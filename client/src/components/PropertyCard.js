import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getPropertyImage } from '../utils/imageHelper';
import { formatTimeAgo } from '../utils/timeAgo';

gsap.registerPlugin(ScrollTrigger);

const PropertyCard = ({ property, showBadge = true, index = 0 }) => {
  const [imageError, setImageError] = useState(false);
  const cardRef = useRef();

  // Get the properly formatted image URL
  const imageUrl = getPropertyImage(property);

  // GSAP Animation on scroll
  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current,
        {
          opacity: 0,
          y: 60,
          scale: 0.95
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: cardRef.current,
            start: 'top 90%',
            toggleActions: 'play none none reverse'
          },
          delay: index * 0.1
        }
      );
    }
  }, [index]);

  // Determine badge text and color
  const getBadgeInfo = () => {
    if (property.listingType === 'rent') {
      return { text: 'FOR RENT', colorClass: 'bg-gradient-to-r from-emerald-500 to-emerald-600' };
    }
    return { text: 'FOR SALE', colorClass: 'bg-gradient-to-r from-blue-600 to-blue-700' };
  };

  const badge = getBadgeInfo();

  // Debug logging
  useEffect(() => {
    console.log('PropertyCard Debug:', {
      propertyId: property._id,
      title: property.title,
      rawImages: property.images,
      constructedUrl: imageUrl
    });
  }, [property, imageUrl]);

  return (
    <Link
      ref={cardRef}
      to={`/property/${property._id}`}
      className="backdrop-blur-xl bg-white/80 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 group cursor-pointer border border-white/40"
    >
      {/* Property Image */}
      <div className="relative h-64 overflow-hidden bg-gradient-to-br from-blue-100 to-blue-200">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
              console.error('❌ Image failed to load:', imageUrl);
              console.error('Error event:', e);
              setImageError(true);
            }}
            onLoad={() => {
              console.log('✅ Image loaded successfully:', imageUrl);
            }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex flex-col items-center justify-center">
            <span className="text-6xl mb-2">🏠</span>
            <p className="text-blue-600 text-sm font-semibold">No Image Available</p>
            {imageError && (
              <p className="text-red-500 text-xs mt-2 px-4 text-center">Failed to load image</p>
            )}
          </div>
        )}

        {/* Badges */}
        {showBadge && (
          <div className="absolute top-4 left-4">
            <span className={`${badge.colorClass} text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg backdrop-blur-sm`}>
              {badge.text}
            </span>
          </div>
        )}

        {property.propertyType && (
          <div className="absolute top-4 right-4">
            <span className="backdrop-blur-xl bg-white/30 border border-white/40 text-blue-900 px-3 py-1.5 rounded-full text-xs font-bold capitalize shadow-lg">
              {property.propertyType}
            </span>
          </div>
        )}

        {/* Time ago badge (e.g., 5m ago) */}
        {property.createdAt && (
          <div className="absolute bottom-4 left-4">
            <span className="backdrop-blur-xl bg-black/40 border border-white/20 text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
              {formatTimeAgo(property.createdAt)}
            </span>
          </div>
        )}

        {property.status === 'published' && (
          <div className="absolute bottom-4 right-4">
            <span className="backdrop-blur-xl bg-emerald-500/90 border border-white/30 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
              ✓ Published
            </span>
          </div>
        )}
      </div>

      {/* Property Details */}
      <div className="p-6 backdrop-blur-sm bg-gradient-to-b from-white/50 to-white/80">
        <h3 className="text-xl font-bold text-blue-900 mb-2 group-hover:text-blue-700 transition-colors duration-300 line-clamp-2">
          {property.title}
        </h3>
        <p className="text-blue-700 text-sm mb-4 flex items-center gap-1 line-clamp-1 font-medium">
          <span>📍</span> {property.address || property.location || 'Location not specified'}{property.city ? `, ${property.city}` : ''}
        </p>

        {/* Features */}
        <div className="flex items-center gap-4 text-blue-800 mb-6 text-sm">
          <div className="flex items-center gap-1.5 backdrop-blur-sm bg-blue-50/50 px-3 py-1.5 rounded-full">
            <span className="text-lg">🛏️</span>
            <span className="font-bold">{property.bedrooms || 0}</span>
          </div>
          <div className="flex items-center gap-1.5 backdrop-blur-sm bg-blue-50/50 px-3 py-1.5 rounded-full">
            <span className="text-lg">🚿</span>
            <span className="font-bold">{property.bathrooms || 0}</span>
          </div>
          <div className="flex items-center gap-1.5 backdrop-blur-sm bg-blue-50/50 px-3 py-1.5 rounded-full">
            <span className="text-lg">📐</span>
            <span className="font-bold">{(property.squareFeet || property.area || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Price and CTA */}
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-blue-900">
              ${(property.price || 0).toLocaleString()}
              {property.listingType === 'rent' && (
                <span className="text-sm font-normal text-blue-600 ml-1">/month</span>
              )}
            </div>
            {property.propertyType && (
              <span className={`px-3 py-1.5 ${property.listingType === 'rent'
                  ? 'backdrop-blur-sm bg-emerald-50/70 text-emerald-700 border-emerald-200'
                  : 'backdrop-blur-sm bg-blue-50/70 text-blue-700 border-blue-200'
                } rounded-full text-xs font-bold border mt-2 inline-block capitalize shadow-sm`}>
                {property.propertyType}
              </span>
            )}
          </div>
          <button className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 text-white flex items-center justify-center transition-all duration-300 hover:scale-110 hover:rotate-12 hover:shadow-xl text-xl group-hover:from-blue-700 group-hover:to-blue-800">
            →
          </button>
        </div>
      </div>
    </Link>
  );
};

export default PropertyCard;