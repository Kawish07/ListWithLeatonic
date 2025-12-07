// client/src/pages/User/UserPropertiesPage.js
// Fixed version with proper image handling

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { getPropertyImage } from '../../utils/imageHelper'; // ✅ Import image helper
import useConfirmStore from '../../store/confirmStore';
import useToastStore from '../../store/toastStore';
import {
  FiHome,
  FiEdit,
  FiTrash2,
  FiEye,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiPlus,
  FiFilter,
  FiRefreshCw
} from 'react-icons/fi';

// ✅ Property Card Component with Image Helper
const PropertyCardWithImage = ({ property, onDelete }) => {
  const [imageError, setImageError] = useState(false);
  const imageUrl = getPropertyImage(property); // ✅ Use helper function

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        color: 'bg-amber-100/80 text-amber-700 border border-amber-200/50',
        icon: <FiClock />,
        label: 'Pending Review'
      },
      published: {
        color: 'bg-emerald-100/80 text-emerald-700 border border-emerald-200/50',
        icon: <FiCheckCircle />,
        label: 'Published'
      },
      rejected: {
        color: 'bg-red-100/80 text-red-700 border border-red-200/50',
        icon: <FiXCircle />,
        label: 'Rejected'
      },
      sold: {
        color: 'bg-blue-100/80 text-blue-700 border border-blue-200/50',
        icon: <FiCheckCircle />,
        label: 'Sold'
      },
      rented: {
        color: 'bg-purple-100/80 text-purple-700 border border-purple-200/50',
        icon: <FiCheckCircle />,
        label: 'Rented'
      }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`${config.color} px-3 py-1 rounded-full text-sm flex items-center gap-1 backdrop-blur-sm`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  // Debug logging
  useEffect(() => {
    console.log('PropertyCard Debug:', {
      propertyId: property._id,
      title: property.title,
      rawImages: property.images,
      constructedUrl: imageUrl,
      imageError
    });
  }, [property, imageUrl, imageError]);

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-blue-100/50 hover:-translate-y-1">
      {/* Property Image */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={property.title}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              console.error('❌ Image failed to load:', imageUrl);
              console.error('Property:', property._id, property.title);
              setImageError(true);
            }}
            onLoad={() => {
              console.log('✅ Image loaded successfully:', imageUrl);
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-cyan-100 flex flex-col items-center justify-center">
            <FiHome className="w-12 h-12 text-blue-300 mb-2" />
            <p className="text-blue-400 text-xs">No Image</p>
          </div>
        )}
        <div className="absolute top-4 left-4">
          {getStatusBadge(property.status)}
        </div>
      </div>

      {/* Property Details */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-1">
          {property.title}
        </h3>
        <p className="text-gray-600 text-sm mb-3 flex items-center gap-1 line-clamp-1">
          <span>📍</span> {property.address || property.location}, {property.city || 'Unknown'}
        </p>

        <div className="flex items-center gap-4 text-gray-700 mb-4 text-sm">
          <div className="flex items-center gap-1">
            <span>🛏️</span>
            <span>{property.bedrooms || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>🚿</span>
            <span>{property.bathrooms || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>📐</span>
            <span>{(property.squareFeet || property.area || 0).toLocaleString()}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              ${(property.price || 0).toLocaleString()}
              {property.listingType === 'rent' && (
                <span className="text-sm font-normal text-gray-500 ml-1">/month</span>
              )}
            </div>
            <p className="text-gray-600 text-sm capitalize">
              {property.propertyType} • {property.listingType || 'sale'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={`/property/${property._id}`}
              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
              title="View"
            >
              <FiEye size={18} />
            </Link>
            <Link
              to={`/edit-property/${property._id}`}
              className="p-2 text-cyan-600 hover:text-cyan-700 hover:bg-cyan-50 rounded-lg transition-colors"
              title="Edit"
            >
              <FiEdit size={18} />
            </Link>
            <button
              onClick={() => onDelete(property._id)}
              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <FiTrash2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ✅ Main Component
const UserPropertiesPage = () => {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchUserProperties();
  }, []);

  useEffect(() => {
    filterProperties();
  }, [properties, statusFilter]);

  const fetchUserProperties = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await api.get('/users/properties');
      console.log('📦 Properties API response:', response.data);

      if (response.data && response.data.success === true) {
        const props = response.data.properties || [];
        setProperties(props);
        
        // Debug: Log first property's images
        if (props.length > 0) {
          console.log('📸 First property images:', {
            id: props[0]._id,
            title: props[0].title,
            images: props[0].images
          });
        }
        
        console.log(`✅ Loaded ${props.length} properties`);
      } else {
        const errorMsg = response.data?.message || 'Failed to load properties';
        setError(errorMsg);
        console.error('❌ Properties API error:', errorMsg);
      }
    } catch (error) {
      console.error('❌ Error fetching properties:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to load properties';
      setError(errorMsg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterProperties = () => {
    let filtered = properties;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(prop => prop.status === statusFilter);
    }

    setFilteredProperties(filtered);
    console.log(`🔍 Filtered: ${filtered.length} properties (filter: ${statusFilter})`);
  };

  const deleteProperty = async (propertyId) => {
    useConfirmStore.getState().show('Are you sure you want to delete this property?', async () => {
      try {
        const response = await api.delete(`/properties/${propertyId}`);

        if (response.data?.success) {
          setProperties(prev => prev.filter(p => p._id !== propertyId));
          useToastStore.getState().add({ type: 'success', message: 'Property deleted successfully!' });
        } else {
          useToastStore.getState().add({ type: 'error', message: response.data?.message || 'Failed to delete property' });
        }
      } catch (error) {
        console.error('Error deleting property:', error);
        useToastStore.getState().add({ type: 'error', message: error.response?.data?.message || 'Failed to delete property' });
      }
    });
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUserProperties();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-blue-600 font-medium">Loading properties...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">My Properties</h1>
            <p className="text-gray-600 mt-2">
              Manage all your listed properties
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleRefresh}
              className="bg-white/60 backdrop-blur-md border border-blue-100/50 text-gray-700 px-4 py-3 rounded-xl font-semibold hover:bg-white/80 flex items-center gap-2 transition-all shadow-sm"
              disabled={refreshing}
            >
              <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <Link
              to="/add-property"
              className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 flex items-center gap-2 transition-all shadow-md"
            >
              <FiPlus /> Add Property
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100/80 backdrop-blur-sm text-red-700 rounded-2xl flex items-center gap-2 border border-red-200/50">
            <FiXCircle />
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-lg p-6 mb-8 border border-blue-100/50">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <span className="text-gray-700 font-semibold">Filter by status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-white/50 border border-blue-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer backdrop-blur-sm"
              >
                <option value="all">All Properties</option>
                <option value="pending">Pending Review</option>
                <option value="published">Published</option>
                <option value="rejected">Rejected</option>
                <option value="sold">Sold</option>
                <option value="rented">Rented</option>
              </select>
            </div>
            <div className="text-gray-700">
              Showing <span className="font-bold text-blue-600">{filteredProperties.length}</span> of <span className="font-bold text-blue-600">{properties.length}</span> properties
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        {filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <PropertyCardWithImage
                key={property._id}
                property={property}
                onDelete={deleteProperty}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-lg p-12 text-center border border-blue-100/50">
            <FiHome className="w-16 h-16 text-blue-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No properties found</h3>
            <p className="text-gray-600 mb-6">
              {statusFilter !== 'all'
                ? `You have no properties with status "${statusFilter}"`
                : 'You haven\'t listed any properties yet'}
            </p>
            {statusFilter !== 'all' ? (
              <button
                onClick={() => setStatusFilter('all')}
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline"
              >
                View all properties
              </button>
            ) : (
              <Link
                to="/add-property"
                className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 inline-flex items-center gap-2 transition-all shadow-md"
              >
                <FiPlus /> Add Your First Property
              </Link>
            )}
          </div>
        )}

        {/* Stats Summary */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { label: 'Total', value: properties.length, gradient: 'from-blue-500 to-blue-600' },
            { label: 'Pending', value: properties.filter(p => p.status === 'pending').length, gradient: 'from-amber-500 to-amber-600' },
            { label: 'Published', value: properties.filter(p => p.status === 'published').length, gradient: 'from-emerald-500 to-emerald-600' },
            { label: 'Rejected', value: properties.filter(p => p.status === 'rejected').length, gradient: 'from-red-500 to-red-600' },
            { label: 'Sold/Rented', value: properties.filter(p => p.status === 'sold' || p.status === 'rented').length, gradient: 'from-purple-500 to-purple-600' },
          ].map((stat, index) => (
            <div key={index} className="bg-white/60 backdrop-blur-md rounded-2xl shadow-lg p-4 hover:shadow-xl transition-all border border-blue-100/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-md`}>
                  <span className="text-white font-bold text-sm">{stat.value}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserPropertiesPage;