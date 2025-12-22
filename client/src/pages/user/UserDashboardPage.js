import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../utils/api';
import {
  FiHome,
  FiTrendingUp,
  FiMessageSquare,
  FiUser,
  FiPlus,
  FiEye,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiRefreshCw,
  FiPhone,
  FiMapPin
} from 'react-icons/fi';
import { getPropertyImage } from '../../utils/imageHelper';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import ContactAdminForm from '../../components/ContactAdminForm';
import { useSmoothScroll } from '../../hooks/useSmoothScroll';

gsap.registerPlugin(ScrollTrigger);

// UserPropertyCard component
function UserPropertyCard({ property, index }) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = getPropertyImage(property);
  const cardRef = useRef();

  useEffect(() => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current,
        { opacity: 0, x: -20 },
        {
          opacity: 1,
          x: 0,
          duration: 0.5,
          ease: 'power2.out',
          delay: index * 0.1
        }
      );
    }
  }, [index]);

  return (
    <div ref={cardRef} className="flex items-center gap-4 p-4 bg-white/40 backdrop-blur-md border border-blue-100/50 rounded-2xl hover:bg-white/60 hover:border-blue-200 hover:shadow-lg transition-all duration-300">
      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0 shadow-sm">
        {imageUrl && !imageError ? (
          <img
            src={imageUrl}
            alt={property.title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <svg width="32" height="32" fill="none" stroke="#60a5fa" strokeWidth="2">
            <rect x="3" y="3" width="26" height="26" rx="2" ry="2"/>
            <circle cx="16" cy="16" r="6"/>
          </svg>
        )}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold text-gray-800">{property.title}</h4>
        <p className="text-gray-600 text-sm">{property.location}</p>
        <div className="flex items-center gap-4 mt-2">
          <span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
            property.status === 'published' ? 'bg-emerald-100/80 text-emerald-700 border border-emerald-200/50' :
            property.status === 'pending' ? 'bg-amber-100/80 text-amber-700 border border-amber-200/50' :
            property.status === 'rejected' ? 'bg-red-100/80 text-red-700 border border-red-200/50' :
            'bg-gray-100/80 text-gray-700 border border-gray-200/50'
          }`}>
            {property.status?.charAt(0).toUpperCase() + property.status?.slice(1)}
          </span>
          {property.price && (
            <span className="text-blue-600 font-semibold">${property.price.toLocaleString()}</span>
          )}
        </div>
      </div>
      <Link
        to={`/property/${property._id}`}
        className="text-blue-600 hover:text-blue-700 transition-colors duration-300 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg"
        title="View Property"
      >
        <FiEye size={20} />
      </Link>
    </div>
  );
}

const UserDashboardPage = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalProperties: 0,
    totalLeads: 0,
    activeLeads: 0,
    pendingLeads: 0,
    assignedLeads: 0
  });
  const [recentLeads, setRecentLeads] = useState([]);
  const [myProperties, setMyProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const headerRef = useRef();
  const statsRef = useRef();
  const contentRef = useRef();

  useEffect(() => {
    fetchUserDashboardData();
    
    // Animate on mount
    if (headerRef.current) {
      gsap.fromTo(headerRef.current,
        { y: -50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out' }
      );
    }

    // Poll every 30 seconds for updates
    const intervalId = setInterval(() => {
      if (!loading && !refreshing) {
        fetchUserDashboardData(true);
      }
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!loading && statsRef.current) {
      const cards = statsRef.current.querySelectorAll('.stat-card');
      gsap.fromTo(cards,
        { y: 40, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'back.out(1.7)'
        }
      );
    }
  }, [loading]);

  const fetchUserDashboardData = async (silent = false) => {
    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      console.log('Fetching dashboard data...');

      const response = await api.get('users/dashboard');
      const dashboardData = response.data;

      console.log('Dashboard data structure:', dashboardData);

      if (dashboardData && dashboardData.success === true) {
        let myProps = dashboardData.myProperties || [];

        if ((!myProps || myProps.length === 0)) {
          try {
            const propsRes = await api.get('/users/properties');
            if (propsRes.data && propsRes.data.success === true) {
              myProps = propsRes.data.properties || [];
              console.log('Fallback fetched user properties:', myProps.length);
            }
          } catch (err) {
            console.warn('Fallback fetch for user properties failed:', err);
          }
        }

        const totalProperties = (
          dashboardData.stats && typeof dashboardData.stats.totalProperties === 'number'
        ) ? dashboardData.stats.totalProperties : (myProps ? myProps.length : 0);

        setStats({
          totalProperties,
          totalLeads: dashboardData.stats?.totalLeads || 0,
          activeLeads: dashboardData.stats?.activeLeads || 0,
          pendingLeads: dashboardData.stats?.pendingLeads || 0,
          assignedLeads: dashboardData.stats?.assignedLeads || 0
        });

        const leadsData = dashboardData.recentLeads || [];
        setRecentLeads(leadsData);
        setMyProperties(myProps);
        setError('');
        console.log('Dashboard loaded successfully:', {
          stats: dashboardData.stats,
          propertyCount: myProps.length,
          leadCount: leadsData.length
        });
      } else {
        const msg = dashboardData?.message || 'Failed to load dashboard data';
        console.error('Dashboard API error:', msg, dashboardData);
        setError(msg);
        setDefaultData();
      }
    } catch (error) {
      console.error('Error fetching user dashboard:', error);

      let errorMessage = 'Failed to load dashboard data';

      if (error.response) {
        errorMessage = error.response.data?.message || error.response.statusText || errorMessage;
      } else {
        errorMessage = error.message || errorMessage;
      }

      setError(errorMessage);
      setDefaultData();
    } finally {
      if (!silent) {
        setLoading(false);
      }
      setRefreshing(false);
    }
  };

  const setDefaultData = () => {
    setStats({
      totalProperties: 0,
      totalLeads: 0,
      activeLeads: 0,
      pendingLeads: 0,
      assignedLeads: 0
    });
    setRecentLeads([]);
    setMyProperties([]);
  };

  const handleRefresh = () => {
    fetchUserDashboardData();
  };

  const getPropertyStatusBadge = (status) => {
    const statusConfig = {
      pending: { 
        color: 'bg-amber-100/80 text-amber-700 border border-amber-200/50', 
        label: 'Pending Review',
        icon: <FiClock />
      },
      published: { 
        color: 'bg-emerald-100/80 text-emerald-700 border border-emerald-200/50', 
        label: 'Published',
        icon: <FiCheckCircle />
      },
      rejected: { 
        color: 'bg-red-100/80 text-red-700 border border-red-200/50', 
        label: 'Rejected',
        icon: <FiXCircle />
      },
      sold: { 
        color: 'bg-blue-100/80 text-blue-700 border border-blue-200/50', 
        label: 'Sold',
        icon: <FiCheckCircle />
      },
      rented: { 
        color: 'bg-purple-100/80 text-purple-700 border border-purple-200/50', 
        label: 'Rented',
        icon: <FiCheckCircle />
      }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`${config.color} px-3 py-1 rounded-full text-xs flex items-center gap-1 backdrop-blur-sm`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const getLeadStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-gradient-to-r from-amber-400 to-amber-500', icon: <FiClock /> },
      assigned: { color: 'bg-gradient-to-r from-blue-400 to-blue-500', icon: <FiCheckCircle /> },
      contacted: { color: 'bg-gradient-to-r from-purple-400 to-purple-500', icon: <FiMessageSquare /> },
      established: { color: 'bg-gradient-to-r from-emerald-400 to-emerald-500', icon: <FiCheckCircle /> },
      rejected: { color: 'bg-gradient-to-r from-red-400 to-red-500', icon: <FiXCircle /> },
      'non-viable': { color: 'bg-gradient-to-r from-gray-400 to-gray-500', icon: <FiXCircle /> }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    
    return (
      <span className={`${config.color} text-white px-3 py-1 rounded-full text-xs flex items-center gap-1 shadow-sm`}>
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-blue-600 font-medium">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Header */}
      <div ref={headerRef} className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white p-8 shadow-lg relative z-0">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {user?.name || 'User'}!</h1>
              <p className="text-blue-100 mt-2">Here's your dashboard overview</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleRefresh}
                className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-white/30 transition-all duration-300 flex items-center gap-2 border border-white/30"
                disabled={refreshing}
              >
                <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
                <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              <Link
                to="/add-property"
                className="bg-white text-blue-600 px-6 py-3 rounded-xl font-semibold hover:bg-blue-50 transition-all duration-300 hover:shadow-lg flex items-center gap-2"
              >
                <FiPlus /> Add Property
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div ref={statsRef} className="max-w-7xl mx-auto px-4 md:px-8 -mt-8 relative z-40">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {[
            {
              title: 'My Properties',
              value: stats.totalProperties,
              icon: <FiHome />,
              gradient: 'from-blue-500 to-blue-600',
              link: '/user/properties'
            },
            {
              title: 'Total Leads',
              value: stats.totalLeads,
              icon: <FiTrendingUp />,
              gradient: 'from-emerald-500 to-emerald-600',
              link: '/user/leads'
            },
            {
              title: 'Assigned Leads',
              value: stats.assignedLeads,
              icon: <FiUser />,
              gradient: 'from-cyan-500 to-cyan-600',
              link: '/user/leads'
            },
            {
              title: 'Active Leads',
              value: stats.activeLeads,
              icon: <FiMessageSquare />,
              gradient: 'from-teal-500 to-teal-600',
              link: '/user/leads?status=assigned'
            },
            {
              title: 'Pending Leads',
              value: stats.pendingLeads,
              icon: <FiClock />,
              gradient: 'from-amber-500 to-amber-600',
              link: '/user/leads?status=pending'
            }
          ].map((stat, index) => (
            <Link
              key={index}
              to={stat.link}
              className="stat-card bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl border border-blue-100/50 transition-all duration-300 hover:-translate-y-1 relative z-40"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} text-white shadow-md`}>
                  {stat.icon}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div ref={contentRef} className="max-w-7xl mx-auto px-4 md:px-8 py-8 relative z-40">
        {error && (
          <div className="mb-6">
            <div className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-r from-red-50/60 to-red-100/40 border border-red-200/40 shadow-md">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center shadow-sm">
                  <FiXCircle />
                </div>
              </div>

              <div className="flex-1">
                <p className="text-red-800 font-semibold">Unable to load dashboard</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setError(''); fetchUserDashboardData(); }}
                  className="px-3 py-1 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm hover:shadow-sm"
                >
                  Retry
                </button>
                <button
                  onClick={() => setError('')}
                  aria-label="Close"
                  className="text-gray-500 hover:text-gray-700 p-2 rounded-lg"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Leads */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">Recent Leads Assigned to You</h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleRefresh}
                  className="text-blue-500 hover:text-blue-600 transition-colors duration-300 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg"
                  title="Refresh leads"
                >
                  <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
                </button>
                <Link
                  to="/user/leads"
                  className="text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors duration-300"
                >
                  View all →
                </Link>
              </div>
            </div>
            <div className="space-y-4">
              {recentLeads.length > 0 ? (
                recentLeads.map((lead, index) => (
                  <div key={lead._id} className="p-4 bg-white border border-blue-100/50 rounded-2xl hover:bg-white/60 hover:border-blue-200 hover:shadow-md transition-all duration-300">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                          <span className="text-white font-bold">
                            {lead.firstName?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{lead.firstName} {lead.lastName}</h4>
                          <p className="text-gray-600 text-sm">{lead.email}</p>
                        </div>
                      </div>
                      <div>
                        {getLeadStatusBadge(lead.status)}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div className="flex items-center gap-2 text-gray-700">
                        <FiPhone className="text-blue-400" />
                        <span className="text-sm">{lead.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700">
                        <FiMapPin className="text-blue-400" />
                        <span className="text-sm">
                          {lead.city && lead.stateProvince ? `${lead.city}, ${lead.stateProvince}` : 'N/A'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-gray-700 text-sm">
                        <span className="font-semibold">Category:</span> {lead.category || 'N/A'}
                      </p>
                      <p className="text-gray-700 text-sm">
                        <span className="font-semibold">Requirements:</span> {lead.requirements || 'N/A'}
                      </p>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-gray-500 text-sm">
                          {new Date(lead.createdAt).toLocaleDateString()} at {new Date(lead.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </p>
                        <p className="text-gray-500 text-sm">Label: <span className="font-medium">{lead.label || 'None'}</span></p>
                      </div>
                      <Link
                        to={`/user/leads/${lead._id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors duration-300"
                      >
                        View Details →
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FiMessageSquare className="w-12 h-12 mx-auto mb-3 text-blue-200" />
                  <p>No leads assigned to you yet</p>
                  <p className="text-sm mt-1">Check back later for new leads</p>
                </div>
              )}
            </div>
          </div>

          {/* My Properties */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">My Properties</h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleRefresh}
                  className="text-blue-500 hover:text-blue-600 transition-colors duration-300 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg"
                  title="Refresh properties"
                >
                  <FiRefreshCw className={refreshing ? 'animate-spin' : ''} />
                </button>
                <Link
                  to="/user/properties"
                  className="text-blue-600 hover:text-blue-700 text-sm font-semibold transition-colors duration-300"
                >
                  View all →
                </Link>
              </div>
            </div>
            <div className="space-y-4">
              {myProperties.length > 0 ? (
                myProperties.map((property, index) => (
                  <UserPropertyCard key={property._id} property={property} index={index} />
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FiHome className="w-12 h-12 mx-auto mb-3 text-blue-200" />
                  <p>No properties listed yet</p>
                  <Link
                    to="/add-property"
                    className="inline-block mt-3 text-blue-600 hover:text-blue-700 font-semibold transition-colors duration-300"
                  >
                    Add your first property
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-2xl p-8 border border-blue-100/50 shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link
              to="/add-property"
              className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center border border-blue-100/50"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <FiPlus className="text-white text-xl" />
              </div>
              <h4 className="font-bold text-gray-800 mb-2">Add Property</h4>
              <p className="text-gray-600 text-sm">List your property for sale or rent</p>
            </Link>
            
            <Link
              to="/user/leads"
              className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center border border-blue-100/50"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <FiTrendingUp className="text-white text-xl" />
              </div>
              <h4 className="font-bold text-gray-800 mb-2">Manage Leads</h4>
              <p className="text-gray-600 text-sm">View and manage your assigned leads</p>
            </Link>
            
            <Link
              to="/user/profile"
              className="bg-white/80 backdrop-blur-sm p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-center border border-blue-100/50"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-md">
                <FiUser className="text-white text-xl" />
              </div>
              <h4 className="font-bold text-gray-800 mb-2">Edit Profile</h4>
              <p className="text-gray-600 text-sm">Update your account information</p>
            </Link>
          </div>
        </div>
        {/* Contact Admin Form */}
        <ContactAdminForm initialName={user?.name || ''} initialEmail={user?.email || ''} />
      </div>
    </div>
  );
};

export default UserDashboardPage;