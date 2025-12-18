import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MapPin, Home, TrendingUp, Star, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PopularLocations = ({ darkMode = false, lightMode = false }) => {
  const [hoveredLocation, setHoveredLocation] = useState(null);
  const [isInView, setIsInView] = useState(false);
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const cardsRef = useRef([]);
  const mapRef = useRef(null);
  const rafRef = useRef(null);
  const bgOverlayRef = useRef(null);
  const navigate = useNavigate();

  const locations = [
    {
      id: 'california',
      name: 'California',
      image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400&h=300&fit=crop',
      position: { top: '0%', left: '8%' },
      icon: Home,
      stats: '2,450 homes',
      gradient: 'from-blue-500/20 via-purple-500/20 to-pink-500/20',
      color: 'bg-gradient-to-br from-blue-500 to-purple-600'
    },
    {
      id: 'newyork',
      name: 'New York',
      image: 'https://images.unsplash.com/photo-1543716091-a840c05249ec?w=400&h=300&fit=crop',
      position: { top: '0%', right: '8%' },
      icon: TrendingUp,
      stats: '3,890 homes',
      gradient: 'from-emerald-500/20 via-teal-500/20 to-cyan-500/20',
      color: 'bg-gradient-to-br from-emerald-500 to-teal-600'
    },
    {
      id: 'texas',
      name: 'Texas',
      image: 'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=400&h=300&fit=crop',
      position: { top: '35%', left: '35%' },
      icon: Star,
      stats: '1,920 homes',
      gradient: 'from-amber-500/20 via-orange-500/20 to-red-500/20',
      color: 'bg-gradient-to-br from-amber-500 to-orange-600'
    },
    {
      id: 'florida',
      name: 'Florida',
      image: 'https://images.unsplash.com/photo-1506812574058-fc75fa93fead?w=400&h=300&fit=crop',
      position: { top: '47%', right: '19%' },
      icon: MapPin,
      stats: '2,780 homes',
      gradient: 'from-rose-500/20 via-pink-500/20 to-fuchsia-500/20',
      color: 'bg-gradient-to-br from-rose-500 to-pink-600'
    }
  ];

  const useLight = !!lightMode;
  const effectiveDark = !useLight && !!darkMode;

  // Memoize colors to prevent recalculations
  const themeColors = useMemo(() => {
    const textColor = effectiveDark ? 'text-white' : 'text-gray-900';
    const textSecondaryColor = effectiveDark ? 'text-gray-300' : 'text-gray-600';
    const bgColor = effectiveDark ? 'bg-black' : (useLight ? 'bg-white' : 'bg-gradient-to-br from-gray-50 to-white');
    const glassBg = effectiveDark
      ? 'bg-black/50 border border-white/10'
      : (useLight ? 'bg-white border border-gray-200' : 'bg-white/80 border border-white/40');
    const mapBg = effectiveDark
      ? 'bg-gradient-to-br from-gray-900 via-black to-gray-900'
      : (useLight ? 'bg-white' : 'bg-gradient-to-br from-blue-50/50 via-white to-blue-50/50');
    const lineColor = effectiveDark
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(59, 130, 246, 0.15)';
    const dotColor = effectiveDark ? '#ffffff' : '#3b82f6';

    return {
      textColor,
      textSecondaryColor,
      bgColor,
      glassBg,
      mapBg,
      lineColor,
      dotColor,
    };
  }, [effectiveDark, useLight]);

  // Intersection observer
  useEffect(() => {
    if (!sectionRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsInView(true);
            animateOnEnter();
          } else {
            setIsInView(false);
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: '0px'
      }
    );

    observer.observe(sectionRef.current);

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  // Light mode enforcement
  useEffect(() => {
    try {
      if (lightMode) {
        if (titleRef.current) {
          titleRef.current.style.setProperty('color', '#000000ff', 'important');
        }
        if (sectionRef.current) {
          sectionRef.current.style.setProperty('background-color', '#ffffff', 'important');
        }
      } else {
        if (titleRef.current) {
          titleRef.current.style.removeProperty('color');
        }
        if (sectionRef.current) {
          sectionRef.current.style.removeProperty('background-color');
        }
      }
    } catch (e) {
      console.warn('[PopularLocations] failed to apply lightMode inline styles', e);
    }
  }, [lightMode]);

  // Optimized entrance animation with smooth scroll
  const animateOnEnter = useCallback(() => {
    if (titleRef.current) {
      titleRef.current.style.opacity = '0';
      titleRef.current.style.transform = 'translateY(30px)';
      requestAnimationFrame(() => {
        titleRef.current.style.transition = 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        titleRef.current.style.opacity = '1';
        titleRef.current.style.transform = 'translateY(0)';
      });
    }

    cardsRef.current.forEach((card, index) => {
      if (card) {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.9) translateY(20px)';
        setTimeout(() => {
          card.style.transition = `opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s, transform 0.6s cubic-bezier(0.4, 0, 0.2, 1) ${index * 0.1}s`;
          card.style.opacity = '1';
          card.style.transform = 'scale(1) translateY(0)';
        }, 100);
      }
    });

    if (mapRef.current) {
      mapRef.current.style.opacity = '0';
      mapRef.current.style.transform = 'scale(0.98)';
      setTimeout(() => {
        mapRef.current.style.transition = 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s, transform 0.8s cubic-bezier(0.4, 0, 0.2, 1) 0.2s';
        mapRef.current.style.opacity = '1';
        mapRef.current.style.transform = 'scale(1)';
      }, 100);
    }
  }, []);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleMouseMove = useCallback((e) => {
    // Mouse parallax effect disabled
  }, []);

  const handleMouseLeave = useCallback(() => {
    // Mouse leave effect disabled
  }, []);

  const handleLocationClick = useCallback((location) => {
    try {
      // navigate to location page with router state so LocationPage can use it immediately
      navigate(`/location/${location.id}`, { state: { location: { id: location.id, name: location.name, image: location.image } } });
    } catch (e) {
      console.warn('[PopularLocations] navigation failed', e);
    }
  }, []);

  // Add CSS for smooth transitions
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .popular-locations-section {
        transform-style: preserve-3d;
        perspective: 1000px;
      }
      
      .smooth-parallax {
        will-change: transform;
        transform: translateZ(0);
      }
      
      .location-card {
        transform-style: preserve-3d;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
      }
      
      .hover-3d-effect {
        transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1),
                    box-shadow 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        will-change: transform;
      }
      
      .location-card:hover {
        z-index: 20;
      }
      
      .glass-effect {
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        transform: translateZ(0);
      }
      
      @media (prefers-reduced-motion: reduce) {
        .hover-3d-effect,
        .smooth-parallax,
        .location-card {
          transition: none !important;
          animation: none !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div
      ref={sectionRef}
      className={`popular-locations-section min-h-screen relative overflow-hidden transition-colors duration-700`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ willChange: 'background-color', backgroundColor: effectiveDark ? '#000000' : '#ffffff' }}
    >
      <div className="h-full">
        {/* Background with Map Image */}
        <div ref={mapRef} className={`absolute inset-0 smooth-parallax transition-colors duration-700`} style={{ willChange: 'background' }}>
          {/* Map Image Background */}
          <div
            className="absolute mt-[50px] inset-0 bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(https://assets.movoto.com/novaimgs/images/desktop/home/cities-mapgraphic.svg)',
              backgroundSize: '60%',
              opacity: effectiveDark ? 0.3 : 0.5,
              filter: effectiveDark ? 'invert(1) brightness(0.6)' : 'none'
            }}
          />
          <div ref={bgOverlayRef} className="absolute inset-0 pointer-events-none" style={{ background: 'transparent', opacity: 0, transition: 'opacity 0.6s ease', zIndex: 2, willChange: 'opacity' }} />
        </div>

        {/* Connection Lines - Hidden to keep map clean */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-0">
          {locations.map((loc, index) => (
            <line
              key={`line-${index}`}
              x1="50%"
              y1="50%"
              x2={`${parseFloat(loc.position.left || 100 - parseFloat(loc.position.right || 0)) - 5}%`}
              y2={`${parseFloat(loc.position.top || 100 - parseFloat(loc.position.bottom || 0)) + 5}%`}
              stroke={themeColors.lineColor}
              strokeWidth="1"
              strokeDasharray="5,5"
            />
          ))}
        </svg>

        <div className="relative z-10 flex items-center justify-center min-h-screen md:p-8">
          <div className="max-w-6xl w-full">
            {/* Header */}
            <div ref={titleRef} className="text-center mb-12 md:mb-16">
              <div className={`inline-block mb-4 md:mb-6`}>
                <div className={`${themeColors.glassBg} rounded-2xl px-6 md:px-8 py-3 transition-all duration-700 hover:scale-105`}>
                  <span className={`text-transparent bg-clip-text bg-gradient-to-r ${effectiveDark ? 'from-blue-400 via-purple-400 to-pink-400' : 'from-blue-600 via-purple-600 to-pink-600'
                    } font-bold text-base md:text-lg`}>
                    🏡 Discover Your Perfect Home
                  </span>
                </div>
              </div>
              <h1 className={`text-5xl md:text-7xl font-bold mb-4 md:mb-6 transition-all duration-700 ${useLight ? 'text-gray-900' : (effectiveDark ? 'text-white' : 'text-gray-900')}`}>
                Popular Locations
              </h1>
              <p className={`text-lg md:text-xl font-medium mb-2 md:mb-4 max-w-2xl mx-auto px-4 transition-colors duration-700 ${useLight ? 'text-gray-900' : (effectiveDark ? 'text-gray-300' : 'text-gray-700')
                }`}>
                Explore prime real estate in America's most sought-after cities
              </p>
              <p className={`text-base md:text-lg px-4 transition-colors duration-700 ${useLight ? 'text-gray-800' : (effectiveDark ? 'text-gray-400' : 'text-gray-600')
                }`}>
                Each location offers unique opportunities and lifestyle options
              </p>
            </div>

            {/* Map Container */}
            <div className="relative w-full h-[500px] md:h-[600px]">
              {/* Location Cards */}
              {locations.map((location, index) => {
                const IconComponent = location.icon;
                return (
                  <div
                    key={location.id}
                    ref={(el) => (cardsRef.current[index] = el)}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group location-card"
                    style={{
                      ...location.position,
                      transform: 'translateZ(0)'
                    }}
                    onMouseEnter={() => setHoveredLocation(location.id)}
                    onMouseLeave={() => setHoveredLocation(null)}
                    onClick={() => handleLocationClick(location)}
                  >
                    {/* Card */}
                    <div
                      className={`relative rounded-2xl overflow-hidden transition-all duration-500 ease-out ${hoveredLocation === location.id
                          ? 'scale-105 shadow-2xl'
                          : 'scale-100 shadow-lg'
                        }`}
                      style={{
                        width: 'clamp(140px, 16vw, 180px)',
                        height: 'clamp(160px, 18vw, 200px)',
                        willChange: 'transform',
                        transform: 'translateZ(0)'
                      }}
                    >
                      {/* Image with gradient overlay */}
                      <div className="absolute inset-0">
                        <img
                          src={location.image}
                          alt={location.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          loading="lazy"
                          style={{ transform: 'translateZ(0)' }}
                        />
                        <div className={`absolute inset-0 bg-gradient-to-t ${darkMode ? 'from-black/95 via-black/60 to-transparent' : 'from-black/90 via-black/50 to-transparent'
                          } transition-opacity duration-500`}></div>
                      </div>

                      {/* Glassmorphism Border */}
                      <div className={`absolute inset-0 border-2 rounded-2xl transition-all duration-500 ${darkMode
                          ? 'border-white/10 group-hover:border-white/30'
                          : 'border-white/20 group-hover:border-white/40'
                        }`} />

                      {/* Icon Badge */}
                      <div className={`absolute top-3 right-3 w-10 h-10 ${location.color
                        } rounded-xl flex items-center justify-center shadow-lg transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>

                      {/* Content */}
                      <div className="absolute inset-0 p-4 flex flex-col justify-end">
                        <div className="space-y-2">
                          <h3 className="text-white text-lg font-bold tracking-tight leading-tight">
                            {location.name}
                          </h3>
                          <p className="text-white/80 text-sm font-medium">
                            {location.stats}
                          </p>
                          <div
                            className={`transition-all duration-500 transform ${hoveredLocation === location.id
                                ? 'opacity-100 translate-y-0'
                                : 'opacity-0 translate-y-3'
                              }`}
                          >
                            <button className={`flex items-center gap-2 text-white text-sm font-semibold ${darkMode ? 'bg-white/15 hover:bg-white/25' : 'bg-white/20 hover:bg-white/30'
                              } px-4 py-2 rounded-lg transition-all duration-300 hover:gap-3 backdrop-blur-sm`}>
                              Explore
                              <ChevronRight className="w-4 h-4 transition-transform duration-300" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Central Element - Hidden to show map clearly */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 pointer-events-none">
                <div className="relative">
                  <div className={`w-32 h-32 md:w-40 md:h-40 ${darkMode
                      ? 'bg-white/10 border border-white/20'
                      : 'bg-white/80 border border-white/40'
                    } rounded-full flex flex-col items-center justify-center transition-all duration-700 hover:scale-105`}>
                    <div className="text-center">
                      <div className="text-3xl md:text-4xl mb-1 md:mb-2">🏠</div>
                      <div className={`font-bold text-xs md:text-sm transition-colors duration-700 ${darkMode ? 'text-black' : 'text-gray-900'
                        }`}>
                        United States
                      </div>
                      <div className={`text-xs transition-colors duration-700 ${darkMode ? 'text-black/60' : 'text-gray-600'
                        }`}>
                        Real Estate Map
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom CTA */}
            {/* <div className="text-center mt-12 md:mt-16">
              <button
                onClick={() => console.log('View all locations')}
                className={`inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all duration-500 hover:scale-105 hover-3d-effect ${darkMode
                    ? 'bg-gradient-to-r from-blue-700 to-purple-700 hover:from-blue-600 hover:to-purple-600 text-white'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white'
                  }`}
              >
                <span>View All Locations</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
              </button>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopularLocations;