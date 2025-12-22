// client/src/pages/user/MyLeadsPage.js
import React, { useState, useEffect } from 'react';
import useToastStore from '../../store/toastStore';
import { useSearchParams, Link } from 'react-router-dom';
import axios from '../../utils/api';
import {
  FiMessageSquare,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiFilter,
  FiSearch,
  FiPhone,
  FiMail,
  FiActivity,
  FiMapPin,
  FiEye,
  FiEdit,
  FiUser,
  FiRefreshCw,
  FiHome
} from 'react-icons/fi';

const UserLeadsPage = () => {
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  

  useEffect(() => {
    fetchMyLeads();
  }, []);

  useEffect(() => {
    filterLeads();
  }, [leads, searchTerm, statusFilter, categoryFilter]);

  const fetchMyLeads = async () => {
    try {
      setLoading(true);
      // Fetch leads assigned to the current user
      const response = await axios.get('/users/leads');
      setLeads(response.data.leads || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      useToastStore.getState().add({ type: 'error', message: 'Failed to load leads' });
    } finally {
      setLoading(false);
    }
  };

  const filterLeads = () => {
    let filtered = leads;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lead => lead.status === statusFilter);
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(lead => lead.category === categoryFilter);
    }

    // Labels removed — skip label filtering

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(lead =>
        (lead.firstName + ' ' + lead.lastName).toLowerCase().includes(term) ||
        lead.email.toLowerCase().includes(term) ||
        lead.phone.toLowerCase().includes(term) ||
        lead.company?.toLowerCase().includes(term) ||
        lead.city?.toLowerCase().includes(term) ||
        lead.requirements?.toLowerCase().includes(term)
      );
    }

    setFilteredLeads(filtered);
  };

  const updateLeadStatus = async (leadId, newStatus) => {
    try {
      await axios.put(`users/leads/${leadId}`, { status: newStatus });
      
      setLeads(prev => prev.map(lead =>
        lead._id === leadId ? { ...lead, status: newStatus } : lead
      ));
      
      useToastStore.getState().add({ type: 'success', message: 'Lead status updated' });
    } catch (error) {
      console.error('Error updating lead status:', error);
      useToastStore.getState().add({ type: 'error', message: 'Failed to update lead status' });
    }
  };

  // Labels removed — no label updates from agent dashboard

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-amber-100/80 text-amber-700 border border-amber-200/50', icon: <FiClock /> },
      contacted: { color: 'bg-purple-100/80 text-purple-700 border border-purple-200/50', icon: <FiMessageSquare /> },
      in_process: { color: 'bg-blue-100/80 text-blue-700 border border-blue-200/50', icon: <FiActivity /> },
      closed: { color: 'bg-emerald-100/80 text-emerald-700 border border-emerald-200/50', icon: <FiCheckCircle /> },
      rejected: { color: 'bg-red-100/80 text-red-700 border border-red-200/50', icon: <FiXCircle /> },
      'non-viable': { color: 'bg-gray-100/80 text-gray-700 border border-gray-200/50', icon: <FiXCircle /> }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const pretty = status.replace(/_/g, ' ').replace(/-/g, ' ');
    return (
      <span className={`${config.color} px-3 py-1 rounded-full text-xs flex items-center gap-1 backdrop-blur-sm`}>
        {config.icon}
        {pretty.charAt(0).toUpperCase() + pretty.slice(1)}
      </span>
    );
  };

  // Labels removed — badge UI not shown per request

  const getCategoryBadge = (category) => {
    const categoryConfig = {
      buyer: { color: 'bg-blue-100/80 text-blue-700 border border-blue-200/50', text: 'Buyer' },
      seller: { color: 'bg-purple-100/80 text-purple-700 border border-purple-200/50', text: 'Seller' },
      rental: { color: 'bg-emerald-100/80 text-emerald-700 border border-emerald-200/50', text: 'Rental' }
    };
    
    const config = categoryConfig[category] || { color: 'bg-gray-100/80 text-gray-700 border border-gray-200/50', text: 'N/A' };
    
    return (
      <span className={`${config.color} px-2 py-1 rounded text-xs backdrop-blur-sm`}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-blue-600 font-medium">Loading leads...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">My Assigned Leads</h1>
          <p className="text-gray-600 mt-2">
            Manage and track all leads assigned to you
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-lg p-6 mb-8 border border-blue-100/50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/50 border border-blue-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 backdrop-blur-sm"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 bg-white/50 border border-blue-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 backdrop-blur-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="contacted">Contacted</option>
                <option value="in_process">In Process</option>
                <option value="closed">Closed</option>
                <option value="rejected">Rejected</option>
                <option value="non-viable">Non-viable</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-4 py-2 bg-white/50 border border-blue-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 backdrop-blur-sm"
              >
                <option value="all">All Categories</option>
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
                <option value="rental">Rental</option>
              </select>
            </div>

            {/* Labels removed per request */}
          </div>

          {/* Stats Row */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-gray-700">
              Showing <span className="font-bold text-blue-600">{filteredLeads.length}</span> of <span className="font-bold text-blue-600">{leads.length}</span> leads
            </div>
            <button
              onClick={fetchMyLeads}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition flex items-center gap-2 shadow-md"
            >
              <FiRefreshCw className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Leads Table */}
        <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-lg overflow-hidden border border-blue-100/50">
          {filteredLeads.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-blue-50/80 to-cyan-50/80 backdrop-blur-sm">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Lead Info
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-100/50">
                  {filteredLeads.map((lead) => (
                    <tr key={lead._id} className="hover:bg-white/40 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-gray-800">{lead.firstName} {lead.lastName}</div>
                          <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
                            <FiMail className="text-blue-400" />
                            {lead.email}
                          </div>
                          <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
                            <FiPhone className="text-blue-400" />
                            {lead.phone}
                          </div>
                          {lead.company && (
                            <div className="text-gray-600 text-sm mt-1">
                              <span className="font-medium">Company:</span> {lead.company}
                            </div>
                          )}
                          {(lead.city || lead.stateProvince) && (
                            <div className="flex items-center gap-2 text-gray-600 text-sm mt-1">
                              <FiMapPin className="text-blue-400" />
                              {lead.city && lead.stateProvince ? `${lead.city}, ${lead.stateProvince}` : lead.city || lead.stateProvince}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getCategoryBadge(lead.category)}
                        {lead.requirements && (
                          <div className="mt-2 text-xs text-gray-500 max-w-xs truncate" title={lead.requirements}>
                            {lead.requirements.length > 50 ? lead.requirements.substring(0, 50) + '...' : lead.requirements}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="mb-2">{getStatusBadge(lead.status)}</div>
                        <select
                          value={lead.status}
                          onChange={(e) => updateLeadStatus(lead._id, e.target.value)}
                          className="w-full px-2 py-1 bg-white/50 border border-blue-200/50 rounded-lg text-xs backdrop-blur-sm"
                        >
                          <option value="pending">Pending</option>
                          <option value="contacted">Contacted</option>
                          <option value="in_process">In Process</option>
                          <option value="closed">Closed</option>
                          <option value="rejected">Rejected</option>
                          <option value="non-viable">Non-viable</option>
                        </select>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-gray-700 font-medium">
                          {new Date(lead.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {new Date(lead.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <Link
                            to={`/user/leads/${lead._id}`}
                            className="px-3 py-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm rounded-lg hover:from-blue-600 hover:to-blue-700 transition flex items-center gap-1 justify-center shadow-sm"
                          >
                            <FiEye /> View
                          </Link>
                          <button
                            onClick={() => {
                              // Add lead to notes functionality
                              const note = prompt('Add a note for this lead:', lead.internalNote || '');
                              if (note !== null) {
                                // Update lead with note
                                axios.put(`users/leads/${lead._id}`, { internalNote: note })
                                  .then(() => {
                                    alert('Note updated');
                                    fetchMyLeads();
                                  })
                                  .catch(err => alert('Failed to update note'));
                              }
                            }}
                            className="px-3 py-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white text-sm rounded-lg hover:from-gray-600 hover:to-gray-700 transition flex items-center gap-1 justify-center shadow-sm"
                          >
                            <FiEdit /> Note
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <FiMessageSquare className="w-16 h-16 text-blue-200 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No leads found</h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Try changing your search criteria' 
                  : 'No leads are currently assigned to you'}
              </p>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: 'Total Leads', value: leads.length, gradient: 'from-blue-500 to-blue-600' },
            { label: 'Pending', value: leads.filter(l => l.status === 'pending').length, gradient: 'from-amber-500 to-amber-600' },
            { label: 'Contacted', value: leads.filter(l => l.status === 'contacted').length, gradient: 'from-purple-500 to-purple-600' },
            { label: 'In Process', value: leads.filter(l => l.status === 'in_process').length, gradient: 'from-emerald-500 to-emerald-600' },
          ].map((stat, index) => (
            <div key={index} className="bg-white/60 backdrop-blur-md rounded-2xl shadow-lg p-6 border border-blue-100/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-2">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-br ${stat.gradient} rounded-xl flex items-center justify-center shadow-md`}>
                  <span className="text-white font-bold">{stat.value}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Category Breakdown */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-lg p-6 border border-blue-100/50">
            <h3 className="font-bold text-gray-800 mb-4">Leads by Category</h3>
            {['buyer', 'seller', 'rental'].map(category => {
              const count = leads.filter(l => l.category === category).length;
              return (
                <div key={category} className="flex items-center justify-between mb-3">
                  <span className="text-gray-700 capitalize">{category}</span>
                  <span className="font-bold text-blue-600">{count}</span>
                </div>
              );
            })}
          </div>
          
          <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-lg p-6 border border-blue-100/50">
            <h3 className="font-bold text-gray-800 mb-4">Leads by Status</h3>
            {['pending','contacted','in_process','closed','rejected'].map(status => {
              const count = leads.filter(l => l.status === status).length;
              const label = status.replace(/_/g,' ');
              return (
                <div key={status} className="flex items-center justify-between mb-3">
                  <span className="text-gray-700 capitalize">{label}</span>
                  <span className="font-bold text-blue-600">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserLeadsPage;