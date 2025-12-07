// client/src/pages/admin/UsersPage.js
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
// import AdminSidebar from '../../components/AdminSidebar';
import { FiEdit, FiTrash2, FiPlus, FiSearch, FiX, FiCheck } from 'react-icons/fi';
import useToastStore from '../../store/toastStore';
import useConfirmStore from '../../store/confirmStore';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    isActive: true
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const confirmCallbackRef = useRef(null);

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (roleFilter !== 'all') params.role = roleFilter;

      const response = await axios.get('/api/admin/users', { params });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    if (!searchTerm) {
      setFilteredUsers(users);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = users.filter(user =>
      user.name?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term)
    );
    setFilteredUsers(filtered);
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (userId) => {
    useConfirmStore.getState().show('Are you sure you want to delete this user?', async () => {
      try {
        await axios.delete(`/api/admin/users/${userId}`);
        useToastStore.getState().add({ type: 'success', message: 'User deleted successfully!' });
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        useToastStore.getState().add({ type: 'error', message: 'Failed to delete user' });
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingUser) {
        await axios.put(`/api/admin/users/${editingUser._id}`, formData);
        useToastStore.getState().add({ type: 'success', message: 'User updated successfully!' });
      } else {
        await axios.post('/api/admin/users', formData);
        useToastStore.getState().add({ type: 'success', message: 'User created successfully!' });
      }

      setShowModal(false);
      setEditingUser(null);
      setFormData({ name: '', email: '', role: 'user', isActive: true });
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      useToastStore.getState().add({ type: 'error', message: error.response?.data?.message || 'Failed to save user' });
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: { color: 'bg-purple-100 text-purple-800', text: 'Admin' },
      user: { color: 'bg-blue-100 text-blue-800', text: 'User' },
      agent: { color: 'bg-green-100 text-green-800', text: 'Agent' }
    };

    const config = roleConfig[role] || roleConfig.user;

    return (
      <span className={`${config.color} px-3 py-1 rounded-full text-sm font-medium`}>
        {config.text}
      </span>
    );
  };

  return (
    <div className="flex bg-[#101624] min-h-screen">
      <AdminSidebar />

      <main className="flex-1 p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Manage Users</h1>
            <p className="text-gray-400">Manage all platform users and their permissions</p>
          </div>
          <button
            onClick={() => {
              setEditingUser(null);
              setFormData({ name: '', email: '', role: 'user', isActive: true });
              setShowModal(true);
            }}
            className="bg-[#2c43f5] text-white px-6 py-3 rounded-lg flex items-center gap-2 hover:bg-blue-600 transition"
          >
            <FiPlus /> Add User
          </button>
        </div>

        {/* Filters */}
        <div className="bg-[#181C2A] rounded-xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative col-span-2">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#101624] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5]"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-2 bg-[#101624] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5]"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="agent">Agent</option>
              <option value="user">User</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-[#181C2A] rounded-xl overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-white">Loading users...</div>
          ) : filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#101624]">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium text-white">{user.name}</div>
                            <div className="text-gray-400 text-sm">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          user.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-400">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            title="Edit"
                          >
                            <FiEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(user._id)}
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
              <div className="text-gray-400 text-lg">No users found</div>
            </div>
          )}
        </div>

        {/* User Form Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#181C2A] rounded-xl p-8 max-w-md w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingUser ? 'Edit User' : 'Add New User'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <FiX size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-400 mb-2">Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-[#101624] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5]"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 bg-[#101624] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5]"
                  />
                </div>

                <div>
                  <label className="block text-gray-400 mb-2">Role *</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-[#101624] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2c43f5]"
                  >
                    <option value="user">User</option>
                    <option value="agent">Agent</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-[#2c43f5] rounded focus:ring-[#2c43f5]"
                  />
                  <label className="text-gray-400">Active</label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-[#2c43f5] text-white rounded-lg hover:bg-blue-600 transition"
                  >
                    {editingUser ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Confirm modal
{ /* Render confirm modal at end of file via a small wrapper component */ }
const UsersPageWithConfirm = (props) => {
  return (
    <>
      <UsersPage {...props} />
    </>
  );
};

export default UsersPage;