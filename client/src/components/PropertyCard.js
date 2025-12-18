import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { getPropertyImage } from '../utils/imageHelper';
import { formatTimeAgo } from '../utils/timeAgo';
import { 
  MapPin, Bed, Bath, Square, Calendar, ArrowRight, Home, Building, 
  User, Phone, Mail, Globe, FileText, Star, CheckCircle, XCircle, 
  AlertCircle, Info, Eye, EyeOff, Lock, Unlock, Shield, Key
} from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const PropertyCard = ({ property, showBadge = true, index = 0, darkMode = false }) => {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showHiddenContent, setShowHiddenContent] = useState(false);
  const cardRef = useRef();
  const overlayRef = useRef();
  const contentRef = useRef();
  const badgeRef = useRef();
  const hiddenContentRef = useRef();

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

  // Hover animation
  useEffect(() => {
    if (isHovered) {
      // Scale up card slightly
      gsap.to(cardRef.current, {
        scale: 1.02,
        duration: 0.3,
        ease: 'power2.out'
      });

      // Fade in overlay
      gsap.to(overlayRef.current, {
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out'
      });

      // Slide in main content
      gsap.fromTo(contentRef.current,
        {
          y: 20,
          opacity: 0
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          delay: 0.1,
          ease: 'power2.out'
        }
      );

      // Scale up badge
      gsap.to(badgeRef.current, {
        scale: 1.1,
        duration: 0.3,
        ease: 'back.out(1.7)'
      });

    } else {
      // Reset animations
      gsap.to(cardRef.current, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out'
      });

      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.2,
        ease: 'power2.out'
      });

      gsap.to(contentRef.current, {
        opacity: 0,
        duration: 0.2,
        ease: 'power2.out'
      });

      gsap.to(badgeRef.current, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out'
      });

      // Hide hidden content when not hovered
      if (showHiddenContent) {
        gsap.to(hiddenContentRef.current, {
          opacity: 0,
          y: 20,
          duration: 0.2,
          ease: 'power2.out',
          onComplete: () => setShowHiddenContent(false)
        });
      }
    }
  }, [isHovered, showHiddenContent]);

  // Toggle hidden content
  const toggleHiddenContent = (e) => {
    e.stopPropagation();
    if (!showHiddenContent) {
      setShowHiddenContent(true);
      gsap.fromTo(hiddenContentRef.current,
        {
          opacity: 0,
          y: 20
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          ease: 'power2.out'
        }
      );
    } else {
      gsap.to(hiddenContentRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.2,
        ease: 'power2.out',
        onComplete: () => setShowHiddenContent(false)
      });
    }
  };

  // Determine badge text and color
  const getBadgeInfo = () => {
    if (property.listingType === 'rent') {
      return { 
        text: 'FOR RENT', 
        bgColor: darkMode ? 'bg-emerald-900/80' : 'bg-emerald-500',
        textColor: 'text-white',
        icon: 'rent'
      };
    }
    return { 
      text: 'FOR SALE', 
      bgColor: darkMode ? 'bg-blue-900/80' : 'bg-blue-600',
      textColor: 'text-white',
      icon: 'sale'
    };
  };

  const badge = getBadgeInfo();

  // Tactile braille-inspired design colors
  const cardBg = darkMode ? 'bg-gray-900' : 'bg-white';
  const textPrimary = darkMode ? 'text-white' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-300' : 'text-gray-600';
  const textAccent = darkMode ? 'text-blue-400' : 'text-blue-600';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';
  const featureBg = darkMode ? 'bg-gray-800' : 'bg-gray-50';
  const shadowColor = darkMode ? 'shadow-gray-900/50' : 'shadow-gray-200';

  // Property type icon
  const getPropertyIcon = () => {
    switch(property.propertyType?.toLowerCase()) {
      case 'apartment':
        return <Building className="w-4 h-4" />;
      case 'house':
      case 'villa':
        return <Home className="w-4 h-4" />;
      default:
        return <Home className="w-4 h-4" />;
    }
  };

  // Get hidden content data
  const getHiddenContent = () => {
    return [
      {
        icon: <User className="w-4 h-4" />,
        label: "Owner",
        value: property.owner?.name || "Not specified",
        status: property.owner ? "available" : "not-available"
      },
      {
        icon: <Phone className="w-4 h-4" />,
        label: "Contact",
        value: property.contactPhone || property.owner?.phone || "N/A",
        status: property.contactPhone ? "available" : "not-available"
      },
      {
        icon: <Mail className="w-4 h-4" />,
        label: "Email",
        value: property.contactEmail || property.owner?.email || "N/A",
        status: property.contactEmail ? "available" : "not-available"
      },
      {
        icon: <Shield className="w-4 h-4" />,
        label: "Status",
        value: property.status === 'published' ? 'Verified' : 'Pending',
        status: property.status === 'published' ? "verified" : "pending"
      },
      {
        icon: <FileText className="w-4 h-4" />,
        label: "Last Updated",
        value: formatTimeAgo(property.updatedAt || property.createdAt),
        status: "info"
      }
    ];
  };

  // Get engagement status
  const getEngagementStatus = () => {
    const content = [
      "• Bill does not notice something in distress or engagement on one of the other.",
      "• Bill does not ask questions, say, maybe you often want to do Professionals or Free-Trainers.",
      "• Bill does not send the engagement to certain participants in the past five years and can see how he/she is only able to find passwords.",
      "• If you remember my involvement, email me to BBM-Hotel. Please see Recommend@a-bm.com"
    ];
    
    return content;
  };

  const hiddenContentItems = getHiddenContent();
  const engagementContent = getEngagementStatus();

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden rounded-3xl transition-transform duration-300 ${cardBg} ${borderColor} border-2 ${shadowColor} shadow-md hover:shadow-lg group`}
      style={{
        transformStyle: 'preserve-3d',
        perspective: '1000px'
      }}
    >
      {/* Tactile-inspired textured overlay */}
      <div className="absolute inset-0 opacity-5 z-0">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, ${darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)'} 1px, transparent 1px)`,
          backgroundSize: '8px 8px'
        }}></div>
      </div>

      {/* Hover Overlay for hidden content */}
      <div
        ref={overlayRef}
        className={`absolute inset-0 z-10 pointer-events-none transition-opacity duration-300 ${
          showHiddenContent 
            ? 'bg-gradient-to-t from-black/95 via-black/80 to-black/60' 
            : 'bg-gradient-to-t from-black/80 via-black/50 to-transparent'
        } opacity-0`}
      ></div>

      {/* Property Image */}
      <div className="relative h-70 overflow-hidden">
        {imageUrl && !imageError ? (
          <Link to={`/property/${property._id}`} onClick={(e) => e.stopPropagation()} className="block w-full h-full">
            <img
              src={imageUrl}
              alt={property.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
              style={{ willChange: 'transform, opacity' }}
              onError={() => setImageError(true)}
            />
          </Link>
        ) : (
          <Link to={`/property/${property._id}`} onClick={(e) => e.stopPropagation()} className={`block w-full h-full ${darkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <div className="w-full h-full flex flex-col items-center justify-center">
              <span className="text-6xl mb-2">🏠</span>
              <p className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                No Image Available
              </p>
            </div>
          </Link>
        )}

        {/* Badge - Top Left */}
        {showBadge && (
          <div 
            ref={badgeRef}
            className="absolute top-4 left-4 z-20"
          >
            <span className={`${badge.bgColor} ${badge.textColor} px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg backdrop-blur-sm border ${darkMode ? 'border-white/20' : 'border-white/30'}`}>
              {badge.text}
            </span>
          </div>
        )}

        {/* Property Type Badge - Top Right */}
        {property.propertyType && (
          <div className="absolute top-4 right-4 z-20">
            <div className={`flex items-center gap-2 backdrop-blur-md px-3 py-1.5 rounded-full ${darkMode ? 'bg-gray-900/80 border-gray-700' : 'bg-white/80 border-gray-200'} border`}>
              {getPropertyIcon()}
              <span className={`text-xs font-bold capitalize ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {property.propertyType}
              </span>
            </div>
          </div>
        )}

        {/* HIDDEN CONTACT INFO BUTTON - Middle Right */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30">
          <button
            onClick={toggleHiddenContent}
            className={`flex items-center justify-center w-10 h-10 rounded-full border transition-transform duration-300 hover:scale-110 ${
              showHiddenContent
                ? darkMode 
                  ? 'bg-blue-900/80 border-blue-600 text-blue-300' 
                  : 'bg-blue-600 border-blue-500 text-white'
                : darkMode
                  ? 'bg-gray-900/80 border-gray-700 text-gray-300 hover:bg-gray-800'
                  : 'bg-white/80 border-gray-300 text-gray-700 hover:bg-white'
            } shadow-lg`}
            aria-label={showHiddenContent ? "Hide hidden content" : "Show hidden content"}
          >
            {showHiddenContent ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {/* Time Badge - Bottom Left */}
        {property.createdAt && (
          <div className="absolute bottom-4 left-4 z-20">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 border border-white/20">
              <Calendar className="w-3 h-3 text-white/80" />
              <span className="text-xs font-semibold text-white">
                {formatTimeAgo(property.createdAt)}
              </span>
            </div>
          </div>
        )}

        {/* Status Badge - Bottom Right */}
        {property.status === 'published' && (
          <div className="absolute bottom-4 right-4 z-20">
            <div className="flex items-center gap-1.5 backdrop-blur-md px-3 py-1.5 rounded-full bg-emerald-600/80 border border-emerald-400/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
              <span className="text-xs font-bold text-white">Published</span>
            </div>
          </div>
        )}

        {/* HIDDEN CONTENT - Shows on hover after button click */}
        {showHiddenContent && (
          <div
            ref={hiddenContentRef}
            className="absolute inset-0 z-25 p-6 pointer-events-none"
          >
            <div className="h-full flex flex-col justify-between">
              {/* Hidden Content Header */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-lg font-bold text-white">Property Details</h3>
                </div>
                
                {/* Hidden Info Items */}
                <div className="space-y-3 mb-6">
                  {hiddenContentItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-white/5 p-3 rounded-lg">
                      <div className={`p-2 rounded-full ${
                        item.status === 'available' ? 'bg-emerald-900/50 text-emerald-300' :
                        item.status === 'verified' ? 'bg-blue-900/50 text-blue-300' :
                        item.status === 'pending' ? 'bg-yellow-900/50 text-yellow-300' :
                        'bg-gray-900/50 text-gray-300'
                      }`}>
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-300">{item.label}</div>
                        <div className="text-sm font-semibold text-white">{item.value}</div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        item.status === 'available' ? 'bg-emerald-400' :
                        item.status === 'verified' ? 'bg-blue-400' :
                        item.status === 'pending' ? 'bg-yellow-400' :
                        'bg-gray-400'
                      }`} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Engagement Notice Section */}
              <div className="bg-black/40 border border-white/10 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-yellow-400" />
                  <h4 className="text-sm font-bold text-yellow-300 uppercase tracking-wide">Notice</h4>
                </div>
                <div className="space-y-2 text-xs text-gray-200 max-h-32 overflow-y-auto pr-2">
                  {engagementContent.map((line, idx) => (
                    <p key={idx} className="leading-relaxed">{line}</p>
                  ))}
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-center mt-4">
                <button
                  onClick={toggleHiddenContent}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors duration-200 pointer-events-auto"
                >
                  <XCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">Close Details</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hover Content - Revealed on hover (Original content) */}
        <div
          ref={contentRef}
          className={`absolute inset-0 z-20 p-6 flex flex-col justify-end opacity-0 ${isHovered ? 'pointer-events-auto' : 'pointer-events-none'}`}
        >
          <div className="transform transition-all duration-500">
            {/* Title */}
            <h3 className="text-xl font-bold text-white mb-3 line-clamp-2 drop-shadow-lg">
              {property.title}
            </h3>
            
            {/* Address */}
            <div className="flex items-center gap-2 text-white/90 mb-4">
              <MapPin className="w-4 h-4" />
              <span className="text-sm font-medium">
                {property.address || property.location || 'Location not specified'}
                {property.city && `, ${property.city}`}
              </span>
            </div>

            {/* Quick Stats */}
              <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                <Bed className="w-3 h-3 text-white" />
                <span className="text-xs font-bold text-white">
                  {property.bedrooms || 0} Beds
                </span>
              </div>
                  <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                <Bath className="w-3 h-3 text-white" />
                <span className="text-xs font-bold text-white">
                  {property.bathrooms || 0} Baths
                </span>
              </div>
                  <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full">
                <Square className="w-3 h-3 text-white" />
                <span className="text-xs font-bold text-white">
                  {(property.squareFeet || property.area || 0).toLocaleString()} sqft
                </span>
              </div>
            </div>

            {/* CTA Button */}
            <Link
              to={`/property/${property._id}`}
              className="inline-flex items-center justify-center gap-2 bg-white text-white-900 px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              View Details
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Always-visible property details removed — details now shown in image hover overlay only */}

      {/* Tactile Braille-inspired Border Animation */}
      <div className="absolute inset-0 rounded-3xl border-2 border-transparent group-hover:border-white/20 pointer-events-none transition-all duration-500"></div>
      
      {/* Subtle Glow Effect on Hover */}
      <div className={`absolute -inset-2 rounded-3xl blur-lg opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none ${
        property.listingType === 'rent'
          ? darkMode ? 'bg-emerald-500/20' : 'bg-emerald-400/20'
          : darkMode ? 'bg-blue-500/20' : 'bg-blue-400/20'
      }`}></div>
    </div>
  );
};

export default PropertyCard;