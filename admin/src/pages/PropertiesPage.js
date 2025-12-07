import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FiEdit2, FiEye, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import useToastStore from '../store/toastStore';

const PropertiesPage = () => {
  const [properties, setProperties] = useState([]);
  const [editing, setEditing] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalProperty, setModalProperty] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ title: '', price: '', location: '', description: '' });

  useEffect(() => {
    axios.get('/api/properties').then(res => setProperties(res.data));
  }, []);

  const handleEdit = (property) => {
    setEditing(property._id);
    setForm({
      title: property.title,
      price: property.price,
      location: property.location,
      description: property.description || '',
      status: property.status || 'pending'
    });
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await axios.put(`/api/properties/${id}`, { status: newStatus });
      setProperties(properties.map(p => p._id === id ? res.data : p));
    } catch (err) {
      console.error('Failed to update status', err);
      useToastStore.getState().add({ type: 'error', message: 'Failed to update status' });
    }
  };

  const handleView = (property) => {
    setModalProperty(property);
    setShowModal(true);
  };

  const handleDelete = (id) => {
    setConfirmDeleteId(id);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    try {
      await axios.delete(`/api/properties/${confirmDeleteId}`);
      setProperties(properties.filter(p => p._id !== confirmDeleteId));
      useToastStore.getState().add({ type: 'success', message: 'Property deleted successfully' });
    } catch (err) {
      console.error('Failed to delete property', err);
      useToastStore.getState().add({ type: 'error', message: 'Failed to delete property' });
    } finally {
      setConfirmDeleteId(null);
      setShowConfirm(false);
    }
  };

  const handleSave = async () => {
    if (editing) {
      const res = await axios.put(`/api/properties/${editing}`, form);
      setProperties(properties.map(p => p._id === editing ? res.data : p));
      setEditing(null);
    } else {
      // Ensure status is included when creating
      const payload = { ...form };
      if (!payload.status) payload.status = 'pending';
      const res = await axios.post('/api/properties', payload);
      setProperties([...properties, res.data]);
    }
    setForm({ title: '', price: '', location: '', description: '', status: 'pending' });
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4 text-white">Manage Properties</h2>
      <div className="mb-6 bg-[#181C2A] p-4 rounded-xl">
        <input className="mb-2 p-2 rounded w-full" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <input className="mb-2 p-2 rounded w-full" placeholder="Price" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
        <input className="mb-2 p-2 rounded w-full" placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} />
        <select className="mb-2 p-2 rounded w-full" value={form.status || 'pending'} onChange={e => setForm({ ...form, status: e.target.value })}>
          <option value="pending">Pending</option>
          <option value="published">Published</option>
          <option value="sold">Sold</option>
          <option value="rented">Rented</option>
          <option value="rejected">Rejected</option>
        </select>
        <textarea className="mb-2 p-2 rounded w-full" placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        <button className="bg-[#2c43f5] text-white px-4 py-2 rounded" onClick={handleSave}>{editing ? 'Update' : 'Add'} Property</button>
        {editing && <button className="ml-2 px-4 py-2 rounded bg-gray-600 text-white" onClick={() => setEditing(null)}>Cancel</button>}
      </div>

        <table className="w-full text-white bg-[#0b1220] rounded-xl overflow-hidden shadow-md">
        <thead>
          <tr>
            <th className="p-2">Title</th>
            <th className="p-2">Price</th>
            <th className="p-2">Location</th>
            <th className="p-2">Status</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {properties.map(property => (
            <tr key={property._id} className="border-b border-gray-800 hover:bg-gray-800/20">
              <td className="p-3">
                <div className="font-semibold text-white">{property.title}</div>
                <div className="text-xs text-gray-400 truncate max-w-sm">{property.description || ''}</div>
              </td>
              <td className="p-3 text-green-300">${property.price}</td>
              <td className="p-3 text-gray-300">{property.location}</td>
              <td className="p-3">
                <select className="p-1 rounded bg-[#0b1220] border border-gray-700 text-sm" value={property.status || 'pending'} onChange={e => handleStatusChange(property._id, e.target.value)}>
                  <option value="pending">Pending</option>
                  <option value="published">Published</option>
                  <option value="sold">Sold</option>
                  <option value="rented">Rented</option>
                  <option value="rejected">Rejected</option>
                </select>
              </td>
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <button title="Edit" className="flex items-center gap-2 px-3 py-1 bg-[#1f2937] hover:bg-[#2b3a55] rounded text-sm text-white" onClick={() => handleEdit(property)}>
                    <FiEdit2 /> <span className="hidden md:inline">Edit</span>
                  </button>
                  <button title="View" className="flex items-center gap-2 px-3 py-1 bg-[#0b1220] hover:bg-[#122033] rounded text-sm text-white" onClick={() => handleView(property)}>
                    <FiEye /> <span className="hidden md:inline">View</span>
                  </button>
                  <button title="Delete" className="flex items-center gap-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm text-white" onClick={() => handleDelete(property._id)}>
                    <FiTrash2 /> <span className="hidden md:inline">Delete</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal for viewing property details */}
      {showModal && modalProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-gradient-to-br from-[#071029] to-[#0f1724] text-white w-11/12 md:w-3/4 lg:w-1/2 p-6 rounded-xl shadow-2xl z-10">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-semibold">{modalProperty.title}</h3>
                <p className="text-sm text-gray-400">{modalProperty.location} • ${modalProperty.price}</p>
              </div>
              <button className="text-gray-300 hover:text-white" onClick={() => setShowModal(false)}><FiX /></button>
            </div>
            <p className="text-gray-300 mb-4">{modalProperty.description}</p>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-200">
              <div><strong>Price:</strong> ${modalProperty.price}</div>
              <div><strong>Location:</strong> {modalProperty.location}</div>
              <div><strong>Status:</strong> {modalProperty.status}</div>
              <div><strong>Created:</strong> {new Date(modalProperty.createdAt).toLocaleString()}</div>
            </div>
            <div className="mt-6 flex justify-end">
              <button className="px-4 py-2 bg-[#2c43f5] rounded mr-2" onClick={() => { setShowModal(false); handleEdit(modalProperty); }}><FiEdit2 /> <span className="ml-2">Edit</span></button>
              <button className="px-4 py-2 bg-gray-600 rounded" onClick={() => setShowModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowConfirm(false)}></div>
          <div className="relative bg-[#0b1220] text-white w-11/12 max-w-md p-6 rounded-lg shadow-lg z-10">
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
  );
};

export default PropertiesPage;
