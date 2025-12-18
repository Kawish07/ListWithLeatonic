import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from 'recharts';
import { TrendingUp, TrendingDown, Zap, Shield, Clock, Activity } from 'lucide-react';

const DEFAULT_BASE = {
  '30yr': 6.6,
  '15yr': 5.84,
  '5/1': 6.06
};

const ranges = ['1M','3M','6M','1Y','5Y','10Y','30Y'];

function formatDateLabel(dateOrTs, range) {
  const d = new Date(dateOrTs);
  if (range === '1M' || range === '3M') return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  if (range === '6M' || range === '1Y' || range === '5Y') return `${d.toLocaleDateString('en-US', { month: 'short' })} '${String(d.getFullYear()).slice(-2)}`;
  return `${d.getFullYear()}`;
}

function generateMockSeries(range) {
  const dayMs = 24 * 3600 * 1000;
  const yearMs = 365 * dayMs;

  let points = 12;
  let stepMs = 30 * dayMs;

  switch (range) {
    case '1M':
      points = 30; stepMs = dayMs; break;
    case '3M':
      points = 90; stepMs = dayMs; break;
    case '6M':
      points = 26; stepMs = 7 * dayMs; break;
    case '1Y':
      points = 12; stepMs = Math.round(yearMs / 12); break;
    case '5Y':
      points = 60; stepMs = Math.round(yearMs / 60); break;
    case '10Y':
      points = 120; stepMs = Math.round(yearMs / 120); break;
    case '30Y':
      points = 30; stepMs = yearMs; break;
    default:
      points = 12; stepMs = Math.round(yearMs / 12);
  }

  const now = Date.now();
  const data = [];
  for (let i = points - 1; i >= 0; i--) {
    const ts = now - i * stepMs;
    const noise = (i % 5) * 0.01;
    const v30 = +(DEFAULT_BASE['30yr'] + (Math.sin(i) * 0.08) + (Math.random() - 0.5) * 0.12 + noise).toFixed(2);
    const v15 = +(DEFAULT_BASE['15yr'] + (Math.cos(i) * 0.07) + (Math.random() - 0.5) * 0.1).toFixed(2);
    const v51 = +(DEFAULT_BASE['5/1'] + (Math.sin(i * 0.5) * 0.06) + (Math.random() - 0.5) * 0.11).toFixed(2);

    data.push({
      date: formatDateLabel(ts, range),
      ts,
      '30yr': v30,
      '15yr': v15,
      '5/1': v51
    });
  }

  return data;
}

function tickCountForRange(range) {
  switch (range) {
    case '1M': return 6;
    case '3M': return 8;
    case '6M': return 8;
    case '1Y': return 12;
    case '5Y': return 10;
    case '10Y': return 10;
    case '30Y': return 10;
    default: return 8;
  }
}

