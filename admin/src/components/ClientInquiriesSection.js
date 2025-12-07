import React, { useState, useEffect } from 'react';
import useToastStore from '../store/toastStore';
import {
  FiMessageSquare,
  FiMail,
  FiPhone,
  FiHome,
  FiEye,
  FiCheck,
  FiClock,
  FiUser,
  FiDollarSign,
  FiFilter,
  FiRefreshCw,
  FiSearch
} from 'react-icons/fi';

const ClientInquiriesSection = () => {
  const [inquiries, setInquiries] = useState([]);
  const [stats, setStats] = useState({
    totalInquiries: 0,
    newInquiries: 0,
    todayInquiries: 0
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'all',
    search: ''
  });

  useEffect(() => {
    fetchInquiries();
    fetchInquiryStats();
  }, []);

  const fetchInquiries = async () => {
    try {
      setLoading(true);
      // Build URL so that by default we exclude closed inquiries from the admin list
      let url = `http://localhost:5000/api/client-inquiries?search=${encodeURIComponent(filters.search || '')}`;
      if (filters.status && filters.status !== 'all') {
        url += `&status=${encodeURIComponent(filters.status)}`;
      } else {
        // When no specific status is selected, hide closed inquiries from the default list
        url += `&excludeClosed=true`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setInquiries(data.inquiries || []);
      }
    } catch (error) {
      console.error('Error fetching inquiries:', error);
      const toast = useToastStore.getState();
      toast.add({ type: 'error', message: 'Error loading inquiries: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchInquiryStats = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/client-inquiries/dashboard/stats');
      const data = await response.json();
      
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching inquiry stats:', error);
    }
  };

  const handleStatusUpdate = async (inquiryId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5000/api/client-inquiries/${inquiryId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (data.success) {
        useToastStore.getState().add({ type: 'success', message: 'Status updated successfully' });
        // If status set to 'closed', remove from current UI list immediately
        if (newStatus === 'closed') {
          setInquiries(prev => prev.filter(i => i._id !== inquiryId));
          // refresh stats to reflect removal
          fetchInquiryStats();
        } else {
          // For other statuses, refresh list to show updated status
          fetchInquiries();
          fetchInquiryStats();
        }
      } else {
        useToastStore.getState().add({ type: 'error', message: data.message || 'Failed to update status' });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      useToastStore.getState().add({ type: 'error', message: 'Error updating status: ' + error.message });
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      new: { color: 'bg-blue-500/20 text-blue-400', icon: <FiClock /> },
      read: { color: 'bg-green-500/20 text-green-400', icon: <FiCheck /> },
      contacted: { color: 'bg-purple-500/20 text-purple-400', icon: <FiMessageSquare /> },
      closed: { color: 'bg-gray-500/20 text-gray-400', icon: <FiCheck /> }
    };
    
    const config = statusConfig[status] || statusConfig.new;
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${config.color}`}>
        {config.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPurposeBadge = (purpose) => {
    const purposeConfig = {
      buy: { color: 'bg-green-500/20 text-green-400', label: 'Buy' },
      rent: { color: 'bg-blue-500/20 text-blue-400', label: 'Rent' },
      viewing: { color: 'bg-purple-500/20 text-purple-400', label: 'Viewing' },
      info: { color: 'bg-gray-500/20 text-gray-400', label: 'Info' }
    };
    
    const config = purposeConfig[purpose] || purposeConfig.info;
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white">Loading inquiries...</div>
      </div>
    );
  }

  return (
    <div className="bg-[#181C2A] rounded-xl p-6 shadow-lg border border-gray-800">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white">Client Inquiries</h2>
          <p className="text-gray-400 text-sm mt-1">
            View and manage all property inquiries from clients
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={fetchInquiries}
            className="bg-[#2c43f5] text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center gap-2"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Inquiries</p>
              <p className="text-2xl font-bold text-white mt-2">{stats.totalInquiries}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/20 text-blue-400">
              <FiMessageSquare className="text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">New Inquiries</p>
              <p className="text-2xl font-bold text-white mt-2">{stats.newInquiries}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/20 text-green-400">
              <FiClock className="text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Today's Inquiries</p>
              <p className="text-2xl font-bold text-white mt-2">{stats.todayInquiries}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/20 text-purple-400">
              <FiMail className="text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 mb-6">
        <select
          value={filters.status}
          onChange={(e) => {
            setFilters({ ...filters, status: e.target.value });
            setTimeout(() => fetchInquiries(), 100);
          }}
          className="bg-gray-800 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5]"
        >
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="read">Read</option>
          <option value="contacted">Contacted</option>
          <option value="closed">Closed</option>
        </select>

        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or property..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            onKeyPress={(e) => e.key === 'Enter' && fetchInquiries()}
            className="bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5] w-full"
          />
        </div>

        <button
          onClick={fetchInquiries}
          className="bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition flex items-center gap-2"
        >
          <FiFilter />
          <span>Apply</span>
        </button>
      </div>

      {/* Inquiries Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Client</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Property</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Purpose</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Message</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Status</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.map((inquiry) => (
              <tr key={inquiry._id} className="border-b border-gray-800 hover:bg-gray-800/30">
                <td className="py-3 px-4">
                  <div className="space-y-1">
                    <p className="text-white font-medium">{inquiry.name}</p>
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <FiMail className="text-xs" />
                      <span>{inquiry.email}</span>
                    </div>
                    {inquiry.phone && (
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <FiPhone className="text-xs" />
                        <span>{inquiry.phone}</span>
                      </div>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div>
                    <p className="text-white font-medium">{inquiry.propertyTitle}</p>
                    {inquiry.propertyPrice && (
                      <p className="text-green-400 text-sm">
                        ${inquiry.propertyPrice.toLocaleString()}
                      </p>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4">
                  {getPurposeBadge(inquiry.purpose)}
                </td>
                <td className="py-3 px-4">
                  <p className="text-white text-sm line-clamp-2">{inquiry.message}</p>
                </td>
                <td className="py-3 px-4">
                  {getStatusBadge(inquiry.status)}
                </td>
                <td className="py-3 px-4">
                  <div className="text-gray-400 text-sm">
                    {new Date(inquiry.createdAt).toLocaleDateString()}
                    <div className="text-xs">
                      {new Date(inquiry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleStatusUpdate(inquiry._id, 'read')}
                      className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition"
                      title="Mark as Read"
                      disabled={inquiry.status === 'read'}
                    >
                      <FiEye />
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(inquiry._id, 'contacted')}
                      className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition"
                      title="Mark as Contacted"
                      disabled={inquiry.status === 'contacted'}
                    >
                      <FiMessageSquare />
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(inquiry._id, 'closed')}
                      className="bg-gray-600 text-white p-2 rounded-lg hover:bg-gray-700 transition"
                      title="Mark as Closed"
                      disabled={inquiry.status === 'closed'}
                    >
                      <FiCheck />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {inquiries.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📨</div>
            <h3 className="text-xl font-bold text-white mb-2">No Inquiries Found</h3>
            <p className="text-gray-400">
              {filters.status !== 'all' || filters.search 
                ? 'Try adjusting your filters' 
                : 'No inquiries have been submitted yet'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientInquiriesSection;