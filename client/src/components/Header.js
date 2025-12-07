import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { gsap } from 'gsap';

const Header = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const navigate = useNavigate();
    const headerRef = useRef(null);

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

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Buy', to: '/forsale'},
        { name: 'Rent', to: '/forrent'},
        { name: 'Sell', to: '/contact'},
        { name: 'Get Approved', to: '/contact'},
        { name: 'Contact Us', to: '/contact'},
    ];

    // Handle Add Property click
    const handleAddPropertyClick = (e) => {
        e.preventDefault();

        if (!isAuthenticated) {
            navigate('/signin');
            localStorage.setItem('redirectAfterLogin', '/add-property');
        } else {
            if (userType === 'client') {
                navigate('/dashboard');
            } else {
                navigate('/add-property');
            }
        }

        if (menuOpen) {
            setMenuOpen(false);
        }
    };

    // Handle Sign In click
    const handleSignInClick = (e) => {
        e.preventDefault();
        navigate('/signin');
        if (menuOpen) setMenuOpen(false);
    };

    // User profile dropdown state
    const [showDropdown, setShowDropdown] = useState(false);

    return (
        <header
            ref={headerRef}
            className="fixed top-0 left-0 right-0 z-50 transition-all duration-700 flex items-center justify-center"
            style={{
                opacity: isVisible ? 1 : 0,
                transform: `translateY(${isVisible ? 0 : '-100%'})`
            }}
        >
            <div className="px-4 py-4">
                <div
                    className={`bg-black rounded-full px-6 py-3 md:px-8 md:py-4 flex items-center gap-4 md:gap-8 transition-all duration-500 ${scrolled ? 'shadow-2xl' : 'shadow-lg'}`}
                >
                    {/* Logo Icon (blue) */}
                    <Link to="/">
                        <div className="flex items-center gap-3 group cursor-pointer">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-accent to-accent-dark flex items-center justify-center shadow-md">
                                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                    <path d="M12 3.2l8 5.2v10.6a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1V8.4l8-5.2zM12 5.1 6 9v9h3v-6h6v6h3V9l-6-3.9z" />
                                </svg>
                            </div>
                        </div>
                    </Link>

                    {/* Navigation Links */}
                    <nav className="hidden lg:flex items-center gap-1">
                        {navLinks.map((link, index) => (
                            <Link
                                key={link.name}
                                to={link.to}
                                className="px-4 py-2 text-white font-medium text-base rounded-full transition-all duration-300 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
                            >
                                <span className="flex items-center gap-2">
                                    <span className="text-lg">{link.icon}</span>
                                    {link.name}
                                </span>
                            </Link>
                        ))}
                    </nav>

                    {/* Action Buttons */}
                    <div className="hidden md:flex items-center gap-3">
                        {isAuthenticated ? (
                            <div className="flex items-center gap-4">
                                <Link
                                    to="/user/profile"
                                    className="px-5 py-2.5 text-white font-semibold rounded-full border-2 border-white/20 hover:border-white/40 hover:bg-white/10 transition-all duration-300 hover:scale-105 flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                    Dashboard
                                </Link>

                                {/* User Profile Dropdown */}
                                <div className="relative">
                                    <button
                                        onClick={() => setShowDropdown(!showDropdown)}
                                        className="flex items-center gap-2 text-white hover:text-gray-200 transition-all duration-300"
                                    >
                                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-md">
                                            {user?.avatar ? (
                                                <img
                                                    src={user.avatar}
                                                    alt={user.name}
                                                    className="w-full h-full rounded-full object-cover"
                                                />
                                            ) : (
                                                <span className="font-bold text-white">
                                                    {user?.name?.charAt(0) || 'U'}
                                                </span>
                                            )}
                                        </div>
                                        <span className="font-medium">{user?.name || 'User'}</span>
                                        <svg
                                            className={`w-4 h-4 transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* Dropdown Menu */}
                                    {showDropdown && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
                                            <div className="p-4 border-b border-slate-200">
                                                <p className="text-slate-900 font-medium">{user?.name}</p>
                                                <p className="text-slate-500 text-sm">{user?.email}</p>
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
                                className="px-6 py-2.5 text-white font-semibold rounded-full border-2 border-white/20 hover:border-white/40 hover:bg-white/10 transition-all duration-300 hover:scale-105"
                            >
                                Sign in
                            </button>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="lg:hidden p-3 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-300"
                    >
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center animate-fadeIn">
                    <button
                        onClick={() => setMenuOpen(false)}
                        className="absolute top-8 right-8 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white text-3xl hover:bg-white/20 transition-all duration-300 hover:rotate-90"
                    >
                        ×
                    </button>

                    <div className="mb-12">
                        <div className="w-20 h-20 rounded-xl bg-gradient-to-r from-accent to-accent-dark flex items-center justify-center mx-auto shadow-md">
                            <svg className="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                <path d="M12 3.2l8 5.2v10.6a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1V8.4l8-5.2zM12 5.1 6 9v9h3v-6h6v6h3V9l-6-3.9z" />
                            </svg>
                        </div>
                    </div>

                    <div className="space-y-4 mb-8">
                        {navLinks.map((link, index) => (
                            <Link
                                key={link.name}
                                to={link.to}
                                className="flex items-center justify-center gap-3 text-white text-2xl font-bold px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg bg-transparent hover:bg-white/10"
                                onClick={() => setMenuOpen(false)}
                            >
                                <span className="text-3xl">{link.icon}</span>
                                {link.name}
                            </Link>
                        ))}
                    </div>

                    <div className="flex flex-col gap-4 w-64">
                        {isAuthenticated ? (
                            <>
                                <Link
                                    to="/dashboard"
                                    className="text-center px-8 py-4 text-white font-bold rounded-2xl border-2 border-white/20 hover:bg-white/10 transition-all duration-300"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Dashboard
                                </Link>
                                <div className="flex items-center justify-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                                        {user?.avatar ? (
                                            <img
                                                src={user.avatar}
                                                alt={user.name}
                                                className="w-full h-full rounded-full object-cover"
                                            />
                                        ) : (
                                            <span className="font-bold text-white">
                                                {user?.name?.charAt(0) || 'U'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-white font-medium">{user?.name}</p>
                                        <p className="text-gray-400 text-sm">{user?.email}</p>
                                    </div>
                                </div>
                                <Link
                                    to="/user/profile"
                                    className="text-center px-8 py-4 text-white font-medium rounded-2xl hover:bg-white/10 transition-all duration-300"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    My Profile
                                </Link>
                                <button
                                    onClick={() => {
                                        useAuthStore.getState().logout();
                                        setMenuOpen(false);
                                        navigate('/');
                                    }}
                                    className="text-center px-8 py-4 text-red-400 font-medium rounded-2xl border-2 border-red-400/20 hover:bg-red-400/10 transition-all duration-300"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleSignInClick}
                                className="text-center px-8 py-4 text-white font-bold rounded-2xl border-2 border-white/20 hover:bg-white/10 transition-all duration-300"
                            >
                                Sign in
                            </button>
                        )}

                        <button
                            onClick={handleAddPropertyClick}
                            className="text-center px-8 py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-100 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            Add Property
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </header>
    );
};
export default Header;