// client/src/pages/ForRentPage.js
// Shows ONLY properties for RENT

import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import PropertyCard from '../components/PropertyCard';
import api from '../utils/api';

const ForRentPage = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    propertyType: 'all',
    minPrice: '',
    maxPrice: '',
    bedrooms: 'all',
    city: ''
  });

  useEffect(() => {
    fetchPropertiesForRent();
  }, []);

  // Read search params from Hero search
  const location = useLocation();
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get('search') || params.get('city') || '';
    if (search) {
      setFilters(prev => ({ ...prev, city: search }));
    }
  }, [location.search]);

  const fetchPropertiesForRent = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        status: 'published',
        listingType: 'rent',
        limit: 100
      };
      const urlParams = new URLSearchParams(window.location.search);
      const search = urlParams.get('search') || urlParams.get('city') || '';
      if (search) params.search = search;

      // ✅ CRITICAL: Only fetch properties with listingType = 'rent'
      const response = await api.get('/properties', { params });
      
      console.log('📦 For Rent API Response:', response.data);
      
      if (response.data.success) {
        const rentProperties = response.data.properties || [];
        
        // ✅ Double-check: Filter again on frontend to be absolutely sure
        const onlyRentProperties = rentProperties.filter(
          prop => prop.listingType === 'rent'
        );
        
        setProperties(onlyRentProperties);
        console.log(`✅ Loaded ${onlyRentProperties.length} properties FOR RENT`);
      } else {
        setError('Failed to load properties');
      }
    } catch (error) {
      console.error('❌ Error fetching properties for rent:', error);
      setError('Failed to load properties for rent');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const filteredProperties = properties.filter(property => {
    // Property Type Filter
    if (filters.propertyType !== 'all' && property.propertyType !== filters.propertyType) {
      return false;
    }

    // Min Price Filter (monthly rent)
    if (filters.minPrice && property.price < Number(filters.minPrice)) {
      return false;
    }

    // Max Price Filter (monthly rent)
    if (filters.maxPrice && property.price > Number(filters.maxPrice)) {
      return false;
    }

    // Bedrooms Filter
    if (filters.bedrooms !== 'all' && property.bedrooms !== Number(filters.bedrooms)) {
      return false;
    }

    // City Filter
    if (filters.city && !property.city?.toLowerCase().includes(filters.city.toLowerCase())) {
      return false;
    }

    return true;
  });

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      propertyType: 'all',
      minPrice: '',
      maxPrice: '',
      bedrooms: 'all',
      city: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Filters Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Filter Properties</h2>
            <button
              onClick={clearFilters}
              className="text-green-600 hover:text-green-700 font-medium text-sm"
            >
              Clear All
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Property Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
              <select
                value={filters.propertyType}
                onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="condo">Condo</option>
                <option value="townhouse">Townhouse</option>
                <option value="villa">Villa</option>
                <option value="studio">Studio</option>
              </select>
            </div>

            {/* Min Rent */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Min Rent/Month</label>
              <input
                type="number"
                placeholder="$0"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Max Rent */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Rent/Month</label>
              <input
                type="number"
                placeholder="Any"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Bedrooms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
              <select
                value={filters.bedrooms}
                onChange={(e) => handleFilterChange('bedrooms', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">Any</option>
                <option value="0">Studio</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
                <option value="5">5+</option>
              </select>
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                type="text"
                placeholder="Enter city"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Active Filters Count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing <span className="font-semibold text-green-600">{filteredProperties.length}</span> of <span className="font-semibold">{properties.length}</span> properties
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Properties Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-lg animate-pulse">
                <div className="h-64 bg-gray-200"></div>
                <div className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="flex gap-6 mb-6">
                    <div className="h-4 w-16 bg-gray-200 rounded"></div>
                    <div className="h-4 w-16 bg-gray-200 rounded"></div>
                    <div className="h-4 w-16 bg-gray-200 rounded"></div>
                  </div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.map((property) => (
              <PropertyCard key={property._id} property={property} showBadge={true} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4">🔑</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Properties Found</h3>
            <p className="text-gray-600 mb-6">
              {properties.length === 0 
                ? 'No properties for rent are currently available.'
                : 'Try adjusting your filters to see more results.'}
            </p>
            {Object.values(filters).some(val => val !== 'all' && val !== '') && (
              <button
                onClick={clearFilters}
                className="bg-green-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-600 inline-flex items-center gap-2"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ForRentPage;