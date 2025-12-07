import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import api from '../utils/api';
import { getUserCountry, isStateInCountry, isUSorCA } from '../utils/location';
import PropertyCard from '../components/PropertyCard';
import MortgageRates from '../components/MortgageRates';
import PopularLocations from '../components/PopularLocations';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Location Card Component
const LocationCard = ({ name, properties, image }) => (
  <div className="relative rounded-2xl overflow-hidden h-64 cursor-pointer group shadow-lg hover:shadow-2xl transition-all duration-700 hover:-translate-y-2">
    <img
      src={image || 'https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=2070&auto=format&fit=crop'}
      alt={name}
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 to-blue-900/20 group-hover:from-blue-900/70 group-hover:to-blue-900/10 transition-all duration-700"></div>
    <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform transition-transform duration-700 group-hover:translate-y-[-8px]">
      <h3 className="text-xl font-bold mb-1">{name}</h3>
      <p className="text-sm opacity-90">{properties} properties</p>
    </div>
  </div>
);

// Mortgage Calculator Component
const MortgageCalculator = () => {
  const [calculatorData, setCalculatorData] = useState({
    totalAmount: '',
    downPayment: '',
    interestRate: '',
    loanTerms: '',
    propertyTax: '',
    homeInsurance: '',
    pmi: ''
  });

  const [monthlyMortgage, setMonthlyMortgage] = useState(0);
  const [breakdown, setBreakdown] = useState({
    principalInterest: 0,
    propertyTax: 0,
    homeInsurance: 0,
    pmi: 0
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCalculatorData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateMortgage = () => {
    const {
      totalAmount,
      downPayment,
      interestRate,
      loanTerms,
      propertyTax,
      homeInsurance,
      pmi
    } = calculatorData;

    const price = parseFloat(totalAmount) || 0;
    const downPaymentPercent = parseFloat(downPayment) || 0;
    const annualInterestRate = parseFloat(interestRate) || 0;
    const years = parseFloat(loanTerms) || 0;
    const annualPropertyTax = parseFloat(propertyTax) || 0;
    const annualHomeInsurance = parseFloat(homeInsurance) || 0;
    const monthlyPMI = parseFloat(pmi) || 0;

    const downPaymentAmount = (price * downPaymentPercent) / 100;
    const loanAmount = price - downPaymentAmount;
    const monthlyInterestRate = (annualInterestRate / 100) / 12;
    const numberOfPayments = years * 12;

    let monthlyPrincipalInterest = 0;
    if (monthlyInterestRate > 0) {
      monthlyPrincipalInterest = loanAmount *
        (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) /
        (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
    } else {
      monthlyPrincipalInterest = loanAmount / numberOfPayments;
    }

    const monthlyPropertyTax = annualPropertyTax / 12;
    const monthlyHomeInsurance = annualHomeInsurance / 12;
    const totalMonthly = monthlyPrincipalInterest + monthlyPropertyTax + monthlyHomeInsurance + monthlyPMI;

    setMonthlyMortgage(totalMonthly);
    setBreakdown({
      principalInterest: monthlyPrincipalInterest,
      propertyTax: monthlyPropertyTax,
      homeInsurance: monthlyHomeInsurance,
      pmi: monthlyPMI
    });
  };

  const resetCalculator = () => {
    setCalculatorData({
      totalAmount: '',
      downPayment: '',
      interestRate: '',
      loanTerms: '',
      propertyTax: '',
      homeInsurance: '',
      pmi: ''
    });
    setMonthlyMortgage(0);
    setBreakdown({
      principalInterest: 0,
      propertyTax: 0,
      homeInsurance: 0,
      pmi: 0
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 max-w-6xl mx-auto w-full">
      <h2 className="text-4xl font-bold mb-8 text-blue-900 text-center">Mortgage Calculator</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column - Inputs */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-blue-900 mb-2">
              Total Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500">$</span>
              <input
                type="number"
                name="totalAmount"
                value={calculatorData.totalAmount}
                onChange={handleInputChange}
                placeholder="0"
                className="w-full pl-10 pr-4 py-3 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-900 mb-2">
              Down Payment (%)
            </label>
            <input
              type="number"
              name="downPayment"
              value={calculatorData.downPayment}
              onChange={handleInputChange}
              placeholder="0"
              className="w-full px-4 py-3 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-blue-900 mb-2">
                Interest Rate (%)
              </label>
              <input
                type="number"
                name="interestRate"
                value={calculatorData.interestRate}
                onChange={handleInputChange}
                placeholder="0"
                step="0.01"
                className="w-full px-4 py-3 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-900 mb-2">
                Loan Terms (Years)
              </label>
              <input
                type="number"
                name="loanTerms"
                value={calculatorData.loanTerms}
                onChange={handleInputChange}
                placeholder="0"
                className="w-full px-4 py-3 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-blue-900 mb-2">
                Property Tax ($/year)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500">$</span>
                <input
                  type="number"
                  name="propertyTax"
                  value={calculatorData.propertyTax}
                  onChange={handleInputChange}
                  placeholder="0"
                  className="w-full pl-10 pr-4 py-3 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-900 mb-2">
                Home Insurance ($/year)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500">$</span>
                <input
                  type="number"
                  name="homeInsurance"
                  value={calculatorData.homeInsurance}
                  onChange={handleInputChange}
                  placeholder="0"
                  step="0.01"
                  className="w-full pl-10 pr-4 py-3 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-900 mb-2">
              PMI ($/month)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-500">$</span>
              <input
                type="number"
                name="pmi"
                value={calculatorData.pmi}
                onChange={handleInputChange}
                placeholder="0"
                className="w-full pl-10 pr-4 py-3 border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-300"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={calculateMortgage}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold px-6 py-4 rounded-xl transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-95"
            >
              Calculate
            </button>
            <button
              onClick={resetCalculator}
              className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold px-6 py-4 rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 active:scale-95"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Right Column - Results */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-3xl p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-blue-900 mb-2">Monthly Mortgage</h3>
            <div className="text-5xl font-bold text-blue-900">
              {formatCurrency(monthlyMortgage)}
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="text-lg font-bold text-blue-900 mb-4">Breakdown</h4>

            <div className="flex justify-between items-center pb-4 border-b border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-900"></div>
                <span className="text-blue-800">Principal & Interest</span>
              </div>
              <span className="font-bold text-blue-900">{formatCurrency(breakdown.principalInterest)}</span>
            </div>

            <div className="flex justify-between items-center pb-4 border-b border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-600"></div>
                <span className="text-blue-800">Property Tax</span>
              </div>
              <span className="font-bold text-blue-900">{formatCurrency(breakdown.propertyTax)}</span>
            </div>

            <div className="flex justify-between items-center pb-4 border-b border-blue-200">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                <span className="text-blue-800">Home Insurance</span>
              </div>
              <span className="font-bold text-blue-900">{formatCurrency(breakdown.homeInsurance)}</span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-300"></div>
                <span className="text-blue-800">PMI</span>
              </div>
              <span className="font-bold text-blue-900">{formatCurrency(breakdown.pmi)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HomePage = () => {
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [recentProperties, setRecentProperties] = useState([]);
  const [allProperties, setAllProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [detectedCountry, setDetectedCountry] = useState(null);
  const [noPropertiesForLocation, setNoPropertiesForLocation] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);

  const findHomeSectionRef = useRef(null);
  const featuredSectionRef = useRef(null);
  const recentSectionRef = useRef(null);
  const calculatorSectionRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const country = await getUserCountry();
        setDetectedCountry(country);
        await fetchProperties(country);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Recompute recent/featured every minute so items older than 1 hour move automatically
  useEffect(() => {
    const id = setInterval(() => {
      // Re-run the split logic using currently loaded allProperties
      if (allProperties && allProperties.length > 0) {
        splitFeaturedAndRecent(allProperties);
      }
    }, 60 * 1000); // 1 minute

    return () => clearInterval(id);
  }, [allProperties]);

  useEffect(() => {
    // Animate sections on scroll
    if (findHomeSectionRef.current) {
      gsap.fromTo(findHomeSectionRef.current.querySelectorAll('.card-animate'),
        { y: 80, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: findHomeSectionRef.current,
            start: 'top 80%',
            toggleActions: 'play none none reverse'
          }
        }
      );
    }
  }, []);

  const fetchProperties = async (country = null) => {
    try {
      setError('');

      const response = await api.get('/properties', {
        params: {
          limit: 50,
          status: 'published'
        }
      });

      if (response.data.success) {
        const fetched = response.data.properties || [];
        setAllProperties(fetched);
        let properties = fetched.slice();

        if (country) {
          if (country === 'US' || country === 'CA') {
            properties = properties.filter(p => isStateInCountry(p.state, country));
          } else {
            let countryName = country;
            try {
              const dn = new Intl.DisplayNames(['en'], { type: 'region' });
              const resolved = dn.of(country);
              if (resolved) countryName = resolved;
            } catch (e) { }

            properties = properties.filter(p => {
              if (p.country && String(p.country).toUpperCase() === String(country).toUpperCase()) return true;
              if (p.countryCode && String(p.countryCode).toUpperCase() === String(country).toUpperCase()) return true;

              const hay = [p.address, p.city, p.state].filter(Boolean).join(' ').toLowerCase();
              if (!hay) return false;
              if (countryName && hay.includes(String(countryName).toLowerCase())) return true;
              if (hay.includes(String(country).toLowerCase())) return true;
              return false;
            });
          }
        } else {
          properties = properties.filter(p => isUSorCA(p.state) || !p.state);
        }

        if (country && properties.length === 0) {
          setNoPropertiesForLocation(true);
          properties = fetched.slice();
        } else {
          setNoPropertiesForLocation(false);
        }

        // compute recent = properties added within last 1 hour
        splitFeaturedAndRecent(properties);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      setError('Failed to load properties');
      const fallback = getMockProperties();
      setFeaturedProperties(fallback.slice(0, 3));
      setRecentProperties(fallback.slice(3, 5));
    }
  };

  // Helper: split properties into featured (older than 1 hour) and recent (within last 1 hour)
  const splitFeaturedAndRecent = (properties) => {
    try {
      const now = Date.now();
      const ONE_HOUR = 60 * 60 * 1000;

      // Ensure sorted newest first
      const sorted = (properties || []).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const recent = [];
      const older = [];

      sorted.forEach(p => {
        const created = p.createdAt ? new Date(p.createdAt).getTime() : 0;
        if (now - created <= ONE_HOUR) {
          recent.push(p);
        } else {
          older.push(p);
        }
      });

      // Featured should show all older items (properties older than 1 hour)
      const featured = older.slice();

      // If there aren't enough older items to fill featured, fill from older-than-recent (but do not include items <1h)
      // (already handled by older.slice)

      setFeaturedProperties(featured);
      // Show up to 5 recent items (you can adjust limit)
      setRecentProperties(recent.slice(0, 5));
    } catch (e) {
      console.warn('Error splitting featured/recent', e);
      setFeaturedProperties((properties || []).slice(0, 3));
      setRecentProperties((properties || []).slice(3, 5));
    }
  };

  const getMockProperties = () => {
    return [
      {
        _id: '1',
        title: '6331 Pleasant Houston Cir...',
        address: 'Tennessee, TN',
        city: 'Tennessee',
        price: 448000,
        bedrooms: 3,
        bathrooms: 2,
        squareFeet: 2000,
        listingType: 'sale',
        status: 'published',
        images: ['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=2075&auto=format&fit=crop']
      },
      {
        _id: '2',
        title: 'Modern Downtown Apartment',
        address: 'Texas, TX',
        city: 'Texas',
        price: 385000,
        bedrooms: 2,
        bathrooms: 2,
        squareFeet: 1500,
        listingType: 'sale',
        status: 'published',
        images: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2070&auto=format&fit=crop']
      },
      {
        _id: '3',
        title: 'Luxury Beach House',
        address: 'California, CA',
        city: 'California',
        price: 875000,
        bedrooms: 4,
        bathrooms: 3,
        squareFeet: 3200,
        listingType: 'sale',
        status: 'published',
        images: ['https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=2070&auto=format&fit=crop']
      },
      {
        _id: '4',
        title: 'Welcome to Exaito...',
        address: 'Tennessee, TN',
        city: 'Tennessee',
        price: 325000,
        bedrooms: 3,
        bathrooms: 2,
        squareFeet: 1800,
        listingType: 'sale',
        status: 'published',
        images: ['https://images.unsplash.com/photo-1576941089067-2de3c901e126?q=80&w=2078&auto=format&fit=crop']
      },
      {
        _id: '5',
        title: 'Family Offshoot Retreat',
        address: 'Florida, FL',
        city: 'Florida',
        price: 525000,
        bedrooms: 5,
        bathrooms: 3,
        squareFeet: 2800,
        listingType: 'sale',
        status: 'published',
        images: ['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=2070&auto=format&fit=crop']
      }
    ];
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 min-h-screen">

      {/* Find a perfect home */}
      <section ref={findHomeSectionRef} className="min-h-screen flex items-center justify-center py-20 px-4 md:px-8 transition-all duration-1000">
        <div className="bg-white rounded-3xl shadow-2xl max-w-6xl mx-auto p-8 md:p-12 w-full">
          <h2 className="text-4xl font-bold mb-12 text-blue-900 text-center">Find a perfect home</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { emoji: '🏠', title: 'Buy a Home', desc: 'Custom search Smart insight and expect agent at your', btn: 'Find a home', link: '/contact' },
              { emoji: '🏷️', title: 'Get Pre-Approved', desc: 'Partner up with best agents to get approved fast and immediate.', btn: 'Get Pre-Approved', link: '/contact' },
              { emoji: '🔑', title: 'Sell Your Home', desc: 'Unlock the true value of your home with our expert knowledge.', btn: 'Get Connect', link: '/contact' }
            ].map((item, i) => (
              <div key={i} className="card-animate flex flex-col items-center group text-center transition-all duration-700">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-full p-6 mb-4 transition-all duration-500 group-hover:scale-125 group-hover:shadow-xl group-hover:from-blue-100 group-hover:to-blue-200 group-hover:rotate-6">
                  <span role="img" aria-label={item.title} className="text-4xl">{item.emoji}</span>
                </div>
                <h3 className="font-bold text-xl mb-3 transition-colors duration-300 group-hover:text-blue-700 text-blue-900">{item.title}</h3>
                <p className="text-blue-700 mb-4 text-sm leading-relaxed">{item.desc}</p>
                <Link
                  to={item.link}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:shadow-xl hover:-translate-y-1 active:scale-95"
                >
                  {item.btn}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Properties */}
      <section ref={featuredSectionRef} className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="mb-4 text-sm text-blue-700">
          Showing results for: <span className="font-semibold text-blue-900">{detectedCountry ? (detectedCountry === 'US' ? 'United States' : detectedCountry === 'CA' ? 'Canada' : detectedCountry) : 'United States & Canada'}</span>
        </div>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-4xl font-bold text-blue-900">Featured properties</h2>
          <Link
            to="/forsale"
            className="bg-white border-2 border-blue-500 text-blue-500 font-bold px-6 py-3 rounded-xl transition-all duration-300 hover:bg-blue-500 hover:text-white hover:shadow-lg hover:-translate-y-1"
          >
            View all
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
                <div className="h-56 bg-blue-100 rounded-xl mb-4"></div>
                <div className="h-4 bg-blue-100 rounded mb-2"></div>
                <div className="h-3 bg-blue-100 rounded mb-3"></div>
                <div className="flex gap-4 mb-4">
                  <div className="h-3 w-16 bg-blue-100 rounded"></div>
                  <div className="h-3 w-16 bg-blue-100 rounded"></div>
                  <div className="h-3 w-16 bg-blue-100 rounded"></div>
                </div>
                <div className="h-6 bg-blue-100 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {noPropertiesForLocation && (
              <div className="rounded-2xl p-8 bg-blue-50 border border-blue-200 text-blue-800 mb-8">
                <p className="mb-4">No properties were found in your location ({detectedCountry || 'your area'}). Showing all listings instead.</p>
                <Link to="/forsale" className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-300">View listings from other locations</Link>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredProperties.map(property => (
                <PropertyCard key={property._id} property={property} />
              ))}
            </div>
          </>
        )}
      </section>

      {/* Recently Added */}
      <section ref={recentSectionRef} className="py-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-4xl font-bold text-slate-900">Recently added</h2>
          <Link
            to="/forrent"
            className="bg-white border-2 border-accent text-accent font-bold px-6 py-3 rounded-xl transition-all duration-300 hover:bg-accent hover:text-white hover:shadow-lg hover:-translate-y-1"
          >
            View all
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-2xl p-5 animate-pulse">
                <div className="h-56 bg-slate-200 rounded-xl mb-4"></div>
                <div className="h-4 bg-slate-200 rounded mb-2"></div>
                <div className="h-3 bg-slate-200 rounded mb-3"></div>
                <div className="flex gap-4 mb-4">
                  <div className="h-3 w-16 bg-slate-200 rounded"></div>
                  <div className="h-3 w-16 bg-slate-200 rounded"></div>
                  <div className="h-3 w-16 bg-slate-200 rounded"></div>
                </div>
                <div className="h-6 bg-slate-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {noPropertiesForLocation && (
              <div className="rounded-2xl p-8 bg-amber-50 border border-amber-200 text-amber-800 mb-8">
                <p className="mb-4">No recently added properties were found in your location ({detectedCountry || 'your area'}). Showing all listings instead.</p>
                <Link to="/forsale" className="inline-block bg-slate-900 text-white px-6 py-3 rounded-xl hover:bg-slate-800 transition-all duration-300">View listings from other locations</Link>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {recentProperties.map(property => (
                <PropertyCard key={property._id} property={property} />
              ))}
            </div>
          </>
        )}
      </section>

      <MortgageRates apiUrl={process.env.REACT_APP_MORTGAGE_RATES_API} />
      <PopularLocations />

      <section ref={calculatorSectionRef} className="min-h-screen flex items-center justify-center py-20 px-4 md:px-8 bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200">
        <div className="max-w-7xl mx-auto w-full">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-blue-900">
                Mortgage Calculator
              </h2>
            </div>
            <p className="text-xl text-blue-700 max-w-2xl mx-auto">
              Plan your dream home purchase with our comprehensive mortgage calculator
            </p>
          </div>

          {!showCalculator ? (
            // Calculator Preview Card
            <div className="max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl p-8 md:p-12 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:-translate-y-3 group border-2 border-blue-100">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Left Side - Illustration */}
              <div className="relative">
                <div className="w-48 h-48 md:w-64 md:h-64 bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl mb-6 transition-all duration-700 group-hover:scale-110 group-hover:rotate-3 flex items-center justify-center shadow-xl mx-auto lg:mx-0">
                  <div className="text-white text-center p-6">
                    <svg className="w-20 h-20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-3xl font-bold">$1,850</div>
                    <div className="text-blue-100 text-sm">Sample Monthly Payment</div>
                  </div>
                </div>

                {/* Floating Elements */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-400/20 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-600/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
              </div>

              {/* Right Side - Content */}
              <div className="text-center lg:text-left">
                <h3 className="text-3xl md:text-4xl font-bold text-blue-900 mb-4">
                  Calculate Your Monthly Mortgage
                </h3>
                <p className="text-blue-700 mb-6 text-lg leading-relaxed">
                  Get instant estimates for your monthly payments, interest costs, and amortization schedule.
                  Perfect for planning your home purchase budget.
                </p>

                {/* Features List */}
                <div className="space-y-4 mb-8">
                  {[
                    { icon: '✅', text: 'Real-time calculations' },
                    { icon: '✅', text: 'Detailed breakdown' },
                    { icon: '✅', text: 'Amortization schedule' },
                    { icon: '✅', text: 'Compare loan options' }
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="text-green-500 text-xl">{feature.icon}</span>
                      <span className="text-blue-800 font-medium">{feature.text}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => setShowCalculator(true)}
                  className="group relative bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold px-10 py-4 rounded-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 active:scale-95 text-lg w-full lg:w-auto"
                >
                  <span className="flex items-center justify-center gap-3">
                    Start Calculator
                    <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                  <div className="absolute -inset-2 bg-blue-400/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </button>
              </div>
            </div>

            {/* Stats at Bottom */}
            <div className="mt-12 pt-8 border-t border-blue-200 grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { value: '30-Year', label: 'Fixed Rate', color: 'text-blue-600' },
                { value: '15-Year', label: 'Savings Term', color: 'text-blue-600' },
                { value: '5/1 ARM', label: 'Adjustable Rate', color: 'text-blue-600' },
                { value: 'FHA/VA', label: 'Loan Types', color: 'text-blue-600' }
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                  <div className="text-blue-700 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Tip */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-2xl p-6 flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-blue-700">
              <span className="font-semibold">Tip:</span> Use 20% down payment to avoid PMI and get better interest rates.
            </p>
          </div>
        </div>
          ) : (
            // Full Calculator
            <>
              <MortgageCalculator />
              <div className="text-center mt-12">
                <button
                  onClick={() => setShowCalculator(false)}
                  className="group inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium text-lg transition-colors duration-300"
                >
                  <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Overview
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

export default HomePage;