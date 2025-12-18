
// client/src/pages/ForSalePage.js
import React, { useState, useEffect, useRef } from 'react';
import usePerformanceHints from '../hooks/usePerformance';
import { throttle } from '../utils/perf';
import { Link, useLocation } from 'react-router-dom';
import PropertyCard from '../components/PropertyCard';
import api from '../utils/api';

const ForSalePage = () => {
  const { isLowEnd, prefersReducedMotion } = usePerformanceHints();
  const SALE_HERO_VIDEO = `${process.env.PUBLIC_URL || ''}/videos/sale-hero.mp4`;

  // State management
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

  // Animation states
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [locationReached, setLocationReached] = useState(false);
  const [cardPinned, setCardPinned] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [contentTranslateY, setContentTranslateY] = useState(60);

  // Refs
  const cardWrapperRef = useRef(null);
  const targetProgressRef = useRef(0);
  const mainContainerRef = useRef(null);
  const popularLocationsRef = useRef(null);
  const featuresSectionRef = useRef(null);
  const contentContainerRef = useRef(null);

  const TRANSLATE_BASE = 60;

  // Inject dark mode styles
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
      .dark-mode-active .text-slate-900 { color: var(--text-primary) !important; }
      .dark-mode-active .text-blue-800,
      .dark-mode-active .text-blue-700 { color: var(--text-secondary) !important; }
      .dark-mode-active .text-blue-600,
      .dark-mode-active .text-slate-600 { color: var(--text-tertiary) !important; }
      .dark-mode-active .bg-white {
        background-color: var(--bg-secondary) !important;
        border-color: var(--border-color) !important;
      }
      .dark-mode-active .bg-gray-100,
      .dark-mode-active .bg-gray-50 { background-color: var(--bg-primary) !important; }
      .dark-mode-active .bg-gradient-to-br.from-blue-50.to-blue-100 {
        background: linear-gradient(135deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.5) 100%) !important;
      }
      .dark-mode-active .border-blue-200,
      .dark-mode-active .border-blue-300 { border-color: var(--border-color) !important; }
      .dark-mode-active .shadow-xl {
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.35), 0 6px 8px -4px rgba(0, 0, 0, 0.28) !important;
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
      
      .light-mode-active .main-heading {
        color: #0f172a !important;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.contains(style) && document.head.removeChild(style);
  }, []);

  // Clear overflow locks on mount/unmount
  useEffect(() => {
    const clearOverflow = () => {
      try {
        const lockedBy = document.documentElement.getAttribute?.('data-overflow-locked-by');
        if (!lockedBy) {
          document.documentElement.style.overflow = '';
          document.body.style.overflow = '';
        }
      } catch (e) { }
    };
    clearOverflow();
    return clearOverflow;
  }, []);

  // Main scroll handler for flip card animation
  useEffect(() => {
    const handleScroll = () => {
      if (!cardWrapperRef.current || !popularLocationsRef.current) return;

      const rect = cardWrapperRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const locationRect = popularLocationsRef.current.getBoundingClientRect();
      const locationTop = locationRect.top;

      // Check if popular locations section is reached
      if (locationTop <= windowHeight * 0.5) {
        if ((isDarkMode || scrollProgress > 0.5) && !locationReached) {
          setLocationReached(true);
          mainContainerRef.current?.classList.remove('dark-mode-active');
          featuresSectionRef.current?.classList.add('light-mode-active');
        }
      } else if (locationTop > windowHeight * 0.5 && locationReached) {
        if (isDarkMode || scrollProgress > 0.5) {
          setLocationReached(false);
          mainContainerRef.current?.classList.add('dark-mode-active');
          featuresSectionRef.current?.classList.remove('light-mode-active');
        }
      }

      // Calculate flip progress
      const cardTop = rect.top;
      const startPoint = windowHeight * 0.8;
      const endPoint = windowHeight * 0.2;
      const distance = startPoint - endPoint;
      const rawProgress = (startPoint - cardTop) / distance;
      const progress = Math.max(0, Math.min(1, rawProgress));

      // Skip heavy updates on low-end devices
      if (isLowEnd) {
        if (progress >= 0.98 && !contentVisible) setContentVisible(true);
        targetProgressRef.current = progress;
        return;
      }

      setScrollProgress(progress);
      targetProgressRef.current = progress;

      // Dark mode transition during flip
      if (progress > 0.3 && progress < 1 && !isDarkMode) {
        setIsDarkMode(true);
        mainContainerRef.current?.classList.add('dark-mode-active');
      } else if (progress <= 0.3 && isDarkMode) {
        setIsDarkMode(false);
        mainContainerRef.current?.classList.remove('dark-mode-active');
        setContentVisible(false);
      }

      // Content slide-up animation
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

    const throttled = throttle(handleScroll, prefersReducedMotion ? 200 : 80);
    window.addEventListener('scroll', throttled, { passive: true });
    handleScroll(); // Run once on mount
    return () => window.removeEventListener('scroll', throttled);
  }, [isDarkMode, locationReached, scrollProgress, isLowEnd, prefersReducedMotion, contentVisible]);

  // Smooth progress animation
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
    return () => rafId && cancelAnimationFrame(rafId);
  }, [scrollProgress]);

  // Pin/hide card when flip completes
  useEffect(() => {
    setCardPinned(displayProgress >= 0.98);
  }, [displayProgress]);

  // Toggle content visibility
  useEffect(() => {
    setContentVisible(displayProgress >= 0.98);
  }, [displayProgress]);

  // Expose content visibility to DOM for Header
  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-content-visible', contentVisible ? 'true' : 'false');
    } catch (e) { }
  }, [contentVisible]);

  // Fetch properties on mount
  useEffect(() => {
    fetchPropertiesForSale();
  }, []);

  // Handle URL search params
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get('search') || params.get('city') || '';
    if (search) setFilters(prev => ({ ...prev, city: search }));
  }, [location.search]);

  const fetchPropertiesForSale = async () => {
    try {
      setLoading(true);
      setError('');
      const params = { status: 'published', listingType: 'sale', limit: 100 };
      const urlParams = new URLSearchParams(window.location.search);
      const search = urlParams.get('search') || urlParams.get('city') || '';
      if (search) params.search = search;

      const response = await api.get('/properties', { params });

      if (response.data.success) {
        const saleProperties = (response.data.properties || []).filter(
          prop => prop.listingType === 'sale'
        );
        setProperties(saleProperties);
      } else {
        setError('Failed to load properties');
      }
    } catch (error) {
      console.error('Error fetching properties for sale:', error);
      setError('Failed to load properties for sale');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const filteredProperties = properties.filter(property => {
    if (filters.propertyType !== 'all' && property.propertyType !== filters.propertyType) return false;
    if (filters.minPrice && property.price < Number(filters.minPrice)) return false;
    if (filters.maxPrice && property.price > Number(filters.maxPrice)) return false;
    if (filters.bedrooms !== 'all' && property.bedrooms !== Number(filters.bedrooms)) return false;
    if (filters.city && !property.city?.toLowerCase().includes(filters.city.toLowerCase())) return false;
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

  // Card animation calculations
  const rotationY = displayProgress * 180;
  const scale = 1 + Math.sin(displayProgress * Math.PI) * 0.12;
  const cardOpacity = cardPinned ? 0 : 1;
  const headingColor = locationReached ? '#0b5a3c' : (isDarkMode ? '#ffffff' : '#0f172a');

  const locationData = [
    { city: 'New York', count: '1,240+', emoji: '🗽', img: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80' },
    { city: 'Los Angeles', count: '980+', emoji: '🌴', img: 'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=800&q=80' },
    { city: 'Chicago', count: '760+', emoji: '🏙️', img: 'https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=800&q=80' },
    { city: 'Toronto', count: '890+', emoji: '🍁', img: 'https://images.unsplash.com/photo-1517935706615-2717063c2225?w=800&q=80' },
    { city: 'Vancouver', count: '540+', emoji: '⛰️', img: 'https://images.unsplash.com/photo-1559511260-66a654ae982a?w=800&q=80' },
    { city: 'Miami', count: '620+', emoji: '🏖️', img: 'https://images.unsplash.com/photo-1506966953602-c20cc11f75e3?w=800&q=80' }
  ];

  return (
    <div
      ref={mainContainerRef}
      className={`min-h-screen smooth-transition ${isDarkMode ? 'dark-mode-active' : 'bg-white'}`}
    >
      {/* Flip Card Animation Section */}
      <section
        id="hero-section"
        ref={cardWrapperRef}
        className="flex items-center justify-center py-8 px-4 md:px-8 relative"
        style={{ minHeight: '85vh' }}
      >
        <div className="absolute inset-0 -z-30">
          <img src={`${process.env.PUBLIC_URL || ''}/images/buy-hero.jpg`} alt="Buy hero" className="w-full h-full object-cover" />
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
                  pointerEvents: cardPinned ? 'none' : 'auto',
                  transition: 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease'
                }}
              >
                {/* Front of Card */}
                <div
                  className="flip-card-face absolute inset-0 rounded-3xl shadow-2xl overflow-hidden"
                  style={{
                    background: 'linear-gradient(135deg, #000000ff 0%rgba(0, 0, 0, 1)af 50%, #272727ff 100%)',
                    color: 'white'
                  }}
                >
                  <div className="h-full flex flex-col p-8">
                    <div className="text-center mb-8">
                      <h1 className="text-4xl font-bold mb-4 tracking-tight">Buy With Leatonic</h1>
                      <p className="text-blue-200 text-lg">Find your dream home for sale</p>
                    </div>

                    <div className="space-y-6 flex-1">
                      {['LUXURY HOMES', 'FAMILY HOMES', 'INVESTMENT', 'FIRST-TIME BUYER'].map((item, index) => (
                        <div key={index} className="group cursor-pointer">
                          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 text-center transition-all duration-300 hover:bg-white/20 hover:scale-105 border border-white/20">
                            <h3 className="text-xl font-bold tracking-wide">{item}</h3>
                            <p className="text-sm mt-1 text-blue-100">
                              {item === 'LUXURY HOMES' && 'Premium properties & estates'}
                              {item === 'FAMILY HOMES' && 'Spacious homes with yards'}
                              {item === 'INVESTMENT' && 'Properties with high ROI potential'}
                              {item === 'FIRST-TIME BUYER' && 'Affordable starter homes'}
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
                    <div className="w-28 h-28 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-500 rounded-full mx-auto mb-8 flex items-center justify-center shadow-2xl">
                      <svg className="w-14 h-14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                    </div>
                    <h2 className="text-3xl font-bold mb-4">Homes For Sale</h2>
                    <p className="text-gray-300 text-lg leading-relaxed">Discover exclusive properties ready for purchase</p>
                    <div className="mt-8 flex gap-4 justify-center">
                      <div className="w-12 h-1 bg-blue-500 rounded-full"></div>
                      <div className="w-12 h-1 bg-indigo-500 rounded-full"></div>
                      <div className="w-12 h-1 bg-purple-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Glow effect */}
              <div className="absolute -inset-8 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 blur-3xl rounded-full -z-10 animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Container */}
      <div
        ref={contentContainerRef}
        className="relative z-20 rounded-t-[40px] w-full"
        style={{
          backgroundColor: '#141414',
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
            <div className="flex items-center justify-between mb-4">
              <h2
                className="main-heading text-xl font-bold"
                style={{
                  color: headingColor,
                  transition: 'color 1.2s cubic-bezier(0.22, 0.9, 0.25, 1)'
                }}
              >
                Filter Properties For Sale
              </h2>
              <button
                onClick={clearFilters}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Clear All
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Property Type */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Property Type
                </label>
                <select
                  value={filters.propertyType}
                  onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'border border-gray-300'}`}
                >
                  <option value="all">All Types</option>
                  <option value="house">House</option>
                  <option value="apartment">Apartment</option>
                  <option value="condo">Condo</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="villa">Villa</option>
                </select>
              </div>

              {/* Min Price */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Min Price
                </label>
                <input
                  type="number"
                  placeholder="$0"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'border border-gray-300'}`}
                />
              </div>

              {/* Max Price */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Max Price
                </label>
                <input
                  type="number"
                  placeholder="Any"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'border border-gray-300'}`}
                />
              </div>

              {/* Bedrooms */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Bedrooms
                </label>
                <select
                  value={filters.bedrooms}
                  onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'border border-gray-300'}`}
                >
                  <option value="all">Any</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="5">5+</option>
                </select>
              </div>

              {/* City */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  City
                </label>
                <input
                  type="text"
                  placeholder="Enter city"
                  value={filters.city}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'border border-gray-300'}`}
                />
              </div>
            </div>

            {/* Active Filters Count */}
            <div className={`mt-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Showing <span className="font-semibold text-blue-600">{filteredProperties.length}</span> of <span className="font-semibold">{properties.length}</span> properties for sale
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Properties Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="rounded-3xl overflow-hidden shadow-lg animate-pulse bg-transparent">
                  <div className={`h-64 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                  <div className="p-6">
                    <div className={`h-6 rounded mb-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    <div className={`h-4 rounded mb-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    <div className="flex gap-6 mb-6">
                      <div className={`h-4 w-16 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                      <div className={`h-4 w-16 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                      <div className={`h-4 w-16 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                    </div>
                    <div className={`h-8 rounded ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProperties.map((property) => (
                <PropertyCard key={property._id} property={property} darkMode={isDarkMode} />
              ))}
            </div>
          ) : (
            <div className="rounded-3xl shadow-lg p-12 text-center bg-transparent">
              <div className="text-6xl mb-4">🏠</div>
              <h3 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                No Properties Found
              </h3>
              <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {properties.length === 0
                  ? 'No properties for sale are currently available.'
                  : 'Try adjusting your filters to see more results.'}
              </p>
              {Object.values(filters).some(val => val !== 'all' && val !== '') && (
                <button
                  onClick={clearFilters}
                  className="bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-600 inline-flex items-center gap-2"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* Popular Locations Section */}
          <section ref={popularLocationsRef} className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="main-heading text-3xl font-bold mb-4 smooth-transition text-white">
                Popular Locations
              </h2>
              <p className="text-lg smooth-transition text-gray-300">
                Discover popular properties in trending cities
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
                  to={`/location/${location.city.toLowerCase().replace(/\s+/g, '-')}`}
                  state={{ location: { id: location.city.toLowerCase().replace(/\s+/g, '').replace(/-/g,''), name: location.city, image: location.img } }}
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
                    <p className="text-white/90 text-sm">{location.count} listings available</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ForSalePage;