// client/src/components/PropertyForm.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiHome,
  FiMapPin,
  FiDollarSign,
  FiMaximize2,
  FiCalendar,
  FiLayers,
  FiCheck,
  FiUpload,
  FiX,
  FiArrowLeft
} from 'react-icons/fi';

const PropertyForm = ({ onSubmit, initialData = null, isEditing = false, onBack }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    propertyType: 'house',
    listingType: 'sale',
    price: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    bedrooms: '',
    bathrooms: '',
    squareFeet: '',
    yearBuilt: '',
    images: [],
    features: {
      hasParking: false,
      hasGarden: false,
      hasPool: false,
      hasSecurity: false,
      hasAC: false,
      hasHeating: false,
      hasLaundry: false,
      hasGym: false
    }
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        propertyType: initialData.propertyType || 'house',
        listingType: initialData.listingType || 'sale',
        price: initialData.price ? initialData.price.toString() : '',
        address: initialData.address || '',
        city: initialData.city || '',
        state: initialData.state || '',
        zipCode: initialData.zipCode || '',
        bedrooms: initialData.bedrooms ? initialData.bedrooms.toString() : '',
        bathrooms: initialData.bathrooms ? initialData.bathrooms.toString() : '',
        squareFeet: initialData.squareFeet ? initialData.squareFeet.toString() : '',
        yearBuilt: initialData.yearBuilt ? initialData.yearBuilt.toString() : '',
        images: initialData.images || [],
        features: {
          hasParking: initialData.features?.hasParking || false,
          hasGarden: initialData.features?.hasGarden || false,
          hasPool: initialData.features?.hasPool || false,
          hasSecurity: initialData.features?.hasSecurity || false,
          hasAC: initialData.features?.hasAC || false,
          hasHeating: initialData.features?.hasHeating || false,
          hasLaundry: initialData.features?.hasLaundry || false,
          hasGym: initialData.features?.hasGym || false
        }
      });
    }
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumberInput = (e) => {
    const { name, value } = e.target;
    
    // Remove all non-numeric characters except decimal point
    let cleanValue = value.replace(/[^0-9.]/g, '');
    
    // Remove extra decimal points
    const decimalPoints = (cleanValue.match(/\./g) || []).length;
    if (decimalPoints > 1) {
      const parts = cleanValue.split('.');
      cleanValue = parts[0] + '.' + parts.slice(1).join('');
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: cleanValue
    }));
  };

  const handleFeatureToggle = (feature) => {
    setFormData(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: !prev.features[feature]
      }
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file types and sizes
    const validFiles = files.filter(file => {
      const isValidType = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      
      if (!isValidType) {
        setErrors(prev => ({
          ...prev,
          images: 'Only JPG, PNG, GIF, and WebP images are allowed'
        }));
        return false;
      }
      
      if (!isValidSize) {
        setErrors(prev => ({
          ...prev,
          images: 'Image size must be less than 5MB'
        }));
        return false;
      }
      
      return true;
    });
    
    if (validFiles.length > 0) {
      setImageFiles(prev => [...prev, ...validFiles]);
      setErrors(prev => ({ ...prev, images: '' }));
    }
  };

  const removeImage = (index, isUploaded = false) => {
    if (isUploaded) {
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
      }));
    } else {
      setImageFiles(prev => prev.filter((_, i) => i !== index));
    }
  };

  const formatNumber = (value) => {
    if (!value) return '';
    
    // Format with commas
    const parts = value.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
    
    if (formData.bedrooms && parseInt(formData.bedrooms) < 0) newErrors.bedrooms = 'Invalid number of bedrooms';
    if (formData.bathrooms && parseFloat(formData.bathrooms) < 0) newErrors.bathrooms = 'Invalid number of bathrooms';
    if (formData.squareFeet && parseInt(formData.squareFeet) <= 0) newErrors.squareFeet = 'Invalid square footage';
    if (formData.yearBuilt) {
      const year = parseInt(formData.yearBuilt);
      if (year < 1800 || year > new Date().getFullYear() + 1) {
        newErrors.yearBuilt = 'Invalid year';
      }
    }
    
    // Validate total images (existing + new) don't exceed 10
    const totalImages = formData.images.length + imageFiles.length;
    if (totalImages > 10) {
      newErrors.images = 'Maximum 10 images allowed';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Create FormData object for file upload
      const formDataObj = new FormData();
      
      // Append text fields
      formDataObj.append('title', formData.title);
      formDataObj.append('description', formData.description);
      formDataObj.append('propertyType', formData.propertyType);
      formDataObj.append('listingType', formData.listingType);
      
      // Handle price - remove commas and convert to number
      const priceValue = formData.price ? parseFloat(formData.price.replace(/,/g, '')) : 0;
      formDataObj.append('price', priceValue);
      
      formDataObj.append('address', formData.address);
      formDataObj.append('city', formData.city);
      formDataObj.append('state', formData.state);
      formDataObj.append('zipCode', formData.zipCode);
      
      // Handle other number fields
      if (formData.bedrooms) {
        formDataObj.append('bedrooms', parseInt(formData.bedrooms));
      }
      
      if (formData.bathrooms) {
        formDataObj.append('bathrooms', parseFloat(formData.bathrooms));
      }
      
      if (formData.squareFeet) {
        const squareFeetValue = formData.squareFeet ? parseInt(formData.squareFeet.replace(/,/g, '')) : 0;
        formDataObj.append('squareFeet', squareFeetValue);
      }
      
      if (formData.yearBuilt) {
        formDataObj.append('yearBuilt', parseInt(formData.yearBuilt));
      }
      
      // Append features as JSON string
      formDataObj.append('features', JSON.stringify(formData.features));
      
      // Append existing images
      formData.images.forEach(image => {
        if (typeof image === 'string') {
          formDataObj.append('existingImages', image);
        }
      });
      
      // Append new image files
      imageFiles.forEach((file, index) => {
        formDataObj.append('images', file);
        // Simulate upload progress
        setUploadProgress(prev => ({ ...prev, [index]: 50 }));
      });
      
      // Call the onSubmit prop with the form data
      await onSubmit(formDataObj);
      
      // Reset form on success if not editing
      if (!isEditing) {
        setFormData({
          title: '',
          description: '',
          propertyType: 'house',
          listingType: 'sale',
          price: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          bedrooms: '',
          bathrooms: '',
          squareFeet: '',
          yearBuilt: '',
          images: [],
          features: {
            hasParking: false,
            hasGarden: false,
            hasPool: false,
            hasSecurity: false,
            hasAC: false,
            hasHeating: false,
            hasLaundry: false,
            hasGym: false
          }
        });
        setImageFiles([]);
      }
      
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
      setUploadProgress({});
    }
  };

  const propertyTypes = [
    { value: 'house', label: 'House' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'condo', label: 'Condo' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'villa', label: 'Villa' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'land', label: 'Land' }
  ];

  const featuresList = [
    { key: 'hasParking', label: 'Parking', icon: '🚗' },
    { key: 'hasGarden', label: 'Garden', icon: '🌳' },
    { key: 'hasPool', label: 'Pool', icon: '🏊' },
    { key: 'hasSecurity', label: 'Security', icon: '🔒' },
    { key: 'hasAC', label: 'Air Conditioning', icon: '❄️' },
    { key: 'hasHeating', label: 'Heating', icon: '🔥' },
    { key: 'hasLaundry', label: 'Laundry', icon: '👕' },
    { key: 'hasGym', label: 'Gym', icon: '💪' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4 md:p-6">
      {/* Header with Back Button */}
      <div className="max-w-6xl mx-auto mb-8">
        <Link
          to="/user/properties"
          onClick={(e) => {
            if (onBack) onBack(e);
          }}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6 transition-colors group"
        >
          <FiArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-semibold">Back to Properties</span>
        </Link>
        
        <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 rounded-2xl shadow-2xl p-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {isEditing ? 'Edit Property' : 'Add New Property'}
          </h1>
          <p className="text-blue-100">
            {isEditing 
              ? 'Update your property details below' 
              : 'Fill in the details to list your property'
            }
          </p>
        </div>
      </div>

      {/* Form Container */}
      <div className="max-w-6xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Card */}
          <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-xl border border-blue-100/50 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-8 py-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <FiHome className="w-6 h-6" />
                </div>
                Basic Information
              </h2>
              <p className="text-blue-50 mt-1">Essential details about your property</p>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Property Title */}
                <div className="md:col-span-2">
                  <label className="block text-gray-800 font-semibold mb-3">
                    Property Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={`w-full px-5 py-4 bg-white/50 border ${errors.title ? 'border-red-400' : 'border-blue-200/50'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all backdrop-blur-sm`}
                    placeholder="e.g., Beautiful 3-Bedroom House in Downtown"
                    required
                  />
                  {errors.title && (
                    <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                      <FiX className="w-4 h-4" /> {errors.title}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-gray-800 font-semibold mb-3">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="5"
                    className={`w-full px-5 py-4 bg-white/50 border ${errors.description ? 'border-red-400' : 'border-blue-200/50'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all backdrop-blur-sm`}
                    placeholder="Describe your property in detail..."
                    required
                  />
                  {errors.description && (
                    <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                      <FiX className="w-4 h-4" /> {errors.description}
                    </p>
                  )}
                </div>

                {/* Property Type & Listing Type */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-800 font-semibold mb-3">
                      Property Type <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="propertyType"
                        value={formData.propertyType}
                        onChange={handleInputChange}
                        className="w-full px-5 py-4 bg-white/50 border border-blue-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 appearance-none backdrop-blur-sm transition-all"
                      >
                        {propertyTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-800 font-semibold mb-3">
                      Listing Type <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, listingType: 'sale' }))}
                        className={`py-4 rounded-xl border-2 font-semibold transition-all ${
                          formData.listingType === 'sale'
                            ? 'border-blue-500 bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                            : 'border-blue-200/50 bg-white/50 text-gray-700 hover:border-blue-300 backdrop-blur-sm'
                        }`}
                      >
                        For Sale
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, listingType: 'rent' }))}
                        className={`py-4 rounded-xl border-2 font-semibold transition-all ${
                          formData.listingType === 'rent'
                            ? 'border-blue-500 bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                            : 'border-blue-200/50 bg-white/50 text-gray-700 hover:border-blue-300 backdrop-blur-sm'
                        }`}
                      >
                        For Rent
                      </button>
                    </div>
                  </div>
                </div>

                {/* Price & Square Feet */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-800 font-semibold mb-3">
                      Price <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FiDollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400" />
                      <input
                        type="text"
                        name="price"
                        value={formData.price}
                        onChange={handleNumberInput}
                        className={`w-full pl-12 pr-5 py-4 bg-white/50 border ${errors.price ? 'border-red-400' : 'border-blue-200/50'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all backdrop-blur-sm`}
                        placeholder="0.00"
                        required
                      />
                    </div>
                    <div className="mt-3 p-3 bg-blue-100/50 backdrop-blur-sm rounded-xl border border-blue-200/50">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">Display Price:</span>{' '}
                        {formData.price ? (
                          <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-bold">
                            ${formatNumber(formData.price)}
                            {formData.listingType === 'rent' ? '/month' : ''}
                          </span>
                        ) : (
                          <span className="text-gray-500">--</span>
                        )}
                      </p>
                    </div>
                    {errors.price && (
                      <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                        <FiX className="w-4 h-4" /> {errors.price}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-800 font-semibold mb-3">
                      Square Feet
                    </label>
                    <div className="relative">
                      <FiMaximize2 className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400" />
                      <input
                        type="text"
                        name="squareFeet"
                        value={formData.squareFeet}
                        onChange={handleNumberInput}
                        className={`w-full pl-12 pr-5 py-4 bg-white/50 border ${errors.squareFeet ? 'border-red-400' : 'border-blue-200/50'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all backdrop-blur-sm`}
                        placeholder="0"
                      />
                    </div>
                    {errors.squareFeet && (
                      <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                        <FiX className="w-4 h-4" /> {errors.squareFeet}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Location Details Card */}
          <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-xl border border-blue-100/50 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-8 py-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <FiMapPin className="w-6 h-6" />
                </div>
                Location Details
              </h2>
              <p className="text-blue-50 mt-1">Where is your property located?</p>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Address */}
                <div className="md:col-span-2">
                  <label className="block text-gray-800 font-semibold mb-3">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`w-full px-5 py-4 bg-white/50 border ${errors.address ? 'border-red-400' : 'border-blue-200/50'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all backdrop-blur-sm`}
                    placeholder="123 Main Street"
                    required
                  />
                  {errors.address && (
                    <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                      <FiX className="w-4 h-4" /> {errors.address}
                    </p>
                  )}
                </div>

                {/* City */}
                <div>
                  <label className="block text-gray-800 font-semibold mb-3">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`w-full px-5 py-4 bg-white/50 border ${errors.city ? 'border-red-400' : 'border-blue-200/50'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all backdrop-blur-sm`}
                    placeholder="New York"
                    required
                  />
                  {errors.city && (
                    <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                      <FiX className="w-4 h-4" /> {errors.city}
                    </p>
                  )}
                </div>

                {/* State */}
                <div>
                  <label className="block text-gray-800 font-semibold mb-3">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className={`w-full px-5 py-4 bg-white/50 border ${errors.state ? 'border-red-400' : 'border-blue-200/50'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all backdrop-blur-sm`}
                    placeholder="NY"
                    required
                  />
                  {errors.state && (
                    <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                      <FiX className="w-4 h-4" /> {errors.state}
                    </p>
                  )}
                </div>

                {/* ZIP Code */}
                <div>
                  <label className="block text-gray-800 font-semibold mb-3">
                    ZIP Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className={`w-full px-5 py-4 bg-white/50 border ${errors.zipCode ? 'border-red-400' : 'border-blue-200/50'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all backdrop-blur-sm`}
                    placeholder="10001"
                    required
                  />
                  {errors.zipCode && (
                    <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                      <FiX className="w-4 h-4" /> {errors.zipCode}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Property Specifications Card */}
          <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-xl border border-blue-100/50 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-8 py-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <FiLayers className="w-6 h-6" />
                </div>
                Property Specifications
              </h2>
              <p className="text-blue-50 mt-1">Detailed specifications of your property</p>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {/* Bedrooms */}
                <div>
                  <label className="block text-gray-800 font-semibold mb-3">
                    Bedrooms
                  </label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400">🛏️</div>
                    <input
                      type="text"
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleNumberInput}
                      className={`w-full pl-14 pr-5 py-4 bg-white/50 border ${errors.bedrooms ? 'border-red-400' : 'border-blue-200/50'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all backdrop-blur-sm`}
                      placeholder="0"
                    />
                  </div>
                  {errors.bedrooms && (
                    <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                      <FiX className="w-4 h-4" /> {errors.bedrooms}
                    </p>
                  )}</div>

            {/* Bathrooms */}
            <div>
              <label className="block text-gray-800 font-semibold mb-3">
                Bathrooms
              </label>
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400">🚿</div>
                <input
                  type="text"
                  name="bathrooms"
                  value={formData.bathrooms}
                  onChange={handleNumberInput}
                  className={`w-full pl-14 pr-5 py-4 bg-white/50 border ${errors.bathrooms ? 'border-red-400' : 'border-blue-200/50'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all backdrop-blur-sm`}
                  placeholder="0"
                />
              </div>
              {errors.bathrooms && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                  <FiX className="w-4 h-4" /> {errors.bathrooms}
                </p>
              )}
            </div>

            {/* Year Built */}
            <div>
              <label className="block text-gray-800 font-semibold mb-3">
                Year Built
              </label>
              <div className="relative">
                <FiCalendar className="absolute left-5 top-1/2 -translate-y-1/2 text-blue-400" />
                <input
                  type="text"
                  name="yearBuilt"
                  value={formData.yearBuilt}
                  onChange={handleNumberInput}
                  className={`w-full pl-14 pr-5 py-4 bg-white/50 border ${errors.yearBuilt ? 'border-red-400' : 'border-blue-200/50'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all backdrop-blur-sm`}
                  placeholder="2000"
                  maxLength="4"
                />
              </div>
              {errors.yearBuilt && (
                <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                  <FiX className="w-4 h-4" /> {errors.yearBuilt}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Features Card */}
      <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-xl border border-blue-100/50 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-8 py-6">
          <h2 className="text-2xl font-bold text-white">
            Features & Amenities
          </h2>
          <p className="text-blue-50 mt-1">Select all features that apply to your property</p>
        </div>
        
        <div className="p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featuresList.map(feature => (
              <button
                key={feature.key}
                type="button"
                onClick={() => handleFeatureToggle(feature.key)}
                className={`p-5 rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition-all duration-300 ${
                  formData.features[feature.key]
                    ? 'border-blue-500 bg-gradient-to-br from-blue-100 to-cyan-100 shadow-md transform scale-105'
                    : 'border-blue-200/50 bg-white/40 hover:border-blue-300 hover:bg-white/60 backdrop-blur-sm'
                }`}
              >
                <span className="text-3xl">{feature.icon}</span>
                <span className="font-semibold text-gray-800">{feature.label}</span>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                  formData.features[feature.key]
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                    : 'bg-gray-200'
                }`}>
                  {formData.features[feature.key] && <FiCheck className="text-sm" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Images Upload Card */}
      <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-xl border border-blue-100/50 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-8 py-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <FiUpload className="w-6 h-6" />
            </div>
            Property Images
          </h2>
          <p className="text-blue-50 mt-1">
            Upload high-quality images of your property ({formData.images.length + imageFiles.length}/10)
          </p>
        </div>
        
        <div className="p-8">
          {/* Image Upload Area */}
          <div className="border-3 border-dashed border-blue-300/50 rounded-2xl p-10 text-center mb-8 transition-all hover:border-blue-400 hover:bg-blue-50/50 bg-white/40 backdrop-blur-sm">
            <FiUpload className="w-16 h-16 text-blue-400 mx-auto mb-6" />
            <p className="text-gray-700 text-lg font-semibold mb-3">
              Drag & drop images here or click to browse
            </p>
            <p className="text-gray-500 mb-6">
              Upload up to 10 images (JPG, PNG, GIF, WebP). Max 5MB each.
            </p>
            <input
              type="file"
              id="image-upload"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <label
              htmlFor="image-upload"
              className="inline-block bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-4 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/30 cursor-pointer transition-all transform hover:-translate-y-0.5"
            >
              Select Images
            </label>
          </div>

          {errors.images && (
            <div className="mb-6 p-4 bg-red-100/80 backdrop-blur-sm border border-red-200/50 rounded-xl">
              <p className="text-red-600 flex items-center gap-2">
                <FiX className="w-5 h-5" /> {errors.images}
              </p>
            </div>
          )}

          {/* Preview Existing Images */}
          {formData.images.length > 0 && (
            <div className="mb-8">
              <h3 className="font-semibold text-gray-800 text-lg mb-6 pb-3 border-b border-blue-200/50">
                Existing Images ({formData.images.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {formData.images.map((image, index) => (
                  <div key={`existing-${index}`} className="relative group">
                    <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50">
                      <img
                        src={image}
                        alt={`Property ${index + 1}`}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index, true)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Preview New Images */}
          {imageFiles.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-800 text-lg mb-6 pb-3 border-b border-blue-200/50">
                New Images ({imageFiles.length} selected)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {imageFiles.map((file, index) => (
                  <div key={`new-${index}`} className="relative group">
                    <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50 relative">
                      {uploadProgress[index] && uploadProgress[index] < 100 ? (
                        <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4">
                          <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-3"></div>
                          <div className="text-white text-sm font-medium mb-2">Uploading...</div>
                          <div className="w-full max-w-[100px] h-2 bg-gray-600 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 transition-all duration-300"
                              style={{ width: `${uploadProgress[index]}%` }}
                            ></div>
                          </div>
                          <div className="text-white text-xs mt-2">{uploadProgress[index]}%</div>
                        </div>
                      ) : (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      )}
                    </div>
                    <div className="mt-2 px-1">
                      <p className="text-sm text-gray-600 truncate" title={file.name}>
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index, false)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 hover:scale-110 transition-all"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="sticky bottom-6 bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-6 border border-blue-100/50">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-semibold">Note:</span> Fields marked with <span className="text-red-500">*</span> are required
          </div>
          
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onBack}
              className="px-8 py-3.5 border-2 border-blue-200/50 bg-white/50 text-gray-700 rounded-xl font-semibold hover:bg-white hover:border-blue-300 transition-all backdrop-blur-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-10 py-3.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-semibold hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-3"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{isEditing ? 'Updating Property...' : 'Adding Property...'}</span>
                </>
              ) : (
                <>
                  <FiCheck className="w-5 h-5" />
                  <span>{isEditing ? 'Update Property' : 'Add Property'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  </div>
</div>);
};
export default PropertyForm;