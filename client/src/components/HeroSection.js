import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useLocation, useNavigate, Link } from 'react-router-dom';

const HeroSection = ({ overrideTitle, overrideSubtitle, overrideCta, overrideHighlight }) => {
    const location = useLocation();
    const [isVisible, setIsVisible] = useState(false);
    const [activeTab, setActiveTab] = useState('sale');
    const [queryText, setQueryText] = useState('');
    const navigate = useNavigate();

    const titleRef = useRef(null);
    const subtitleRef = useRef(null);
    const tabsRef = useRef(null);
    const highlightRef = useRef(null);
    const searchRef = useRef(null);

    const path = location.pathname || '/';
    const variantKey = path.startsWith('/forsale')
        ? 'sale'
        : path.startsWith('/forrent')
            ? 'rent'
            : path.startsWith('/contact')
                ? 'contact'
                : 'default';

    const variants = {
        default: {
            title: "Your Search For a Home Begins With",
            highlight: 'ListWithLeatonic.',
            subtitle: 'Leatonic connects top agents with qualified leads so you spend less time chasing and more time closing.',
            cta: 'Get Qualified Referrals'
        },
        sale: {
            title: 'Find your perfect property for sale',
            highlight: 'For Sale Listings',
            subtitle: 'Browse curated sale listings — homes, condos and luxury estates.',
            cta: 'Browse Sale Listings'
        },
        rent: {
            title: 'Discover rental homes you will love',
            highlight: 'For Rent Options',
            subtitle: 'Find flexible rentals and short-term stays in top neighborhoods.',
            cta: 'Browse Rentals'
        },
        contact: {
            title: 'Get in touch with ListWithLeatonic',
            highlight: 'Contact Us',
            subtitle: 'Have a question or need assistance? Our team is here to help — reach out and we will respond promptly.',
            cta: 'Contact Support'
        }
    };

    const baseVariant = variants[variantKey] || variants.default;
    const current = { ...baseVariant };
    if (overrideTitle) current.title = overrideTitle;
    if (overrideSubtitle) current.subtitle = overrideSubtitle;
    if (overrideCta) current.cta = overrideCta;
    if (overrideHighlight) current.highlight = overrideHighlight;

    useEffect(() => {
        setTimeout(() => setIsVisible(true), 300);

        const tl = gsap.timeline({ delay: 0.45 });
        tl.fromTo(titleRef.current,
            { y: 80, opacity: 0, scale: 0.98, filter: 'blur(8px)', rotationX: -8 },
            { y: 0, opacity: 1, scale: 1, filter: 'blur(0px)', rotationX: 0, duration: 1.2, ease: 'power4.out' }
        )
            .fromTo(subtitleRef.current,
                { y: 40, opacity: 0, scale: 0.99, filter: 'blur(6px)' },
                { y: 0, opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.9, ease: 'power4.out' },
                '-=0.95'
            )
            .fromTo(tabsRef.current,
                { y: 30, opacity: 0, scale: 0.99 },
                { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' },
                '-=0.8'
            )
            .fromTo(searchRef.current,
                { y: 40, opacity: 0, scale: 0.96 },
                { y: 0, opacity: 1, scale: 1, duration: 0.9, ease: 'power3.out' },
                '-=0.7'
            )
            .fromTo(highlightRef.current,
                { scale: 0.85, rotation: -6, opacity: 0.9 },
                { scale: 1, rotation: 0, opacity: 1, duration: 1.1, ease: 'elastic.out(1, 0.6)' },
                '-=1.0'
            );

        setActiveTab(variantKey === 'rent' ? 'rent' : variantKey === 'sale' ? 'sale' : null);
    }, [variantKey]);

    function handleSearch() {
        const q = (queryText || '').trim();
        const target = variantKey === 'rent' ? '/forrent' : '/forsale';
        if (!q) {
            navigate(target);
            return;
        }

        const params = new URLSearchParams();
        params.set('search', q);
        navigate(`${target}?${params.toString()}`);
    }

    return (
        <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
            {/* Floating Background Circles */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute w-64 h-64 bg-blue-300/20 rounded-full blur-3xl animate-float top-20 left-10" />
                <div className="absolute w-72 h-72 bg-blue-400/15 rounded-full blur-3xl animate-float-slow bottom-20 right-16" />
                <div className="absolute w-[500px] h-[500px] bg-blue-200/10 rounded-full blur-3xl animate-float top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>

            {/* Glassy Effect Card 1 - Top Right (Circle) */}
            <div className="absolute top-32 right-12 w-72 h-72 rounded-full backdrop-blur-2xl bg-white/10 border border-white/20 shadow-2xl animate-float z-5">
                <div className="p-8 h-full flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mb-5 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h3 className="text-gray-900 font-extrabold text-xl mb-3">Fast Results</h3>
                    <p className="text-gray-700 font-semibold text-sm px-4">Find your dream home in seconds</p>
                </div>
            </div>

            {/* Glassy Effect Card 2 - Bottom Left (Circle) */}
            <div className="absolute bottom-28 left-12 w-72 h-72 rounded-full backdrop-blur-2xl bg-white/10 border border-white/20 shadow-2xl animate-float z-5">
                <div className="p-8 h-full flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full mb-5 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h3 className="text-gray-900 font-extrabold text-xl mb-3">Verified Listings</h3>
                    <p className="text-gray-700 font-semibold text-sm px-4">100% authentic properties</p>
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 text-center max-w-6xl mx-auto w-full px-4 md:px-8">
                <h1
                    ref={titleRef}
                    className="text-5xl md:text-6xl lg:text-7xl leading-tight mb-6 font-extrabold text-gray-900"
                >
                    {current.title}{' '}
                    <span
                        ref={highlightRef}
                        className="inline-block bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2 rounded-xl shadow-lg animate-fade-pulse"
                    >
                        {current.highlight}
                    </span>
                </h1>

                <p
                    ref={subtitleRef}
                    className="text-lg md:text-xl text-gray-600 mb-12 max-w-3xl mx-auto"
                >
                    {current.subtitle}
                </p>

                {/* Tabs */}
                <div
                    ref={tabsRef}
                    className="flex items-center justify-center gap-8 mb-8"
                >
                    <Link
                        to="/forsale"
                        onClick={() => setActiveTab('sale')}
                        className={`text-lg md:text-xl font-semibold pb-2 transition-all duration-500 ${
                            activeTab === 'sale'
                                ? 'text-gray-900 border-b-4 border-blue-400'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        For Sale
                    </Link>
                    <Link
                        to="/forrent"
                        onClick={() => setActiveTab('rent')}
                        className={`text-lg md:text-xl font-semibold pb-2 transition-all duration-500 ${
                            activeTab === 'rent'
                                ? 'text-gray-900 border-b-4 border-purple-400'
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        For Rent
                    </Link>
                </div>

                {/* Search Bar + CTA */}
                <div ref={searchRef} className="relative max-w-4xl mx-auto">
                    <div className="bg-white rounded-full shadow-lg flex items-center overflow-hidden border-2 border-gray-200 hover:shadow-xl transition-all duration-500">
                        <input
                            type="text"
                            value={queryText}
                            onChange={(e) => setQueryText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                            placeholder="Search by city, state or country..."
                            className="flex-1 px-6 py-4 text-gray-700 text-lg focus:outline-none placeholder:text-gray-400"
                        />
                        <button
                            onClick={() => handleSearch()}
                            className="bg-blue-500 hover:bg-purple-500 text-white px-6 py-4 m-2 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 font-semibold flex items-center gap-2"
                        >
                            {current.cta}
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Animation keyframes */}
            <style>
                {`
                    @keyframes float {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-20px); }
                    }
                    @keyframes float-slow {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-15px); }
                    }
                    @keyframes fade-pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.5; }
                    }
                    .animate-float {
                        animation: float 6s ease-in-out infinite;
                    }
                    .animate-float-slow {
                        animation: float-slow 8s ease-in-out infinite;
                    }
                    .animate-fade-pulse {
                        animation: fade-pulse 3s ease-in-out infinite;
                    }
                `}
            </style>
        </section>
    );
};

export default HeroSection;