import React, { useState, useEffect, useRef } from "react";
import { TrendingUp, Star, Quote } from "lucide-react";
import { Link } from "react-router-dom";
import PropertyCard from "../components/PropertyCard";
import MortgageRates from "../components/MortgageRates";
import PopularLocations from "../components/PopularLocations";
import axios from "axios";

// ========== MortgageCalculator Component (UNCHANGED) ==========
const MortgageCalculator = ({ dark = false }) => {
  const [homePrice, setHomePrice] = useState("");
  const [downPayment, setDownPayment] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [loanTerm, setLoanTerm] = useState("30");
  const [monthlyPayment, setMonthlyPayment] = useState(null);

  const calculatePayment = () => {
    const principal = homePrice - (homePrice * downPayment) / 100;
    const monthlyRate = interestRate / 100 / 12;
    const numberOfPayments = loanTerm * 12;

    const payment =
      (principal *
        (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

    setMonthlyPayment(payment.toFixed(2));
  };

  const bg = dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.95)';
  const border = dark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)';
  const textColor = dark ? '#f8fafc' : '#0f172a';

  return (
    <div
      className="rounded-2xl shadow-xl max-w-2xl mx-auto"
      style={{
        background: bg,
        border: border,
        padding: 24,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)'
      }}
    >
      <h3 style={{ color: textColor }} className="text-2xl font-bold mb-6">
        Calculate Your Mortgage
      </h3>
      <div className="space-y-4">
        {[{
          type: 'number', placeholder: 'Home Price', value: homePrice, onChange: (e) => setHomePrice(e.target.value)
        }, {
          type: 'number', placeholder: 'Down Payment %', value: downPayment, onChange: (e) => setDownPayment(e.target.value)
        }, {
          type: 'number', placeholder: 'Interest Rate %', value: interestRate, onChange: (e) => setInterestRate(e.target.value)
        }, {
          type: 'number', placeholder: 'Loan Term (years)', value: loanTerm, onChange: (e) => setLoanTerm(e.target.value)
        }].map((fld, idx) => (
          <input
            key={idx}
            type={fld.type}
            placeholder={fld.placeholder}
            value={fld.value}
            onChange={fld.onChange}
            className="w-full p-3 rounded-lg"
            style={{
              background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.9)',
              border: dark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
              color: textColor
            }}
          />
        ))}

        <button
          onClick={calculatePayment}
          className="w-full p-3 rounded-lg font-semibold transition-all"
          style={{
            background: 'linear-gradient(90deg,#4f46e5,#06b6d4)',
            color: '#fff',
            boxShadow: dark ? '0 10px 30px rgba(2,6,23,0.6)' : '0 8px 20px rgba(2,6,23,0.08)'
          }}
        >
          Calculate Payment
        </button>
        {monthlyPayment && (
          <div className="mt-4 p-4 rounded-lg" style={{ background: dark ? 'rgba(255,255,255,0.02)' : 'rgba(59,130,246,0.06)' }}>
            <p className="text-lg font-semibold" style={{ color: textColor }}>
              Monthly Payment: <span style={{ color: dark ? '#7dd3fc' : '#075985' }}>${monthlyPayment}</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );

};

