import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Home, TrendingUp, Star, ChevronRight } from 'lucide-react';

const PopularLocations = () => {
  const [hoveredLocation, setHoveredLocation] = useState(null);
  const [isInView, setIsInView] = useState(false);
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const cardsRef = useRef([]);
  const mapRef = useRef(null);
  
  const rafRef = useRef(null);
  const lastMousePos = useRef({ x: 0, y: 0 });
  const isAnimating = useRef(false);

  const locations = [
    {
      id: 'california',
      name: 'California',
      image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400&h=300&fit=crop',
      position: { top: '20%', left: '5%' },
      icon: Home,
      stats: '2,450 homes',
      gradient: 'from-blue-500/20 via-purple-500/20 to-pink-500/20',
      color: 'bg-gradient-to-br from-blue-500 to-purple-600'
    },
    {
      id: 'newyork',
      name: 'New York',
      image: 'https://images.unsplash.com/photo-1543716091-a840c05249ec?w=400&h=300&fit=crop',
      position: { top: '20%', right: '0%' },
      icon: TrendingUp,
      stats: '3,890 homes',
      gradient: 'from-emerald-500/20 via-teal-500/20 to-cyan-500/20',
      color: 'bg-gradient-to-br from-emerald-500 to-teal-600'
    },
    {
      id: 'texas',
      name: 'Texas',
      image: 'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=400&h=300&fit=crop',
      position: { bottom: '0%', left: '5%' },
      icon: Star,
      stats: '1,920 homes',
      gradient: 'from-amber-500/20 via-orange-500/20 to-red-500/20',
      color: 'bg-gradient-to-br from-amber-500 to-orange-600'
    },
    {
      id: 'florida',
      name: 'Florida',
      image: 'https://images.unsplash.com/photo-1506812574058-fc75fa93fead?w=400&h=300&fit=crop',
      position: { bottom: '0%', right: '0%' },
      icon: MapPin,
      stats: '2,780 homes',
      gradient: 'from-rose-500/20 via-pink-500/20 to-fuchsia-500/20',
      color: 'bg-gradient-to-br from-rose-500 to-pink-600'
    }
  ];

  // Simplified intersection observer - only triggers once
  useEffect(() => {
    if (!sectionRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !isInView) {
            setIsInView(true);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    observer.observe(sectionRef.current);
    
    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, [isInView]);

  // Throttled mouse move with CSS transforms instead of GSAP
  const handleMouseMove = useCallback((e) => {
    if (!mapRef.current || !isInView || isAnimating.current) return;
    
    const rect = mapRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    
    // Check if mouse moved significantly (throttle by distance)
    const dx = x - lastMousePos.current.x;
    const dy = y - lastMousePos.current.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < 0.05) return; // Skip small movements
    
    lastMousePos.current = { x, y };
    
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    
    rafRef.current = requestAnimationFrame(() => {
      cardsRef.current.forEach((card, index) => {
        if (card) {
          const intensity = 8 + (index % 3) * 2;
          const translateX = x * intensity;
          const translateY = y * intensity;
          const rotate = x * 1.5;
          
          // Use CSS transform directly - much faster than GSAP
          card.style.transform = `translate(${translateX}px, ${translateY}px) rotate(${rotate}deg)`;
          card.style.transition = 'transform 0.3s ease-out';
        }
      });
    });
  }, [isInView]);

  const handleMouseLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    
    cardsRef.current.forEach((card) => {
      if (card) {
        card.style.transform = 'translate(0px, 0px) rotate(0deg)';
        card.style.transition = 'transform 0.6s ease-out';
      }
    });
    
    lastMousePos.current = { x: 0, y: 0 };
  }, []);

  const handleLocationClick = useCallback((location) => {
    console.log('Navigate to:', location.id);
    // navigate(`/location/${location.id}`, { state: location });
  }, []);

  // Clean up
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={sectionRef} 
      className="min-h-screen relative overflow-hidden py-20"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ willChange: 'auto' }}
    >
      {/* Simplified Background - removed heavy blur and complex SVG */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        {/* Lightweight static grid */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }}></div>
        
        {/* Simple overlay - no backdrop-blur during scroll */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-transparent to-black/40"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 md:p-8">
        <div className="max-w-7xl w-full">
          {/* Header - simpler animations */}
          <div 
            ref={titleRef} 
            className={`text-center mb-12 md:mb-20 transition-all duration-1000 ${
              isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
            }`}
          >
            <div className="inline-block mb-6">
              <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl px-8 py-4 shadow-2xl">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 font-bold text-xl">
                  🗺️ Explore Top Real Estate Markets
                </span>
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent leading-tight">
              Popular Locations
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 font-medium mb-4 max-w-3xl mx-auto">
              Discover premium properties in America's most vibrant cities
            </p>
            <p className="text-lg text-gray-400">
              Each market offers unique investment opportunities
            </p>
          </div>

          {/* Map Container */}
          <div ref={mapRef} className="relative w-full h-[700px] md:h-[800px] lg:h-[900px]">
            {/* Location Cards */}
            {locations.map((location, index) => {
              const IconComponent = location.icon;
              const positionStyle = {
                ...location.position,
                zIndex: hoveredLocation === location.id ? 50 : 40 - index
              };

              return (
                <div
                  key={location.id}
                  ref={(el) => (cardsRef.current[index] = el)}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group transition-all duration-700 ${
                    isInView ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                  }`}
                  style={{
                    ...positionStyle,
                    transitionDelay: `${index * 150}ms`,
                    willChange: 'transform'
                  }}
                  onMouseEnter={() => setHoveredLocation(location.id)}
                  onMouseLeave={() => setHoveredLocation(null)}
                  onClick={() => handleLocationClick(location)}
                >
                  {/* Card Container */}
                  <div
                    className={`relative rounded-3xl overflow-hidden shadow-2xl transition-all duration-500 ${
                      hoveredLocation === location.id 
                        ? 'scale-125 shadow-2xl -translate-y-4 z-50' 
                        : 'scale-100'
                    }`}
                    style={{
                      width: 'clamp(180px, 18vw, 220px)',
                      height: 'clamp(180px, 18vw, 220px)'
                    }}
                  >
                    {/* Image Container */}
                    <div className="absolute inset-0 overflow-hidden rounded-3xl">
                      <img
                        src={location.image}
                        alt={location.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-90 group-hover:opacity-95 transition-opacity duration-500`}></div>
                    </div>

                    {/* Glass Border */}
                    <div className="absolute inset-0 border-2 border-white/30 rounded-3xl group-hover:border-white/50 transition-all duration-300"></div>

                    {/* Glow Effect - only on hover */}
                    {hoveredLocation === location.id && (
                      <div className={`absolute -inset-4 ${location.color} opacity-25 blur-xl transition-opacity duration-700`}></div>
                    )}

                    {/* Icon */}
                    <div className={`absolute top-4 right-4 w-14 h-14 ${location.color} rounded-xl flex items-center justify-center shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-12`}>
                      <IconComponent className="w-7 h-7 text-white" />
                    </div>

                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <h3 className="text-white text-2xl md:text-3xl font-bold mb-2 drop-shadow-2xl leading-tight">
                        {location.name}
                      </h3>
                      <div className={`transition-all duration-500 transform ${
                        hoveredLocation === location.id 
                          ? 'opacity-100 translate-y-0' 
                          : 'opacity-0 translate-y-4'
                      }`}>
                        <p className="text-white/90 text-base font-medium mb-4">
                          {location.stats}
                        </p>
                        <button className="flex items-center gap-3 text-white text-base font-semibold bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-lg px-6 py-3 rounded-xl hover:from-white/30 hover:to-white/20 transition-all duration-300 shadow-lg">
                          View Properties
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                        </button>
                      </div>
                    </div>

                    {/* Floating Label */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                      <div className={`px-4 py-2 ${location.color} rounded-full text-white text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                        hoveredLocation === location.id 
                          ? 'opacity-100 translate-y-0' 
                          : 'opacity-0 -translate-y-2'
                      }`}>
                        {location.name}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Central Interactive Element */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                {/* Simplified rings - no animation during scroll */}
                <div className="absolute inset-0">
                  <div className="w-96 h-96 border-2 border-white/10 rounded-full opacity-30"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 border-2 border-white/20 rounded-full opacity-50"></div>
                </div>
                
                {/* Central Glass Card */}
                <div className="relative w-60 h-60 bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl border-2 border-white/30 rounded-3xl flex flex-col items-center justify-center shadow-2xl p-8">
                  <div className="text-center">
                    <div className="text-5xl mb-4">📍</div>
                    <h3 className="text-white font-bold text-2xl mb-2">USA Map</h3>
                    <p className="text-white/70 text-sm">Interactive real estate map</p>
                    <p className="text-white/50 text-xs mt-2">{locations.length} locations</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: '15,240+', label: 'Active Listings', icon: '🏠' },
              { value: '99.2%', label: 'Satisfaction Rate', icon: '⭐' },
              { value: '$3.4B', label: 'Property Value', icon: '💰' },
              { value: '62+', label: 'Cities Nationwide', icon: '🗺️' }
            ].map((stat, index) => (
              <div 
                key={index}
                className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 text-center transition-all duration-300 hover:scale-105 hover:from-white/15 hover:to-white/10 hover:border-white/30"
              >
                <div className="text-3xl mb-3">{stat.icon}</div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-gray-300 text-sm font-medium">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="text-center mt-16">
            <div className="mb-8">
              <p className="text-xl text-gray-300 mb-4">
                Ready to find your perfect property?
              </p>
              <p className="text-gray-400">
                Browse thousands of listings across all major US cities
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => console.log('Navigate to /forsale')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold px-10 py-4 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 text-lg shadow-xl flex items-center justify-center gap-3"
              >
                Browse Properties
                <ChevronRight className="w-6 h-6" />
              </button>
              <button
                onClick={() => console.log('Navigate to /forrent')}
                className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold px-10 py-4 rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 text-lg shadow-xl flex items-center justify-center gap-3"
              >
                View Rentals
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PopularLocations;