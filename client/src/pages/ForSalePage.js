// client/src/pages/ForSalePage.js
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PropertyCard from '../components/PropertyCard';
import api from '../utils/api';

const ForSalePage = () => {
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

  // FLIP ANIMATION STATES (FROM HOMEPAGE)
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isFlipComplete, setIsFlipComplete] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [locationReached, setLocationReached] = useState(false);

  // Refs
  const flipSectionRef = useRef(null);
  const contentRef = useRef(null);
  const locationsRef = useRef(null);

  // Handle URL search params
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get('search') || params.get('city') || '';
    if (search) setFilters(prev => ({ ...prev, city: search }));
  }, [location.search]);

  // Fetch properties on mount
  useEffect(() => {
    fetchPropertiesForSale();
  }, []);

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

  // Observe PopularLocations section to toggle background color
  useEffect(() => {
    const el = locationsRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setLocationReached(entry.isIntersecting);

        try {
          const top = entry.boundingClientRect ? entry.boundingClientRect.top : 0;
          if (entry.isIntersecting) {
            // We've reached locations section
          } else if (top < 0) {
            // We've scrolled past it
          }
        } catch (e) {
          // fallback
        }
      },
      {
        root: null,
        threshold: 0.35,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [locationsRef]);

  // Keep the page <body> background in sync with sections
  useEffect(() => {
    try {
      if (locationReached) {
        document.body.style.backgroundColor = '#ffffff';
      } else {
        document.body.style.backgroundColor = '#141414';
      }
    } catch (e) {
      // ignore
    }

    return () => {
      try {
        document.body.style.backgroundColor = '';
      } catch (e) {}
    };
  }, [locationReached]);

 // 4. SCROLL HANDLER (OPTIMIZED: Smooth appearance and no jitter)
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          const windowHeight = window.innerHeight;

          const startAppear = windowHeight * 0.1;
          const fullyVisible = windowHeight * 0.7;
          const startFlip = windowHeight * 1.2;
          const endFlip = windowHeight * 3.0;

          let progress = 0;

          if (scrollY < startAppear) {
            progress = 0;
          } else if (scrollY >= startAppear && scrollY < fullyVisible) {
            const range = fullyVisible - startAppear;
            const current = scrollY - startAppear;
            progress = (current / range) * 0.3;
          } else if (scrollY >= fullyVisible && scrollY < startFlip) {
            const range = startFlip - fullyVisible;
            const current = scrollY - fullyVisible;
            progress = 0.3 + (current / range) * 0.1;
          } else if (scrollY >= startFlip) {
            const range = endFlip - startFlip;
            const current = Math.min(scrollY - startFlip, range);
            progress = 0.4 + (current / range) * 0.6;
          }

          progress = Math.max(0, Math.min(1, progress));
          setScrollProgress(progress);

          if (progress >= 0.88) {
            setIsFlipComplete(true);
            setShowContent(true);
          } else if (progress < 0.35) {
            setIsFlipComplete(false);
            setShowContent(false);
          }
          
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
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

  // ANIMATION CALCULATIONS (FROM HOMEPAGE)
  const cardTranslateY =
    scrollProgress < 0.3
      ? Math.max((1 - scrollProgress / 0.3) * 60, 15)
      : 0;

  const rotationY = Math.max(0, (scrollProgress - 0.4) / 0.6) * 180;
  const scale = 1 + (Math.max(0, scrollProgress - 0.4) / 0.6) * 11;
  const cardOpacity = scrollProgress < 0.3 ? scrollProgress / 0.3 : 1;
  const overlayOpacity = showContent ? 1 : 0;

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
      className="relative min-h-[400vh]"
      style={{
        backgroundColor: locationReached ? "#f5f5f5" : (showContent ? "#141414" : "#ffffff"),
        overflowX: "hidden",
        overflow: "hidden",
      }}
    >
      {/* Dark overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundColor: "#141414",
          opacity: !locationReached ? overlayOpacity : 0,
          transition: "opacity 600ms ease",
          zIndex: 10,
        }}
      />

      <div className="h-screen"></div>

      {/* Flipping Card */}
      <div
        ref={flipSectionRef}
        className="fixed left-1/2 pointer-events-none"
        style={{
          left: "50%",
          top: showContent ? "20vh" : "26vh",
          transform: "translateX(-50%)",
          opacity: cardOpacity,
          zIndex: showContent ? 40 : 50,
        }}
      >
        <div style={{ perspective: "2500px", width: "380px", height: "520px" }}>
          <div
            style={{
              width: "100%",
              height: "100%",
              transformStyle: "preserve-3d",
              transform: `translateY(${cardTranslateY}vh) rotateY(${rotationY}deg) scale(${scale})`,
              transition: "transform 0.1s linear",
            }}
          >
            {/* Front Face */}
            <div
              className="absolute inset-0 rounded-3xl shadow-2xl overflow-hidden border-2 border-white/20"
              style={{
                background:
                  "linear-gradient(135deg, #141414 0%, #1a1a1a 50%, #141414 100%)",
                backfaceVisibility: "hidden",
                boxShadow: `
                  0 0 0 1px rgba(255, 255, 255, 0.1),
                  0 0 30px rgba(255, 255, 255, 0.05),
                  0 0 60px rgba(255, 255, 255, 0.03),
                  inset 0 0 20px rgba(255, 255, 255, 0.05)
                `,
              }}
            >
              <div
                className="absolute inset-0 rounded-3xl opacity-30"
                style={{
                  background:
                    "linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)",
                  filter: "blur(1px)",
                }}
              />

              <div className="h-full flex flex-col items-center justify-between p-8 text-white relative z-10">
                <div style={{ height: 28 }} />

                <div className="flex items-center justify-center mb-6">
                  <div className="grid grid-cols-2 gap-4" style={{ width: 84 }}>
                    <div className="w-8 h-8 border-2 border-white rounded-sm shadow-lg" />
                    <div className="w-8 h-8 border-2 border-white rounded-sm shadow-lg" />
                    <div className="w-8 h-8 border-2 border-white rounded-sm shadow-lg" />
                    <div className="w-8 h-8 border-2 border-white rounded-sm shadow-lg" />
                  </div>
                </div>

                <div className="w-full text-center mb-2">
                  <h2 className="text-4xl md:text-5xl font-light tracking-widest">
                    FOR SALE
                  </h2>
                  <div className="mt-3 text-sm opacity-60">⠋⠕⠗ ⠎⠁⠇⠑</div>
                </div>
              </div>
            </div>

            {/* Back Face */}
            <div
              className="absolute inset-0 rounded-3xl overflow-hidden"
              style={{
                backgroundColor: "#141414",
                transform: "rotateY(180deg)",
                backfaceVisibility: "hidden",
                boxShadow: `
                  0 0 0 1px rgba(255, 255, 255, 0.1),
                  0 0 30px rgba(255, 255, 255, 0.05),
                  inset 0 0 20px rgba(255, 255, 255, 0.05)
                `,
              }}
            >
              <div
                className="absolute inset-0 rounded-3xl opacity-20"
                style={{
                  background:
                    "linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)",
                  filter: "blur(1px)",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div
        ref={contentRef}
        className="relative"
        style={{
          marginTop: showContent ? "85vh" : "100vh",
          opacity: showContent ? 1 : 0,
          transform: showContent ? "translateY(0)" : "translateY(50px)",
          transition:
            "opacity 0.8s ease, transform 0.8s ease, margin-top 0.6s ease",
          pointerEvents: showContent ? "auto" : "none",
          zIndex: showContent ? 60 : 30,
        }}
      >
        <div
          className={`rounded-t-[64px] overflow-hidden min-h-screen pt-20 ${locationReached ? 'light-mode-active' : ''}`}
          style={{
            backgroundColor: locationReached ? "#f5f5f5" : "#141414",
            transition: "background-color 700ms ease-in-out",
          }}
        >
          {/* Filter Section */}
          <div className="py-10 px-4 md:px-8 max-w-7xl mx-auto">
            <div className="rounded-3xl p-8 mb-8 border border-gray-700 shadow-2xl" style={{ backgroundColor: 'transparent' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">
                  Filter Properties For Sale
                </h2>
                <button
                  onClick={clearFilters}
                  className="text-blue-400 hover:text-blue-300 font-medium text-sm"
                >
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Property Type */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Property Type
                  </label>
                  <select
                    value={filters.propertyType}
                    onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-white border-gray-700"
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
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Min Price
                  </label>
                  <input
                    type="number"
                    placeholder="$0"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-white border-gray-700"
                  />
                </div>

                {/* Max Price */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Max Price
                  </label>
                  <input
                    type="number"
                    placeholder="Any"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-white border-gray-700"
                  />
                </div>

                {/* Bedrooms */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    Bedrooms
                  </label>
                  <select
                    value={filters.bedrooms}
                    onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-white border-gray-700"
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
                  <label className="block text-sm font-medium mb-2 text-gray-300">
                    City
                  </label>
                  <input
                    type="text"
                    placeholder="Enter city"
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    className="w-full px-4 py-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-white border-gray-700"
                  />
                </div>
              </div>

              {/* Active Filters Count */}
              <div className="mt-4 text-sm text-gray-400">
                Showing <span className="font-semibold text-blue-400">{filteredProperties.length}</span> of <span className="font-semibold">{properties.length}</span> properties for sale
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-900/30 border border-red-700 text-red-300 rounded-lg">
                {error}
              </div>
            )}

            {/* Properties Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="rounded-3xl overflow-hidden shadow-lg animate-pulse">
                    <div className="h-64 bg-gray-700"></div>
                    <div className="p-6">
                      <div className="h-6 bg-gray-700 rounded mb-2"></div>
                      <div className="h-4 bg-gray-700 rounded mb-4"></div>
                      <div className="flex gap-6 mb-6">
                        <div className="h-4 w-16 bg-gray-700 rounded"></div>
                        <div className="h-4 w-16 bg-gray-700 rounded"></div>
                        <div className="h-4 w-16 bg-gray-700 rounded"></div>
                      </div>
                      <div className="h-8 bg-gray-700 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProperties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProperties.map((property) => (
                  <PropertyCard key={property._id} property={property} darkMode={true} />
                ))}
              </div>
            ) : (
              <div
                className="rounded-3xl shadow-lg p-12 text-center border border-gray-700 heading-transition"
                style={{
                  backgroundColor: locationReached ? '#141414' : 'transparent',
                  color: 'white',
                  transition: 'background-color 700ms ease-in-out, color 700ms ease-in-out',
                }}
              >
                <div className="text-6xl mb-4">🏠</div>
                <h3 className="text-2xl font-bold mb-2" style={{ color: 'white' }}>
                  No Properties Found
                </h3>
                <p className="mb-6" style={{ color: 'rgba(255,255,255,0.8)' }}>
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
          </div>

          {/* Popular Locations Section */}
          <section ref={locationsRef} className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
            <div className="text-center mb-12">
                <div className="flex items-center justify-center mb-4">
                  <div className="text-sm font-semibold uppercase tracking-wider text-blue-400">
                    Locations
                  </div>
                </div>

                <h2 className="main-heading heading-transition mx-auto">
                  Popular Locations
                </h2>

                <p className={`text-lg heading-transition ${locationReached ? 'text-gray-700' : 'text-gray-300'}`}>
                  Discover properties for sale in trending cities
                </p>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {locationData.map((loc, index) => (
                <Link
                  key={index}
                  to={`/forsale?city=${loc.city.toLowerCase()}`}
                  className="relative rounded-3xl overflow-hidden h-80 group cursor-pointer shadow-lg"
                >
                  <img
                    src={loc.img}
                    alt={loc.city}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                    <div className="text-3xl mb-2">{loc.emoji}</div>
                    <h3 className="text-2xl font-bold mb-1">{loc.city}</h3>
                    <p className="text-white/90 text-sm">{loc.count} listings available</p>
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