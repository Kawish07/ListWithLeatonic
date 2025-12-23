import React, { useState, useEffect, useRef } from "react";
import { TrendingUp, Star, Quote } from "lucide-react";
import { Link } from "react-router-dom";
import PropertyCard from "../components/PropertyCard";
import MortgageRates from "../components/MortgageRates";
import PopularLocations from "../components/PopularLocations";
import axios from "axios";
import MortgageCalculator from "../components/MortgageCalculator";

const HomePage = () => {
  // 1. FLIP ANIMATION STATES (FROM LATEST CODE - UNCHANGED)
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isFlipComplete, setIsFlipComplete] = useState(false);
  const [showContent, setShowContent] = useState(false);

  // 2. DATA STATES (FROM YOUR REAL API CODE - ADDED)
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [recentProperties, setRecentProperties] = useState([]);
  const [allProperties, setAllProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detectedCountry, setDetectedCountry] = useState(null);
  const [detectedRegion, setDetectedRegion] = useState(null);
  const [detectedCity, setDetectedCity] = useState(null);
  const [noPropertiesForLocation, setNoPropertiesForLocation] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);

  const flipSectionRef = useRef(null);
  const contentRef = useRef(null);
  const locationsRef = useRef(null);
  const [isAtLocations, setIsAtLocations] = useState(false);
  const [hasReachedLocations, setHasReachedLocations] = useState(false);

  // 3. DATA FETCHING (FROM YOUR REAL API CODE - INTEGRATED)
  useEffect(() => {
    const fetchProperties = async (locationHints = {}) => {
      try {
        setLoading(true);
        setError("");
        const response = await axios.get("/api/properties", {
          params: {
            limit: 50,
            status: "published",
          },
        });
          let fetched = [];
          if (!response || !response.data) {
            fetched = [];
          } else if (Array.isArray(response.data)) {
            fetched = response.data;
          } else if (Array.isArray(response.data.properties)) {
            fetched = response.data.properties;
          } else if (Array.isArray(response.data.data)) {
            fetched = response.data.data;
          } else if (response.data.properties && Array.isArray(response.data.properties)) {
            fetched = response.data.properties;
          } else if (response.data.success && Array.isArray(response.data.properties)) {
            fetched = response.data.properties;
          } else {
            // fallback: try common nested locations
            const maybe = response.data.properties || response.data.data || response.data.items;
            fetched = Array.isArray(maybe) ? maybe : [];
          }

          // Update state and helper
          setAllProperties(fetched || []);

          // If we have location hints, try to filter properties by city/region/country
          const { city, region, country } = locationHints || {};
          const normalize = (v) => (v || "").toString().toLowerCase();

          const matches = (fetched || []).filter((p) => {
            const hay = (
              (p.city || p.region || p.state || p.address || p.location || p.country || p.countryCode || p.area || "")
            ).toString().toLowerCase();

            if (city && city.toString().trim()) {
              if (hay.includes(normalize(city))) return true;
            }
            if (region && region.toString().trim()) {
              if (hay.includes(normalize(region))) return true;
            }
            if (country && country.toString().trim()) {
              if (
                (p.country && p.country.toString().toLowerCase() === normalize(country)) ||
                hay.includes(normalize(country))
              )
                return true;
            }

            return false;
          });

          if (matches.length > 0) {
            // Show matched properties as featured
            setFeaturedProperties(matches.slice(0, 6));
            // Keep recent as overall sorted list (sorted by createdAt)
            try {
              const sortedAll = (fetched || []).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
              setRecentProperties(sortedAll);
            } catch (e) {
              setRecentProperties(fetched || []);
            }
            setNoPropertiesForLocation(false);
          } else {
            // No matches for user's location: show all listings as fallback and flag the message
            setNoPropertiesForLocation(true);
            setFeaturedProperties((fetched || []).slice(0, 6));
            setRecentProperties((fetched || []));
          }
      } catch (error) {
        console.warn("Error fetching properties (relative), attempting fallback:", error?.response?.status || error);
        try {
          const base = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
          const resp2 = await axios.get(`${base}/api/properties`, {
            params: { limit: 50, status: 'published' }
          });
          let alt = [];
          if (resp2 && resp2.data) {
            if (Array.isArray(resp2.data)) alt = resp2.data;
            else alt = resp2.data.properties || resp2.data.data || resp2.data.items || [];
          }
          setAllProperties(alt || []);

          // fallback: try to apply location hints if available
          const { city, region, country } = {};
          const normalize = (v) => (v || "").toString().toLowerCase();
          const matches = (alt || []).filter((p) => {
            const hay = (
              (p.city || p.region || p.state || p.address || p.location || p.country || p.countryCode || p.area || "")
            ).toString().toLowerCase();
            if (city && city.toString().trim()) {
              if (hay.includes(normalize(city))) return true;
            }
            if (region && region.toString().trim()) {
              if (hay.includes(normalize(region))) return true;
            }
            if (country && country.toString().trim()) {
              if (
                (p.country && p.country.toString().toLowerCase() === normalize(country)) ||
                hay.includes(normalize(country))
              )
                return true;
            }
            return false;
          });

          if (matches.length > 0) {
            setFeaturedProperties(matches.slice(0, 6));
            try {
              const sortedAlt = (alt || []).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
              setRecentProperties(sortedAlt);
            } catch (e) {
              setRecentProperties(alt || []);
            }
            setNoPropertiesForLocation(false);
          } else {
            setNoPropertiesForLocation(true);
            setFeaturedProperties((alt || []).slice(0, 6));
            setRecentProperties((alt || []));
          }
        } catch (e2) {
          console.error('Fallback properties fetch failed:', e2);
          setError('Failed to load properties');
        }
      } finally {
        setLoading(false);
      }
    };

    // Detect user location via ipinfo (best-effort) then fetch properties
    const detectAndFetch = async () => {
      try {
        let city = null;
        let region = null;
        let country = null;

        try {
          const token = process.env.REACT_APP_IPINFO_TOKEN;
          const url = `https://ipinfo.io/json${token ? `?token=${token}` : ""}`;
          const res = await fetch(url);
          if (res && res.ok) {
            const data = await res.json();
            city = data.city || null;
            region = data.region || null;
            country = data.country || null;
          }
        } catch (e) {
          console.warn('ipinfo detection failed, defaulting to US', e);
        }

        if (!country) country = 'US';
        setDetectedCity(city);
        setDetectedRegion(region);
        setDetectedCountry(country);

        await fetchProperties({ city, region, country });
      } catch (e) {
        console.warn('Location detection failed, fetching without hints', e);
        await fetchProperties();
      }
    };

    detectAndFetch();
  }, []);

  // Observe PopularLocations section to toggle background color
  useEffect(() => {
    const el = locationsRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        // set in-view flag
        setIsAtLocations(entry.isIntersecting);

        try {
          const top = entry.boundingClientRect ? entry.boundingClientRect.top : 0;
          if (entry.isIntersecting) {
            setHasReachedLocations(true);
          } else if (top < 0) {
            setHasReachedLocations(true);
          } else {
            setHasReachedLocations(false);
          }
        } catch (e) {
          // fallback: mirror isIntersecting
          setHasReachedLocations(entry.isIntersecting);
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

  // Keep the page <body> background in sync with the sections below the hero.
  useEffect(() => {
    try {
      if (hasReachedLocations) {
        document.body.style.backgroundColor = '#ffffff';
      } else {
        // keep dark while before locations (matches overlay/background)
        document.body.style.backgroundColor = '#141414';
      }
    } catch (e) {
      // ignore (server-side rendering or restricted environments)
    }

    return () => {
      try {
        document.body.style.backgroundColor = '';
      } catch (e) {}
    };
  }, [hasReachedLocations]);

  const splitFeaturedAndRecent = (properties) => {
    try {
      const sorted = (properties || [])
        .slice()
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setFeaturedProperties(sorted.slice(0, 6));
      setRecentProperties(sorted);
    } catch (e) {
      console.warn("Error splitting featured/recent", e);
      setFeaturedProperties((properties || []).slice(0, 3));
      setRecentProperties(properties || []);
    }
  };

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

  // 5. ANIMATION CALCULATIONS (UPDATED: Added minimum gap on reverse scroll)
  const cardTranslateY =
    scrollProgress < 0.3
      ? Math.max((1 - scrollProgress / 0.3) * 60, 15) // Minimum 15vh gap during reverse scroll
      : 0;

  const rotationY = Math.max(0, (scrollProgress - 0.4) / 0.6) * 180;
  const scale = 1 + (Math.max(0, scrollProgress - 0.4) / 0.6) * 11;

  const cardOpacity = scrollProgress < 0.3 ? scrollProgress / 0.3 : 1;

  const overlayOpacity = showContent ? 1 : 0;

  const showReviews = scrollProgress >= 0.35 || showContent;

  const isDarkMode = (typeof window !== 'undefined') && (document.documentElement.classList.contains('dark') || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches));

  // Smooth the translateY value to avoid jitter when reversing scroll
  const [displayTranslate, setDisplayTranslate] = useState(cardTranslateY);

  useEffect(() => {
    let rafId = null;
    const smoothStep = () => {
      setDisplayTranslate((prev) => {
        const target = cardTranslateY;
        const delta = target - prev;
        const step = delta * 0.18; // easing factor
        const next = Math.abs(step) < 0.05 ? target : prev + step;
        return next;
      });
      rafId = requestAnimationFrame(smoothStep);
    };
    rafId = requestAnimationFrame(smoothStep);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [cardTranslateY]);

  // Ensure flip card stays below the hero: compute a dynamic top (px) based on hero bottom
  const [flipTopPx, setFlipTopPx] = useState(null);
  useEffect(() => {
    let raf = 0;
    const updateTop = () => {
      try {
        const minTop = window.innerHeight * 0.24; // baseline 24vh
        const heroEl = document.querySelector('section.min-h-screen');
        let desired = minTop;
        if (heroEl) {
          const rect = heroEl.getBoundingClientRect();
          // rect.bottom is px from viewport top; ensure card top is at least 24px below hero bottom
          desired = Math.max(rect.bottom + 24, minTop);
        }
        setFlipTopPx(Math.round(desired));
      } catch (e) {
        setFlipTopPx(Math.round(window.innerHeight * 0.24));
      }
      raf = 0;
    };

    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(updateTop);
    };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    // initial
    schedule();
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // 6. RENDER (Enhanced review cards with better design + stylish background pattern)
  return (
    <div
      className="relative min-h-[400vh]"
      style={{
        backgroundColor: hasReachedLocations ? "#f5f5f5" : (showContent ? "#141414" : "#ffffff"),
        overflowX: "hidden",
        overflow: "hidden",
      }}
    >
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundColor: "#141414",
          opacity: !hasReachedLocations ? overlayOpacity : 0,
          transition: "opacity 600ms ease",
          zIndex: 10,
        }}
      />

      {/* Stylish Background Pattern */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          opacity: showReviews ? 0.4 : 0,
          transition: "opacity 800ms ease",
          zIndex: 15,
          background: `
            radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 50%, rgba(147, 51, 234, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 50% 80%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)
          `,
        }}
      />

      {/* Animated Dot Pattern */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          opacity: showReviews ? 0.3 : 0,
          transition: "opacity 800ms ease",
          zIndex: 15,
          backgroundImage: `
            radial-gradient(circle, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
      <div className="h-screen"></div>

      {/* CTA Cards replacing review card positions (left-top, left-bottom, right-top) */}
      <div
        style={{
          position: "absolute",
          left: "calc(30% - 280px)",
          top: "20vh",
          transform: `translateX(0) translateY(${showReviews ? "0" : "120vh"}) translateZ(0)`,
          transition: "transform 450ms cubic-bezier(0.4, 0, 0.2, 1), opacity 400ms ease",
          willChange: "transform, opacity",
          opacity: showReviews ? 1 : 0,
          zIndex: 20,
          pointerEvents: showReviews ? "auto" : "none",
        }}
      >
        <div className="max-w-sm rounded-3xl p-6 shadow-2xl border bg-white text-blue-900" style={{ width: 320 }}>
          <div className="flex flex-col items-start gap-4">
            <div className="rounded-full p-4 bg-gray-50">
              <span className="text-2xl">🏠</span>
            </div>
            <h3 className="text-lg font-bold text-blue-900">Buy a Home</h3>
            <p className="text-sm text-blue-700">Custom search, smart insights and expert agents at your service.</p>
            <div className="mt-3">
              <Link to="/contact" className="inline-block bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg font-semibold">Find a home</Link>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: "calc(30% - 280px)",
          top: "65vh",
          transform: `translateX(0) translateY(${showReviews ? "0" : "140vh"}) translateZ(0)`,
          transition: "transform 520ms cubic-bezier(0.4, 0, 0.2, 1), opacity 500ms ease",
          willChange: "transform, opacity",
          opacity: showReviews ? 1 : 0,
          zIndex: 20,
          pointerEvents: showReviews ? "auto" : "none",
        }}
      >
        <div className="max-w-sm rounded-3xl p-6 shadow-2xl border bg-white text-purple-900" style={{ width: 320 }}>
          <div className="flex flex-col items-start gap-4">
            <div className="rounded-full p-4 bg-gray-50">
              <span className="text-2xl">🏷️</span>
            </div>
            <h3 className="text-lg font-bold text-purple-900">Get Pre-Approved</h3>
            <p className="text-sm text-purple-700">Partner with top agents to get approved fast and confidently.</p>
            <div className="mt-3">
              <Link to="/contact" className="inline-block bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-semibold">Get Pre-Approved</Link>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: "calc(50% + 280px)",
          top: "20vh",
          transform: `translateX(0) translateY(${showReviews ? "0" : "125vh"}) translateZ(0)`,
          transition: "transform 450ms cubic-bezier(0.4, 0, 0.2, 1), opacity 400ms ease",
          willChange: "transform, opacity",
          opacity: showReviews ? 1 : 0,
          zIndex: 20,
          pointerEvents: showReviews ? "auto" : "none",
        }}
      >
        <div className="max-w-sm rounded-3xl p-6 shadow-2xl border bg-white text-green-900" style={{ width: 320 }}>
          <div className="flex flex-col items-start gap-4">
            <div className="rounded-full p-4 bg-gray-50">
              <span className="text-2xl">🔑</span>
            </div>
            <h3 className="text-lg font-bold text-green-900">Sell Your Home</h3>
            <p className="text-sm text-green-700">Unlock the true value of your home with our expert guidance.</p>
            <div className="mt-3">
              <Link to="/contact" className="inline-block bg-gradient-to-r from-green-500 to-teal-500 text-white px-4 py-2 rounded-lg font-semibold">Get Connect</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Flipping Card (with improved spacing during reverse scroll) */}
      <div
        ref={flipSectionRef}
        className="fixed left-1/2 pointer-events-none"
        style={{
          left: "50%",
          top: flipTopPx ? `${flipTopPx}px` : "24vh",
          transform: "translateX(-50%)",
          opacity: 1,
          zIndex: showContent ? 40 : 50,
        }}
      >
        <div style={{ perspective: "2500px", width: "380px", height: "520px" }}>
          <div
            style={{
              width: "100%",
              height: "100%",
              transformStyle: "preserve-3d",
              transform: `translateY(${displayTranslate}vh) rotateY(${rotationY}deg) scale(${scale})`,
              // remove CSS transition to allow per-frame updates (prevents jitter)
              willChange: "transform",
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
                    PROJECTS
                  </h2>
                  <div className="mt-3 text-sm opacity-60">⠏⠗⠕⠚⠑⠉⠞⠎</div>
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
                  0 0 0 1px rgba(0, 0, 0, 0.1),
                  0 0 30px rgba(0, 0, 0, 0.05),
                  inset 0 0 20px rgba(0, 0, 0, 0.05)
                `,
              }}
            >
              <div
                className="absolute inset-0 rounded-3xl opacity-20"
                style={{
                  background:
                    "linear-gradient(135deg, transparent 0%, rgba(0, 0, 0, 0.1) 50%, transparent 100%)",
                  filter: "blur(1px)",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content Area (Using Real API Data - UNCHANGED) */}
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
          className="rounded-t-[64px] overflow-hidden min-h-screen pt-20"
          style={{
            backgroundColor: hasReachedLocations ? "#f5f5f5" : "#141414",
            transition: "background-color 700ms ease-in-out",
          }}
        >
          {/* Featured Properties Section with REAL DATA */}
          <div className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
            <div className="text-sm mb-4 text-gray-400">
              Showing results for: {" "}
              <span className="font-semibold">
                {detectedCity
                  ? `${detectedCity}${detectedRegion ? `, ${detectedRegion}` : ""}`
                  : detectedRegion
                  ? detectedRegion
                  : detectedCountry
                  ? detectedCountry === "US"
                    ? "United States"
                    : detectedCountry === "CA"
                    ? "Canada"
                    : detectedCountry
                  : "your area"}
              </span>
            </div>

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold uppercase tracking-wider text-blue-400">
                    Listings
                  </div>
                  <h2 className="main-heading text-white">
                    Featured Properties
                  </h2>
                </div>
              </div>
              <Link
                to="/forsale"
                className="border-2 border-gray-600 text-gray-300 font-bold px-6 py-3 rounded-xl transition-all hover:bg-gray-700 hover:text-white"
              >
                View all
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-gray-800 rounded-2xl p-5 animate-pulse"
                  >
                    <div className="h-56 bg-gray-700 rounded-xl mb-4"></div>
                    <div className="h-4 bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded mb-3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                {noPropertiesForLocation && (
                  <div className="bg-gray-800 border border-gray-700 text-gray-300 rounded-2xl p-8 mb-8">
                    <p className="mb-4">
                      No properties were found in your location (
                      {detectedCity
                        ? `${detectedCity}${detectedRegion ? `, ${detectedRegion}` : ""}`
                        : detectedRegion
                        ? detectedRegion
                        : detectedCountry
                        ? detectedCountry
                        : "your area"}
                      ). Showing all listings instead.
                    </p>
                    <Link
                      to="/forsale"
                      className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-300"
                    >
                      View listings from other locations
                    </Link>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {featuredProperties.map((property, idx) => (
                    <PropertyCard
                      key={property._id || property.id || idx}
                      property={property}
                      darkMode={true}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Recently Added Section with REAL DATA */}
          <div className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold uppercase tracking-wider text-blue-400">
                    Listings
                  </div>
                  <h2 className="main-heading text-white">Recently Added</h2>
                </div>
              </div>
              <Link
                to="/forrent"
                className="border-2 border-gray-600 text-gray-300 font-bold px-6 py-3 rounded-xl transition-all hover:bg-gray-700 hover:text-white"
              >
                View all
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {recentProperties.map((property, idx) => (
                <PropertyCard
                  key={property._id || property.id || idx}
                  property={property}
                  darkMode={true}
                />
              ))}
            </div>
          </div>
          {/* Mortgage Rates Section */}
          <div className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
            <MortgageRates
              apiUrl={process.env.REACT_APP_MORTGAGE_RATES_API}
              darkMode={true}
            />
          </div>

          {/* Popular Locations Section */}
          <div ref={locationsRef} className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
            <PopularLocations darkMode={!isAtLocations} lightMode={isAtLocations} />
          </div>

          {/* Mortgage Calculator Section */}
          <MortgageCalculator />
        </div>
      </div>
    </div>
  );
};

export default HomePage;
