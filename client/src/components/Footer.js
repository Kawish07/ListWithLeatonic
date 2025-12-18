import React, { useEffect, useRef, useState } from 'react';
// Removed Lenis instance to avoid conflicting smooth-scroll instances

const Footer = () => {
    const footerRef = useRef(null);
    const [scale, setScale] = useState(1);
    const [opacity, setOpacity] = useState(1);
    // Use a simple window scroll listener instead of a second Lenis instance
    useEffect(() => {
        const handleScroll = () => {
            if (!footerRef.current) return;

            const footer = footerRef.current;
            const rect = footer.getBoundingClientRect();
            const windowHeight = window.innerHeight || document.documentElement.clientHeight;

            if (rect.top < windowHeight && rect.bottom > 0) {
                const visibleHeight = Math.min(rect.bottom, windowHeight) - Math.max(rect.top, 0);
                const progress = visibleHeight / windowHeight;
                const newScale = 1 + (progress * 0.3);
                setScale(Math.min(newScale, 1.3));
                setOpacity(Math.min(progress * 2, 1));
            } else {
                setScale(1);
                setOpacity(0);
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleScroll);
        handleScroll();

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
        };
    }, []);

    // Prevent horizontal scrollbar while footer is visible by hiding overflow-x
    // Save/restore previous value so we don't stomp other code
    useEffect(() => {
        if (!footerRef.current) return;
        if (!('IntersectionObserver' in window)) return;

        const el = footerRef.current;
        const prevRef = { current: '' };

        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    try {
                        // Save previous only once
                        if (!prevRef.current) prevRef.current = document.documentElement.style.overflowX || '';
                    } catch (e) { prevRef.current = ''; }
                    try { document.documentElement.style.overflowX = 'hidden'; } catch (e) { }
                } else {
                    try { document.documentElement.style.overflowX = prevRef.current || ''; } catch (e) { }
                }
            });
        }, { threshold: 0 });

        obs.observe(el);
        return () => {
            obs.disconnect();
            try { document.documentElement.style.overflowX = prevRef.current || ''; } catch (e) { }
        };
    }, []);

    return (
        <footer 
            ref={footerRef} 
            className="relative text-white py-8 px-6 overflow-hidden"
            style={{
                minHeight: '70vh',
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
                transition: 'transform 0.3s ease-out',
                background: 'rgba(0, 0, 0, 0.95)',
                zIndex: 60,
                /* removed backdrop-filter for cross-browser performance */
            }}
        >
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/90 to-black"></div>
                <div 
                    className="absolute inset-0 opacity-3"
                    style={{
                        backgroundImage: `
                            linear-gradient(to right, rgba(99, 102, 241, 0.1) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(99, 102, 241, 0.1) 1px, transparent 1px)
                        `,
                        backgroundSize: '80px 80px'
                    }}
                ></div>
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#6366f1]/3 rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#4f46e5]/3 rounded-full blur-2xl"></div>
            </div>

            <div className="relative z-10 h-full flex flex-col">
                {/* Large Brand Name - Top */}
                <div className="relative z-20 w-full flex justify-center pt-12 pb-8">
                    <h1 
                        className="font-black tracking-tighter text-white leading-none text-[6vw] md:text-[4.5vw] lg:text-[3.5vw]"
                        style={{
                            opacity: opacity,
                            transition: 'opacity 0.3s ease-out'
                        }}
                    >
                        LISTWITH<span className="text-blue-600">LEATONIC</span>
                    </h1>
                </div>

                {/* Footer Content */}
                <div className="relative z-20">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                            {/* Logo and Description */}
                            <div>
                                <a href="/">
                                    <div className="flex items-center gap-3 mb-3 group ms-9">
                                        <div className="w-9 h-9 bg-gradient-to-r from-[#6366f1] to-[#4f46e5] rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
                                            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                                    <path d="M12 3.2l8 5.2v10.6a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1V8.4l8-5.2zM12 5.1 6 9v9h3v-6h6v6h3V9l-6-3.9z" />
                                </svg>
                                        </div>
                                        <span className="text-sm font-bold text-white">
                                            ListWithLeatonic
                                        </span>
                                    </div>
                                </a>
                                <p className="text-gray-400 text-xs leading-relaxed ms-9">
                                    Your trusted partner in finding the perfect home. Making dreams come true, one property at a time.
                                </p>
                                
                                {/* Social Media Icons */}
                                <div className="flex gap-2 mt-3 ms-9">
                                    {[
                                        { name: 'Facebook', icon: 'M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z' },
                                        { name: 'Twitter', icon: 'M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z' },
                                        { name: 'Instagram', icon: 'M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01' }
                                    ].map((social) => (
                                        <a
                                            key={social.name}
                                            href="#"
                                            className="w-10 h-10 bg-[#1a1d29] border border-[#2d3142] rounded-full flex items-center justify-center hover:bg-gradient-to-r hover:from-[#6366f1] hover:to-[#4f46e5] hover:border-transparent transition-all duration-500 hover:scale-110 group"
                                            aria-label={social.name}
                                        >
                                            <svg className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={social.icon} />
                                            </svg>
                                        </a>
                                    ))}
                                </div>
                            </div>

                            {/* Company */}
                            <div>
                                <h3 className="font-bold text-sm mb-3 text-white">Company</h3>
                                <ul className="space-y-1.5">
                                    {['About Us', 'Rent', 'Sell', 'Buy'].map((item) => (
                                        <li key={item}>
                                            <a
                                                href={`/${item.toLowerCase().replace(' ', '-')}`}
                                                className="text-sm text-gray-400 hover:text-white hover:translate-x-2 transition-all duration-300 inline-flex items-center gap-2 group"
                                            >
                                                <span className="w-0 h-0.5 bg-gradient-to-r from-[#6366f1] to-[#4f46e5] group-hover:w-4 transition-all duration-300"></span>
                                                {item}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Resources */}
                            <div>
                                <h3 className="font-bold text-sm mb-3 text-white">Resources</h3>
                                <ul className="space-y-1.5">
                                    {['Help Center', 'Guides', 'Terms of Service', 'Privacy Policy'].map((item) => (
                                        <li key={item}>
                                            <a
                                                href={`/${item.toLowerCase().replace(/ /g, '-')}`}
                                                className="text-sm text-gray-400 hover:text-white hover:translate-x-2 transition-all duration-300 inline-flex items-center gap-2 group"
                                            >
                                                <span className="w-0 h-0.5 bg-gradient-to-r from-[#6366f1] to-[#4f46e5] group-hover:w-4 transition-all duration-300"></span>
                                                {item}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Connect */}
                            <div>
                                <h3 className="font-bold text-sm mb-3 text-white">Connect</h3>
                                <ul className="space-y-1.5 mb-3">
                                    {['Contact Us', 'Support'].map((item) => (
                                        <li key={item}>
                                            <a
                                                href={`/${item.toLowerCase().replace(' ', '-')}`}
                                                className="text-sm text-gray-400 hover:text-white hover:translate-x-2 transition-all duration-300 inline-flex items-center gap-2 group"
                                            >
                                                <span className="w-0 h-0.5 bg-gradient-to-r from-[#6366f1] to-[#4f46e5] group-hover:w-4 transition-all duration-300"></span>
                                                {item}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        {/* Bottom Bar */}
                        <div className="border-t border-[#2d3142] pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
                            <p className="text-gray-400 text-sm ms-9">
                                © {new Date().getFullYear()} ListWithLeatonic. All rights reserved.
                            </p>
                            <div className="flex gap-4 text-xs me-10">
                                <a href="/terms" className="text-sm text-gray-400 hover:text-white transition-all duration-300 relative group">
                                    Terms
                                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6366f1] to-[#4f46e5] group-hover:w-full transition-all duration-300"></span>
                                </a>
                                <a href="/privacy" className="text-sm text-gray-400 hover:text-white transition-all duration-300 relative group">
                                    Privacy
                                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6366f1] to-[#4f46e5] group-hover:w-full transition-all duration-300"></span>
                                </a>
                                <a href="/cookies" className="text-sm text-gray-400 hover:text-white transition-all duration-300 relative group">
                                    Cookies
                                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-[#6366f1] to-[#4f46e5] group-hover:w-full transition-all duration-300"></span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;