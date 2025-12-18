import React, { useState, useEffect, useRef } from 'react';
import usePerformanceHints from '../hooks/usePerformance';
import { throttle } from '../utils/perf';
import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import api from '../utils/api';
import { getUserCountry } from '../utils/location';
import PropertyCard from '../components/PropertyCard';
import MortgageRates from '../components/MortgageRates';
import PopularLocations from '../components/PopularLocations';

const MortgageCalculator = () => {
  const [homePrice, setHomePrice] = useState('');
  const [downPayment, setDownPayment] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [loanTerm, setLoanTerm] = useState('30');
  const [monthlyPayment, setMonthlyPayment] = useState(null);

  const calculatePayment = () => {
    const principal = homePrice - (homePrice * downPayment / 100);
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;

    const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    setMonthlyPayment(payment.toFixed(2));
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl mx-auto">
      <h3 className="text-2xl font-bold mb-6 text-gray-900">Calculate Your Mortgage</h3>
      <div className="space-y-4">
        <input
          type="number"
          placeholder="Home Price"
          value={homePrice}
          onChange={(e) => setHomePrice(e.target.value)}
          className="w-full p-3 border rounded-lg"
        />
        <input
          type="number"
          placeholder="Down Payment %"
          value={downPayment}
          onChange={(e) => setDownPayment(e.target.value)}
          className="w-full p-3 border rounded-lg"
        />
        <input
          type="number"
          placeholder="Interest Rate %"
          value={interestRate}
          onChange={(e) => setInterestRate(e.target.value)}
          className="w-full p-3 border rounded-lg"
        />
        <input
          type="number"
          placeholder="Loan Term (years)"
          value={loanTerm}
          onChange={(e) => setLoanTerm(e.target.value)}
          className="w-full p-3 border rounded-lg"
        />
        <button
          onClick={calculatePayment}
          className="w-full bg-blue-600 text-white p-3 rounded-lg font-semibold hover:bg-blue-700 transition-all"
        >
          Calculate Payment
        </button>
        {monthlyPayment && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-lg font-semibold text-gray-900">
              Monthly Payment: <span className="text-blue-600">${monthlyPayment}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const HomePage = () => {
  const { isLowEnd, prefersReducedMotion } = usePerformanceHints();
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [recentProperties, setRecentProperties] = useState([]);
  const [allProperties, setAllProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detectedCountry, setDetectedCountry] = useState(null);
  const [noPropertiesForLocation, setNoPropertiesForLocation] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [containerBgWhite, setContainerBgWhite] = useState(false);
  const [isFlipComplete, setIsFlipComplete] = useState(false);
  const [bodyBgBlack, setBodyBgBlack] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  // Reduce base translate so content container starts closer under the flip card
  const TRANSLATE_BASE = 60;
  const [contentTranslateY, setContentTranslateY] = useState(TRANSLATE_BASE);

  const { scrollY } = useScroll();
  const yTransform = useTransform(scrollY, [0, 500], [0, -400]);

  const scrollVariants = {
    hidden: { opacity: 0, y: 150 },
    visible: { opacity: 1, y: 0 },
  };

  const flipSectionRef = useRef(null);
  const contentContainerRef = useRef(null);
  const popularLocationsRef = useRef(null);
  const calculatorSectionRef = useRef(null);
  const featuredRef = useRef(null);
  const wrapperRef = useRef(null);

  const [forceBlack, setForceBlack] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const country = await getUserCountry();
        setDetectedCountry(country);
        await fetchProperties(country);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (!flipSectionRef.current) return;

      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const flipRect = flipSectionRef.current.getBoundingClientRect();
      const flipTop = flipRect.top + scrollY;
      // Use the card's center in viewport coordinates. Start the flip when
      // the card center reaches the bottom of the viewport and complete it
      // when the center reaches the middle of the viewport.
      const cardCenterViewportY = flipRect.top + (flipRect.height / 2);
      const startY = windowHeight; // start flip when center is at bottom
      const endY = windowHeight * 0.5; // complete flip at middle of viewport
      let progress = (startY - cardCenterViewportY) / (startY - endY);
      progress = Math.max(0, Math.min(1, progress));

      setScrollProgress(progress);

      // Background transition during flip (starts at 30% progress)
      if (progress > 0.3 && progress < 1) {
        setBodyBgBlack(true);
      } else if (progress <= 0.3) {
        setBodyBgBlack(false);
        setContentVisible(false);
      }

      // Check if flip is complete (98% progress)
      if (progress >= 0.98) {
        if (!isFlipComplete) {
          setIsFlipComplete(true);
          setContentVisible(true);
        }
        // Smooth content slide animation - SLOWER AND MORE DELAYED
        const additionalScroll = scrollY - (flipTop + windowHeight * 0.7);
        const slideProgress = Math.min(additionalScroll / (windowHeight * 0.8), 1);
        setContentTranslateY(TRANSLATE_BASE - (slideProgress * TRANSLATE_BASE));
      } else if (progress < 0.5) {
        setIsFlipComplete(false);
        setContentTranslateY(TRANSLATE_BASE);
      }

      // Content container color change based on Popular Locations section
      if (isFlipComplete && contentContainerRef.current && popularLocationsRef.current) {
        const locationsRect = popularLocationsRef.current.getBoundingClientRect();

        // Change to white when locations section reaches 60% of viewport
        if (locationsRect.top <= windowHeight * 0.6) {
          setContainerBgWhite(true);
        } else {
          setContainerBgWhite(false);
        }
      }
    };

    const throttled = throttle(handleScroll, prefersReducedMotion ? 200 : (isLowEnd ? 200 : 80));
    window.addEventListener('scroll', throttled, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', throttled);
  }, [isFlipComplete]);

  // Expose contentVisible to the DOM so other components (Header) can react
  useEffect(() => {
    try {
      if (contentVisible) {
        document.documentElement.setAttribute('data-content-visible', 'true');
      } else {
        document.documentElement.setAttribute('data-content-visible', 'false');
      }
    } catch (e) {
      // ignore server-side or restricted environments
    }
  }, [contentVisible]);

  // Ensure attribute exists on mount for Header detection
  useEffect(() => {
    try {
      if (document.documentElement.getAttribute('data-content-visible') === null) {
        document.documentElement.setAttribute('data-content-visible', contentVisible ? 'true' : 'false');
      }
    } catch (e) {}
  }, []);

  const fetchProperties = async (country = null) => {
    try {
      setError('');
      const response = await api.get('/properties', {
        params: {
          limit: 50,
          status: 'published'
        }
      });

      if (response.data.success) {
        const fetched = response.data.properties || [];
        setAllProperties(fetched);
        splitFeaturedAndRecent(fetched);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      setError('Failed to load properties');
    }
  };

  // When the featured properties section is reached, force the content container to full black
  useEffect(() => {
    const onScroll = () => {
      if (!featuredRef.current) return;
      const rect = featuredRef.current.getBoundingClientRect();
      const winH = window.innerHeight;
      // when the featured section top is within the top 25% of viewport, force black
      if (rect.top <= winH * 0.25) {
        setForceBlack(true);
      } else {
        setForceBlack(false);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const splitFeaturedAndRecent = (properties) => {
    try {
      // Always show all properties in the "Recently added" section,
      // sorted by newest first so users see latest listings regardless of location.
      const sorted = (properties || []).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Featured: show the top 6 highlighted listings
      setFeaturedProperties(sorted.slice(0, 6));
      // Recent: show all properties (newest first)
      setRecentProperties(sorted);
    } catch (e) {
      console.warn('Error splitting featured/recent', e);
      setFeaturedProperties((properties || []).slice(0, 3));
      setRecentProperties(properties || []);
    }
  };

  const rotationY = scrollProgress * 180;
  const scale = 1 + Math.sin(scrollProgress * Math.PI) * 0.12;
  const sideContentVisible = scrollProgress > 0.3;
  const sideContentOpacity = Math.min(1, Math.max(0, (scrollProgress - 0.3) / 0.4));

  // Compute a smooth background color for the content container
  // contentTranslateY goes from 100 (off-screen) -> 0 (pinned at top). We want
  // white at start and black when fully up, so progress = 1 - (contentTranslateY/100).
  const contentProgress = Math.max(0, Math.min(1, 1 - (contentTranslateY / 100)));
  // interpolate from white (255) -> dark target (#141414 = rgb(20,20,20))
  const DARK_TARGET = 20;
  const colorValue = Math.round(255 - contentProgress * (255 - DARK_TARGET));
  let containerBgColor = `rgb(${colorValue}, ${colorValue}, ${colorValue})`;
  // If PopularLocations requested a white background, honor it first
  if (containerBgWhite) {
    containerBgColor = '#ffffff';
  } else if (forceBlack) {
    // Featured section forces dark target color (#141414)
    containerBgColor = '#141414';
  }

  // Heading color logic: black when container is white, switch to white when container darkens
  const isContentDark = forceBlack || (!containerBgWhite && contentProgress > 0.5);
  const headingColor = containerBgWhite ? '#000000' : (isContentDark ? '#ffffff' : '#000000');
  // Slow, smooth transition used for headings
  const headingTransition = 'color 1.2s cubic-bezier(0.22, 0.9, 0.25, 1)';
  // Listings small label color (blue tone) that transitions with the container
  const listingsColor = containerBgWhite ? '#2563eb' : '#60a5fa';

  // We'll use composited opacity overlays (GPU-friendly) instead of
  // changing `background-color` which forces repaints on many devices.
  const pageDarkOverlayOpacity = bodyBgBlack ? 1 : 0;

  return (
    <div className="homepage-content relative" style={{ minHeight: '100vh' }}>
      {/* Page background overlays (composited opacity) */}
      <div
        aria-hidden
        className="absolute inset-0 -z-20 pointer-events-none"
        style={{
          background: '#ffffff',
          opacity: pageDarkOverlayOpacity ? 0 : 1,
          transition: 'opacity 0.6s ease',
          willChange: 'opacity'
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-30 pointer-events-none"
        style={{
          background: '#000000',
          opacity: pageDarkOverlayOpacity,
          transition: 'opacity 0.6s ease',
          willChange: 'opacity'
        }}
      />
      {/* Flip Card Section - Positioned Higher */}
      <section
        id="hero-section"
        ref={flipSectionRef}
        className="flex items-center justify-center px-4 md:px-8"
        style={{
          // reduced from 200vh — tightened further to bring content container closer
          minHeight: '85vh',
          position: 'relative',
          zIndex: 2,
          paddingTop: '2vh',
          paddingBottom: '2vh'
        }}
      >
        <div className="max-w-7xl mx-auto w-full" style={{ position: 'relative', zIndex: 10 }}>
          <div className="flex items-center justify-center gap-12">
            {/* Left Side Content */}
            <div
              className="side-content transition-all duration-800 w-44 sm:w-56 md:w-64 lg:w-72"
              style={{
                opacity: sideContentOpacity,
                transform: `translateX(${sideContentVisible ? 0 : -50}px) scale(${0.8 + sideContentOpacity * 0.2})`
              }}
            >
              <div className="flex flex-col items-center group text-center">
                <div className="rounded-full p-6 mb-4 transition-all group-hover:scale-110 bg-gradient-to-br from-blue-50 to-blue-100">
                  <span role="img" aria-label="Buy a Home" className="text-4xl">🏠</span>
                </div>
                <h3 className="font-bold text-xl mb-3 text-white">Buy a Home</h3>
                <p className="mb-4 text-sm leading-relaxed text-white">
                  Custom search Smart insight and expert agent at your service
                </p>
                <Link
                  to="/contact"
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg hover:-translate-y-1"
                >
                  Find a home
                </Link>
              </div>
            </div>

            {/* Center Flip Card */}
            <div className="relative" style={{ perspective: '2000px' }}>
              <div
                className="relative cursor-pointer"
                style={{
                  // make the flip card responsive using viewport units
                  width: 'min(54vw, 420px)',
                  height: 'min(64vh, 700px)',
                  transformStyle: 'preserve-3d',
                  transformOrigin: '50% 50%',
                  willChange: 'transform',
                  transform: `rotateY(${rotationY}deg) scale(${scale})`,
                  transition: 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)'
                }}
              >
                {/* Front Face */}
                <div
                  className="absolute inset-0 rounded-3xl shadow-2xl overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #000000 0%, #000000 100%)',
                    color: 'white',
                    backfaceVisibility: 'hidden'
                  }}
                >
                  <div className="h-full flex flex-col p-8">
                    <div className="text-center mb-8">
                      <h1 className="text-4xl font-bold mb-4 tracking-tight">ListWithLeatonic</h1>
                      <p className="text-blue-200 text-lg">Your trusted real estate partner</p>
                    </div>

                    <div className="space-y-6 flex-2">
                      {['BUY', 'RENT', 'SELL', 'GET APPROVED'].map((item, index) => (
                        <div key={index} className="group cursor-pointer">
                          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 text-center transition-all duration-300 hover:bg-white/20 hover:scale-105 border border-white/20">
                            <h3 className="text-xl font-bold tracking-wide">{item}</h3>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Back Face */}
                <div
                  className="absolute inset-0 rounded-3xl overflow-hidden flex items-center justify-center"
                  style={{
                    backgroundColor: '#000000',
                    transform: 'rotateY(180deg)',
                    backfaceVisibility: 'hidden',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                  }}
                >
                  <div className="text-center text-white p-8">
                    <div className="w-28 h-28 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-full mx-auto mb-8 flex items-center justify-center shadow-2xl">
                      <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <h2 className="text-3xl font-bold mb-4">Get Financing</h2>
                    <p className="text-gray-300 text-lg leading-relaxed mb-10">
                      Partner up with best agents to get pre-approved fast
                    </p>

                    <div className="mt-12">
                      <div className="flex gap-2 justify-center mb-6">
                        <div className="w-10 h-1 bg-blue-500 rounded-full"></div>
                        <div className="w-10 h-1 bg-purple-500 rounded-full"></div>
                        <div className="w-10 h-1 bg-pink-500 rounded-full"></div>
                      </div>

                      <Link
                        to="/contact"
                        className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white px-10 py-4 rounded-2xl font-bold text-lg transition-all hover:shadow-2xl hover:-translate-y-1.5 shadow-xl inline-block"
                      >
                        Get Pre-Approved Now
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute -inset-8 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-3xl rounded-full -z-10 animate-pulse"></div>
            </div>

            {/* Right Side Content */}
            <div
              className="side-content transition-all duration-800 w-44 sm:w-56 md:w-64 lg:w-72"
              style={{
                opacity: sideContentOpacity,
                transform: `translateX(${sideContentVisible ? 0 : 50}px) scale(${0.8 + sideContentOpacity * 0.2})`
              }}
            >
              <div className="flex flex-col items-center group text-center">
                <div className="rounded-full p-6 mb-4 transition-all group-hover:scale-110 bg-gradient-to-br from-blue-50 to-blue-100">
                  <span role="img" aria-label="Sell Home" className="text-4xl">🏷️</span>
                </div>
                <h3 className="font-bold text-xl mb-3 text-white">Sell Your Home</h3>
                <p className="mb-4 text-sm leading-relaxed text-white">
                  Unlock the true value of your home with our expert knowledge
                </p>
                <Link
                  to="/contact"
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg hover:-translate-y-1"
                >
                  Get Connect
                </Link>
              </div>
            </div>
          </div>
        </div>
        
      </section>

      {/* Content Container - Slides up after flip */}
      <div
        ref={contentContainerRef}
        className="relative z-20 rounded-t-[64px] overflow-hidden"
        style={{
          transform: `translateY(${contentTranslateY}vh)`,
          transition: 'transform 0.9s cubic-bezier(0.22,1,0.36,1), opacity 0.6s ease',
          paddingTop: '24px',
          minHeight: '80vh',
          opacity: contentVisible ? 1 : 0,
          pointerEvents: contentVisible ? 'auto' : 'none'
        }}
      >
        {/* Content background layers (use opacity transitions for composite-only change) */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 pointer-events-none"
          style={{
            background: '#ffffff',
            opacity: containerBgWhite ? 1 : (1 - contentProgress),
            transition: 'opacity 0.9s cubic-bezier(0.22,1,0.36,1)',
            willChange: 'opacity'
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-20 pointer-events-none"
          style={{
            background: forceBlack ? '#141414' : '#141414',
            opacity: containerBgWhite ? 0 : contentProgress,
            transition: 'opacity 0.9s cubic-bezier(0.22,1,0.36,1)',
            willChange: 'opacity'
          }}
        />
        {/* Featured Properties */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          variants={scrollVariants}
          transition={{ duration: 1.5 }}
          viewport={{ once: true }}
          ref={featuredRef}
          className="py-20 px-4 md:px-8 max-w-7xl mx-auto"
        >
          <div className="text-sm mb-4 text-gray-400">
            Showing results for: <span className="font-semibold">
              {detectedCountry ? (detectedCountry === 'US' ? 'United States' : detectedCountry === 'CA' ? 'Canada' : detectedCountry) : 'United States & Canada'}
            </span>
          </div>
          <div className="flex items-center justify-between mb-8">
              <div className={`inline-flex items-center gap-3 mb-4 transition-all duration-1000`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${containerBgWhite ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-blue-700 to-blue-800'}`}>
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold uppercase tracking-wider" style={{ color: listingsColor, transition: headingTransition }}>
                  Listings
                </div>
                <h2 className={`main-heading`} style={{ color: headingColor, transition: headingTransition }}>
                  Featured properties
                </h2>
              </div>
            </div>
            <Link
              to="/forsale"
              className={`border-2 font-bold px-6 py-3 rounded-xl transition-all ${containerBgWhite
                  ? 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
                  : 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
            >
              View all
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className={`rounded-2xl p-5 animate-pulse ${containerBgWhite ? 'bg-gray-200' : 'bg-gray-800'}`}>
                  <div className={`h-56 rounded-xl mb-4 ${containerBgWhite ? 'bg-gray-300' : 'bg-gray-700'}`}></div>
                  <div className={`h-4 rounded mb-2 ${containerBgWhite ? 'bg-gray-300' : 'bg-gray-700'}`}></div>
                  <div className={`h-3 rounded mb-3 ${containerBgWhite ? 'bg-gray-300' : 'bg-gray-700'}`}></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {noPropertiesForLocation && (
                <div className={`rounded-2xl p-8 mb-8 border ${containerBgWhite ? 'bg-gray-100 border-gray-300 text-gray-700' : 'bg-gray-800 border-gray-700 text-gray-300'}`}>
                  <p className="mb-4">No properties were found in your location ({detectedCountry || 'your area'}). Showing all listings instead.</p>
                  <Link to="/forsale" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-300">View listings from other locations</Link>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {featuredProperties.map(property => (
                  <PropertyCard key={property._id} property={property} darkMode={!containerBgWhite} />
                ))}
              </div>
            </>
          )}
        </motion.div>

        {/* Recently Added */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          variants={scrollVariants}
          transition={{ duration: 1.5 }}
          viewport={{ once: true }}
          className="py-20 px-4 md:px-8 max-w-7xl mx-auto"
        >
          <div className="flex items-center justify-between mb-8">
            <div className={`inline-flex items-center gap-3 mb-4 transition-all duration-1000`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${containerBgWhite ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gradient-to-r from-blue-700 to-blue-800'}`}>
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <div className={`text-sm font-semibold uppercase tracking-wider ${containerBgWhite ? 'text-blue-600' : 'text-blue-400'}`}>
                  Listings
                </div>
                <h2 className={`main-heading`} style={{ color: headingColor, transition: 'color 0.6s cubic-bezier(0.2,0.9,0.2,1)'}}>
                  Recently added
                </h2>
              </div>
            </div>
            <Link
              to="/forrent"
              className={`border-2 font-bold px-6 py-3 rounded-xl transition-all ${containerBgWhite
                  ? 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
                  : 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
            >
              View all
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {recentProperties.map(property => (
              <PropertyCard key={property._id} property={property} darkMode={!containerBgWhite} />
            ))}
          </div>
        </motion.div>

        {/* Mortgage Rates */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          variants={scrollVariants}
          transition={{ duration: 1.5 }}
          viewport={{ once: true }}
          className="bg-transparent py-10 px-4 md:px-8 max-w-7xl mx-auto"
        >
          <MortgageRates apiUrl={process.env.REACT_APP_MORTGAGE_RATES_API} darkMode={!containerBgWhite} />
        </motion.div>

        {/* Popular Locations */}
        <motion.div
          ref={popularLocationsRef}
          initial="hidden"
          whileInView="visible"
          variants={scrollVariants}
          transition={{ duration: 1.5 }}
          viewport={{ once: true }}
        >
          <PopularLocations darkMode={!containerBgWhite} lightMode={containerBgWhite} />
        </motion.div>

        {/* Mortgage Calculator */}
        <motion.div
          ref={calculatorSectionRef}
          initial="hidden"
          whileInView="visible"
          variants={scrollVariants}
          transition={{ duration: 1.5 }}
          viewport={{ once: true }}
          className="min-h-screen flex items-center justify-center px-4 md:px-8 py-20"
        >
          <div className="max-w-7xl mx-auto w-full">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className={`text-4xl font-bold`} style={{ color: containerBgWhite ? '#111827' : '#ffffff', transition: headingTransition }}>Mortgage Calculator</h2>
              </div>
              <p className={`text-xl max-w-2xl mx-auto ${containerBgWhite ? 'text-gray-600' : 'text-gray-300'}`}>
                Plan your dream home purchase with our comprehensive mortgage calculator
              </p>
            </div>

            {!showCalculator ? (
              <div className="max-w-4xl mx-auto">
                <div className={`rounded-3xl p-8 md:p-12 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-3 group ${containerBgWhite ? 'bg-gray-100 border-2 border-gray-200' : 'bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-gray-700'
                  }`}>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    <div className="relative">
                      <div className="w-48 h-48 md:w-64 md:h-64 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl mb-6 transition-all duration-700 group-hover:scale-110 group-hover:rotate-3 flex items-center justify-center shadow-xl mx-auto lg:mx-0">
                        <div className="text-white text-center p-6">
                          <svg className="w-20 h-20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="text-3xl font-bold">$1,850</div>
                          <div className="text-blue-100 text-sm">Sample Monthly Payment</div>
                        </div>
                      </div>
                      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-400/20 rounded-full blur-lg animate-pulse"></div>
                      <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-600/10 rounded-full blur-lg animate-pulse" style={{ animationDelay: '1s' }}></div>
                    </div>

                    <div className="text-center lg:text-left">
                      <h3 className={`text-3xl md:text-4xl font-bold mb-4`} style={{ color: containerBgWhite ? '#111827' : '#ffffff', transition: headingTransition }}>
                        Calculate Your Monthly Mortgage
                      </h3>
                      <p className={`mb-6 text-lg leading-relaxed ${containerBgWhite ? 'text-gray-600' : 'text-gray-300'}`}>
                        Get instant estimates for your monthly payments, interest costs, and amortization schedule.
                        Perfect for planning your home purchase budget.
                      </p>

                      <div className="space-y-4 mb-8">
                        {[
                          { icon: '✅', text: 'Real-time calculations' },
                          { icon: '✅', text: 'Detailed breakdown' },
                          { icon: '✅', text: 'Amortization schedule' },
                          { icon: '✅', text: 'Compare loan options' }
                        ].map((feature, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <span className="text-green-500 text-xl">{feature.icon}</span>
                            <span className={`font-medium ${containerBgWhite ? 'text-gray-700' : 'text-gray-300'}`}>{feature.text}</span>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => setShowCalculator(true)}
                        className="group relative bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold px-10 py-4 rounded-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 active:scale-95 text-lg w-full lg:w-auto"
                      >
                        <span className="flex items-center justify-center gap-3">
                          Start Calculator
                          <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </span>
                        <div className="absolute -inset-2 bg-blue-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      </button>
                    </div>
                  </div>

                  <div className="mt-12 pt-8 border-t border-gray-700 grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[
                      { value: '30-Year', label: 'Fixed Rate', color: 'text-blue-400' },
                      { value: '15-Year', label: 'Savings Term', color: 'text-blue-400' },
                      { value: '5/1 ARM', label: 'Adjustable Rate', color: 'text-blue-400' },
                      { value: 'FHA/VA', label: 'Loan Types', color: 'text-blue-400' }
                    ].map((stat, index) => (
                      <div key={index} className="text-center">
                        <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                        <div className={`text-sm ${containerBgWhite ? 'text-gray-500' : 'text-gray-400'}`}>{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`mt-8 border ${containerBgWhite ? 'border-gray-300 bg-gray-100' : 'border-gray-700 bg-gray-800'} rounded-2xl p-6 flex items-center gap-4`}>
                  <div className={`w-10 h-10 ${containerBgWhite ? 'bg-gray-300' : 'bg-gray-700'} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className={containerBgWhite ? 'text-gray-700' : 'text-gray-300'}>
                    <span className="font-semibold">Tip:</span> Use 20% down payment to avoid PMI and get better interest rates.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <MortgageCalculator />
                <div className="text-center mt-12">
                  <button
                    onClick={() => setShowCalculator(false)}
                    className={`group inline-flex items-center gap-2 font-medium text-lg transition-colors duration-300 ${containerBgWhite ? 'text-blue-600 hover:text-blue-800' : 'text-blue-400 hover:text-blue-300'}`}
                  >
                    <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Overview
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HomePage;