// ========== HomePage Component (UPDATED with spacing fix and enhanced reviews) ==========
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

          // Normalize API response shapes: some endpoints return
          // { success: true, properties: [...] } while others return
          // an array directly or { data: [...] }.
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

        // Determine whether we've reached (or passed) the locations section.
        // If the section is intersecting -> we've reached it. If it's not intersecting
        // but its boundingClientRect.top is negative, we've scrolled past it -> also 'reached'.
        // If it's below the viewport (top > 0) and not intersecting, we haven't reached it.
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

  // 4. SCROLL HANDLER (UPDATED: Added gap during reverse scroll)
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;

      const startAppear = windowHeight * 0.05;
      const fullyVisible = windowHeight * 0.6;
      const startFlip = windowHeight * 1.0;
      const endFlip = windowHeight * 3.0;

      let progress = 0;

      if (scrollY >= startAppear && scrollY < fullyVisible) {
        progress =
          ((scrollY - startAppear) / (fullyVisible - startAppear)) * 0.3;
      } else if (scrollY >= fullyVisible && scrollY < startFlip) {
        progress =
          0.3 + ((scrollY - fullyVisible) / (startFlip - fullyVisible)) * 0.1;
      } else if (scrollY >= startFlip) {
        const flipProgress = (scrollY - startFlip) / (endFlip - startFlip);
        progress = 0.4 + flipProgress * 0.6;
      }

      progress = Math.max(0, Math.min(1, progress));
      setScrollProgress(progress);

      if (progress >= 0.9) {
        setIsFlipComplete(true);
        setShowContent(true);
      } else if (progress < 0.4) {
        setIsFlipComplete(false);
        setShowContent(false);
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

      {/* ENHANCED Left Review Cards */}
      <div
        style={{
          position: "absolute",
          left: "calc(30% - 280px)",
          top: "20vh",
          transform: `translateX(0) translateY(${showReviews ? "0" : "120vh"}) translateZ(0)`,
          transition:
            "transform 450ms cubic-bezier(0.4, 0, 0.2, 1), opacity 400ms ease",
          willChange: "transform, opacity",
          opacity: showReviews ? 1 : 0,
          zIndex: 20,
          pointerEvents: showReviews ? "auto" : "none",
        }}
      >
        <div
          className="max-w-sm bg-gradient-to-br from-white via-blue-50 to-white rounded-3xl p-6 shadow-2xl border border-blue-100"
          style={{ width: 320 }}
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center overflow-hidden shadow-lg">
                <img
                  src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'><rect fill='%23f3f4f6' width='128' height='128'/><circle cx='64' cy='44' r='28' fill='%23c7d2fe'/><rect x='28' y='86' width='72' height='14' rx='7' fill='%23e6eefc'/></svg>"
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-md"></div>
            </div>
            <div className="flex-1">
              <div className="text-base font-bold text-gray-900">
                Arushi Sharma
              </div>
              <div className="text-xs text-gray-500 mb-2">
                Head of Design • 2 days ago
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
            </div>
          </div>
          <Quote className="w-6 h-6 text-blue-400 opacity-50 mb-2" />
          <div className="text-sm text-gray-700 leading-relaxed">
            A top choice for interior design projects that put accessibility and
            disability-friendly features first. Outstanding attention to detail!
          </div>
          <div className="mt-4 pt-4 border-t border-blue-100 flex items-center justify-between text-xs text-gray-500">
            <span>✓ Verified Purchase</span>
            <span className="flex items-center gap-1">
              <span className="text-blue-600 font-semibold">4.9/5</span>
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: "calc(30% - 280px)",
          top: "65vh",
          transform: `translateX(0) translateY(${showReviews ? "0" : "140vh"}) translateZ(0)`,
          transition:
            "transform 520ms cubic-bezier(0.4, 0, 0.2, 1), opacity 500ms ease",
          willChange: "transform, opacity",
          opacity: showReviews ? 1 : 0,
          zIndex: 20,
          pointerEvents: showReviews ? "auto" : "none",
        }}
      >
        <div
          className="max-w-sm bg-gradient-to-br from-white via-purple-50 to-white rounded-3xl p-6 shadow-2xl border border-purple-100"
          style={{ width: 320 }}
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center overflow-hidden shadow-lg">
                <img
                  src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'><rect fill='%23fff7ed' width='128' height='128'/><circle cx='64' cy='44' r='28' fill='%23fbcfe8'/><rect x='28' y='86' width='72' height='14' rx='7' fill='%23fee7f3'/></svg>"
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-md"></div>
            </div>
            <div className="flex-1">
              <div className="text-base font-bold text-gray-900">Maya Chen</div>
              <div className="text-xs text-gray-500 mb-2">
                Property Manager • 1 week ago
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <Star
                    key={i}
                    className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400"
                  />
                ))}
                <Star className="w-3.5 h-3.5 fill-gray-300 text-gray-300" />
              </div>
            </div>
          </div>
          <Quote className="w-6 h-6 text-purple-400 opacity-50 mb-2" />
          <div className="text-sm text-gray-700 leading-relaxed">
            The platform made finding accessible properties so much easier. Love
            the detailed accessibility features and virtual tours!
          </div>
          <div className="mt-4 pt-4 border-t border-purple-100 flex items-center justify-between text-xs text-gray-500">
            <span>✓ Verified User</span>
            <span className="flex items-center gap-1">
              <span className="text-purple-600 font-semibold">4.5/5</span>
            </span>
          </div>
        </div>
      </div>

      {/* ENHANCED Right Review Cards */}
      <div
        style={{
          position: "absolute",
          left: "calc(50% + 280px)",
          top: "20vh",
          transform: `translateX(0) translateY(${showReviews ? "0" : "125vh"}) translateZ(0)`,
          transition:
            "transform 450ms cubic-bezier(0.4, 0, 0.2, 1), opacity 400ms ease",
          willChange: "transform, opacity",
          opacity: showReviews ? 1 : 0,
          zIndex: 20,
          pointerEvents: showReviews ? "auto" : "none",
        }}
      >
        <div
          className="max-w-sm bg-gradient-to-br from-white via-green-50 to-white rounded-3xl p-6 shadow-2xl border border-green-100 text-right"
          style={{ width: 320 }}
        >
          <div className="flex items-start gap-4 mb-4 flex-row-reverse">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center overflow-hidden shadow-lg">
                <img
                  src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'><rect fill='%23ecfdf5' width='128' height='128'/><circle cx='64' cy='44' r='28' fill='%23bbf7d0'/><rect x='28' y='86' width='72' height='14' rx='7' fill='%23e6fff4'/></svg>"
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-md"></div>
            </div>
            <div className="flex-1">
              <div className="text-base font-bold text-gray-900">
                Kshitij K.
              </div>
              <div className="text-xs text-gray-500 mb-2">
                Advocate • 3 days ago
              </div>
              <div className="flex items-center gap-1 justify-end">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
            </div>
          </div>
          <Quote className="w-6 h-6 text-green-400 opacity-50 mb-2 ml-auto" />
          <div className="text-sm text-gray-700 leading-relaxed">
            Equispace created a disability-friendly space that's as beautiful as
            it is accessible. Truly transformative work!
          </div>
          <div className="mt-4 pt-4 border-t border-green-100 flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="text-green-600 font-semibold">4.8/5</span>
            </span>
            <span>✓ Verified Client</span>
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: "calc(50% + 280px)",
          top: "65vh",
          transform: `translateX(0) translateY(${showReviews ? "0" : "140vh"}) translateZ(0)`,
          transition:
            "transform 520ms cubic-bezier(0.4, 0, 0.2, 1), opacity 500ms ease",
          willChange: "transform, opacity",
          opacity: showReviews ? 1 : 0,
          zIndex: 20,
          pointerEvents: showReviews ? "auto" : "none",
        }}
      >
        <div
          className="max-w-sm bg-gradient-to-br from-white via-orange-50 to-white rounded-3xl p-6 shadow-2xl border border-orange-100 text-right"
          style={{ width: 320 }}
        >
          <div className="flex items-start gap-4 mb-4 flex-row-reverse">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center overflow-hidden shadow-lg">
                <img
                  src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'><rect fill='%23fff7ed' width='128' height='128'/><circle cx='64' cy='44' r='28' fill='%23ffd8a8'/><rect x='28' y='86' width='72' height='14' rx='7' fill='%23fff4e6'/></svg>"
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white shadow-md"></div>
            </div>
            <div className="flex-1">
              <div className="text-base font-bold text-gray-900">
                James Rodriguez
              </div>
              <div className="text-xs text-gray-500 mb-2">
                Real Estate Agent • 5 days ago
              </div>
              <div className="flex items-center gap-1 justify-end">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
            </div>
          </div>
          <Quote className="w-6 h-6 text-orange-400 opacity-50 mb-2 ml-auto" />
          <div className="text-sm text-gray-700 leading-relaxed">
            Game changer for my clients with mobility needs. The search filters
            are incredibly detailed and accurate.
          </div>
          <div className="mt-4 pt-4 border-t border-orange-100 flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="text-orange-600 font-semibold">5.0/5</span>
            </span>
            <span>✓ Verified Professional</span>
          </div>
        </div>
      </div>

      {/* Flipping Card (with improved spacing during reverse scroll) */}
      <div
        ref={flipSectionRef}
        className="fixed left-1/2 pointer-events-none"
        style={{
          left: "50%",
          top: showContent ? "30vh" : "35vh",
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
          {/* Mortgage Calculator Section */}
          <div className="py-20 px-4 md:px-8 max-w-5xl mx-auto">
            <div className="bg-transparent border border-gray-400 rounded-3xl p-12 shadow-2xl relative overflow-hidden">
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>

              <div className="relative z-10">
                <div className="text-center mb-12">
                  <div className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full mb-4">
                    <span className="text-blue-400 text-sm font-semibold uppercase tracking-wider">
                      Financial Tools
                    </span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold mb-4 text-[#141414]">
                    Mortgage Calculator
                  </h2>
                  <p className="text-xl text-gray-900 max-w-2xl mx-auto">
                    Get instant estimates for your monthly payments and make
                    informed decisions
                  </p>
                </div>

                {!showCalculator ? (
                  <div>
                    <div className="mb-10 bg-transparent border border-gray-300 rounded-2xl p-8">
                      <div className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-2">
                        Sample Calculation
                      </div>
                      <div className="text-5xl font-bold text-[#141414] mb-1">
                        $1,850
                      </div>
                      <div className="text-gray-800">Monthly Payment</div>
                    </div>

                    <button
                      onClick={() => setShowCalculator(true)}
                      className="bg-blue-600 text-white px-12 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-0.5 mb-12"
                    >
                      Start Calculator →
                    </button>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
                      {[
                        { value: "30-Year", label: "Fixed Rate", icon: "📅" },
                        { value: "15-Year", label: "Savings Term", icon: "💰" },
                        {
                          value: "5/1 ARM",
                          label: "Adjustable Rate",
                          icon: "📊",
                        },
                        { value: "FHA/VA", label: "Loan Types", icon: "🏠" },
                      ].map((stat, index) => (
                        <div
                          key={index}
                          className="bg-transparent border border-gray-300/50 rounded-xl p-6 text-center hover:border-blue-500/30 transition-all"
                        >
                          <div className="text-3xl mb-2">{stat.icon}</div>
                          <div className="text-xl font-bold text-[#141414] mb-1">
                            {stat.value}
                          </div>
                          <div className="text-sm text-gray-800">
                            {stat.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <MortgageCalculator dark={showContent} />
                    <div className="text-center mt-12">
                      <button
                        onClick={() => setShowCalculator(false)}
                        className="text-gray-400 hover:text-white font-medium text-lg transition-colors duration-300 flex items-center gap-2 mx-auto"
                      >
                        <span>←</span> Back to Overview
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
