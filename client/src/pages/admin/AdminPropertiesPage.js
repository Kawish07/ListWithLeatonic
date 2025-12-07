// client/src/pages/admin/PropertiesPage.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
// import AdminSidebar from '../../components/AdminSidebar';
import { FiEdit, FiTrash2, FiEye, FiCheck, FiX, FiClock, FiSearch, FiFilter } from 'react-icons/fi';
import useToastStore from '../../store/toastStore';

const PropertiesPage = () => {
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewProperty, setViewProperty] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, [currentPage, statusFilter]);

  useEffect(() => {
    filterProperties();
  }, [properties, searchTerm]);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: 10
      };
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await axios.get('/api/admin/properties', { params });
      setProperties(response.data.properties || []);
      setTotalPages(response.data.pages || 1);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProperties = () => {
    if (!searchTerm) {
      setFilteredProperties(properties);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = properties.filter(prop =>
      prop.title?.toLowerCase().includes(term) ||
      prop.location?.toLowerCase().includes(term) ||
      prop.owner?.name?.toLowerCase().includes(term)
    );
    setFilteredProperties(filtered);
  };

  const handleStatusChange = async (propertyId, newStatus) => {
    try {
      await axios.put(`/api/admin/properties/${propertyId}/status`, {
        status: newStatus
      });
      useToastStore.getState().add({ type: 'success', message: `Property ${newStatus} successfully!` });
      fetchProperties();
    } catch (error) {
      console.error('Error updating property status:', error);
      useToastStore.getState().add({ type: 'error', message: 'Failed to update property status' });
    }
  };

  const handleDelete = async (propertyId) => {
    // Show styled confirm modal instead of native confirm
    setConfirmDeleteId(propertyId);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await axios.delete(`/api/admin/properties/${confirmDeleteId}`);
      useToastStore.getState().add({ type: 'success', message: 'Property deleted successfully!' });
      fetchProperties();
    } catch (error) {
      console.error('Error deleting property:', error);
      useToastStore.getState().add({ type: 'error', message: 'Failed to delete property' });
    } finally {
      setShowConfirm(false);
      setConfirmDeleteId(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: <FiClock />, text: 'Pending' },
      published: { color: 'bg-green-100 text-green-800', icon: <FiCheck />, text: 'Published' },
      rejected: { color: 'bg-red-100 text-red-800', icon: <FiX />, text: 'Rejected' },
      draft: { color: 'bg-gray-100 text-gray-800', icon: <FiEdit />, text: 'Draft' }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`${config.color} px-3 py-1 rounded-full text-sm flex items-center gap-1 inline-flex`}>
        {config.icon}
        {config.text}
      </span>
    );
  };

  return (
    <div className="flex bg-[#101624] min-h-screen">
      <AdminSidebar />

      <main className="flex-1 p-6 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Manage Properties</h1>
          <p className="text-gray-400">Review, approve, and manage all property listings</p>
        </div>

        {/* Filters */}
        <div className="bg-[#181C2A] rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search properties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#101624] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5]"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="flex-1 px-4 py-2 bg-[#101624] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5]"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="published">Published</option>
                <option value="rejected">Rejected</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between bg-[#101624] p-3 rounded-lg">
              <span className="text-gray-400">Total Properties</span>
              <span className="font-bold text-white">{properties.length}</span>
            </div>
          </div>
    
          {/* View Modal */}
          {viewProperty && (
            <div className="fixed inset-0 z-50 flex items-start md:items-center justify-center p-6">
              <div className="absolute inset-0 bg-black/60" onClick={() => setViewProperty(null)}></div>
              <div className="relative bg-[#0b1220] text-white w-full max-w-4xl max-h-[90vh] overflow-auto rounded-lg shadow-2xl z-10">
                {viewProperty.images && viewProperty.images.length > 0 && (
                  <div className="w-full h-56 md:h-72 overflow-hidden rounded-t-lg">
                    <img src={viewProperty.images[0]} alt={viewProperty.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-2xl font-semibold mb-2">{viewProperty.title}</h3>
                  <p className="text-gray-300 mb-4">{viewProperty.description || 'No description provided.'}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                    <div><strong>Price:</strong> <span className="text-green-300">${viewProperty.price}</span></div>
                    <div><strong>Location:</strong> {viewProperty.location || 'N/A'}</div>
                    <div><strong>Status:</strong> {viewProperty.status}</div>
                    <div><strong>Owner:</strong> {viewProperty.owner?.name || 'Unknown'}</div>
                    <div><strong>Type:</strong> {viewProperty.type || '—'}</div>
                    <div><strong>Created:</strong> {new Date(viewProperty.createdAt).toLocaleString()}</div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button className="px-4 py-2 bg-blue-600 rounded" onClick={() => { setViewProperty(null); /* could open edit */ }}>Close</button>
                    <button className="px-4 py-2 bg-red-600 rounded" onClick={() => { setConfirmDeleteId(viewProperty._id); setShowConfirm(true); }}>Delete</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Confirm Delete Modal */}
          {showConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-black/60" onClick={() => setShowConfirm(false)}></div>
              <div className="relative bg-[#0b1220] text-white w-full max-w-md p-6 rounded-lg shadow-2xl z-10">
                <h4 className="text-lg font-semibold mb-2">Confirm Delete</h4>
                <p className="text-gray-300 mb-4">Are you sure you want to permanently delete this property? This action cannot be undone.</p>
                <div className="flex justify-end gap-3">
                  <button className="px-4 py-2 bg-gray-600 rounded" onClick={() => { setShowConfirm(false); setConfirmDeleteId(null); }}>Cancel</button>
                  <button className="px-4 py-2 bg-red-600 rounded" onClick={confirmDelete}>Delete</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Properties Table */}
        <div className="bg-[#181C2A] rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-white">Loading properties...</div>
          ) : filteredProperties.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#101624]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Property
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Owner
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredProperties.map((property) => (
                    <tr key={property._id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={property.images?.[0] || 'https://via.placeholder.com/100'}
                            alt={property.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                          <div>
                            <div className="font-medium text-white">{property.title}</div>
                            <div className="text-gray-400 text-sm">{property.location}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white">{property.owner?.name || 'Unknown'}</div>
                        <div className="text-gray-400 text-sm">{property.owner?.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#2c43f5]">
                          ${property.price?.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(property.status)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-400">
                          {new Date(property.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {property.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleStatusChange(property._id, 'published')}
                                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                title="Approve"
                              >
                                <FiCheck />
                              </button>
                              <button
                                onClick={() => handleStatusChange(property._id, 'rejected')}
                                className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                                title="Reject"
                              >
                                <FiX />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setViewProperty(property)}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            title="View"
                          >
                            <FiEye />
                          </button>
                          <button
                            onClick={() => handleDelete(property._id)}
                            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <div className="text-gray-400 text-lg">No properties found</div>
              <p className="text-gray-500 text-sm mt-2">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try changing your search criteria'
                  : 'No properties have been listed yet'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-[#181C2A] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2c43f5] transition"
            >
              Previous
            </button>
            <span className="text-white">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-[#181C2A] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2c43f5] transition"
            >
              Next
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default PropertiesPage;