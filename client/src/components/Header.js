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
    const [footerVisible, setFooterVisible] = useState(false);
    const [bottomOffset, setBottomOffset] = useState(24); // px from bottom
    const [showDropdown, setShowDropdown] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const headerRef = useRef(null);
    const [isFooterLight, setIsFooterLight] = useState(false);
    // Get authentication state
    const { isAuthenticated, user, userType } = useAuthStore();

    useEffect(() => {
        // Animate header on mount
        setTimeout(() => setIsVisible(true), 100);

        if (headerRef.current) {
            gsap.fromTo(headerRef.current,
                { y: -100, opacity: 0 },
                { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.2 }
            );
        }

        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Observe the hero section; when it's out of view show a bottom navbar
    // but only after the content container has appeared (contentVisible)
    useEffect(() => {
        const heroEl = document.getElementById('hero-section');

        const getContentVisible = () => document.documentElement.getAttribute('data-content-visible') === 'true';

        if (heroEl && 'IntersectionObserver' in window) {
            const obs = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    const heroOut = !entry.isIntersecting;
                    const contentVisibleFlag = getContentVisible();
                    setShowBottomNav(heroOut && contentVisibleFlag);
                });
            }, { threshold: 0.15 });

            obs.observe(heroEl);
            return () => obs.disconnect();
        }

        // Fallback: use scroll position + contentVisible flag
        const onScroll = () => {
            const heroOut = window.scrollY > 300;
            const contentVisibleFlag = getContentVisible();
            setShowBottomNav(heroOut && contentVisibleFlag);
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
        return () => window.removeEventListener('scroll', onScroll);
    }, [location.pathname]);

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
        // expose a convenience boolean so header can switch color theme
        const checkInitial = () => setIsFooterLight(footerEl.getBoundingClientRect().top < window.innerHeight);
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
    const computedTopVisible = isVisible && !showBottomVisible;
    const lightHeader = footerVisible || isFooterLight;
    const linkColor = lightHeader ? 'text-black' : 'text-white';
    const headerBgClass = lightHeader ? 'bg-white' : 'bg-transparent';
    // Lock background scroll when mobile menu is open to avoid multiple scroll contexts
    useEffect(() => {
        // Persist previous overflow values across toggles so we can correctly restore them
        const prevHtmlRef = headerRef.current && headerRef.current.__prevHtmlOverflowRef
            ? headerRef.current.__prevHtmlOverflowRef
            : { current: '' };
        const prevBodyRef = headerRef.current && headerRef.current.__prevBodyOverflowRef
            ? headerRef.current.__prevBodyOverflowRef
            : { current: '' };

        // Helper to safely read/write styles
        const safeRead = (getter) => {
            try { return getter() || ''; } catch (e) { return ''; }
        };
        const safeWrite = (setter) => {
            try { setter(); } catch (e) { }
        };

            if (menuOpen) {
            // Save previous values only once when opening
            if (!prevHtmlRef.current) prevHtmlRef.current = safeRead(() => document.documentElement.style.overflow);
            if (!prevBodyRef.current) prevBodyRef.current = safeRead(() => document.body.style.overflow);

            safeWrite(() => { document.documentElement.style.overflow = 'hidden'; });
            safeWrite(() => { document.body.style.overflow = 'hidden'; });
                try { document.documentElement.setAttribute('data-overflow-locked-by', 'header'); } catch (e) {}
        } else {
            // Restore saved values when closing
            safeWrite(() => { document.documentElement.style.overflow = prevHtmlRef.current || ''; });
            safeWrite(() => { document.body.style.overflow = prevBodyRef.current || ''; });

            // clear stored refs so subsequent opens save fresh values
            prevHtmlRef.current = '';
            prevBodyRef.current = '';
                try { document.documentElement.removeAttribute('data-overflow-locked-by'); } catch (e) {}
        }

        // Attach refs to header DOM node so they persist across effect runs and unmount
        if (headerRef.current) {
            headerRef.current.__prevHtmlOverflowRef = prevHtmlRef;
            headerRef.current.__prevBodyOverflowRef = prevBodyRef;
        }

        return () => {
            // On unmount, restore whatever we have stored
            safeWrite(() => { document.documentElement.style.overflow = prevHtmlRef.current || ''; });
            safeWrite(() => { document.body.style.overflow = prevBodyRef.current || ''; });
            try { document.documentElement.removeAttribute('data-overflow-locked-by'); } catch (e) {}
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
                    {/* Logo - Styled like EquiSpace but keeping your logo functionality */}
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

                    {/* Navigation Links - YOUR EXACT LINKS with updated styling */}
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

                    {/* Action Buttons - YOUR EXACT FUNCTIONALITY with updated styling */}
                    <div className="hidden sm:flex items-center gap-1.5">
                        {isAuthenticated ? (
                            <div className="flex items-center gap-1.5">
                                <Link
                                    to="/user/profile"
                                    className={`px-5 py-2.5 ${lightHeader ? 'text-black border-black hover:bg-black hover:text-white' : 'text-white border-white hover:bg-white hover:text-black'} font-semibold text-sm rounded-lg transition-all duration-300 hover:scale-105 flex items-center gap-2 whitespace-nowrap`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                    <span className="hidden md:inline">Dashboard</span>
                                </Link>

                                {/* User Profile Dropdown - YOUR EXACT FUNCTIONALITY */}
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

                                    {/* Dropdown Menu - YOUR EXACT CODE */}
                                    {showDropdown && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
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
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                    My Profile
                                                </Link>
                                                <Link
                                                    to="/user/properties"
                                                    className="flex items-center gap-2 px-4 py-3 text-slate-700 hover:bg-slate-50 transition-all duration-300"
                                                    onClick={() => setShowDropdown(false)}
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                    </svg>
                                                    My Properties
                                                </Link>
                                                <Link
                                                    to="/user/leads"
                                                    className="flex items-center gap-2 px-4 py-3 text-slate-700 hover:bg-slate-50 transition-all duration-300"
                                                    onClick={() => setShowDropdown(false)}
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                                    </svg>
                                                    My Leads
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
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                    </svg>
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

                    {/* Mobile Menu Button - YOUR EXACT CODE */}
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

            {/* Mobile Menu - YOUR EXACT CODE with minimal styling updates */}
            {menuOpen && (
                <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center animate-fadeIn">
                    <button
                        onClick={() => setMenuOpen(false)}
                        className="absolute top-6 right-6 w-10 h-10 sm:w-12 sm:h-12 bg-white/10 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl hover:bg-white/20 transition-all duration-300 hover:rotate-90"
                        aria-label="Close menu"
                    >
                        ×
                    </button>

                    <div className="mb-8 sm:mb-12">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-gradient-to-r from-[#00A8FF] to-[#0097E6] flex items-center justify-center mx-auto shadow-md">
                            <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                <path d="M12 3.2l8 5.2v10.6a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1V8.4l8-5.2zM12 5.1 6 9v9h3v-6h6v6h3V9l-6-3.9z" />
                            </svg>
                        </div>
                        <span className="text-white font-bold text-2xl mt-4 block text-center">ListWithLeatonic</span>
                    </div>

                    <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 w-full px-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.to}
                                className="flex items-center justify-center text-white text-xl sm:text-2xl font-bold px-4 sm:px-6 py-2.5 sm:py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg bg-transparent hover:bg-white/10"
                                onClick={() => setMenuOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    <div className="flex flex-col gap-3 sm:gap-4 w-64 sm:w-72 px-6">
                        {isAuthenticated ? (
                            <>
                                <Link
                                    to="/user/profile"
                                    className="text-center px-6 sm:px-8 py-3 sm:py-4 text-white font-bold text-base sm:text-lg rounded-2xl border-2 border-white hover:bg-white hover:text-black transition-all duration-300"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Dashboard
                                </Link>
                                <div className="flex items-center justify-center gap-3 mb-2 sm:mb-4">
                                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                        {user?.avatar ? (
                                            <img
                                                src={user.avatar}
                                                alt={user.name}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <span className="font-bold text-white text-sm sm:text-base">
                                                {user?.name?.charAt(0) || 'U'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-left overflow-hidden">
                                        <p className="text-white font-medium text-sm sm:text-base truncate">{user?.name}</p>
                                        <p className="text-gray-400 text-xs sm:text-sm truncate">{user?.email}</p>
                                    </div>
                                </div>
                                <Link
                                    to="/user/profile"
                                    className="text-center px-6 sm:px-8 py-3 sm:py-4 text-white font-medium text-sm sm:text-base rounded-2xl hover:bg-white/10 transition-all duration-300"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    My Profile
                                </Link>
                                <Link
                                    to="/user/properties"
                                    className="text-center px-6 sm:px-8 py-3 sm:py-4 text-white font-medium text-sm sm:text-base rounded-2xl hover:bg-white/10 transition-all duration-300"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    My Properties
                                </Link>
                                <Link
                                    to="/user/leads"
                                    className="text-center px-6 sm:px-8 py-3 sm:py-4 text-white font-medium text-sm sm:text-base rounded-2xl hover:bg-white/10 transition-all duration-300"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    My Leads
                                </Link>
                                <button
                                    onClick={() => {
                                        useAuthStore.getState().logout();
                                        setMenuOpen(false);
                                        navigate('/');
                                    }}
                                    className="text-center px-6 sm:px-8 py-3 sm:py-4 text-red-400 font-medium text-sm sm:text-base rounded-2xl border-2 border-red-400/20 hover:bg-red-400/10 transition-all duration-300"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleSignInClick}
                                className="text-center px-6 sm:px-8 py-3 sm:py-4 text-white font-bold text-base sm:text-lg rounded-2xl border-2 border-white hover:bg-white hover:text-black transition-all duration-300"
                            >
                                Sign in
                            </button>
                        )}
                    </div>
                </div>
            )}
        </header>

        {/* Bottom floating navbar shown when hero is scrolled out */}
        {showBottomVisible && (
            <div className="fixed left-1/2 transform -translate-x-1/2" style={{ bottom: `${bottomOffset}px`, zIndex: 80 }}>
                <div className="backdrop-blur-md rounded-lg px-4 py-3 flex items-center gap-4 shadow-xl max-w-3xl mx-auto" style={{ backgroundColor: '#3c3c3c' }}>
                    <Link to="/" className="flex items-center gap-3 p-1">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-black to-black flex items-center justify-center shadow-md">
                            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                <path d="M12 3.2l8 5.2v10.6a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1V8.4l8-5.2zM12 5.1 6 9v9h3v-6h6v6h3V9l-6-3.9z" />
                            </svg>
                        </div>
                    </Link>

                    <nav className="hidden sm:flex items-center gap-3 px-2">
                        {navLinks.slice(0,4).map(link => (
                            <Link
                                key={link.name}
                                to={link.to}
                                className="px-3 py-2 text-sm text-white rounded-md bg-transparent border border-white/20 hover:bg-white/10 transition-colors font-medium"
                                style={{ borderColor: 'rgba(91, 91, 91, 0.9)' }}
                            >
                                {link.name}
                            </Link>
                        ))}
                    </nav>

                    <div className="ml-2">
                        <Link to="/contact" className="bg-black text-white px-4 py-2 rounded-2xl font-semibold shadow-md">Contact us</Link>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export default Header;