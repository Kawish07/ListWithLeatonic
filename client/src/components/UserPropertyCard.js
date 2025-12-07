// client/src/components/UserPropertyCard.js
// Fixed version for User Dashboard

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiEye, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { getPropertyImage } from '../utils/imageHelper';

const UserPropertyCard = ({ property }) => {
  const [imageError, setImageError] = useState(false);
  const imageUrl = getPropertyImage(property);

  const getPropertyStatusBadge = (status) => {
    const statusConfig = {
      pending: { 
        color: 'bg-yellow-100 text-yellow-800', 
        label: 'Pending Review',
        icon: <FiClock />
      },
      published: { 
        color: 'bg-green-100 text-green-800', 
        label: 'Published',
        icon: <FiCheckCircle />
      },
      rejected: { 
        color: 'bg-red-100 text-red-800', 
        label: 'Rejected',
        icon: <FiXCircle />
      },
      sold: { 
        color: 'bg-blue-100 text-blue-800', 
        label: 'Sold',
        icon: <FiCheckCircle />
      },
      rented: { 
        color: 'bg-purple-100 text-purple-800', 
        label: 'Rented',
        icon: <FiCheckCircle />
      }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`${config.color} px-3 py-1 rounded-full text-xs flex items-center gap-1 w-fit`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  return (
    <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
      {/* Property Thumbnail */}
      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-200 flex items-center justify-center flex-shrink-0">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={property.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('❌ UserPropertyCard image failed:', imageUrl);
              setImageError(true);
            }}
            onLoad={() => {
              console.log('✅ UserPropertyCard image loaded:', imageUrl);
            }}
          />
        ) : (
          <svg width="32" height="32" fill="none" stroke="#9CA3AF" strokeWidth="2">
            <rect x="3" y="3" width="26" height="26" rx="2" ry="2"/>
            <circle cx="16" cy="16" r="6"/>
          </svg>
        )}
      </div>

      {/* Property Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 truncate">{property.title}</h4>
        <p className="text-gray-600 text-sm truncate">
          {property.location || property.address || 'Location not specified'}
        </p>
        <div className="flex items-center gap-3 mt-2">
          {getPropertyStatusBadge(property.status)}
          <span className="text-sm font-semibold text-accent">
            ${(property.price || 0).toLocaleString()}
            {property.listingType === 'rent' && <span className="text-xs text-gray-500">/mo</span>}
          </span>
        </div>
      </div>

      {/* View Button */}
      <Link
        to={`/property/${property._id}`}
        className="text-accent hover:text-accent-dark p-2 hover:bg-blue-50 rounded-lg transition-colors"
        title="View Property"
      >
        <FiEye size={20} />
      </Link>
    </div>
  );
};

export default UserPropertyCard;