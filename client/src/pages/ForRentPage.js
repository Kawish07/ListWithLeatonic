import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import usePerformanceHints from '../hooks/usePerformance';
import { throttle } from '../utils/perf';
import PropertyCard from '../components/PropertyCard';
import api from '../utils/api';

const ForRentPage = () => {
  const { isLowEnd, prefersReducedMotion } = usePerformanceHints();
  // Replace this with your rent hero video URL or path (public folder)
  const RENT_HERO_VIDEO = `${process.env.PUBLIC_URL || ''}/videos/rent-hero.mp4`;
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    propertyType: 'all',
    minPrice: '',
    maxPrice: '',
    bedrooms: 'all',
    city: ''
  });

  // Flip card states & refs
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  const TRANSLATE_BASE = 60;
  const [contentTranslateY, setContentTranslateY] = useState(TRANSLATE_BASE);
  const [contentVisible, setContentVisible] = useState(false);
  const [cardPinned, setCardPinned] = useState(false);
  const cardWrapperRef = useRef(null);
  const contentContainerRef = useRef(null);
  const popularLocationsRef = useRef(null);
  const [locationReached, setLocationReached] = useState(false);
  const calculatorSectionRef = useRef(null);
  const targetProgressRef = useRef(0);
  const mainContainerRef = useRef(null);

  // Add dark mode styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .dark-mode-active {
        --text-primary: #ffffff;
        --text-secondary: #d1d5db;
        --text-tertiary: #9ca3af;
        --bg-primary: #0a0a0a;
        --bg-secondary: #141414;
        --bg-card: rgba(0, 0, 0, 0.95);
        --border-color: rgba(255, 255, 255, 0.15);
        background-color: var(--bg-primary) !important;
        color: var(--text-primary) !important;
        transition: background-color 0.8s ease, color 0.8s ease;
      }
      
      .dark-mode-active .text-blue-900,
      .dark-mode-active .text-slate-900 {
        color: var(--text-primary) !important;
      }
      
      .dark-mode-active .text-blue-800,
      .dark-mode-active .text-blue-700 {
        color: var(--text-secondary) !important;
      }
      
      .dark-mode-active .text-blue-600,
      .dark-mode-active .text-slate-600 {
        color: var(--text-tertiary) !important;
      }
      
      .dark-mode-active .bg-white {
        background-color: var(--bg-secondary) !important;
        border-color: var(--border-color) !important;
      }
      
      .dark-mode-active .bg-gray-100,
      .dark-mode-active .bg-gray-50 {
        background-color: var(--bg-primary) !important;
      }
      
      .flip-card-3d {
        transform-style: preserve-3d;
        will-change: transform;
      }
      
      .flip-card-face {
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        will-change: transform;
      }
      
      .smooth-transition {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .light-mode-active {
        background-color: #ffffff !important;
        color: #0f172a !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // Handle scroll for flip card animation
  useEffect(() => {

    const rawHandler = () => {
      if (!cardWrapperRef.current) return;

      const rect = cardWrapperRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      const cardCenterViewportY = rect.top + (rect.height / 2);
      const startY = windowHeight * 0.75;
      const endY = windowHeight * 0.25;
      let progress = (startY - cardCenterViewportY) / (startY - endY);
      progress = Math.max(0, Math.min(1, progress));

      if (isLowEnd) {
        targetProgressRef.current = progress;
        if (progress >= 0.98 && !contentVisible) setContentVisible(true);
        return;
      }

      setScrollProgress(progress);
      targetProgressRef.current = progress;

      if (progress > 0.3 && progress < 1) {
        if (!isDarkMode) {
          setIsDarkMode(true);
          if (mainContainerRef.current) mainContainerRef.current.classList.add('dark-mode-active');
        }
      } else if (progress <= 0.3) {
        if (isDarkMode) {
          setIsDarkMode(false);
          if (mainContainerRef.current) mainContainerRef.current.classList.remove('dark-mode-active');
        }
        setContentVisible(false);
      }

      if (progress >= 0.98) {
        if (!contentVisible) setContentVisible(true);
        const scrollY = window.scrollY;
        const flipTop = rect.top + scrollY;
        const additionalScroll = scrollY - (flipTop + windowHeight * 0.7);
        const slideProgress = Math.min(Math.max(additionalScroll / (windowHeight * 0.8), 0), 1);
        setContentTranslateY(TRANSLATE_BASE - (slideProgress * TRANSLATE_BASE));
      } else if (progress < 0.5) {
        setContentTranslateY(TRANSLATE_BASE);
      }
    };

    const throttled = throttle(rawHandler, prefersReducedMotion ? 200 : 80);
    window.addEventListener('scroll', throttled, { passive: true });
    rawHandler();

    return () => window.removeEventListener('scroll', throttled);
  }, [isDarkMode, contentVisible, scrollProgress]);

  // Smooth the visual progress
  useEffect(() => {
    let rafId = null;

    const animate = () => {
      const target = targetProgressRef.current ?? scrollProgress;
      setDisplayProgress(prev => {
        const next = prev + (target - prev) * 0.12;
        return Math.abs(next - target) < 0.0005 ? target : next;
      });
      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);
  useEffect(() => {
      setCardPinned(displayProgress >= 0.98);
    }, [displayProgress]);

  // Toggle content container visibility
  useEffect(() => {
    if (displayProgress >= 0.98) {
      setContentVisible(true);
    } else {
      setContentVisible(false);
    }
  }, [displayProgress]);

  // Observe popular locations entering viewport to set `locationReached`
  useEffect(() => {
    if (!popularLocationsRef.current || !('IntersectionObserver' in window)) return;
    const el = popularLocationsRef.current;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        // When section is at least 35% visible, consider it 'reached'
        setLocationReached(entry.intersectionRatio >= 0.35);
      });
    }, { threshold: [0, 0.15, 0.35, 0.5] });

    obs.observe(el);
    return () => obs.disconnect();
  }, [popularLocationsRef.current]);

  // expose contentVisible to DOM so Header can show bottom nav when needed
  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-content-visible', contentVisible ? 'true' : 'false');
    } catch (e) {}
  }, [contentVisible]);

  useEffect(() => {
    fetchPropertiesForRent();
  }, []);

  // Read search params from Hero search
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get('search') || params.get('city') || '';
    if (search) {
      setFilters(prev => ({ ...prev, city: search }));
    }
  }, [location.search]);

  // Defensive: clear any accidental global overflow locks when this page mounts
  useEffect(() => {
    try {
      const lockedBy = document.documentElement.getAttribute && document.documentElement.getAttribute('data-overflow-locked-by');
      if (!lockedBy) {
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
      }
    } catch (e) {}

    return () => {
      try {
        const lockedBy = document.documentElement.getAttribute && document.documentElement.getAttribute('data-overflow-locked-by');
        if (!lockedBy) {
          document.documentElement.style.overflow = '';
          document.body.style.overflow = '';
        }
      } catch (e) {}
    };
  }, []);

  const fetchPropertiesForRent = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        status: 'published',
        listingType: 'rent',
        limit: 100
      };
      const urlParams = new URLSearchParams(window.location.search);
      const search = urlParams.get('search') || urlParams.get('city') || '';
      if (search) params.search = search;

      const response = await api.get('/properties', { params });

      if (response.data.success) {
        const rentProperties = response.data.properties || [];
        const onlyRentProperties = rentProperties.filter(
          prop => prop.listingType === 'rent'
        );
        setProperties(onlyRentProperties);
      } else {
        setError('Failed to load properties');
      }
    } catch (error) {
      console.error('Error fetching properties for rent:', error);
      setError('Failed to load properties for rent');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const filteredProperties = properties.filter(property => {
    if (filters.propertyType !== 'all' && property.propertyType !== filters.propertyType) {
      return false;
    }
    if (filters.minPrice && property.price < Number(filters.minPrice)) {
      return false;
    }
    if (filters.maxPrice && property.price > Number(filters.maxPrice)) {
      return false;
    }
    if (filters.bedrooms !== 'all' && property.bedrooms !== Number(filters.bedrooms)) {
      return false;
    }
    if (filters.city && !property.city?.toLowerCase().includes(filters.city.toLowerCase())) {
      return false;
    }
    return true;
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      propertyType: 'all',
      minPrice: '',
      maxPrice: '',
      bedrooms: 'all',
      city: ''
    });
  };

  // Calculate transformations for flip card
  const rotationY = displayProgress * 180;
  const scale = 1 + Math.sin(displayProgress * Math.PI) * 0.12;
  const cardOpacity = cardPinned ? 0 : 1;
  const containerBgColor = '#141414';

  // Heading transition (match HomePage)
  const headingTransition = 'color 1.2s cubic-bezier(0.22, 0.9, 0.25, 1)';
  const headingColor = locationReached ? '#ffffffff' : (isDarkMode ? '#ffffff' : '#0f172a');

  return (
    <div
      ref={mainContainerRef}
      className={`min-h-screen smooth-transition ${isDarkMode ? 'dark-mode-active' : 'light-mode-active'}`}
    >
      {/* Flip Card Animation Section */}
      <section
        id="hero-section"
        ref={cardWrapperRef}
        className="flex items-center justify-center py-8 px-4 md:px-8 relative overflow-hidden"
        style={{ minHeight: '85vh' }}
      >
        <div className="absolute inset-0 -z-30">
          <img src={`${process.env.PUBLIC_URL || ''}/images/sell-hero.jpg`} alt="Rent hero" className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-black/40 -z-20"></div>
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col items-center sticky top-16">
            <div className="relative" style={{ perspective: '2000px' }}>
              <div
                className="flip-card-3d relative cursor-pointer"
                style={{
                  width: '400px',
                  height: '550px',
                  transform: `rotateY(${rotationY}deg) scale(${scale})`,
                  opacity: cardOpacity,
                  transition: 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease',
                  pointerEvents: cardOpacity === 0 ? 'none' : 'auto'
                }}
              >
                {/* Front of Card */}
                <div
                  className="flip-card-face absolute inset-0 rounded-3xl shadow-2xl overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #053a96ff 0%, #000000ff 50%, #0b0b0bff 100%)',
                    color: 'white'
                  }}
                >
                  <div className="h-full flex flex-col p-8">
                    <div className="text-center mb-8">
                      <h1 className="text-4xl font-bold mb-4 tracking-tight">Rent With Leatonic</h1>
                      <p className="text-green-200 text-lg">Find your perfect rental home</p>
                    </div>

                    <div className="space-y-6 flex-1">
                      {['APARTMENTS', 'HOUSES', 'CONDOS', 'STUDIOS'].map((item, index) => (
                        <div key={index} className="group cursor-pointer">
                          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 text-center transition-all duration-300 hover:bg-white/20 hover:scale-105 border border-white/20">
                            <h3 className="text-xl font-bold tracking-wide">{item}</h3>
                            <p className="text-sm mt-1 text-green-100">
                              {item === 'APARTMENTS' && 'Modern living spaces'
                                || item === 'HOUSES' && 'Family homes & townhouses'
                                || item === 'CONDOS' && 'Luxury condominiums'
                                || item === 'STUDIOS' && 'Compact & affordable'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Back of Card */}
                <div
                  className="flip-card-face absolute inset-0 rounded-3xl overflow-hidden flex items-center justify-center"
                  style={{
                    backgroundColor: '#000000',
                    transform: 'rotateY(180deg)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                  }}
                >
                  <div className="text-center text-white p-8">
                    <div className="w-28 h-28 bg-gradient-to-br from-green-500 via-emerald-500 to-teal-500 rounded-full mx-auto mb-8 flex items-center justify-center shadow-2xl">
                      <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                      </svg>
                    </div>
                    <h2 className="text-3xl font-bold mb-4">Rentals Available</h2>
                    <p className="text-gray-300 text-lg leading-relaxed">Browse through our curated selection of rental properties</p>
                    <div className="mt-8 flex gap-4 justify-center">
                      <div className="w-12 h-1 bg-black rounded-full"></div>
                      <div className="w-12 h-1 bg-black rounded-full"></div>
                      <div className="w-12 h-1 bg-black rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Glow effect */}
              <div className="absolute -inset-8 bg-gradient-to-r from-black via-black/20 to-black/20 blur-3xl rounded-full -z-10 animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Container */}
      <div
        ref={contentContainerRef}
        className="relative z-20 rounded-t-[40px]"
        style={{
          backgroundColor: containerBgColor,
          transform: `translateY(${contentTranslateY}vh)`,
          transition: 'background-color 0.9s cubic-bezier(0.4,0,0.2,1), transform 0.9s cubic-bezier(0.22,1,0.36,1), opacity 0.6s ease',
          paddingTop: '24px',
          minHeight: '80vh',
          opacity: contentVisible ? 1 : 0,
          pointerEvents: contentVisible ? 'auto' : 'none'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          {/* Filter Section */}
          <div className="rounded-3xl p-8 mb-8 smooth-transition border bg-transparent border-gray-800 shadow-2xl">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8">
              <div>
                <h2 className={`main-heading text-2xl font-bold mb-2`} style={{ color: headingColor, transition: headingTransition }}>
                  Find Your Perfect Rental
                </h2>
                <p className={`text-sm`} style={{ color: isDarkMode ? '#9ca3af' : '#6b7280', transition: headingTransition }}>
                  Filter through our extensive rental properties collection
                </p>
              </div>
              <div className="flex items-center gap-4 mt-4 md:mt-0">
                <div className="px-4 py-2 rounded-xl text-sm font-medium bg-transparent text-gray-300">
                  <span className="font-bold text-green-500">{filteredProperties.length}</span> Properties Found
                </div>
                <button
                  onClick={clearFilters}
                  className="px-5 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-all duration-300 bg-transparent text-gray-300 hover:bg-gray-700 hover:text-white border border-gray-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {/* Property Type */}
              <div>
                <label className="block text-sm font-semibold mb-3 flex items-center gap-2 text-gray-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Property Type
                </label>
                <div className="relative">
                  <select
                    value={filters.propertyType}
                    onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl appearance-none transition-all duration-300 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-black text-white border border-gray-800 hover:border-gray-700"
                  >
                    <option value="all">All Property Types</option>
                    <option value="house">House</option>
                    <option value="apartment">Apartment</option>
                    <option value="condo">Condo</option>
                    <option value="townhouse">Townhouse</option>
                    <option value="villa">Villa</option>
                    <option value="studio">Studio</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Price Range */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-semibold mb-3 flex items-center gap-2 text-gray-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Monthly Rent
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="$ Min"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-black text-white border border-gray-800 hover:border-gray-700"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="$ Max"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-black text-white border border-gray-800 hover:border-gray-700"
                    />
                  </div>
                </div>
              </div>

              {/* Bedrooms */}
              <div>
                <label className="block text-sm font-semibold mb-3 flex items-center gap-2 text-gray-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Bedrooms
                </label>
                <div className="relative">
                  <select
                    value={filters.bedrooms}
                    onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
                    className="w-full px-4 py-3.5 rounded-xl appearance-none transition-all duration-300 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-black text-white border border-gray-800 hover:border-gray-700"
                  >
                    <option value="all">Any Bedrooms</option>
                    <option value="0">Studio</option>
                    <option value="1">1 Bedroom</option>
                    <option value="2">2 Bedrooms</option>
                    <option value="3">3 Bedrooms</option>
                    <option value="4">4+ Bedrooms</option>
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold mb-3 flex items-center gap-2 text-gray-300">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search city or area"
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    className="w-full px-4 py-3.5 pl-11 rounded-xl transition-all duration-300 focus:ring-2 focus:ring-green-500 focus:border-transparent bg-black text-white border border-gray-800 hover:border-gray-700"
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Advanced Filters */}
            <div className="mt-8 pt-8 border-t border-gray-800">
              <div className="flex items-center justify-between">
                <button className="flex items-center gap-2 text-sm font-medium transition-colors text-gray-400 hover:text-white">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  More Filters
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-xs px-3 py-1.5 rounded-full bg-gray-800 text-gray-300">
                    ⚡ Real-time filtering
                  </span>
                  <span className="text-xs px-3 py-1.5 rounded-full bg-green-900/30 text-green-400 border border-green-800/50">
                    ✅ {properties.length} total rentals
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-2xl p-6 mb-8 flex items-start gap-4 bg-red-900/20 border border-red-800/50 text-red-300">
              <svg className="w-6 h-6 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="font-semibold mb-1">Error Loading Properties</h4>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Properties Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="rounded-3xl overflow-hidden shadow-lg animate-pulse bg-gray-800">
                  <div className="h-64 bg-gray-700"></div>
                  <div className="p-6">
                    <div className="h-6 rounded mb-2 bg-gray-700"></div>
                    <div className="h-4 rounded mb-4 bg-gray-700"></div>
                    <div className="flex gap-6 mb-6">
                      <div className="h-4 w-16 rounded bg-gray-700"></div>
                      <div className="h-4 w-16 rounded bg-gray-700"></div>
                      <div className="h-4 w-16 rounded bg-gray-700"></div>
                    </div>
                    <div className="h-8 rounded bg-gray-700"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProperties.length > 0 ? (
            <>
            {/* Results Summary */}
            <div className={`rounded-2xl p-6 mb-8 flex items-center justify-between ${isDarkMode
              ? 'bg-transparent border border-gray-700'
              : 'bg-white border border-gray-200 shadow-sm'
              }`}>
              <div>
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Available Rentals
                </h3>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Showing <span className="font-bold text-green-500">{filteredProperties.length}</span> of <span className="font-bold">{properties.length}</span> properties
                  {filters.city && ` in "${filters.city}"`}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-4 py-2 rounded-xl text-sm font-medium ${isDarkMode
                  ? 'bg-gray-700 text-gray-300'
                  : 'bg-gray-100 text-gray-700'
                  }`}>
                  🎯 Sorted by: Latest
                </span>
                <button className={`p-2.5 rounded-xl transition-colors ${isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Properties Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProperties.map((property) => (
                <PropertyCard key={property._id} property={property} darkMode={isDarkMode} />
              ))}
            </div>
          </>
        ) : (
          <div className={`rounded-3xl shadow-xl p-12 text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${isDarkMode
              ? 'bg-gray-700'
              : 'bg-gray-100'
              }`}>
              <div className="text-4xl">🔍</div>
            </div>
            <h3 className={`text-2xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              No Properties Found
            </h3>
            <p className={`text-lg mb-8 max-w-lg mx-auto ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {properties.length === 0
                ? 'No rental properties are currently available. Please check back later or contact our rental team.'
                : 'No properties match your current filters. Try adjusting your search criteria.'}
            </p>
            {Object.values(filters).some(val => val !== 'all' && val !== '') && (
              <button
                onClick={clearFilters}
                className={`px-8 py-3.5 rounded-xl font-semibold inline-flex items-center gap-3 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${isDarkMode
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700'
                  : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600'
                  }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Clear All Filters & Show All Properties
              </button>
            )}
            {properties.length === 0 && (
              <Link
                to="/contact"
                className={`mt-6 inline-block px-8 py-3.5 rounded-xl font-semibold transition-all duration-300 hover:shadow-lg ${isDarkMode
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
              >
                Contact Rental Team
              </Link>
            )}
          </div>
        )}
      </div>
    </div>

      {/* Popular Locations Section (reused from HomePage) */}
      <section ref={popularLocationsRef} className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className={`main-heading text-3xl font-bold mb-4 smooth-transition`} style={{ color: headingColor, transition: headingTransition }}>
            Popular Rental Locations
          </h2>
          <p className={`text-lg smooth-transition`} style={{ color: isDarkMode ? '#9ca3af' : '#374151', transition: headingTransition }}>
            Discover rental properties in trending cities
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { city: 'New York', count: '1,240+', emoji: '🗽', img: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80' },
            { city: 'Los Angeles', count: '980+', emoji: '🌴', img: 'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=800&q=80' },
            { city: 'Chicago', count: '760+', emoji: '🏙️', img: 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=800&q=80' },
            { city: 'Toronto', count: '890+', emoji: '🍁', img: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=800&q=80' },
            { city: 'Vancouver', count: '540+', emoji: '⛰️', img: 'https://images.unsplash.com/photo-1559511260-66a654ae982a?w=800&q=80' },
            { city: 'Miami', count: '620+', emoji: '🏖️', img: 'https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=800&q=80' }
          ].map((location, index) => (
            <Link
              key={index}
              to={`/forrent?city=${location.city.toLowerCase().replace(/\s+/g, '-')}`}
              className={`relative rounded-3xl overflow-hidden h-80 group cursor-pointer ${locationReached ? 'shadow-lg' : ''}`}
            >
              <img
                src={location.img}
                alt={location.city}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <div className="text-3xl mb-2">{location.emoji}</div>
                <h3 className="text-2xl font-bold mb-1">{location.city}</h3>
                <p className="text-white/90 text-sm">{location.count} rentals available</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Why Rent With Us Section */}
      <section ref={calculatorSectionRef} className="min-h-screen flex items-center justify-center py-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-12">
            <h2 className={`main-heading text-3xl font-bold mb-4`} style={{ color: headingColor, transition: headingTransition }}>
              Why Rent With Leatonic?
            </h2>
            <p className={`text-xl`} style={{ color: locationReached ? '#86efac' : (isDarkMode ? '#d1d5db' : '#6b7280'), transition: headingTransition }}>
              Experience hassle-free renting with our premium services
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: '✅',
                title: 'Verified Listings',
                desc: 'All properties are personally verified by our team'
              },
              {
                icon: '🛡️',
                title: 'Secure Process',
                desc: 'Safe and transparent rental agreements'
              },
              {
                icon: '⚡',
                title: 'Quick Move-in',
                desc: 'Many properties available for immediate move-in'
              },
              {
                icon: '📞',
                title: '24/7 Support',
                desc: 'Round-the-clock customer service for tenants'
              }
            ].map((feature, index) => (
              <div
                key={index}
                className={`rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-3 ${locationReached ? 'bg-white shadow-xl' : 'bg-gray-800'}`}
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className={`text-xl font-bold mb-3 ${locationReached ? 'text-green-900' : 'text-white'}`}>
                  {feature.title}
                </h3>
                <p className={locationReached ? 'text-green-700' : 'text-gray-300'}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default ForRentPage;