export default function MortgageRates({ apiUrl, darkMode = false }) {
  const [range, setRange] = useState('1Y');
  const [data, setData] = useState(() => generateMockSeries('1Y'));
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const pollingRef = useRef(null);
  const sectionRef = useRef(null);
  const observerRef = useRef(null);

  const stats = useMemo(() => {
    if (!data || data.length < 2) return null;
    const first = data[0];
    const last = data[data.length - 1];
    const compute = (key) => {
      const a = first[key] || 0;
      const b = last[key] || 0;
      const diff = +(b - a).toFixed(2);
      const pct = a ? +(((b - a) / a) * 100).toFixed(2) : 0;
      return { first: a, last: b, diff, pct, trend: diff >= 0 ? 'up' : 'down' };
    };
    return {
      '30yr': compute('30yr'),
      '15yr': compute('15yr'),
      '5/1': compute('5/1')
    };
  }, [data]);

  // Intersection Observer for scroll animations (only once)
  useEffect(() => {
    if (hasAnimated || !sectionRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            setIsVisible(true);
            setHasAnimated(true);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -10% 0px' }
    );

    observerRef.current.observe(sectionRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasAnimated]);

  // When the chart section becomes visible, force a resize event so Recharts can measure correctly
  useEffect(() => {
    if (!isVisible) return;
    // Prefer calling Lenis' update if present (avoids triggering ScrollTrigger's scrollerProxy
    // which may call scrollTop and cause an unexpected jump). Fall back to a resize event
    // only if Lenis isn't available.
    const t = setTimeout(() => {
      try {
        if (window && window.lenis && typeof window.lenis.update === 'function') {
          window.lenis.update();
        } else {
          window.dispatchEvent(new Event('resize'));
        }
      } catch (e) {
        // swallow errors silently
      }
    }, 120);
    return () => clearTimeout(t);
  }, [isVisible]);

  // Data fetching and polling
  useEffect(() => {
    let mounted = true;

    async function fetchRemote(r) {
      if (!apiUrl) return null;
      try {
        const res = await fetch(`${apiUrl}?range=${r}`);
        if (!res.ok) return null;
        const json = await res.json();
        return json.data || json;
      } catch (e) {
        return null;
      }
    }

    (async () => {
      const remote = await fetchRemote(range);
      if (mounted && remote && Array.isArray(remote) && remote.length) {
        setData(remote);
      } else {
        setData(generateMockSeries(range));
      }
    })();

    // Polling for live updates
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      const remote = await fetchRemote(range);
      if (remote && Array.isArray(remote) && remote.length) {
        setData(remote);
      } else {
        setData(prev => {
          if (!prev || !prev.length) return generateMockSeries(range);
          const next = prev.map((p, i) => ({ ...p }));
          for (let k = Math.max(0, next.length - 6); k < next.length; k++) {
            next[k]['30yr'] = +((next[k]['30yr'] || DEFAULT_BASE['30yr']) + (Math.random()-0.5)*0.08).toFixed(2);
            next[k]['15yr'] = +((next[k]['15yr'] || DEFAULT_BASE['15yr']) + (Math.random()-0.5)*0.06).toFixed(2);
            next[k]['5/1'] = +((next[k]['5/1'] || DEFAULT_BASE['5/1']) + (Math.random()-0.5)*0.07).toFixed(2);
          }
          return next;
        });
      }
    }, 20000);

    return () => {
      mounted = false;
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [apiUrl, range]);

  const latest = data && data.length ? data[data.length-1] : null;

  const rateCards = [
    {
      key: '30yr',
      label: '30-Year FRM',
      color: '#60a5fa',
      lightColor: '#3b82f6',
      gradient: 'from-blue-500 to-blue-600',
      icon: <Shield className="w-5 h-5" />,
      description: 'Fixed Rate Mortgage'
    },
    {
      key: '15yr',
      label: '15-Year FRM',
      color: '#34d399',
      lightColor: '#10b981',
      gradient: 'from-emerald-500 to-emerald-600',
      icon: <Zap className="w-5 h-5" />,
      description: 'Shorter Term Savings'
    },
    {
      key: '5/1',
      label: '5/1 Year ARM',
      color: '#a78bfa',
      lightColor: '#8b5cf6',
      gradient: 'from-purple-500 to-purple-600',
      icon: <Clock className="w-5 h-5" />,
      description: 'Adjustable Rate Mortgage'
    }
  ];

  // Colors for dark mode
  const textColor = darkMode ? 'text-white' : 'text-blue-900';
  const textSecondaryColor = darkMode ? 'text-gray-300' : 'text-blue-700';
  const bgColor = darkMode ? 'bg-gray-900' : 'bg-white';
  const cardBgColor = darkMode ? 'bg-gray-800' : 'bg-white';
  const borderColor = darkMode ? 'border-gray-700' : 'border-blue-100/50';
  const buttonActiveBg = darkMode ? 'bg-blue-900' : 'bg-gradient-to-r from-blue-500 to-blue-600';
  const buttonInactiveBg = darkMode ? 'bg-gray-800' : 'bg-blue-50';
  const buttonActiveText = 'text-white';
  const buttonInactiveText = darkMode ? 'text-gray-300' : 'text-blue-700';

  return (
    <section 
      ref={sectionRef} 
      className={` bg-transparent px-4 md:px-8 max-w-7xl mx-auto relative overflow-hidden transition-colors duration-500 ${darkMode ? 'text-white' : ''}`}
    >
      {/* Background Effects (removed pattern for transparent appearance) */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        {/* Intentionally left transparent to avoid background patterns */}
      </div>

      {/* Header */}
      <div className="text-center mb-12">
        <div 
          className={`inline-flex items-center gap-3 mb-4 transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            darkMode ? 'bg-gradient-to-r from-blue-700 to-blue-800' : 'bg-gradient-to-r from-blue-500 to-blue-600'
          }`}>
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <div className={`text-sm font-semibold uppercase tracking-wider ${
              darkMode ? 'text-blue-400' : 'text-blue-600'
            }`}>
              Market Insights
            </div>
            <h2 className={`main-heading ${textColor}`}>
              Mortgage Rate Trends
            </h2>
          </div>
        </div>
        <p 
          className={`text-lg max-w-2xl mx-auto transition-all duration-1000 delay-200 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
          } ${textSecondaryColor}`}
        >
          Track real-time mortgage rates across different loan types. Make informed decisions with our interactive analytics.
        </p>
      </div>

      {/* Rate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {rateCards.map((card, index) => (
          <div
            key={card.key}
            className={`rounded-2xl p-6 transition-all duration-500 hover:-translate-y-2 group relative overflow-hidden ${
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
            } ${borderColor} bg-transparent`}
            style={{ 
              transitionDelay: `${300 + index * 150}ms`,
              transitionDuration: '800ms'
            }}
          >
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${
              darkMode ? 'from-blue-900/20 to-purple-900/20' : card.gradient
            } opacity-0 group-hover:opacity-${darkMode ? '10' : '5'} transition-opacity duration-500`} />
            
            {/* Animated Border */}
            <div className={`absolute inset-0 rounded-2xl border-2 border-transparent group-hover:${
              darkMode ? 'border-blue-700' : 'border-blue-200'
            } transition-all duration-500`} />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    darkMode ? 'bg-gradient-to-r from-gray-700 to-gray-800' : `bg-gradient-to-r ${card.gradient}`
                  }`}>
                    {React.cloneElement(card.icon, { 
                      className: `w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-white'}` 
                    })}
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${
                      darkMode ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                      {card.label}
                    </div>
                    <div className={`text-xs ${
                      darkMode ? 'text-gray-400' : 'text-blue-400'
                    }`}>
                      {card.description}
                    </div>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                  stats && stats[card.key]?.trend === 'up' 
                    ? darkMode ? 'bg-red-900/30' : 'bg-red-100'
                    : darkMode ? 'bg-green-900/30' : 'bg-green-100'
                }`}>
                  {stats && stats[card.key]?.trend === 'up' ? 
                    <TrendingUp className={`w-6 h-6 ${darkMode ? 'text-red-400' : 'text-red-500'}`} /> : 
                    <TrendingDown className={`w-6 h-6 ${darkMode ? 'text-green-400' : 'text-green-500'}`} />
                  }
                </div>
              </div>

              <div className="mb-4">
                <div className={`text-4xl font-bold mb-2 transition-all duration-300 ${
                  darkMode ? 'text-white' : 'text-blue-900'
                }`}>
                  {latest ? `${latest[card.key]}%` : `${DEFAULT_BASE[card.key]}%`}
                </div>
                <div className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-blue-500'
                }`}>
                  Current Rate
                </div>
              </div>

              {stats && stats[card.key] && (
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                      stats[card.key].diff >= 0 
                        ? darkMode 
                          ? 'bg-red-900/30 text-red-300 border border-red-800' 
                          : 'bg-red-50 text-red-700 border border-red-100'
                        : darkMode 
                          ? 'bg-green-900/30 text-green-300 border border-green-800' 
                          : 'bg-green-50 text-green-700 border border-green-100'
                    }`}>
                      {stats[card.key].diff >= 0 ? '+' : ''}{stats[card.key].diff}%
                      <small className={`${darkMode ? 'opacity-70' : 'opacity-70'}`}>
                        ({stats[card.key].pct >= 0 ? '+' : ''}{stats[card.key].pct}%)
                      </small>
                    </div>
                  </div>
                  <div className={`text-xs text-right ${
                    darkMode ? 'text-gray-400' : 'text-blue-400'
                  }`}>
                    <div>Fees: 0.29 Points</div>
                    <div>APR: {latest ? `${(parseFloat(latest[card.key]) + 0.29).toFixed(2)}%` : '6.89%'}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Chart Section */}
      <div 
        className={`rounded-3xl p-6 border transition-all duration-1000 delay-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        } ${darkMode ? 'border-gray-700 bg-transparent' : 'border-blue-100 bg-transparent'}`}
      >
        {/* Range Selector */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div className="flex flex-wrap gap-2">
            {ranges.map(r => (
              <button
                key={r}
                onClick={(e) => {
                  e.preventDefault();
                  setRange(r);
                }}
                type="button"
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                  r === range 
                    ? `${buttonActiveBg} ${buttonActiveText} scale-105` 
                    : `${buttonInactiveBg} ${buttonInactiveText} hover:scale-105 ${
                        darkMode ? 'hover:bg-gray-700' : 'hover:bg-blue-100'
                      }`
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${
                  r === range 
                    ? 'bg-white' 
                    : darkMode ? 'bg-gray-400' : 'bg-blue-500'
                }`} />
                {r}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-6">
            {rateCards.map(card => (
              <div key={card.key} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: darkMode ? card.color : card.lightColor }} 
                />
                <span className={`text-sm font-medium ${textColor}`}>
                  {card.label.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="relative" style={{ height: 400, minHeight: 300 }}>
          {isVisible ? (
            <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
              <defs>
                <linearGradient id="grad30" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={darkMode ? '#60a5fa' : '#3b82f6'} stopOpacity={darkMode ? 0.4 : 0.2}/>
                  <stop offset="100%" stopColor={darkMode ? '#60a5fa' : '#3b82f6'} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="grad15" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={darkMode ? '#34d399' : '#10b981'} stopOpacity={darkMode ? 0.4 : 0.2}/>
                  <stop offset="100%" stopColor={darkMode ? '#34d399' : '#10b981'} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="grad51" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={darkMode ? '#a78bfa' : '#8b5cf6'} stopOpacity={darkMode ? 0.4 : 0.2}/>
                  <stop offset="100%" stopColor={darkMode ? '#a78bfa' : '#8b5cf6'} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 6" 
                stroke={darkMode ? '#374151' : '#e2e8f0'} 
              />
              <XAxis
                dataKey="ts"
                type="number"
                scale="time"
                domain={[dataMin => dataMin, dataMax => dataMax]}
                tickFormatter={(ts) => formatDateLabel(ts, range)}
                tick={{ fontSize: 12, fill: darkMode ? '#9ca3af' : '#64748b' }}
                tickCount={tickCountForRange(range)}
                axisLine={{ stroke: darkMode ? '#4b5563' : '#cbd5e1' }}
              />
              <YAxis 
                domain={[dataMin => Math.floor(dataMin) - 1, dataMax => Math.ceil(dataMax) + 1]} 
                tickFormatter={(v) => `${v}%`} 
                tick={{ fontSize: 12, fill: darkMode ? '#9ca3af' : '#64748b' }}
                axisLine={{ stroke: darkMode ? '#4b5563' : '#cbd5e1' }}
              />
                <Tooltip 
                contentStyle={{ 
                  backgroundColor: darkMode ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'none',
                  borderRadius: '12px',
                  border: darkMode ? '1px solid #374151' : '1px solid #e2e8f0',
                  boxShadow: 'none',
                  color: darkMode ? '#f3f4f6' : '#1f2937'
                }}
                formatter={(value) => [`${value}%`, 'Rate']}
                labelFormatter={(label) => `Date: ${formatDateLabel(label, range)}`}
              />
              
              {/* 30-Year */}
              <Area 
                type="monotone" 
                dataKey="30yr" 
                stroke={darkMode ? '#60a5fa' : '#3b82f6'} 
                fill="url(#grad30)" 
                strokeWidth={3} 
                dot={{ r: 0 }}
                activeDot={{ 
                  r: 8, 
                  stroke: darkMode ? '#60a5fa' : '#3b82f6',
                  strokeWidth: 2,
                  fill: darkMode ? '#111827' : 'white'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="30yr" 
                stroke={darkMode ? '#60a5fa' : '#3b82f6'} 
                strokeWidth={2} 
                dot={false}
                strokeDasharray="0" 
              />
              
              {/* 15-Year */}
              <Area 
                type="monotone" 
                dataKey="15yr" 
                stroke={darkMode ? '#34d399' : '#10b981'} 
                fill="url(#grad15)" 
                strokeWidth={3} 
                dot={{ r: 0 }}
                activeDot={{ 
                  r: 8, 
                  stroke: darkMode ? '#34d399' : '#10b981',
                  strokeWidth: 2,
                  fill: darkMode ? '#111827' : 'white'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="15yr" 
                stroke={darkMode ? '#34d399' : '#10b981'} 
                strokeWidth={2} 
                dot={false}
                strokeDasharray="0" 
              />
              
              {/* 5/1 ARM */}
              <Area 
                type="monotone" 
                dataKey="5/1" 
                stroke={darkMode ? '#a78bfa' : '#8b5cf6'} 
                fill="url(#grad51)" 
                strokeWidth={3} 
                dot={{ r: 0 }}
                activeDot={{ 
                  r: 8, 
                  stroke: darkMode ? '#a78bfa' : '#8b5cf6',
                  strokeWidth: 2,
                  fill: darkMode ? '#111827' : 'white'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="5/1" 
                stroke={darkMode ? '#a78bfa' : '#8b5cf6'} 
                strokeWidth={2} 
                dot={false}
                strokeDasharray="0" 
              />
            </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-gray-500">
              Loading chart...
            </div>
          )}
        </div>

        {/* Live Update Indicator */}
        <div className="mt-6 flex items-center justify-between text-sm flex-wrap gap-4">
          <div className={`flex items-center gap-2 ${
            darkMode ? 'text-blue-400' : 'text-blue-600'
          }`}>
            <Activity className="w-4 h-4 text-green-500" />
            <span>Live updates every 20 seconds</span>
          </div>
          <button 
            onClick={(e) => {
              e.preventDefault();
              setData(generateMockSeries(range));
            }}
            type="button"
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 flex items-center gap-2 ${
              darkMode 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Market Insights */}
      <div 
        className={`mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-1000 delay-1000 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}
      >
      </div>
    </section>
  );
}