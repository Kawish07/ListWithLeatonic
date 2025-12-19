// client/src/pages/ContactUsPage.js
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

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

  // FLIP ANIMATION STATES (FROM HOMEPAGE)
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isFlipComplete, setIsFlipComplete] = useState(false);
  const [showContent, setShowContent] = useState(false);

  // Refs
  const flipSectionRef = useRef(null);
  const contentRef = useRef(null);
  const formRef = useRef(null);

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

  // SCROLL HANDLER (FROM HOMEPAGE)
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
        progress = ((scrollY - startAppear) / (fullyVisible - startAppear)) * 0.3;
      } else if (scrollY >= fullyVisible && scrollY < startFlip) {
        progress = 0.3 + ((scrollY - fullyVisible) / (startFlip - fullyVisible)) * 0.1;
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

  // ANIMATION CALCULATIONS (FROM HOMEPAGE)
  const cardTranslateY =
    scrollProgress < 0.3
      ? Math.max((1 - scrollProgress / 0.3) * 60, 15)
      : 0;

  const rotationY = Math.max(0, (scrollProgress - 0.4) / 0.6) * 180;
  const scale = 1 + (Math.max(0, scrollProgress - 0.4) / 0.6) * 11;
  const cardOpacity = scrollProgress < 0.3 ? scrollProgress / 0.3 : 1;
  const overlayOpacity = showContent ? 1 : 0;

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
      className="relative min-h-[400vh]"
      style={{
        backgroundColor: showContent ? "#141414" : "#ffffff",
        overflowX: "hidden",
        overflow: "hidden",
      }}
    >
      {/* Dark overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundColor: "#141414",
          opacity: overlayOpacity,
          transition: "opacity 600ms ease",
          zIndex: 10,
        }}
      />

      <div className="h-screen"></div>

      {/* Flipping Card */}
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
                    CONTACT
                  </h2>
                  <div className="mt-3 text-sm opacity-60">⠉⠕⠝⠞⠁⠉⠞</div>
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

      {/* Content Area */}
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
            backgroundColor: "#141414",
            transition: "background-color 700ms ease-in-out",
          }}
        >
          {/* Contact Methods Section */}
          <div className="py-10 px-4 md:px-8 max-w-7xl mx-auto">
            <div className="rounded-3xl p-8 md:p-12 mb-12 border border-gray-700" style={{ backgroundColor: 'transparent' }}>
              <h2 className="text-4xl font-bold mb-12 text-center text-white">
                How Can We Help You?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { emoji: '🏠', title: 'Property Inquiry', desc: 'Questions about buying, selling or renting properties', btn: 'Ask Now', link: '#form' },
                  { emoji: '📋', title: 'Schedule Viewing', desc: 'Book an appointment to visit properties in person', btn: 'Schedule', link: '#form' },
                  { emoji: '💼', title: 'Agent Support', desc: 'Connect with our licensed real estate agents', btn: 'Connect', link: '#form' }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center group text-center transition-all hover:-translate-y-2">
                    <div className="rounded-full p-6 mb-4 transition-all group-hover:scale-110 bg-gradient-to-br from-orange-500/20 to-red-500/20">
                      <span role="img" aria-label={item.title} className="text-4xl text-orange-500">{item.emoji}</span>
                    </div>
                    <h3 className="font-bold text-xl mb-3 text-white">{item.title}</h3>
                    <p className="mb-4 text-sm leading-relaxed text-gray-300">{item.desc}</p>
                    <a
                      href={item.link}
                      className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-all hover:shadow-lg hover:-translate-y-1 active:scale-95"
                    >
                      {item.btn}
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Section */}
            <div className="mb-12">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight text-white mb-6">
                Get in <span className="text-orange-500">Touch</span>
              </h1>
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
                  whileHover={{ y: -10 }}
                  className="rounded-3xl p-8 transition-all duration-500 group cursor-pointer bg-transparent border border-gray-700 hover:border-orange-500/30 hover:shadow-2xl"
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

            {/* Contact Form & Map Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pb-20">
              {/* Contact Form */}
              <div ref={formRef}>
                <div className="rounded-3xl p-8 md:p-12 bg-transparent border border-gray-700">
                  <h2 className="text-3xl font-bold mb-2 text-white">Send us a Message</h2>
                  <p className="mb-8 text-gray-400">Fill out the form below and we'll respond within 24 hours.</p>
                  
                  {submitStatus === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-4 rounded-xl bg-green-900/30 border border-green-800/30"
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
                    <div>
                      <label className="block font-medium mb-2 text-gray-300" htmlFor="name">
                        Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 bg-transparent text-white border border-gray-700"
                        placeholder="Your name"
                      />
                    </div>

                    <div>
                      <label className="block font-medium mb-2 text-gray-300" htmlFor="email">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 bg-transparent text-white border border-gray-700"
                        placeholder="your.email@example.com"
                      />
                    </div>

                    <div>
                      <label className="block font-medium mb-2 text-gray-300" htmlFor="phone">
                        Phone
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 bg-transparent text-white border border-gray-700"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

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
                          className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 bg-transparent text-white border border-gray-700"
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
                          className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 bg-transparent text-white border border-gray-700"
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
                        className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 resize-none bg-transparent text-white border border-gray-700"
                        placeholder="Tell us how we can help you..."
                      />
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white font-bold py-4 rounded-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="rounded-3xl overflow-hidden mb-8 bg-transparent border border-gray-700">
                  <div className="h-64 relative overflow-hidden bg-transparent">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-500/30">
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
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-700">
                          <span className="text-orange-500">🕐</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-300">Business Hours</p>
                          <p className="text-sm text-gray-400">Mon-Fri: 9AM-6PM EST</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-gray-700">
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
                <div className="rounded-3xl p-8 bg-transparent border border-gray-700">
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
                        className="rounded-xl p-5 hover:shadow-md transition-shadow duration-300 bg-transparent border border-gray-700 hover:border-orange-500/30"
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
        </div>
      </div>
    </div>
  );
};

export default ContactUsPage;