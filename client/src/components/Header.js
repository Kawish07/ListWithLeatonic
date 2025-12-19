// Header.jsx - Only styling changes, content/functionality preserved
import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { gsap } from 'gsap';

const Header = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [showBottomNav, setShowBottomNav] = useState(false);
    const [heroInView, setHeroInView] = useState(true);
    const [footerVisible, setFooterVisible] = useState(false);
    const [bottomOffset, setBottomOffset] = useState(24); // px from bottom
    const [showDropdown, setShowDropdown] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const headerRef = useRef(null);
    const [isFooterLight, setIsFooterLight] = useState(false);
    // Get authentication state
    const { isAuthenticated, user } = useAuthStore();

    useEffect(() => {
        // Animate header on mount
        setTimeout(() => setIsVisible(true), 100);

        if (headerRef.current) {
            gsap.fromTo(headerRef.current,
                { y: -100, opacity: 0 },
                { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.2 }
            );
        }

        const SCROLL_THRESHOLD = 80;
        const handleScroll = () => {
            setScrolled(window.scrollY > SCROLL_THRESHOLD);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Observe the hero section; when it's out of view show a bottom navbar
    // Show bottom navbar when user scrolls down slightly on any page.
    // Hide bottom navbar while the hero/top section is visible (show top navbar instead).
    useEffect(() => {
        const heroEl = document.getElementById('hero-section');

        const getContentVisible = () => {
            try {
                // Default to true for pages without the data flag so bottom nav works across pages
                const attr = document.documentElement.getAttribute('data-content-visible');
                return attr === null ? true : attr === 'true';
            } catch (e) {
                return true;
            }
        };

        if (heroEl && 'IntersectionObserver' in window) {
            const obs = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const inView = entry.isIntersecting;
                    setHeroInView(inView);
                });
            }, { threshold: 0.15 });

            obs.observe(heroEl);
            return () => obs.disconnect();
        }

        // No hero element on this page: treat as not in view so bottom nav can appear on scroll
        setHeroInView(false);
        try {
            const contentVisibleFlag = getContentVisible();
            const scrolledPast = window.scrollY > 80;
            const shouldShow = scrolledPast && !menuOpen && contentVisibleFlag && !footerVisible;
            setShowBottomNav(shouldShow);
        } catch (e) {}
        // nothing to cleanup
    }, [location.pathname, menuOpen, footerVisible]);

    // Recompute bottom nav whenever scroll/menu/footer/hero state changes (single source of truth)
    useEffect(() => {
        const contentVisibleFlag = (() => {
            try {
                const attr = document.documentElement.getAttribute('data-content-visible');
                return attr === null ? true : attr === 'true';
            } catch (e) { return true; }
        })();

        const shouldShow = scrolled && !heroInView && contentVisibleFlag && !menuOpen && !footerVisible;
        setShowBottomNav(shouldShow);
    }, [scrolled, heroInView, menuOpen, footerVisible]);

    // Observe footer so bottom navbar stays above it (or hides if required)
    useEffect(() => {
        const footerEl = document.querySelector('footer');
        if (!footerEl || !('IntersectionObserver' in window)) return;

        const footerObs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // mark footer visible so bottom nav can hide if needed
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
        }, { threshold: [0, 0.01, 0.25, 0.5, 1] });

        footerObs.observe(footerEl);
        
        const checkInitial = () => {
            try {
                setIsFooterLight(footerEl.getBoundingClientRect().top < window.innerHeight);
            } catch (e) {}
        };
        checkInitial();
        return () => footerObs.disconnect();
    }, []);

    // YOUR EXACT NAV LINKS PRESERVED
    const navLinks = [
        { name: 'Buy', to: '/forsale'},
        { name: 'Rent', to: '/forrent'},
        { name: 'Sell', to: '/contact'},
        { name: 'Get Approved', to: '/contact'},
        { name: 'Contact Us', to: '/contact'},
    ];

    // Handle Sign In click - EXACTLY AS YOU HAD IT
    const handleSignInClick = (e) => {
        e.preventDefault();
        navigate('/signin');
        if (menuOpen) setMenuOpen(false);
    };

    const showBottomVisible = showBottomNav && !menuOpen && !footerVisible;
    // Hide top header while footer is visible to avoid header overlapping footer area
    const computedTopVisible = isVisible && !showBottomVisible && !footerVisible;
    const lightHeader = footerVisible || isFooterLight;
    const linkColor = lightHeader ? 'text-black' : 'text-white';
    const headerBgClass = lightHeader ? 'bg-white' : 'bg-transparent';

    // Lock background scroll when mobile menu is open
    useEffect(() => {
        if (menuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [menuOpen]);

    return (
        <>
        <header
            ref={headerRef}
            className="fixed top-0 left-0 right-0 z-50 transition-all duration-700"
            style={{
                opacity: computedTopVisible ? 1 : 0,
                transform: `translateY(${computedTopVisible ? 0 : '-120%'})`
            }}
        >
            <div className="w-full px-4 py-4">
                <div
                    className={`${headerBgClass} rounded-2xl px-4 py-4 flex items-center justify-between transition-transform duration-500 ${scrolled ? 'shadow-xl' : ''} max-w-6xl mx-auto`}
                    style={{ transitionProperty: 'background-color, box-shadow, transform, opacity' }}
                >
                    {/* Logo */}
                    <Link to="/" className="flex-shrink-0">
                        <div className="flex items-center gap-3 group cursor-pointer">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-black to-black flex items-center justify-center shadow-md">
                                <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                    <path d="M12 3.2l8 5.2v10.6a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1V8.4l8-5.2zM12 5.1 6 9v9h3v-6h6v6h3V9l-6-3.9z" />
                                </svg>
                            </div>
                            <span className={`${linkColor} font-bold text-2xl tracking-wider`}>ListWithLeatonic</span>
                        </div>
                    </Link>

                    {/* Navigation Links */}
                    <nav className="hidden lg:flex items-center gap-1 flex-1 justify-center">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.to}
                                className={`px-4 py-2 ${linkColor} font-medium text-sm uppercase tracking-wider rounded-lg transition-all duration-300 ${lightHeader ? 'hover:bg-black/10' : 'hover:bg-white/10'} focus:outline-none focus:ring-2 focus:ring-white/20 whitespace-nowrap`}
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
                                    className={`px-5 py-2.5 ${lightHeader ? 'text-black border-black hover:bg-black hover:text-white' : 'text-white border-white hover:bg-white hover:text-black'} font-semibold text-sm rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2 whitespace-nowrap`}
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
                                                <img
                                                    src={user.avatar}
                                                    alt={user.name}
                                                    className="w-full h-full rounded-full object-cover"
                                                />
                                            ) : (
                                                <span className="font-bold text-white text-sm">
                                                    {user?.name?.charAt(0) || 'U'}
                                                </span>
                                            )}
                                        </div>
                                        <span className="font-medium text-sm hidden lg:inline">{user?.name || 'User'}</span>
                                        <svg
                                            className={`w-3 h-3 transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
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
                                                <Link
                                                    to="/user/profile"
                                                    className="flex items-center gap-2 px-4 py-3 text-slate-700 hover:bg-slate-50 transition-all duration-300"
                                                    onClick={() => setShowDropdown(false)}
                                                >
                                                    My Profile
                                                </Link>
                                                <Link
                                                    to="/user/properties"
                                                    className="flex items-center gap-2 px-4 py-3 text-slate-700 hover:bg-slate-50 transition-all duration-300"
                                                    onClick={() => setShowDropdown(false)}
                                                >
                                                    My Properties
                                                </Link>
                                            </div>
                                            <div className="border-t border-slate-200 py-2">
                                                <button
                                                    onClick={() => {
                                                        useAuthStore.getState().logout();
                                                        setShowDropdown(false);
                                                        navigate('/');
                                                    }}
                                                    className="flex items-center gap-2 w-full px-4 py-3 text-red-600 hover:bg-red-50 transition-all duration-300"
                                                >
                                                    Logout
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                                <button
                                    onClick={handleSignInClick}
                                    className={`px-5 py-2.5 ${lightHeader ? 'text-black border-black hover:bg-black hover:text-white' : 'text-white border-white hover:bg-white hover:text-black'} font-semibold text-sm rounded-lg transition-all duration-300 hover:scale-105 whitespace-nowrap`}
                                >
                                    Sign in
                                </button>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className={`sm:hidden p-2 rounded-lg transition-all duration-300 ${lightHeader ? 'bg-black/5 hover:bg-black/10' : 'bg-white/10 hover:bg-white/20'}`}
                        aria-label="Toggle menu"
                    >
                        <svg className={`w-6 h-6 ${linkColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="fixed inset-0 bg-black z-[60] flex flex-col items-center justify-center animate-fadeIn overflow-y-auto py-20">
                    <button
                        onClick={() => setMenuOpen(false)}
                        className="absolute top-6 right-6 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white text-3xl hover:bg-white/20 transition-all duration-300"
                        aria-label="Close menu"
                    >
                        
                    </button>

                    <div className="mb-12">
                        <div className="w-20 h-20 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center mx-auto shadow-md">
                            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 3.2l8 5.2v10.6a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1V8.4l8-5.2zM12 5.1 6 9v9h3v-6h6v6h3V9l-6-3.9z" />
                            </svg>
                        </div>
                        <span className="text-white font-bold text-2xl mt-4 block text-center">ListWithLeatonic</span>
                    </div>

                    <div className="space-y-4 mb-8 w-full px-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.to}
                                className="flex items-center justify-center text-white text-2xl font-bold py-3 rounded-2xl transition-all duration-300 hover:bg-white/10"
                                onClick={() => setMenuOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    <div className="flex flex-col gap-4 w-72 px-6">
                        {isAuthenticated ? (
                            <>
                                <Link
                                    to="/user/dashboard"
                                    className="text-center py-4 text-white font-bold text-lg rounded-2xl border-2 border-white hover:bg-white hover:text-black transition-all duration-300"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Dashboard
                                </Link>
                                <button
                                    onClick={() => {
                                        useAuthStore.getState().logout();
                                        setMenuOpen(false);
                                        navigate('/');
                                    }}
                                    className="text-center py-4 text-red-400 font-medium text-lg rounded-2xl border-2 border-red-400/20 hover:bg-red-400/10 transition-all duration-300"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleSignInClick}
                                className="text-center py-4 text-white font-bold text-lg rounded-2xl border-2 border-white hover:bg-white hover:text-black transition-all duration-300"
                            >
                                Sign in
                            </button>
                        )}
                    </div>
                </div>
            )}
        </header>

        {/* Bottom floating navbar */}
        {showBottomVisible && (
            <div className="fixed left-4 right-4 sm:left-1/2 sm:right-auto sm:transform sm:-translate-x-1/2" style={{ bottom: `${bottomOffset}px`, zIndex: 80 }}>
                <div className="backdrop-blur-md rounded-lg px-4 py-3 flex items-center gap-4 shadow-xl mx-auto" style={{ backgroundColor: 'rgba(60,60,60,0.85)', width: 'max-content' }}>
                    <Link to="/" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center shadow-md">
                            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 3.2l8 5.2v10.6a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1V8.4l8-5.2zM12 5.1 6 9v9h3v-6h6v6h3V9l-6-3.9z" />
                            </svg>
                        </div>
                    </Link>

                    <nav className="flex items-center gap-3">
                        {navLinks.slice(0,3).map(link => (
                            <Link
                                key={link.name}
                                to={link.to}
                                className="px-3 py-2 text-sm text-white rounded-md border border-white/10 hover:bg-white/10 transition-colors font-medium"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </nav>

                    <Link to="/contact" className="bg-black text-white px-4 py-2 rounded-2xl font-semibold shadow-md text-sm">Contact</Link>
                </div>
            </div>
        )}
        </>
    );
};

export default Header;
