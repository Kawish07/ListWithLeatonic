import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { throttle } from 'lodash';

const ContactUsPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    lookingFor: '',
    state: '',
    preferredDate: '',
    preferredTime: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  // Animation states
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [displayProgress, setDisplayProgress] = useState(0);
  const [cardPinned, setCardPinned] = useState(false);
  const [contentVisible, setContentVisible] = useState(false);
  const [contentTranslateY, setContentTranslateY] = useState(60);

  // Refs
  const cardWrapperRef = useRef(null);
  const targetProgressRef = useRef(0);
  const mainContainerRef = useRef(null);
  const contentContainerRef = useRef(null);
  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const descRef = useRef(null);
  const formRef = useRef(null);
  const contactCardsRef = useRef([]);
  const faqSectionRef = useRef(null);

  const TRANSLATE_BASE = 60;

  const contactMethods = [
    {
      icon: '📧',
      title: 'Email Us',
      details: 'support@listwithleatonic.com',
      description: 'Send us an email for general inquiries',
      gradient: 'from-orange-500/20 to-red-500/20'
    },
    {
      icon: '📞',
      title: 'Call Us',
      details: '+1 (855) 743-1091',
      description: 'Available Monday-Friday, 9AM-6PM EST',
      gradient: 'from-purple-500/20 to-pink-500/20'
    },
    {
      icon: '🏢',
      title: 'Visit Us',
      details: '123 Real Estate Ave, Suite 500',
      description: 'Toronto, ON M5H 2N2, Canada',
      gradient: 'from-blue-500/20 to-cyan-500/20'
    }
  ];

  // Inject dark mode styles
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .dark-mode-active {
        --text-primary: #ffffff;
        --text-secondary: #d1d5db;
        --text-tertiary: #9ca3af;
        --bg-primary: #0a0a0a;
        --bg-secondary: #141414;
        --bg-card: rgba(0, 0, 0, 0.95);
        --border-color: rgba(255, 255, 255, 0.15);
        background-color: var(--bg-primary) !important;
        color: var(--text-primary) !important;
        transition: background-color 0.8s ease, color 0.8s ease;
      }
      
      .dark-mode-active .text-gray-900,
      .dark-mode-active .text-slate-900 { color: var(--text-primary) !important; }
      .dark-mode-active .text-gray-800,
      .dark-mode-active .text-gray-700 { color: var(--text-secondary) !important; }
      .dark-mode-active .text-gray-600,
      .dark-mode-active .text-slate-600 { color: var(--text-tertiary) !important; }
      .dark-mode-active .bg-white {
        background-color: var(--bg-secondary) !important;
        border-color: var(--border-color) !important;
      }
      .dark-mode-active .bg-gray-100,
      .dark-mode-active .bg-gray-50 { background-color: var(--bg-primary) !important; }
      .dark-mode-active .border-gray-200,
      .dark-mode-active .border-gray-300 { border-color: var(--border-color) !important; }
      .dark-mode-active .shadow-xl {
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.35), 0 6px 8px -4px rgba(0, 0, 0, 0.28) !important;
      }
      
      .flip-card-3d {
        transform-style: preserve-3d;
        will-change: transform;
      }
      
      .flip-card-face {
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        will-change: transform;
      }
      
      .smooth-transition {
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      .glass-card {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 1.5rem;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.contains(style) && document.head.removeChild(style);
  }, []);

  // Clear overflow locks on mount/unmount
  useEffect(() => {
    const clearOverflow = () => {
      try {
        const lockedBy = document.documentElement.getAttribute?.('data-overflow-locked-by');
        if (!lockedBy) {
          document.documentElement.style.overflow = '';
          document.body.style.overflow = '';
        }
      } catch (e) { }
    };
    clearOverflow();
    return clearOverflow;
  }, []);

  // Main scroll handler for flip card animation
  useEffect(() => {
    const handleScroll = () => {
      if (!cardWrapperRef.current) return;

      const rect = cardWrapperRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      // Calculate flip progress
      const cardTop = rect.top;
      const startPoint = windowHeight * 0.8;
      const endPoint = windowHeight * 0.2;
      const distance = startPoint - endPoint;
      const rawProgress = (startPoint - cardTop) / distance;
      const progress = Math.max(0, Math.min(1, rawProgress));

      setScrollProgress(progress);
      targetProgressRef.current = progress;

      // Dark mode transition during flip
      if (progress > 0.3 && progress < 1 && !isDarkMode) {
        setIsDarkMode(true);
        mainContainerRef.current?.classList.add('dark-mode-active');
      } else if (progress <= 0.3 && isDarkMode) {
        setIsDarkMode(false);
        mainContainerRef.current?.classList.remove('dark-mode-active');
        setContentVisible(false);
      }

      // Content slide-up animation
      if (progress >= 0.98) {
        if (!contentVisible) setContentVisible(true);
        const scrollY = window.scrollY;
        const flipTop = rect.top + scrollY;
        const additionalScroll = scrollY - (flipTop + windowHeight * 0.7);
        const slideProgress = Math.min(Math.max(additionalScroll / (windowHeight * 0.8), 0), 1);
        setContentTranslateY(TRANSLATE_BASE - (slideProgress * TRANSLATE_BASE));
      } else if (progress < 0.5) {
        setContentTranslateY(TRANSLATE_BASE);
      }
    };

    const throttled = throttle(handleScroll, 80);
    window.addEventListener('scroll', throttled, { passive: true });
    handleScroll(); // Run once on mount
    return () => window.removeEventListener('scroll', throttled);
  }, [isDarkMode, scrollProgress, contentVisible]);

  // Smooth progress animation
  useEffect(() => {
    let rafId = null;
    const animate = () => {
      const target = targetProgressRef.current ?? scrollProgress;
      setDisplayProgress(prev => {
        const next = prev + (target - prev) * 0.12;
        return Math.abs(next - target) < 0.0005 ? target : next;
      });
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => rafId && cancelAnimationFrame(rafId);
  }, [scrollProgress]);

  // Pin/hide card when flip completes
  useEffect(() => {
    setCardPinned(displayProgress >= 0.98);
  }, [displayProgress]);

  // Toggle content visibility
  useEffect(() => {
    setContentVisible(displayProgress >= 0.98);
  }, [displayProgress]);

  // Expose content visibility to DOM for Header
  useEffect(() => {
    try {
      document.documentElement.setAttribute('data-content-visible', contentVisible ? 'true' : 'false');
    } catch (e) { }
  }, [contentVisible]);

  // Card animation calculations
  const rotationY = displayProgress * 180;
  const scale = 1 + Math.sin(displayProgress * Math.PI) * 0.12;
  const cardOpacity = cardPinned ? 0 : 1;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const lookingForToPurpose = {
        for_home: 'buy',
        sell_property: 'info',
        pre_approved: 'info',
        general: 'info'
      };

      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message,
        purpose: lookingForToPurpose[formData.lookingFor] || 'info',
        lookingFor: formData.lookingFor,
        state: formData.state,
        preferredDate: formData.preferredDate,
        preferredTime: formData.preferredTime
      };

      const apiBase = (process.env.REACT_APP_API_BASE || '').replace(/\/$/, '');
      const endpoint = apiBase ? `${apiBase}/api/client-inquiries` : '/api/client-inquiries';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const contentType = (res.headers.get('content-type') || '').toLowerCase();

      if (!res.ok) {
        let errMsg = `Server error ${res.status}`;
        if (contentType.includes('application/json')) {
          const body = await res.json().catch(() => null);
          errMsg = (body && body.message) ? body.message : errMsg;
        }
        throw new Error(errMsg);
      }

      let data = {};
      if (contentType.includes('application/json')) {
        data = await res.json();
      }

      setIsSubmitting(false);

      if (data && data.success) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', phone: '', lookingFor: '', state: '', preferredDate: '', preferredTime: '', message: '' });
      } else {
        setSubmitStatus('error');
      }

      setTimeout(() => setSubmitStatus(null), 6000);

    } catch (err) {
      console.error('Contact form submit error:', err);
      setIsSubmitting(false);
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus(null), 6000);
    }
  };

  return (
    <div
      ref={mainContainerRef}
      className={`min-h-screen smooth-transition ${isDarkMode ? 'dark-mode-active' : 'bg-white'}`}
    >
      {/* Flip Card Animation Section */}
      <section
        ref={cardWrapperRef}
        className="flex items-center justify-center py-32 px-4 md:px-8"
        style={{ minHeight: '180vh' }}
      >
        <div className="max-w-7xl mx-auto w-full">
          <div className="flex flex-col items-center sticky top-1/4">
            <div className="relative" style={{ perspective: '2000px' }}>
              <div
                className="flip-card-3d relative cursor-pointer"
                style={{
                  width: '400px',
                  height: '550px',
                  transform: `rotateY(${rotationY}deg) scale(${scale})`,
                  opacity: cardOpacity,
                  pointerEvents: cardPinned ? 'none' : 'auto',
                  transition: 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.35s ease'
                }}
              >
                {/* Front of Card - Contact Navigation */}
                <div
                  className="flip-card-face absolute inset-0 rounded-3xl shadow-2xl overflow-hidden glass-card"
                  style={{
                    background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.2) 0%, rgba(220, 38, 38, 0.2) 50%, rgba(249, 115, 22, 0.2) 100%)',
                    color: isDarkMode ? 'white' : '#0f172a'
                  }}
                >
                  <div className="h-full flex flex-col p-8">
                    <div className="text-center mb-8">
                      <h1 className="text-4xl font-bold mb-4 tracking-tight">Connect With Us</h1>
                      <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Your trusted real estate partner</p>
                    </div>

                    <div className="space-y-6 flex-1">
                      {['GET ASSISTANCE', 'SCHEDULE TOUR', 'ASK QUESTION', 'GET QUOTE'].map((item, index) => (
                        <div key={index} className="group cursor-pointer">
                          <div className={`backdrop-blur-sm rounded-xl p-5 text-center transition-all duration-300 hover:scale-105 border ${
                            isDarkMode 
                              ? 'bg-white/5 hover:bg-white/10 border-white/10' 
                              : 'bg-white/20 hover:bg-white/30 border-white/30'
                          }`}>
                            <h3 className="text-xl font-bold tracking-wide">{item}</h3>
                            <p className={`text-sm mt-1 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                              {item === 'GET ASSISTANCE' && 'Professional guidance & support'
                              || item === 'SCHEDULE TOUR' && 'Book property viewing'
                              || item === 'ASK QUESTION' && 'Get expert answers'
                              || item === 'GET QUOTE' && 'Receive personalized estimate'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Back of Card (Black Side) */}
                <div
                  className="flip-card-face absolute inset-0 rounded-3xl overflow-hidden flex items-center justify-center glass-card"
                  style={{
                    backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)',
                    transform: 'rotateY(180deg)',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <div className="text-center p-8">
                    <div className={`w-28 h-28 rounded-full mx-auto mb-8 flex items-center justify-center shadow-2xl ${
                      isDarkMode 
                        ? 'bg-gradient-to-br from-orange-500/30 via-red-500/30 to-rose-500/30' 
                        : 'bg-gradient-to-br from-orange-500/20 via-red-500/20 to-rose-500/20'
                    }`}>
                      <svg className="w-14 h-14 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Let's Talk</h2>
                    <p className={`text-lg leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Reach out to our expert team for personalized assistance
                    </p>
                    <div className="mt-8 flex gap-4 justify-center">
                      <div className={`w-12 h-1 rounded-full ${isDarkMode ? 'bg-orange-500/50' : 'bg-orange-500/30'}`}></div>
                      <div className={`w-12 h-1 rounded-full ${isDarkMode ? 'bg-red-500/50' : 'bg-red-500/30'}`}></div>
                      <div className={`w-12 h-1 rounded-full ${isDarkMode ? 'bg-rose-500/50' : 'bg-rose-500/30'}`}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Glow effect */}
              <div className="absolute -inset-8 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-rose-500/10 blur-3xl rounded-full -z-10 animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Container - slides up after flip */}
      <div
        ref={contentContainerRef}
        className="relative z-20 rounded-t-[40px] w-full"
        style={{
          backgroundColor: '#141414',
          transform: `translateY(${contentTranslateY}vh)`,
          transition: 'background-color 0.9s cubic-bezier(0.4,0,0.2,1), transform 0.9s cubic-bezier(0.22,1,0.36,1), opacity 0.6s ease',
          paddingTop: '24px',
          minHeight: '200vh',
          opacity: contentVisible ? 1 : 0,
          pointerEvents: contentVisible ? 'auto' : 'none'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          {/* Contact Methods Section */}
          <div className="glass-card max-w-6xl mx-auto p-8 md:p-12 w-full border-white/10 mb-12">
            <h2 className="text-4xl font-bold mb-12 text-center text-white">
              How Can We Help You?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { emoji: '🏠', title: 'Property Inquiry', desc: 'Questions about buying, selling or renting properties', btn: 'Ask Now', link: '#form' },
                { emoji: '📋', title: 'Schedule Viewing', desc: 'Book an appointment to visit properties in person', btn: 'Schedule', link: '#form' },
                { emoji: '💼', title: 'Agent Support', desc: 'Connect with our licensed real estate agents', btn: 'Connect', link: '#form' }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center group text-center smooth-transition hover:-translate-y-2">
                  <div className="rounded-full p-6 mb-4 smooth-transition group-hover:scale-110 bg-gradient-to-br from-orange-500/20 to-red-500/20">
                    <span role="img" aria-label={item.title} className="text-4xl text-orange-500">{item.emoji}</span>
                  </div>
                  <h3 className="font-bold text-xl mb-3 text-white">{item.title}</h3>
                  <p className="mb-4 text-sm leading-relaxed text-gray-300">{item.desc}</p>
                  <a
                    href={item.link}
                    className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-semibold smooth-transition hover:shadow-lg hover:-translate-y-1 active:scale-95"
                  >
                    {item.btn}
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Section */}
          <section ref={heroRef} className="relative pt-10 px-4 md:px-8">
            <div className="max-w-7xl mx-auto">
              {/* Title */}
              <div ref={titleRef} className="mb-6">
                <h1 className="text-4xl md:text-6xl font-bold leading-tight text-white">
                  Get in <span className="text-orange-500">Touch</span>
                </h1>
              </div>

              {/* Description */}
              <div ref={descRef} className="mb-12">
                <p className="text-lg md:text-xl leading-relaxed max-w-3xl text-gray-300">
                  Have questions or need help? Our team is here to assist you with all your real estate needs. 
                  Reach out to us and we'll get back to you soon.
                </p>
              </div>

              {/* Contact Methods Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                {contactMethods.map((method, index) => (
                  <motion.div
                    key={method.title}
                    ref={el => contactCardsRef.current[index] = el}
                    whileHover={{ y: -10 }}
                    className="rounded-3xl p-8 transition-all duration-500 group cursor-pointer backdrop-blur-xl bg-gradient-to-br from-gray-900/20 to-black/20 border border-white/10 hover:border-orange-500/30 hover:shadow-2xl"
                  >
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 bg-gradient-to-br ${method.gradient}`}>
                      <span className="text-3xl">{method.icon}</span>
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-white">{method.title}</h3>
                    <p className="text-lg font-semibold text-orange-500 mb-2">{method.details}</p>
                    <p className="text-sm text-gray-400">{method.description}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Contact Form & Map Section */}
          <section className="py-10 px-4 md:px-8 pb-20">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Contact Form */}
                <div ref={formRef}>
                  <div className="rounded-3xl p-8 md:p-12 backdrop-blur-xl bg-gradient-to-br from-gray-900/20 to-black/20 border border-white/10">
                    <h2 className="text-3xl font-bold mb-2 text-white">Send us a Message</h2>
                    <p className="mb-8 text-gray-400">Fill out the form below and we'll respond within 24 hours.</p>
                    
                    {submitStatus === 'success' && (
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 p-4 rounded-xl backdrop-blur-xl bg-gradient-to-br from-green-900/30 to-emerald-900/30 border border-green-800/30"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-green-800/30">
                            <span className="text-green-500 text-xl">✓</span>
                          </div>
                          <div>
                            <p className="font-semibold text-green-300">Message Sent Successfully!</p>
                            <p className="text-sm text-green-400">We'll get back to you soon.</p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6" id="form">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block font-medium mb-2 text-gray-300" htmlFor="preferredDate">
                            Preferred Date
                          </label>
                          <input
                            type="date"
                            id="preferredDate"
                            name="preferredDate"
                            value={formData.preferredDate}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm bg-white/5 text-white border border-white/10"
                          />
                        </div>
                        <div>
                          <label className="block font-medium mb-2 text-gray-300" htmlFor="preferredTime">
                            Preferred Time
                          </label>
                          <input
                            type="time"
                            id="preferredTime"
                            name="preferredTime"
                            value={formData.preferredTime}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 backdrop-blur-sm bg-white/5 text-white border border-white/10"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-medium mb-2 text-gray-300" htmlFor="message">
                          Message *
                        </label>
                        <textarea
                          id="message"
                          name="message"
                          value={formData.message}
                          onChange={handleInputChange}
                          required
                          rows="6"
                          className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 resize-none backdrop-blur-sm bg-white/5 text-white border border-white/10"
                          placeholder="Tell us how we can help you..."
                        />
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold py-4 rounded-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
                      >
                        {isSubmitting ? (
                          <div className="flex items-center justify-center gap-3">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Sending Message...</span>
                          </div>
                        ) : (
                          'Send Message'
                        )}
                      </motion.button>
                    </form>
                  </div>
                </div>

                {/* Map & FAQ Section */}
                <div>
                  {/* Map */}
                  <div className="rounded-3xl overflow-hidden backdrop-blur-xl mb-8 bg-gradient-to-br from-gray-900/20 to-black/20 border border-white/10">
                    <div className="h-64 relative overflow-hidden bg-gradient-to-br from-gray-800/80 to-gray-900/80">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-orange-500/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-500/30">
                            <span className="text-orange-500 text-2xl">📍</span>
                          </div>
                          <p className="text-white font-semibold">123 Real Estate Ave</p>
                          <p className="text-gray-300">Toronto, ON M5H 2N2</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold mb-4 text-white">Our Office Location</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/5">
                            <span className="text-orange-500">🕐</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-300">Business Hours</p>
                            <p className="text-sm text-gray-400">Mon-Fri: 9AM-6PM EST</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-white/5">
                            <span className="text-orange-500">🚗</span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-300">Parking Available</p>
                            <p className="text-sm text-gray-400">Underground parking with validation</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* FAQ Section */}
                  <div ref={faqSectionRef} className="rounded-3xl p-8 backdrop-blur-xl bg-gradient-to-br from-gray-900/20 to-black/20 border border-white/10">
                    <h3 className="text-2xl font-bold mb-6 text-white">
                      Frequently Asked Questions
                    </h3>
                    <div className="space-y-4">
                      {[
                        {
                          q: "How quickly will I receive a response?",
                          a: "We typically respond within 24 hours during business days."
                        },
                        {
                          q: "Can I schedule an in-person meeting?",
                          a: "Yes, we offer in-person consultations at our office."
                        },
                        {
                          q: "Do you provide support on weekends?",
                          a: "Email support is available 24/7, phone support is weekdays only."
                        }
                      ].map((faq, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="rounded-xl p-5 hover:shadow-md transition-shadow duration-300 backdrop-blur-sm bg-white/5 border border-white/10 hover:border-orange-500/30"
                        >
                          <p className="font-semibold mb-2 flex items-center gap-2 text-white">
                            <span className="text-orange-500">❓</span>
                            {faq.q}
                          </p>
                          <p className="text-sm text-gray-400">{faq.a}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ContactUsPage;