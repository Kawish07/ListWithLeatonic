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
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TrendingUp, TrendingDown, Zap, Shield, Clock } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

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

export default function MortgageRates({ apiUrl }) {
  const [range, setRange] = useState('1Y');
  const [data, setData] = useState(() => generateMockSeries('1Y'));
  const pollingRef = useRef(null);
  const sectionRef = useRef(null);
  const cardsRef = useRef([]);
  const chartRef = useRef(null);
  const titleRef = useRef(null);

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

  // Animation on scroll - OPTIMIZED FOR LENIS
  useEffect(() => {
    if (!sectionRef.current) return;

    // Wait for DOM to be ready
    const timer = setTimeout(() => {
      const ctx = gsap.context(() => {
        // Use will-change and force3D for GPU acceleration
        const commonProps = {
          force3D: true,
          immediateRender: false
        };

        // Animate title
        gsap.fromTo(titleRef.current,
          { 
            y: 50, 
            opacity: 0, 
            scale: 0.95,
            ...commonProps
          },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 80%',
              end: 'top 20%',
              toggleActions: 'play none none reverse',
              // KEY FIXES FOR SMOOTH SCROLL
              scrub: false,
              markers: false,
              invalidateOnRefresh: true,
              fastScrollEnd: true,
              preventOverlaps: true
            },
            ...commonProps
          }
        );

        // Animate cards with stagger
        cardsRef.current.forEach((card, index) => {
          if (card) {
            gsap.fromTo(card,
              { 
                y: 60, 
                opacity: 0, 
                scale: 0.9,
                ...commonProps
              },
              {
                y: 0,
                opacity: 1,
                scale: 1,
                duration: 0.8,
                delay: index * 0.15,
                ease: 'back.out(1.2)',
                scrollTrigger: {
                  trigger: sectionRef.current,
                  start: 'top 70%',
                  end: 'top 20%',
                  toggleActions: 'play none none reverse',
                  scrub: false,
                  invalidateOnRefresh: true,
                  fastScrollEnd: true,
                  preventOverlaps: true
                },
                ...commonProps
              }
            );
          }
        });

        // Animate chart container
        gsap.fromTo(chartRef.current,
          { 
            opacity: 0, 
            y: 40,
            ...commonProps
          },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            delay: 0.3,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 60%',
              end: 'top 20%',
              toggleActions: 'play none none reverse',
              scrub: false,
              invalidateOnRefresh: true,
              fastScrollEnd: true,
              preventOverlaps: true
            },
            ...commonProps
          }
        );
      }, sectionRef);

      return () => ctx.revert();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Refresh ScrollTrigger when data changes
  useEffect(() => {
    const timer = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 100);
    return () => clearTimeout(timer);
  }, [data, range]);

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
      color: '#3b82f6',
      gradient: 'from-blue-500 to-blue-600',
      icon: <Shield className="w-5 h-5" />,
      description: 'Fixed Rate Mortgage'
    },
    {
      key: '15yr',
      label: '15-Year FRM',
      color: '#10b981',
      gradient: 'from-emerald-500 to-emerald-600',
      icon: <Zap className="w-5 h-5" />,
      description: 'Shorter Term Savings'
    },
    {
      key: '5/1',
      label: '5/1 Year ARM',
      color: '#8b5cf6',
      gradient: 'from-purple-500 to-purple-600',
      icon: <Clock className="w-5 h-5" />,
      description: 'Adjustable Rate Mortgage'
    }
  ];

  return (
    <section 
      ref={sectionRef} 
      className="py-20 px-4 md:px-8 max-w-7xl mx-auto relative overflow-hidden"
      style={{ willChange: 'transform' }}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        
        {/* Animated Grid Pattern */}
        <div className="absolute inset-0 opacity-5">
          <svg className="w-full h-full">
            <defs>
              <pattern id="mortgage-grid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#3b82f6" strokeWidth="1" />
                <circle cx="40" cy="40" r="2" fill="#3b82f6" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#mortgage-grid)" />
          </svg>
        </div>
      </div>

      {/* Header */}
      <div className="text-center mb-12">
        <div ref={titleRef} className="inline-flex items-center gap-3 mb-4" style={{ willChange: 'transform, opacity' }}>
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Market Insights</div>
            <h2 className="text-4xl md:text-5xl font-bold text-blue-900">Mortgage Rate Trends</h2>
          </div>
        </div>
        <p className="text-lg text-blue-700 max-w-2xl mx-auto">
          Track real-time mortgage rates across different loan types. Make informed decisions with our interactive analytics.
        </p>
      </div>

      {/* Rate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {rateCards.map((card, index) => (
          <div
            key={card.key}
            ref={(el) => (cardsRef.current[index] = el)}
            className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 shadow-xl border border-blue-100/50 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group relative overflow-hidden"
            style={{ willChange: 'transform, opacity' }}
          >
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
            
            {/* Animated Border */}
            <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-blue-200 transition-all duration-500" />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 bg-gradient-to-r ${card.gradient} rounded-lg flex items-center justify-center shadow-md`}>
                    {card.icon}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-blue-600">{card.label}</div>
                    <div className="text-xs text-blue-400">{card.description}</div>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-full ${stats && stats[card.key]?.trend === 'up' ? 'bg-red-100' : 'bg-green-100'} flex items-center justify-center`}>
                  {stats && stats[card.key]?.trend === 'up' ? 
                    <TrendingUp className="w-6 h-6 text-red-500" /> : 
                    <TrendingDown className="w-6 h-6 text-green-500" />
                  }
                </div>
              </div>

              <div className="mb-4">
                <div className="text-4xl font-bold text-blue-900 mb-2">
                  {latest ? `${latest[card.key]}%` : `${DEFAULT_BASE[card.key]}%`}
                </div>
                <div className="text-sm text-blue-500">Current Rate</div>
              </div>

              {stats && stats[card.key] && (
                <div className="flex items-center justify-between">
                  <div>
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                      stats[card.key].diff >= 0 
                        ? 'bg-red-50 text-red-700 border border-red-100' 
                        : 'bg-green-50 text-green-700 border border-green-100'
                    }`}>
                      {stats[card.key].diff >= 0 ? '+' : ''}{stats[card.key].diff}%
                      <small className="opacity-70">({stats[card.key].pct >= 0 ? '+' : ''}{stats[card.key].pct}%)</small>
                    </div>
                  </div>
                  <div className="text-xs text-blue-400 text-right">
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
        ref={chartRef} 
        className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-2xl border border-blue-100"
        style={{ willChange: 'transform, opacity' }}
      >
        {/* Range Selector */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div className="flex flex-wrap gap-2">
            {ranges.map(r => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                  r === range 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105' 
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 hover:scale-105'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${r === range ? 'bg-white' : 'bg-blue-500'}`} />
                {r}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-6">
            {rateCards.map(card => (
              <div key={card.key} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: card.color }} />
                <span className="text-sm font-medium text-blue-900">{card.label.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="relative" style={{ height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
              <defs>
                <linearGradient id="grad30" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2}/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="grad15" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="grad51" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 6" stroke="#e2e8f0" />
              <XAxis
                dataKey="ts"
                type="number"
                scale="time"
                domain={[dataMin => dataMin, dataMax => dataMax]}
                tickFormatter={(ts) => formatDateLabel(ts, range)}
                tick={{ fontSize: 12, fill: '#64748b' }}
                tickCount={tickCountForRange(range)}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis 
                domain={[dataMin => Math.floor(dataMin) - 1, dataMax => Math.ceil(dataMax) + 1]} 
                tickFormatter={(v) => `${v}%`} 
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                }}
                formatter={(value) => [`${value}%`, 'Rate']}
                labelFormatter={(label) => `Date: ${formatDateLabel(label, range)}`}
              />
              
              {/* 30-Year */}
              <Area 
                type="monotone" 
                dataKey="30yr" 
                stroke="#3b82f6" 
                fill="url(#grad30)" 
                strokeWidth={3} 
                dot={{ r: 0 }}
                activeDot={{ 
                  r: 8, 
                  stroke: '#3b82f6',
                  strokeWidth: 2,
                  fill: 'white'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="30yr" 
                stroke="#3b82f6" 
                strokeWidth={2} 
                dot={false}
                strokeDasharray="0" 
              />
              
              {/* 15-Year */}
              <Area 
                type="monotone" 
                dataKey="15yr" 
                stroke="#10b981" 
                fill="url(#grad15)" 
                strokeWidth={3} 
                dot={{ r: 0 }}
                activeDot={{ 
                  r: 8, 
                  stroke: '#10b981',
                  strokeWidth: 2,
                  fill: 'white'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="15yr" 
                stroke="#10b981" 
                strokeWidth={2} 
                dot={false}
                strokeDasharray="0" 
              />
              
              {/* 5/1 ARM */}
              <Area 
                type="monotone" 
                dataKey="5/1" 
                stroke="#8b5cf6" 
                fill="url(#grad51)" 
                strokeWidth={3} 
                dot={{ r: 0 }}
                activeDot={{ 
                  r: 8, 
                  stroke: '#8b5cf6',
                  strokeWidth: 2,
                  fill: 'white'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="5/1" 
                stroke="#8b5cf6" 
                strokeWidth={2} 
                dot={false}
                strokeDasharray="0" 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Live Update Indicator */}
        <div className="mt-6 flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-blue-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Live updates every 20 seconds</span>
          </div>
          <button 
            onClick={() => {
              setData(generateMockSeries(range));
            }}
            className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-medium transition-all duration-300 hover:scale-105"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Market Insights */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-bold text-blue-900">Market Trend</h3>
          </div>
          <p className="text-blue-700 text-sm">
            Rates have shown {stats && stats['30yr']?.trend === 'up' ? 'an upward' : 'a downward'} trend over the selected period. 
            Consider locking rates for long-term stability.
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="font-bold text-emerald-900">Quick Tip</h3>
          </div>
          <p className="text-emerald-700 text-sm">
            15-year mortgages offer lower rates but higher monthly payments. 
            ARM rates start low but can adjust after the initial period.
          </p>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-bold text-purple-900">Best Choice</h3>
          </div>
          <p className="text-purple-700 text-sm">
            {stats && stats['30yr']?.trend === 'up' ? 'Consider shorter terms' : 'Long-term fixed rates'} 
            are currently favorable based on the trend analysis and market conditions.
          </p>
        </div>
      </div>
    </section>
  );
}