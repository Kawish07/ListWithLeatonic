import React, { useEffect } from 'react';

const Footer = () => {
    useEffect(() => {
        try {
            // set body + html background to white so no dark gaps show behind rounded containers
            document.body.style.backgroundColor = '#ffffff';
            document.documentElement.style.backgroundColor = '#ffffff';
        } catch (e) {}

        return () => {
            try {
                document.body.style.backgroundColor = '';
                document.documentElement.style.backgroundColor = '';
            } catch (e) {}
        };
    }, []);
    return (
        <footer 
            className="relative overflow-hidden w-full"
            style={{
                minHeight: '70vh',
                backgroundColor: '#f5f5f5',
                zIndex: 60,
            }}
        >
            <div className="relative z-10 h-full flex flex-col max-w-8xl mx-auto py-10 px-6 md:px-12 rounded-1xl bg-[#141414]" style={{ color: '#1f2937' }}>
                {/* Main Content */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                    {/* Left Side - Let's Connect */}
                    <div>
                        <h1 className="text-6xl md:text-7xl lg:text-8xl font-light mb-8" style={{ color: '#ffffffff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
                            Let's Connect
                        </h1>
                        <p className="text-lg mb-8 leading-relaxed" style={{ color: '#ffffffff', opacity: 0.85 }}>
                            Tell us about your business. Let's get this conversation started. Fill in the form or send us an email.
                        </p>
                        
                        {/* Email Link with Arrow */}
                        <div className="flex items-center gap-3 mb-16">
                            <svg className="w-8 h-8" style={{ color: '#ffffffff' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5 12h14M12 5l7 7-7 7"/>
                            </svg>
                            <a href="mailto:contactus@ListWithLeatonic" className="text-xl underline hover:opacity-70 transition-opacity" style={{ color: '#ffffffff' }}>
                                contactus@ListWithLeatonic
                            </a>
                        </div>

                        {/* Social Links and Address */}
                        <div className="grid grid-cols-2 gap-12">
                            <div>
                                <p className="text-sm mb-4" style={{ color: '#ffffffff', opacity: 0.8 }}>(Connect)</p>
                                <div className="space-y-3">
                                    <a href="#" className="block text-lg hover:opacity-70 transition-opacity" style={{ color: '#ffffffff' }}>Twitter</a>
                                    <a href="#" className="block text-lg hover:opacity-70 transition-opacity" style={{ color: '#ffffffff' }}>Instagram</a>
                                    <a href="#" className="block text-lg hover:opacity-70 transition-opacity" style={{ color: '#ffffffff' }}>Linkedin</a>
                                </div>
                            </div>
                            <div>
                                <p className="text-sm mb-4" style={{ color: '#ffffffff', opacity: 0.8 }}>(Visit Us)</p>
                                <address className="text-lg not-italic leading-relaxed" style={{ color: '#ffffffff' }}>
                                    #129, ground floor 6th cross Bapuji<br />
                                    layout Chandra layout Vijaynagar,<br />
                                    Bangalore-560040, India
                                </address>
                            </div>
                        </div>
                    </div>

                    {/* Right Side - Contact Form */}
                    <div>
                        <form className="space-y-6">
                            <div>
                                <label className="block text-sm mb-2" style={{ color: '#ffffffff' }}>Name</label>
                                <input 
                                    type="text" 
                                    placeholder="John Doe"
                                    className="w-full px-6 py-4 rounded-xl border-0 text-lg"
                                    style={{ 
                                        backgroundColor: '#292929',
                                        color: '#ffffffff',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-2" style={{ color: '#ffffffff' }}>Email Address</label>
                                <input 
                                    type="email" 
                                    placeholder="abc@email.com"
                                    className="w-full px-6 py-4 rounded-xl border-0 text-lg"
                                    style={{ 
                                        backgroundColor: '#292929',
                                        color: '#ffffffff',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-2" style={{ color: '#ffffffff' }}>Company Name</label>
                                <input 
                                    type="text" 
                                    placeholder="ABC company"
                                    className="w-full px-6 py-4 rounded-xl border-0 text-lg"
                                    style={{ 
                                        backgroundColor: '#292929',
                                        color: '#ffffffff',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-2" style={{ color: '#ffffffff' }}>Message</label>
                                <textarea 
                                    placeholder="I want to build a..."
                                    rows="4"
                                    className="w-full px-6 py-4 rounded-xl border-0 text-lg resize-none"
                                    style={{ 
                                        backgroundColor: '#292929',
                                        color: '#ffffffff',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                            <button 
                                type="submit"
                                className="px-12 py-4 rounded-full text-lg font-medium transition-opacity hover:opacity-90"
                                style={{ 
                                    backgroundColor: '#F4D160',
                                    color: '#141414'
                                }}
                            >
                                Submit
                            </button>
                        </form>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-16 pt-8 border-t flex items-center justify-between" style={{ borderColor: '#e6e6e6' }}>
                    <p className="text-sm" style={{ color: '#6b7280', opacity: 0.9 }}>
                        Copyright © {new Date().getFullYear()} Equisspace. All rights reserved.
                    </p>
                    <a 
                        href="#top" 
                        className="text-sm underline hover:opacity-70 transition-opacity"
                        style={{ color: '#6b7280', opacity: 0.9 }}
                    >
                        Back to top
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;