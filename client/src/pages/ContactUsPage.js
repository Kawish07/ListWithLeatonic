import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Footer from '../components/Footer';

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

  const heroRef = useRef(null);
  const titleRef = useRef(null);
  const descRef = useRef(null);
  const formRef = useRef(null);
  const contactCardsRef = useRef([]);
  const mapRef = useRef(null);

  const contactMethods = [
    {
      icon: '📧',
      title: 'Email Us',
      details: 'support@realizty.com',
      description: 'Send us an email for general inquiries',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: '📞',
      title: 'Call Us',
      details: '+1 (855) 743-1091',
      description: 'Available Monday-Friday, 9AM-6PM EST',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: '🏢',
      title: 'Visit Us',
      details: '123 Real Estate Ave, Suite 500',
      description: 'Toronto, ON M5H 2N2, Canada',
      color: 'from-green-500 to-emerald-500'
    }
  ];

  useEffect(() => {
    // Register GSAP plugins (Lenis is initialized once in App.js)
    gsap.registerPlugin(ScrollTrigger);

    // Hero animations
    gsap.fromTo(titleRef.current,
      { y: 100, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: "power3.out"
      }
    );

    gsap.fromTo(descRef.current,
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        delay: 0.3,
        ease: "power3.out"
      }
    );

    // Contact cards animation
    contactCardsRef.current.forEach((card, index) => {
      if (card) {
        gsap.fromTo(card,
          { y: 100, opacity: 0, scale: 0.9 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            delay: 0.5 + (index * 0.2),
            ease: "back.out(1.7)",
            scrollTrigger: {
              trigger: card,
              start: "top 80%",
              toggleActions: "play none none reverse"
            }
          }
        );
      }
    });

    // Form animation
    gsap.fromTo(formRef.current,
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        scrollTrigger: {
          trigger: formRef.current,
          start: "top 75%",
          toggleActions: "play none none reverse"
        }
      }
    );

    // Map animation
    gsap.fromTo(mapRef.current,
      { scale: 0.8, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 1,
        scrollTrigger: {
          trigger: mapRef.current,
          start: "top 75%",
          toggleActions: "play none none reverse"
        }
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

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
      // Map frontend 'I'm Looking For' to purpose where applicable
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

      // auto-clear status after 6 seconds
      setTimeout(() => setSubmitStatus(null), 6000);

    } catch (err) {
      console.error('Contact form submit error:', err);
      setIsSubmitting(false);
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus(null), 6000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section ref={heroRef} className="relative pt-32 pb-20 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm mb-8">
            <a href="/" className="text-gray-600 hover:text-accent transition-colors duration-300">HOME</a>
            <span className="text-gray-400">»</span>
            <span className="text-accent font-semibold">Contact Us</span>
          </div>

          {/* Title */}
          <div ref={titleRef} className="mb-6">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
              Get in <span className="text-accent">Touch</span>
            </h1>
          </div>

          {/* Description */}
          <div ref={descRef} className="mb-12">
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl leading-relaxed">
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
                className="bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 group cursor-pointer"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${method.color} flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                  <span className="text-3xl">{method.icon}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{method.title}</h3>
                <p className="text-lg font-semibold text-accent mb-2">{method.details}</p>
                <p className="text-gray-600 text-sm">{method.description}</p>
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
              <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Send us a Message</h2>
                <p className="text-gray-600 mb-8">Fill out the form below and we'll respond within 24 hours.</p>
                
                {submitStatus === 'success' && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 text-xl">✓</span>
                      </div>
                      <div>
                        <p className="font-semibold text-green-800">Message Sent Successfully!</p>
                        <p className="text-green-600 text-sm">We'll get back to you soon.</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2" htmlFor="name">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-300"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2" htmlFor="email">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-300"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2" htmlFor="phone">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-300"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2" htmlFor="lookingFor">
                        I'm Looking For *
                      </label>
                      <select
                        id="lookingFor"
                        name="lookingFor"
                        value={formData.lookingFor}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-300 bg-white"
                      >
                        <option value="">Select an option</option>
                        <option value="for_home">I'm looking for a home</option>
                        <option value="sell_property">I want to sell my property</option>
                        <option value="pre_approved">I want to get pre-approved</option>
                        <option value="general">General inquiry</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-gray-700 font-medium mb-2" htmlFor="state">
                        State/Province
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-300"
                        placeholder="Ontario"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2" htmlFor="preferredDate">
                        Preferred Date
                      </label>
                      <input
                        type="date"
                        id="preferredDate"
                        name="preferredDate"
                        value={formData.preferredDate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-300"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 font-medium mb-2" htmlFor="preferredTime">
                        Preferred Time
                      </label>
                      <input
                        type="time"
                        id="preferredTime"
                        name="preferredTime"
                        value={formData.preferredTime}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-300"
                      />
                    </div>
                  </div>
                    <label className="block text-gray-700 font-medium mb-2" htmlFor="message">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows="6"
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-300 resize-none"
                      placeholder="Tell us how we can help you..."
                    />
                  

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-accent to-accent-dark text-white font-bold py-4 rounded-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div ref={mapRef} className="bg-white rounded-3xl overflow-hidden shadow-xl mb-8">
                <div className="h-64 bg-gradient-to-br from-gray-800 to-gray-900 relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-white text-2xl">📍</span>
                      </div>
                      <p className="text-white font-semibold">123 Real Estate Ave</p>
                      <p className="text-gray-300">Toronto, ON M5H 2N2</p>
                    </div>
                  </div>
                  {/* Map dots animation */}
                  <div className="absolute inset-0">
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1 h-1 bg-accent/50 rounded-full animate-pulse"
                        style={{
                          top: `${Math.random() * 100}%`,
                          left: `${Math.random() * 100}%`,
                          animationDelay: `${i * 0.2}s`
                        }}
                      />
                    ))}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Our Office Location</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <span className="text-accent">🕐</span>
                      </div>
                      <div>
                        <p className="font-medium">Business Hours</p>
                        <p className="text-gray-600 text-sm">Mon-Fri: 9AM-6PM EST</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <span className="text-accent">🚗</span>
                      </div>
                      <div>
                        <p className="font-medium">Parking Available</p>
                        <p className="text-gray-600 text-sm">Underground parking with validation</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FAQ Section */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h3>
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
                      className="bg-white rounded-xl p-5 hover:shadow-md transition-shadow duration-300"
                    >
                      <p className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                        <span className="text-accent">❓</span>
                        {faq.q}
                      </p>
                      <p className="text-gray-600 text-sm">{faq.a}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactUsPage;