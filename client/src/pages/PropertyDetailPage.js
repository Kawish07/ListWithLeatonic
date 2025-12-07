// client/src/pages/PropertyDetailPage.js
// Fixed version with proper image handling

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { getPropertyImages, getImageUrl } from '../utils/imageHelper'; // ✅ Import image helper
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
  FiSquare
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

        // Debug: Log image information
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-accent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading property details...</p>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏠</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'This property does not exist or has been removed.'}</p>
          <button
            onClick={() => navigate(-1)}
            className="bg-accent text-white px-6 py-3 rounded-xl font-semibold hover:bg-accent-dark inline-flex items-center gap-2"
          >
            <FiArrowLeft /> Go Back
          </button>
        </div>
      </div>
    );
  }

  // ✅ Get properly formatted image URLs
  const imageUrls = getPropertyImages(property);
  const currentImageUrl = imageUrls[currentImageIndex];

  console.log('🖼️ Image URLs:', {
    total: imageUrls.length,
    current: currentImageUrl,
    all: imageUrls
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-[#2c43f5] transition-colors"
          >
            <FiArrowLeft /> Back to Listings
          </button>
        </div>
      </div>

      {/* Image Gallery */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
          <div className="relative">
            {/* Main Image */}
            <div className="relative h-[500px] rounded-2xl overflow-hidden bg-gray-200">
              {currentImageUrl ? (
                <img
                  src={currentImageUrl}
                  alt={`${property.title} - Image ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error('❌ Failed to load image:', currentImageUrl);
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="500" height="500"%3E%3Crect fill="%23e5e7eb" width="500" height="500"/%3E%3Ctext fill="%239ca3af" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="24"%3EImage not available%3C/text%3E%3C/svg%3E';
                  }}
                  onLoad={() => {
                    console.log('✅ Image loaded:', currentImageUrl);
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
                  <FiHome className="w-24 h-24 text-gray-400 mb-4" />
                  <p className="text-gray-500 text-lg">No images available</p>
                </div>
              )}

              {/* Navigation Arrows */}
              {imageUrls.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all hover:scale-110"
                  >
                    <FiChevronLeft size={24} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition-all hover:scale-110"
                  >
                    <FiChevronRight size={24} />
                  </button>
                </>
              )}

              {/* Image Counter */}
              {imageUrls.length > 0 && (
                <div className="absolute bottom-4 right-4 bg-black/70 text-white px-4 py-2 rounded-full text-sm">
                  {currentImageIndex + 1} / {imageUrls.length}
                </div>
              )}

              {/* Status Badge */}
              <div className="absolute top-4 left-4">
                <span className={`px-4 py-2 rounded-full text-sm font-bold ${property.listingType === 'rent'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                  : 'bg-accent'
                  } text-white shadow-lg`}>
                  FOR {property.listingType === 'rent' ? 'RENT' : 'SALE'}
                </span>
              </div>
            </div>

            {/* Thumbnail Gallery */}
            {imageUrls.length > 1 && (
              <div className="mt-4 grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {imageUrls.map((url, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative h-20 rounded-lg overflow-hidden border-2 transition-all ${index === currentImageIndex
                      ? 'border-accent ring-2 ring-accent/30'
                      : 'border-gray-300 hover:border-gray-400'
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
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Property Details */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Title and Price */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">{property.title}</h1>
              <div className="flex items-center gap-2 text-gray-600 mb-6">
                <FiMapPin className="text-accent" />
                <span>{(property.address || property.location) + (property.city ? `, ${property.city}` : '')}</span>
              </div>
              <div className="text-4xl font-bold text-accent">
                ${property.price?.toLocaleString()}
                {property.listingType === 'rent' && (
                  <span className="text-lg font-normal text-gray-500 ml-2">/month</span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {property.description || 'No description available.'}
              </p>
            </div>

            {/* Amenities */}
            {/* Amenities / Features: prefer `features` object, fall back to `amenities` array */}
            {( (property.features && Object.keys(property.features).length > 0) || (property.amenities && property.amenities.length > 0) ) && (
              <div className="bg-white rounded-2xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Amenities & Features</h2>

                {/* Features object as badges */}
                {property.features && Object.keys(property.features).length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {property.features.hasParking && <span className="px-3 py-1 bg-gray-100 rounded-full flex items-center gap-2">🚗 Parking</span>}
                    {property.features.hasPool && <span className="px-3 py-1 bg-gray-100 rounded-full flex items-center gap-2">🏊 Pool</span>}
                    {property.features.hasGarden && <span className="px-3 py-1 bg-gray-100 rounded-full flex items-center gap-2">🌳 Garden</span>}
                    {property.features.hasAC && <span className="px-3 py-1 bg-gray-100 rounded-full flex items-center gap-2">❄️ AC</span>}
                    {property.features.hasHeating && <span className="px-3 py-1 bg-gray-100 rounded-full flex items-center gap-2">🔥 Heating</span>}
                    {property.features.hasLaundry && <span className="px-3 py-1 bg-gray-100 rounded-full flex items-center gap-2">👕 Laundry</span>}
                    {property.features.hasGym && <span className="px-3 py-1 bg-gray-100 rounded-full flex items-center gap-2">💪 Gym</span>}
                  </div>
                )}

                {/* Legacy amenities array */}
                {property.amenities && property.amenities.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {property.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center gap-2 text-gray-700">
                        <span className="text-green-500">✓</span>
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Inquiry</h3>
              <form onSubmit={handleQuickInquiry} className="space-y-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  value={inquiryForm.name}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  required
                />
                <input
                  type="email"
                  placeholder="Your Email"
                  value={inquiryForm.email}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                  required
                />
                <input
                  type="tel"
                  placeholder="Your Phone"
                  value={inquiryForm.phone}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                />
                <div>
                  <label className="block text-gray-700 mb-2">I'm interested to:</label>
                  <div className="flex gap-2">
                    {['buy', 'rent', 'viewing', 'info'].map((purpose) => (
                      <button
                        key={purpose}
                        type="button"
                        onClick={() => setInquiryForm({ ...inquiryForm, purpose })}
                        className={`px-3 py-1 rounded-full text-sm ${inquiryForm.purpose === purpose
                          ? 'bg-accent text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                      >
                        {purpose === 'buy' ? 'Buy' :
                          purpose === 'rent' ? 'Rent' :
                            purpose === 'viewing' ? 'View' : 'Info'}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  placeholder="Your message..."
                  value={inquiryForm.message}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#2c43f5] focus:border-transparent resize-none"
                  required
                />
                <button
                  type="submit"
                  disabled={sendingInquiry}
                  className="w-full bg-[#2c43f5] text-white py-3 rounded-xl font-semibold hover:bg-[#0519ad] transition-colors disabled:opacity-50"
                >
                  {sendingInquiry ? 'Sending...' : 'Send Inquiry'}
                </button>
              </form>
            </div>

            {/* Share Buttons */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Share Property</h3>
              <div className="flex gap-3">
                <button className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors">
                  <FiShare2 className="inline mr-2" />
                  Share
                </button>
                <button className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition-colors">
                  <FiHeart className="inline mr-2" />
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