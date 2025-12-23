// client/src/pages/PropertyDetailPage.js
// Enhanced professional version with improved styling

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { getPropertyImages, getImageUrl } from '../utils/imageHelper';
import useAuthStore from '../store/authStore';
import {
  FiMapPin,
  FiHome,
  FiDroplet,
  FiMaximize2,
  FiDollarSign,
  FiCalendar,
  FiUser,
  FiMail,
  FiPhone,
  FiHeart,
  FiShare2,
  FiArrowLeft,
  FiChevronLeft,
  FiChevronRight,
  FiSquare,
  FiCheck,
  FiClock,
  FiMessageCircle
} from 'react-icons/fi';

const PropertyDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    email:'',
    phone:'',
    purpose: 'info',
    message: ''
  });
  const [sendingInquiry, setSendingInquiry] = useState(false);

  useEffect(() => {
    fetchPropertyDetails();
  }, [id]);

  const fetchPropertyDetails = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get(`/properties/${id}`);
      console.log('🏠 Property Detail Response:', response.data);

      if (response.data.success) {
        const propertyData = response.data.property;
        setProperty(propertyData);

        console.log('📸 Property Images:', {
          rawImages: propertyData.images,
          count: propertyData.images?.length || 0,
          firstImage: propertyData.images?.[0]
        });
      } else {
        setError('Property not found');
      }
    } catch (error) {
      console.error('❌ Error fetching property:', error);
      setError('Failed to load property details');
    } finally {
      setLoading(false);
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await api.post(`/leads`, {
        propertyId: property._id,
        propertyTitle: property.title,
        ...contactForm
      });

      if (response.data.success) {
        alert('Your inquiry has been sent successfully!');
        setShowContactForm(false);
        setContactForm({ name: '', email: '', phone: '', message: '' });
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      alert(error.response?.data?.message || 'Failed to send inquiry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickInquiry = async (e) => {
    e.preventDefault();
    setSendingInquiry(true);

    try {
      const response = await api.post('/client-inquiries', {
        ...inquiryForm,
        propertyId: property._id,
        propertyTitle: property.title,
        propertyPrice: property.price,
        propertyType: property.propertyType
      });

      if (response.data.success) {
        alert('Your inquiry has been sent successfully! We will contact you soon.');
        setInquiryForm({
          name: user?.name || '',
          email: user?.email || '',
          phone: user?.phone || '',
          purpose: 'info',
          message: ''
        });
      }
    } catch (error) {
      console.error('Error sending inquiry:', error);
      alert(error.response?.data?.message || 'Failed to send inquiry');
    } finally {
      setSendingInquiry(false);
    }
  };

  const nextImage = () => {
    if (property && property.images && property.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % property.images.length);
    }
  };

  const prevImage = () => {
    if (property && property.images && property.images.length > 0) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? property.images.length - 1 : prev - 1
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200 mx-auto mb-6"></div>
            <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-[#2c43f5] absolute top-0 left-1/2 transform -translate-x-1/2"></div>
          </div>
          <p className="text-gray-700 font-medium text-lg">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-12">
            <div className="text-7xl mb-6">🏠</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Property Not Found</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">{error || 'This property does not exist or has been removed.'}</p>
            <button
              onClick={() => navigate(-1)}
              className="bg-gradient-to-r from-[#2c43f5] to-[#1e3ad4] text-white px-8 py-4 rounded-xl font-semibold hover:shadow-xl transition-all duration-300 inline-flex items-center gap-3 transform hover:scale-105"
            >
              <FiArrowLeft className="text-xl" /> Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const imageUrls = getPropertyImages(property);
  const currentImageUrl = imageUrls[currentImageIndex];

  console.log('🖼️ Image URLs:', {
    total: imageUrls.length,
    current: currentImageUrl,
    all: imageUrls
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header with Gradient */}
      <div className="bg-gradient-to-r from-white via-blue-50 to-indigo-50 border-b border-gray-200 shadow-sm sticky top-0 z-40 backdrop-blur-lg bg-opacity-90">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-5">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-700 hover:text-[#2c43f5] transition-all duration-300 font-medium group"
          >
            <FiArrowLeft className="group-hover:-translate-x-1 transition-transform duration-300" />
            <span>Back to Listings</span>
          </button>
        </div>
      </div>

      {/* Premium Image Gallery */}
      <div className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <div className="relative">
            {/* Main Image with Enhanced Styling */}
            <div className="relative h-[550px] rounded-3xl overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300 shadow-2xl">
              {currentImageUrl ? (
                <img
                  src={currentImageUrl}
                  alt={`${property.title} - Image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover transition-all duration-500"
                  onError={(e) => {
                    console.error('❌ Failed to load image:', currentImageUrl);
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="500"%3E%3Crect fill="%23e5e7eb" width="500" height="500"/%3E%3Ctext fill="%239ca3af" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="24"%3EImage not available%3C/text%3E%3C/svg%3E';
                  }}
                  onLoad={() => {
                    console.log('✅ Image loaded:', currentImageUrl);
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400">
                  <FiHome className="w-32 h-32 text-gray-400 mb-6" />
                  <p className="text-gray-500 text-xl font-medium">No images available</p>
                </div>
              )}

              {/* Premium Navigation Arrows */}
              {imageUrls.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-6 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-gray-800 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 border border-gray-200"
                  >
                    <FiChevronLeft size={28} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-6 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-gray-800 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 border border-gray-200"
                  >
                    <FiChevronRight size={28} />
                  </button>
                </>
              )}

              {/* Enhanced Image Counter */}
              {imageUrls.length > 0 && (
                <div className="absolute bottom-6 right-6 bg-black/80 backdrop-blur-md text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-xl">
                  {currentImageIndex + 1} / {imageUrls.length}
                </div>
              )}

              {/* Premium Status Badge */}
              <div className="absolute top-6 left-6">
                <span className={`px-6 py-3 rounded-full text-sm font-bold uppercase tracking-wider ${property.listingType === 'rent'
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600'
                  : 'bg-gradient-to-r from-[#2c43f5] to-[#1e3ad4]'
                  } text-white shadow-2xl border-2 border-white/30`}>
                  FOR {property.listingType === 'rent' ? 'RENT' : 'SALE'}
                </span>
              </div>
            </div>

            {/* Enhanced Thumbnail Gallery */}
            {imageUrls.length > 1 && (
              <div className="mt-6 grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {imageUrls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative h-24 rounded-xl overflow-hidden border-3 transition-all duration-300 transform hover:scale-105 ${index === currentImageIndex
                      ? 'border-[#2c43f5] ring-4 ring-[#2c43f5]/30 shadow-xl'
                      : 'border-gray-300 hover:border-[#2c43f5]/50 shadow-md hover:shadow-lg'
                      }`}
                  >
                    <img
                      src={url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23e5e7eb" width="100" height="100"/%3E%3C/svg%3E';
                      }}
                    />
                    {index === currentImageIndex && (
                      <div className="absolute inset-0 bg-[#2c43f5]/20 flex items-center justify-center">
                        <FiCheck className="text-white text-2xl drop-shadow-lg" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Property Details Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Premium Title and Price Card */}
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-xl p-10 border border-gray-100">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">{property.title}</h1>
              <div className="flex items-center gap-3 text-gray-700 mb-8 text-lg">
                <div className="bg-[#2c43f5]/10 p-2.5 rounded-full">
                  <FiMapPin className="text-[#2c43f5] text-xl" />
                </div>
                <span className="font-medium">{(property.address || property.location) + (property.city ? `, ${property.city}` : '')}</span>
              </div>
              <div className="bg-gradient-to-r from-[#2c43f5] to-[#1e3ad4] rounded-2xl p-6 shadow-lg">
                <div className="text-white">
                  <p className="text-sm font-semibold uppercase tracking-wider mb-2 opacity-90">Price</p>
                  <div className="text-5xl font-bold">
                    ${property.price?.toLocaleString()}
                    {property.listingType === 'rent' && (
                      <span className="text-2xl font-normal opacity-90 ml-3">/month</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Description Card */}
            <div className="bg-white rounded-3xl shadow-xl p-10 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-[#2c43f5]/10 p-3 rounded-xl">
                  <FiMessageCircle className="text-[#2c43f5] text-2xl" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900">Description</h2>
              </div>
              <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">
                {property.description || 'No description available.'}
              </p>
            </div>

            {/* Premium Amenities Card */}
            {( (property.features && Object.keys(property.features).length > 0) || (property.amenities && property.amenities.length > 0) ) && (
              <div className="bg-white rounded-3xl shadow-xl p-10 border border-gray-100">
                <div className="flex items-center gap-3 mb-8">
                  <div className="bg-[#2c43f5]/10 p-3 rounded-xl">
                    <FiHome className="text-[#2c43f5] text-2xl" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">Amenities & Features</h2>
                </div>

                {property.features && Object.keys(property.features).length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                    {property.features.hasParking && (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 px-5 py-4 rounded-xl border border-blue-200 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <span className="text-3xl">🚗</span>
                        <span className="font-semibold text-gray-800">Parking</span>
                      </div>
                    )}
                    {property.features.hasPool && (
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 px-5 py-4 rounded-xl border border-cyan-200 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <span className="text-3xl">🏊</span>
                        <span className="font-semibold text-gray-800">Pool</span>
                      </div>
                    )}
                    {property.features.hasGarden && (
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 px-5 py-4 rounded-xl border border-green-200 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <span className="text-3xl">🌳</span>
                        <span className="font-semibold text-gray-800">Garden</span>
                      </div>
                    )}
                    {property.features.hasAC && (
                      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 px-5 py-4 rounded-xl border border-cyan-200 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <span className="text-3xl">❄️</span>
                        <span className="font-semibold text-gray-800">AC</span>
                      </div>
                    )}
                    {property.features.hasHeating && (
                      <div className="bg-gradient-to-br from-orange-50 to-red-50 px-5 py-4 rounded-xl border border-orange-200 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <span className="text-3xl">🔥</span>
                        <span className="font-semibold text-gray-800">Heating</span>
                      </div>
                    )}
                    {property.features.hasLaundry && (
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 px-5 py-4 rounded-xl border border-purple-200 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <span className="text-3xl">👕</span>
                        <span className="font-semibold text-gray-800">Laundry</span>
                      </div>
                    )}
                    {property.features.hasGym && (
                      <div className="bg-gradient-to-br from-red-50 to-orange-50 px-5 py-4 rounded-xl border border-red-200 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <span className="text-3xl">💪</span>
                        <span className="font-semibold text-gray-800">Gym</span>
                      </div>
                    )}
                  </div>
                )}

                {property.amenities && property.amenities.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {property.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center gap-3 text-gray-700 bg-gray-50 px-4 py-3 rounded-xl border border-gray-200">
                        <div className="bg-green-500 text-white rounded-full p-1">
                          <FiCheck className="text-sm" />
                        </div>
                        <span className="font-medium">{amenity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Enhanced Sidebar */}
          <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {/* Premium Quick Inquiry Card */}
            <div className="bg-gradient-to-br from-white to-blue-50 rounded-3xl shadow-2xl p-8 border border-gray-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-[#2c43f5]/10 p-3 rounded-xl">
                  <FiMail className="text-[#2c43f5] text-2xl" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Quick Inquiry</h3>
              </div>
              <form onSubmit={handleQuickInquiry} className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={inquiryForm.name}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                    className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2c43f5] focus:border-[#2c43f5] transition-all duration-300 text-gray-800 font-medium"
                    required
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder="Your Email"
                    value={inquiryForm.email}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                    className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2c43f5] focus:border-[#2c43f5] transition-all duration-300 text-gray-800 font-medium"
                    required
                  />
                </div>
                <div>
                  <input
                    type="tel"
                    placeholder="Your Phone"
                    value={inquiryForm.phone}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                    className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2c43f5] focus:border-[#2c43f5] transition-all duration-300 text-gray-800 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-gray-800 mb-3 font-semibold text-sm uppercase tracking-wide">I'm interested to:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['buy', 'rent', 'viewing', 'info'].map((purpose) => (
                      <button
                        key={purpose}
                        type="button"
                        onClick={() => setInquiryForm({ ...inquiryForm, purpose })}
                        className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${inquiryForm.purpose === purpose
                          ? 'bg-gradient-to-r from-[#2c43f5] to-[#1e3ad4] text-white shadow-lg transform scale-105'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                          }`}
                      >
                        {purpose === 'buy' ? 'Buy' :
                          purpose === 'rent' ? 'Rent' :
                            purpose === 'viewing' ? 'View' : 'Info'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <textarea
                    placeholder="Your message..."
                    value={inquiryForm.message}
                    onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                    rows="4"
                    className="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2c43f5] focus:border-[#2c43f5] transition-all duration-300 resize-none text-gray-800 font-medium"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={sendingInquiry}
                  className="w-full bg-gradient-to-r from-[#2c43f5] to-[#1e3ad4] text-white py-4 rounded-xl font-bold text-lg hover:shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                >
                  {sendingInquiry ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Sending...
                    </span>
                  ) : (
                    'Send Inquiry'
                  )}
                </button>
              </form>
            </div>

            {/* Enhanced Share & Save Card */}
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-5">Share Property</h3>
              <div className="grid grid-cols-2 gap-3">
                <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3.5 px-4 rounded-xl hover:shadow-xl transition-all duration-300 font-semibold flex items-center justify-center gap-2 transform hover:scale-105">
                  <FiShare2 className="text-lg" />
                  Share
                </button>
                <button className="bg-gradient-to-r from-red-500 to-pink-600 text-white py-3.5 px-4 rounded-xl hover:shadow-xl transition-all duration-300 font-semibold flex items-center justify-center gap-2 transform hover:scale-105">
                  <FiHeart className="text-lg" />
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailPage;