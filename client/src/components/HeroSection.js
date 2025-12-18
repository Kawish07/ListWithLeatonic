import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useLocation, useNavigate, Link } from 'react-router-dom';

const HeroSection = ({ overrideTitle, overrideSubtitle, overrideCta, overrideHighlight, overrideImage }) => {
    const location = useLocation();
    const [isVisible, setIsVisible] = useState(false);
    const [activeTab, setActiveTab] = useState('sale');
    const [queryText, setQueryText] = useState('');
    const [videoError, setVideoError] = useState(false);
    const [showPlayButton, setShowPlayButton] = useState(false);
    const navigate = useNavigate();

    const titleRef = useRef(null);
    const subtitleRef = useRef(null);
    const tabsRef = useRef(null);
    const highlightRef = useRef(null);
    const searchRef = useRef(null);
    const videoRef = useRef(null);
    const sectionRef = useRef(null);
    const [loadVideoSources, setLoadVideoSources] = useState(false);

    // YOUR EXACT LOGIC FOR PATH DETECTION
    const path = location.pathname || '/';
    const variantKey = path.startsWith('/forsale')
        ? 'sale'
        : path.startsWith('/forrent')
            ? 'rent'
            : path.startsWith('/contact')
                ? 'contact'
                : 'default';

    // YOUR EXACT VARIANTS
    const variants = {
        default: {
            title: "Your Search For a Home Begins With",
            highlight: 'ListWithLeatonic',
            subtitle: 'Leatonic connects top agents with qualified leads so you spend less time chasing and more time closing.',
            cta: 'Search Properties'
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

    // YOUR EXACT GSAP ANIMATIONS
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
        
        // Try to play video safely. If autoplay is blocked, show a play button overlay
        if (videoRef.current) {
            const vid = videoRef.current;
            let cancelled = false;

            const tryPlay = () => {
                try {
                    const playPromise = vid.play();
                    if (playPromise !== undefined && typeof playPromise.then === 'function') {
                        playPromise.then(() => {
                            // playing
                            setVideoError(false);
                            setShowPlayButton(false);
                        }).catch((error) => {
                            // Autoplay prevented - don't remove the video element, show a play button
                            // eslint-disable-next-line no-console
                            console.debug('Video autoplay prevented or failed:', error);
                            setShowPlayButton(true);
                        });
                    }
                } catch (e) {
                    // eslint-disable-next-line no-console
                    console.debug('Video play attempt threw', e);
                    setShowPlayButton(true);
                }
            };

            const onCanPlay = () => { if (!cancelled) tryPlay(); };
            vid.addEventListener('canplay', onCanPlay);

            // small delay and try once
            const t = setTimeout(() => { if (!cancelled) tryPlay(); }, 600);

            // cleanup
            const cleanup = () => {
                cancelled = true;
                vid.removeEventListener('canplay', onCanPlay);
                clearTimeout(t);
            };

            // store cleanup on ref to run when component unmounts
            videoRef.current._cleanup = cleanup;
        }
        // cleanup possible canplay listener when variantKey or component changes
        return () => {
            try {
                if (videoRef.current && videoRef.current._cleanup) videoRef.current._cleanup();
            } catch (e) {}
        };
    }, [variantKey]);

    // Lazy-load video sources when hero enters viewport or after window load
    useEffect(() => {
        if (loadVideoSources) return;

        let obs = null;
        try {
            obs = new IntersectionObserver((entries) => {
                entries.forEach(e => {
                    if (e.isIntersecting) {
                        setLoadVideoSources(true);
                        if (obs && sectionRef.current) obs.unobserve(sectionRef.current);
                    }
                });
            }, { rootMargin: '200px', threshold: 0.05 });

            if (sectionRef.current) obs.observe(sectionRef.current);
        } catch (e) {
            // IntersectionObserver not supported — fall back to immediate load
            setLoadVideoSources(true);
        }

        // Ensure video sources load eventually after window load (safety net)
        const onWindowLoad = () => setTimeout(() => setLoadVideoSources(true), 1200);
        if (document.readyState === 'complete') onWindowLoad(); else window.addEventListener('load', onWindowLoad);

        return () => {
            try { if (obs && sectionRef.current) obs.unobserve(sectionRef.current); } catch (e) {}
            try { window.removeEventListener('load', onWindowLoad); } catch (e) {}
        };
    }, [loadVideoSources]);

    // Debug: attach event listeners to video element to report playback/network state
    useEffect(() => {
        const vid = videoRef.current;
        if (!vid) return;

        const log = (msg, data) => {
            try {
                // eslint-disable-next-line no-console
                console.debug('[HeroSection][video]', msg, data || {});
            } catch (e) {}
        };

        const onErr = (e) => log('error', { code: vid.error ? vid.error.code : null, message: (vid.error && vid.error.message) || e });
        const onPlay = () => log('play', { readyState: vid.readyState, networkState: vid.networkState });
        const onPause = () => log('pause', { readyState: vid.readyState });
        const onStalled = () => log('stalled', { networkState: vid.networkState });
        const onLoaded = () => log('loadeddata', { readyState: vid.readyState });
        const onCanPlay = () => log('canplay', { readyState: vid.readyState });

        vid.addEventListener('error', onErr);
        vid.addEventListener('play', onPlay);
        vid.addEventListener('pause', onPause);
        vid.addEventListener('stalled', onStalled);
        vid.addEventListener('loadeddata', onLoaded);
        vid.addEventListener('canplay', onCanPlay);

        // Log sources and attributes
        try {
            const sources = Array.from(vid.querySelectorAll ? vid.querySelectorAll('source') : []).map(s => ({ src: s.src, type: s.type }));
            log('video-attributes', { muted: vid.muted, autoplay: vid.autoplay, loop: vid.loop, playsInline: vid.playsInline, src: vid.currentSrc, sources });
        } catch (e) {
            log('video-attributes-failed', e);
        }

        return () => {
            vid.removeEventListener('error', onErr);
            vid.removeEventListener('play', onPlay);
            vid.removeEventListener('pause', onPause);
            vid.removeEventListener('stalled', onStalled);
            vid.removeEventListener('loadeddata', onLoaded);
            vid.removeEventListener('canplay', onCanPlay);
        };
    }, [videoRef.current, showPlayButton]);

    // Fallback: if after a short delay the video is still paused, show the manual play button
    useEffect(() => {
        const vid = videoRef.current;
        if (!vid) return;
        const t = setTimeout(() => {
            try {
                if (!videoError && vid.paused) {
                    setShowPlayButton(true);
                    // eslint-disable-next-line no-console
                    console.debug('[HeroSection][video] fallback: video still paused after timeout, showing play button');
                }
            } catch (e) {}
        }, 1000);
        return () => clearTimeout(t);
    }, [videoRef.current, videoError]);

    // Handle video error
    const handleVideoError = () => {
        setVideoError(true);
        setShowPlayButton(false);
    };

    const handleManualPlay = async () => {
        try {
            if (!videoRef.current) return;
            const p = videoRef.current.play();
            if (p && typeof p.then === 'function') {
                await p;
            }
            setVideoError(false);
            setShowPlayButton(false);
        } catch (e) {
            // eslint-disable-next-line no-console
            console.warn('Manual play failed', e);
            // If manual play fails, show fallback image
            setVideoError(true);
            setShowPlayButton(false);
        }
    };

    // YOUR EXACT SEARCH FUNCTION
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

    const heroImageMap = {
        sale: `${process.env.PUBLIC_URL || ''}/images/buy-hero.jpg`,
        rent: `${process.env.PUBLIC_URL || ''}/images/sell-hero.jpg`,
        contact: `${process.env.PUBLIC_URL || ''}/images/contact-hero.jpg`
    };

    // Prefer explicit overrideImage (passed from LocationPage or navigation state),
    // otherwise fall back to the route-based hero image map.
    const heroImageForRoute = overrideImage || heroImageMap[variantKey] || null;

    return (
        <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
            {/* Background: prefer static images for sale/rent/contact routes, otherwise video */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                {heroImageForRoute ? (
                    <div className="absolute inset-0 -z-30">
                        <img src={heroImageForRoute} alt={`${variantKey} hero`} className="w-full h-full object-cover" />
                    </div>
                ) : (!videoError ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        className="absolute w-full h-full object-cover"
                        onError={handleVideoError}
                        poster="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
                    >
                        {/* Only inject heavy video sources when we want to load them (lazy) */}
                        {loadVideoSources && (
                          <>
                            <source src="/videos/hero.mp4" type="video/mp4" />
                            <source src="https://player.vimeo.com/external/389837478.hd.mp4?s=7c7bfbfc8121c4262c32eb4622d7335d3944c6da&profile_id=175" type="video/mp4" />
                            <source src="https://assets.mixkit.co/videos/preview/mixkit-modern-office-building-4835-large.mp4" type="video/mp4" />
                            <source src="https://cdn.pixabay.com/vimeo/741128311/modern-159046.mp4?width=1920&hash=ac8615b8e0e4e9a2b12819d58cf00e6f0014b2be" type="video/mp4" />
                          </>
                        )}
                        Your browser does not support the video tag.
                    </video>
                ) : (
                    // Fallback image if video fails
                    <div 
                        className="absolute w-full h-full bg-cover bg-center"
                        style={{
                            backgroundImage: `url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`
                        }}
                    />
                ))}

                {/* Dark overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />

                {/* Play button overlay (shows when autoplay is blocked) - only when video is active */}
                {showPlayButton && !videoError && !heroImageForRoute && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                        <button
                            onClick={handleManualPlay}
                            className="pointer-events-auto bg-white/90 text-black rounded-full w-20 h-20 md:w-24 md:h-24 shadow-2xl flex items-center justify-center text-lg font-bold"
                            aria-label="Play background video"
                        >
                            ▶
                        </button>
                    </div>
                )}
            </div>

            {/* YOUR EXACT CONTENT with updated styling */}
            <div className="relative z-10 text-center max-w-6xl mx-auto w-full px-4 md:px-8">
                <h1
                    ref={titleRef}
                    className="text-4xl md:text-5xl lg:text-7xl leading-tight mb-6 font-extrabold text-white"
                >
                    {current.title}{' '}
                    <span
                        ref={highlightRef}
                        className="inline-block bg-gradient-to-r from-black to-black-900 text-white px-6 py-3 rounded-xl shadow-lg animate-fade-pulse"
                    >
                        {current.highlight}
                    </span>
                </h1>

                <p
                    ref={subtitleRef}
                    className="text-lg md:text-xl text-white mb-12 max-w-3xl mx-auto"
                >
                    {current.subtitle}
                </p>

                {/* YOUR EXACT TABS with white styling */}
                <div
                    ref={tabsRef}
                    className="flex items-center justify-center gap-8 mb-8"
                >
                    <Link
                        to="/forsale"
                        onClick={() => setActiveTab('sale')}
                        className={`text-lg md:text-xl font-semibold pb-2 transition-all duration-500 ${
                            activeTab === 'sale'
                                ? 'text-white border-b-4 border-blue-400'
                                : 'text-white/70 hover:text-white'
                        }`}
                    >
                        For Sale
                    </Link>
                    <Link
                        to="/forrent"
                        onClick={() => setActiveTab('rent')}
                        className={`text-lg md:text-xl font-semibold pb-2 transition-all duration-500 ${
                            activeTab === 'rent'
                                ? 'text-white border-b-4 border-purple-400'
                                : 'text-white/70 hover:text-white'
                        }`}
                    >
                        For Rent
                    </Link>
                </div>

                {/* YOUR EXACT SEARCH BAR with white styling */}
                <div ref={searchRef} className="relative max-w-4xl mx-auto">
                    <div className="bg-white/10 rounded-full shadow-md flex items-center overflow-hidden border-2 border-white/30 hover:border-white/50 transition-transform duration-500">
                        <input
                            type="text"
                            value={queryText}
                            onChange={(e) => setQueryText(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                            placeholder="Search by city, state or country..."
                            className="flex-1 px-6 py-4 text-white text-lg focus:outline-none placeholder:text-white/60 bg-transparent"
                        />
                        <button
                            onClick={() => handleSearch()}
                            className="bg-white hover:bg-gray-100 text-black px-6 py-4 m-2 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 font-semibold flex items-center gap-2"
                        >
                            {current.cta}
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Video loading indicator (only when video is active) */}
            {!heroImageForRoute && !videoError && (
                <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 text-white/70 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Live Video</span>
                </div>
            )}

            {/* Animation keyframes - YOUR EXACT CODE */}
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
                    
                    /* Force video to play */
                    video {
                        min-width: 100%;
                        min-height: 100%;
                        width: auto;
                        height: auto;
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                    }
                `}
            </style>
        </section>
    );
};

export default HeroSection;