// Header.jsx - Updated with unique dark sidebar design
import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { gsap } from "gsap";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showBottomNav, setShowBottomNav] = useState(false);
  const [heroInView, setHeroInView] = useState(true);
  const [footerVisible, setFooterVisible] = useState(false);
  const [bottomOffset, setBottomOffset] = useState(24);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const headerRef = useRef(null);
  const menuRef = useRef(null);
  const overlayRef = useRef(null);
  const [isFooterLight, setIsFooterLight] = useState(false);
  
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);

    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { y: -100, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.2 }
      );
    }

    const SCROLL_THRESHOLD = 80;
    const handleScroll = () => {
      setScrolled(window.scrollY > SCROLL_THRESHOLD);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close menu when route changes
  useEffect(() => {
    if (menuOpen) {
      handleCloseMenu();
    }
  }, [location.pathname]);

  // Animate menu when it opens/closes
  useEffect(() => {
    if (menuOpen) {
      setIsAnimating(true);
      document.body.style.overflow = "hidden";
      
      // Animate overlay
      gsap.to(overlayRef.current, {
        opacity: 0.8,
        duration: 0.4,
        ease: "power2.out"
      });
      
      // Animate sidebar with bounce effect
      gsap.fromTo(menuRef.current,
        { x: "100%", opacity: 0, scale: 0.95 },
        {
          x: 0,
          opacity: 1,
          scale: 1,
          duration: 0.5,
          ease: "back.out(1.2)",
          onComplete: () => setIsAnimating(false)
        }
      );
    } else {
      setIsAnimating(true);
      
      // Animate overlay out
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.in"
      });
      
      // Animate sidebar out with smooth slide
      gsap.to(menuRef.current, {
        x: "100%",
        opacity: 0,
        scale: 0.95,
        duration: 0.4,
        ease: "power2.in",
        onComplete: () => {
          setIsAnimating(false);
          document.body.style.overflow = "unset";
        }
      });
    }
  }, [menuOpen]);

  // Hero section observer
  useEffect(() => {
    const heroEl = document.getElementById("hero-section");
    if (heroEl && "IntersectionObserver" in window) {
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            setHeroInView(entry.isIntersecting);
          });
        },
        { threshold: 0.15 }
      );
      obs.observe(heroEl);
      return () => obs.disconnect();
    }
    setHeroInView(false);
  }, [location.pathname]);

  // Bottom nav logic
  useEffect(() => {
    const contentVisibleFlag = (() => {
      try {
        const attr = document.documentElement.getAttribute("data-content-visible");
        return attr === null ? true : attr === "true";
      } catch (e) {
        return true;
      }
    })();

    const shouldShow =
      scrolled && !heroInView && contentVisibleFlag && !menuOpen && !footerVisible;
    setShowBottomNav(shouldShow);
  }, [scrolled, heroInView, menuOpen, footerVisible]);

  // Footer observer
  useEffect(() => {
    const footerEl = document.querySelector("footer");
    if (!footerEl || !("IntersectionObserver" in window)) return;

    const footerObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setFooterVisible(true);
            const rect = entry.boundingClientRect || footerEl.getBoundingClientRect();
            const viewportH = window.innerHeight || document.documentElement.clientHeight;
            const overlap = Math.max(0, viewportH - rect.top);
            const lift = Math.ceil(overlap);
            const maxLift = 160;
            setBottomOffset(Math.min(maxLift, lift + 12));
          } else {
            setFooterVisible(false);
            setBottomOffset(24);
          }
        });
      },
      { threshold: [0, 0.01, 0.25, 0.5, 1] }
    );

    footerObs.observe(footerEl);
    return () => footerObs.disconnect();
  }, []);

  const navLinks = [
    { name: "Buy", to: "/forsale", icon: "🏠" },
    { name: "Rent", to: "/forrent", icon: "🔑" },
    { name: "Sell", to: "/contact", icon: "💰" },
    { name: "Get Approved", to: "/contact", icon: "✅" },
    { name: "Contact Us", to: "/contact", icon: "📞" },
  ];

  const handleSignInClick = (e) => {
    e.preventDefault();
    navigate("/signin");
    if (menuOpen) setMenuOpen(false);
  };

  const handleCloseMenu = () => {
    if (!isAnimating && menuOpen) {
      setMenuOpen(false);
    }
  };

  const showBottomVisible = showBottomNav && !menuOpen && !footerVisible;
  const computedTopVisible = isVisible && !showBottomVisible && !footerVisible;
  const lightHeader = footerVisible || isFooterLight;
  const linkColor = lightHeader ? "text-black" : "text-white";
  const headerBgClass = lightHeader ? "bg-white" : "bg-transparent";

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (menuOpen && event.key === 'Escape' && !isAnimating) {
        handleCloseMenu();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [menuOpen, isAnimating]);

  return (
    <>
      <header
        ref={headerRef}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-700"
        style={{
          opacity: computedTopVisible ? 1 : 0,
          transform: `translateY(${computedTopVisible ? 0 : "-120%"})`,
        }}
      >
        <div className="w-full px-4 py-4">
          <div
            className={`${headerBgClass} rounded-2xl px-4 py-4 flex items-center justify-between transition-transform duration-500 ${
              scrolled ? "shadow-xl" : ""
            } max-w-6xl mx-auto`}
          >
            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <div className="flex items-center gap-3 group cursor-pointer">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-black to-black flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3.2l8 5.2v10.6a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1V8.4l8-5.2zM12 5.1 6 9v9h3v-6h6v6h3V9l-6-3.9z" />
                  </svg>
                </div>
                <span className={`${linkColor} font-bold text-2xl tracking-wider`}>
                  ListWithLeatonic
                </span>
              </div>
            </Link>

            {/* Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.to}
                  className={`px-4 py-2 ${linkColor} font-medium text-sm uppercase tracking-wider rounded-lg transition-all duration-300 ${
                    lightHeader ? "hover:bg-black/10" : "hover:bg-white/10"
                  } focus:outline-none focus:ring-2 focus:ring-white/20 whitespace-nowrap`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Action Buttons */}
            <div className="hidden sm:flex items-center gap-1.5">
              {isAuthenticated ? (
                <div className="flex items-center gap-1.5">
                  <Link
                    to="/user/dashboard"
                    className={`px-5 py-2.5 ${
                      lightHeader
                        ? "text-black border-black hover:bg-black hover:text-white"
                        : "text-white border-white hover:bg-white hover:text-black"
                    } font-semibold text-sm rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2 whitespace-nowrap`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span className="hidden md:inline">Dashboard</span>
                  </Link>

                  <div className="relative">
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="flex items-center gap-1.5 text-white hover:text-gray-200 transition-all duration-300"
                    >
                      <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
                        {user?.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="font-bold text-white text-sm">{user?.name?.charAt(0) || "U"}</span>
                        )}
                      </div>
                      <span className="font-medium text-sm hidden lg:inline">{user?.name || "User"}</span>
                      <svg className={`w-3 h-3 transition-transform duration-300 ${showDropdown ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showDropdown && (
                      <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                        <div className="p-4 border-b border-slate-200">
                          <p className="text-slate-900 font-medium truncate">{user?.name}</p>
                          <p className="text-slate-500 text-sm truncate">{user?.email}</p>
                        </div>
                        <div className="py-2">
                          <Link to="/user/profile" className="flex items-center gap-2 px-4 py-3 text-slate-700 hover:bg-slate-50 transition-all duration-300" onClick={() => setShowDropdown(false)}>My Profile</Link>
                          <Link to="/user/properties" className="flex items-center gap-2 px-4 py-3 text-slate-700 hover:bg-slate-50 transition-all duration-300" onClick={() => setShowDropdown(false)}>My Properties</Link>
                        </div>
                        <div className="border-t border-slate-200 py-2">
                          <button onClick={() => { useAuthStore.getState().logout(); setShowDropdown(false); navigate("/"); }} className="flex items-center gap-2 w-full px-4 py-3 text-red-600 hover:bg-red-50 transition-all duration-300">Logout</button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <button onClick={handleSignInClick} className={`px-5 py-2.5 ${
                    lightHeader ? "text-black border-black hover:bg-black hover:text-white" : "text-white border-white hover:bg-white hover:text-black"
                  } font-semibold text-sm rounded-lg transition-all duration-300 hover:scale-105 whitespace-nowrap`}>
                  Sign in
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button onClick={() => setMenuOpen(!menuOpen)} className={`lg:hidden p-2 rounded-lg transition-all duration-300 ${
                lightHeader ? "bg-black/5 hover:bg-black/10" : "bg-white/10 hover:bg-white/20"
              }`} aria-label="Toggle menu">
              <svg className={`w-6 h-6 ${linkColor} transition-transform duration-300 ${menuOpen ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Animated Overlay */}
      <div ref={overlayRef} className="fixed inset-0 bg-black z-[60] opacity-0 pointer-events-none" onClick={handleCloseMenu} />

      {/* Unique Dark Sidebar */}
      <div ref={menuRef} className="fixed inset-y-0 right-0 z-[70] w-full max-w-md transform translate-x-full bg-[#141414] shadow-2xl overflow-hidden">
        {/* Decorative Top Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400" />
        
        {/* Sidebar Content */}
        <div className="h-full flex flex-col">
          {/* Header Section with Glow Effect */}
          <div className="px-8 pt-12 pb-8 border-b border-gray-800/50 relative">
            <div className="absolute top-0 right-0 p-6">
              <button onClick={handleCloseMenu} className="w-10 h-10 flex items-center justify-center text-[#f5f5f5] hover:text-white hover:bg-white/10 rounded-full transition-all duration-300 group" aria-label="Close menu">
                <svg className="w-5 h-5 transform group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3.2l8 5.2v10.6a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1V8.4l8-5.2zM12 5.1 6 9v9h3v-6h6v6h3V9l-6-3.9z" />
                  </svg>
                </div>
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl blur opacity-30 animate-pulse" />
              </div>
              <div>
                <span className="text-[#f5f5f5] font-bold text-2xl tracking-wider bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  ListWithLeatonic
                </span>
                <p className="text-gray-400 text-sm mt-1">Find your dream property</p>
              </div>
            </div>
          </div>

          {/* Navigation Links with Unique Hover Effects */}
          <div className="px-6 py-8 flex-1 overflow-y-auto">
            <div className="space-y-2">
              {navLinks.map((link, index) => (
                <Link
                  key={link.name}
                  to={link.to}
                  onClick={handleCloseMenu}
                  className="group relative flex items-center px-5 py-4 text-[#f5f5f5] rounded-xl transition-all duration-300 hover:pl-8 hover:bg-gradient-to-r hover:from-white/5 hover:to-transparent overflow-hidden"
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  {/* Animated Background Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500/0 via-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Glow Effect */}
                  <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:left-3" />
                  
                  {/* Icon */}
                  <span className="text-xl mr-4 transform group-hover:scale-110 transition-transform duration-300">
                    {link.icon}
                  </span>
                  
                  {/* Text */}
                  <span className="text-lg font-medium relative z-10 group-hover:text-white transition-colors duration-300">
                    {link.name}
                  </span>
                  
                  {/* Animated Arrow */}
                  <svg className="ml-auto w-5 h-5 text-gray-500 transform -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 group-hover:text-purple-400 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </Link>
              ))}
            </div>

            {/* Divider with Gradient */}
            <div className="my-8 relative">
              <div className="h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
              <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 px-4 bg-[#141414] text-gray-500 text-sm">
                Account
              </div>
            </div>

            {/* User Info Section */}
            {isAuthenticated ? (
              <div className="space-y-4">
                <div className="relative group">
                  <div className="flex items-center gap-4 px-5 py-4 rounded-xl bg-gradient-to-r from-white/5 to-transparent">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-lg">
                        {user?.avatar ? (
                          <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="font-bold text-white text-lg">{user?.name?.charAt(0) || "U"}</span>
                        )}
                      </div>
                      <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[#f5f5f5] font-semibold truncate">{user?.name || "User"}</p>
                      <p className="text-gray-400 text-sm truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link
                    to="/user/dashboard"
                    onClick={handleCloseMenu}
                    className="group relative block w-full px-6 py-4 text-center font-semibold rounded-xl overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-500 opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="relative text-white">Dashboard</span>
                  </Link>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      to="/user/profile"
                      onClick={handleCloseMenu}
                      className="px-4 py-3 text-center text-[#f5f5f5] font-medium border border-gray-700 rounded-xl hover:bg-white/5 hover:border-purple-500/50 transition-all duration-300 hover:scale-[1.02]"
                    >
                      Profile
                    </Link>
                    <Link
                      to="/user/properties"
                      onClick={handleCloseMenu}
                      className="px-4 py-3 text-center text-[#f5f5f5] font-medium border border-gray-700 rounded-xl hover:bg-white/5 hover:border-purple-500/50 transition-all duration-300 hover:scale-[1.02]"
                    >
                      Properties
                    </Link>
                  </div>
                  
                  <button
                    onClick={() => {
                      useAuthStore.getState().logout();
                      handleCloseMenu();
                      navigate("/");
                    }}
                    className="w-full px-6 py-4 text-red-400 font-medium border border-red-500/20 rounded-xl hover:bg-red-500/10 hover:border-red-500/40 transition-all duration-300 hover:scale-[1.02] group"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Logout
                    </span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={(e) => {
                    handleCloseMenu();
                    handleSignInClick(e);
                  }}
                  className="group relative block w-full px-6 py-4 text-center font-semibold rounded-xl overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-500 opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative text-white flex items-center justify-center gap-2">
                    <svg className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Sign In
                  </span>
                </button>
                
                <p className="text-center text-gray-400 text-sm">
                  Don't have an account?{" "}
                  <Link
                    to="/signup"
                    onClick={handleCloseMenu}
                    className="text-purple-400 hover:text-purple-300 font-medium hover:underline transition-all duration-300"
                  >
                    Sign up now
                  </Link>
                </p>
              </div>
            )}
          </div>

          {/* Footer with Gradient Border */}
          <div className="px-6 py-6 border-t border-gray-800/50">
            <div className="text-center">
              <p className="text-gray-400 text-sm">© {new Date().getFullYear()} ListWithLeatonic</p>
              <p className="text-gray-500 text-xs mt-1">Find your perfect home</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom floating navbar */}
      {showBottomVisible && (
        <div className="fixed left-4 right-4 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2" style={{ bottom: `${bottomOffset}px`, zIndex: 80 }}>
          <div className="backdrop-blur-md rounded-lg px-4 py-3 flex items-center gap-4 shadow-xl mx-auto" style={{ backgroundColor: "rgba(60,60,60,0.85)", width: "max-content" }}>
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center shadow-md">
                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3.2l8 5.2v10.6a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1V8.4l8-5.2zM12 5.1 6 9v9h3v-6h6v6h3V9l-6-3.9z" />
                </svg>
              </div>
            </Link>

            <nav className="flex items-center gap-3">
              {navLinks.slice(0, 3).map((link) => (
                <Link key={link.name} to={link.to} className="px-3 py-2 text-sm text-white rounded-md border border-white/10 hover:bg-white/10 transition-colors font-medium">
                  {link.name}
                </Link>
              ))}
            </nav>

            <Link to="/contact" className="bg-black text-white px-4 py-2 rounded-2xl font-semibold shadow-md text-sm">
              Contact
            </Link>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;