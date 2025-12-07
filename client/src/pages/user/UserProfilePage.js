import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../utils/api';
import {
  FiUser,
  FiLock,
  FiHelpCircle,
  FiLogOut,
  FiCamera,
  FiSave,
  FiMail,
  FiPhone,
  FiMapPin,
  FiEdit,
  FiX,
  FiCheck,
  FiAlertCircle
} from 'react-icons/fi';

const UserProfilePage = () => {
  const navigate = useNavigate();
  const { user, updateUser, logout, refreshUser } = useAuthStore();

  // Active tab state
  const [activeTab, setActiveTab] = useState('personal');

  // Profile data state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    avatar: ''
  });

  // Password state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Contact support state
  const [contactData, setContactData] = useState({
    subject: '',
    message: '',
    category: 'general'
  });

  // UI states
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Debug: Log current state
  useEffect(() => {
    console.log('Current user in store:', user);
    console.log('Profile data state:', profileData);
  }, [user, profileData]);

  // Load user data on mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Normalize image URL returned from server
  const normalizeImageUrl = (url) => {
    if (!url) return null;
    try {
      if (url.startsWith('/uploads/')) return `http://localhost:5000${url}`;
    } catch (e) {
      // fallback to raw url
    }
    return url;
  };

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      console.log('Fetching user profile...');
      
      const response = await api.get('/users/profile');
      console.log('Profile API Response:', response.data);
      
      if (response.data.success) {
        const userData = response.data.user;
        const normalizedAvatar = normalizeImageUrl(userData.avatar) || '';

        setProfileData({
          name: userData.name || '',
          email: userData.email || '',
          phone: userData.phone || '',
          address: userData.address || '',
          avatar: userData.avatar || ''
        });
        setImagePreview(normalizedAvatar);
        
        // Update auth store with fresh data (use normalized avatar for immediate UI)
        updateUser({ ...userData, avatar: normalizedAvatar });
        
        console.log('Profile loaded successfully:', userData);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || error.message || 'Failed to load profile data' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle profile image upload
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Please select an image file' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size should be less than 5MB' });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload image
    setUploadingImage(true);
    const formData = new FormData();
    formData.append('profileImage', file);

    try {
      console.log('Uploading profile image...');
      const response = await api.post('/users/upload-profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      console.log('Image upload response:', response.data);
      
      if (response.data.success) {
        const { imageUrl, user: updatedUser } = response.data;

        const normalized = normalizeImageUrl(imageUrl) || normalizeImageUrl(updatedUser?.avatar);

        // Update local state
        setProfileData(prev => ({ ...prev, avatar: imageUrl || updatedUser?.avatar || '' }));
        setImagePreview(normalized);

        // Update auth store with normalized avatar
        const updatedUserWithNormalized = { ...updatedUser, avatar: normalized };
        updateUser(updatedUserWithNormalized);

        setMessage({ 
          type: 'success', 
          text: response.data.message || 'Profile image updated successfully!' 
        });

        console.log('Image uploaded and user updated:', updatedUserWithNormalized);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || error.message || 'Failed to upload image.' 
      });
      setImagePreview(profileData.avatar);
    } finally {
      setUploadingImage(false);
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      console.log('Updating profile with data:', profileData);
      const response = await api.put('/users/profile', profileData);
      console.log('Update profile response:', response.data);
      
      if (response.data.success) {
        const updatedUser = response.data.user;
        const normalizedAvatar = normalizeImageUrl(updatedUser.avatar) || null;

        // Update auth store with normalized avatar
        updateUser({ ...updatedUser, avatar: normalizedAvatar });

        // Update local state with fresh data from server
        setProfileData({
          name: updatedUser.name || '',
          email: updatedUser.email || '',
          phone: updatedUser.phone || '',
          address: updatedUser.address || '',
          avatar: updatedUser.avatar || ''
        });
        setImagePreview(normalizedAvatar);

        setMessage({ 
          type: 'success', 
          text: response.data.message || 'Profile updated successfully!' 
        });

        // Force refresh user data from store
        await refreshUser();

        console.log('Profile updated and persisted:', updatedUser);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || error.message || 'Failed to update profile' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validation
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }

    setLoading(true);

    try {
      console.log('Changing password...');
      const response = await api.put('/users/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword
      });

      console.log('Password change response:', response.data);
      
      if (response.data.success) {
        setMessage({ 
          type: 'success', 
          text: response.data.message || 'Password changed successfully!' 
        });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || error.message || 'Failed to change password.' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle contact support
  const handleContactSupport = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      console.log('Contacting support...');
      const response = await api.post('/users/contact-support', contactData);
      console.log('Contact support response:', response.data);
      
      if (response.data.success) {
        setMessage({ 
          type: 'success', 
          text: response.data.message || 'Message sent successfully!' 
        });
        setContactData({ subject: '', message: '', category: 'general' });
      }
    } catch (error) {
      console.error('Error contacting support:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || error.message || 'Failed to send message' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Clear message after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (loading && !imagePreview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50 flex items-center justify-center">
        <div className="text-blue-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-50">
      {/* Header with Glass Effect */}
      <div className="bg-gradient-to-r from-sky-500/80 to-blue-500/80 backdrop-blur-lg text-white p-8 border-b border-white/20">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-blue-100/90 mt-2">Manage your account settings and preferences</p>
        </div>
      </div>

      {/* Message Display with Glass Effect */}
      {message.text && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-6">
          <div className={`p-4 rounded-xl backdrop-blur-md border ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-200/50 text-emerald-800' 
              : 'bg-rose-500/10 border-rose-200/50 text-rose-800'
          }`}>
            <div className="flex items-center gap-3">
              {message.type === 'success' ? <FiCheck className="text-emerald-600" /> : <FiAlertCircle className="text-rose-600" />}
              <span>{message.text}</span>
              <button
                onClick={() => setMessage({ type: '', text: '' })}
                className="ml-auto"
              >
                <FiX className="text-gray-500 hover:text-gray-700" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation with Glass Effect */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/50 p-6">
              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('personal')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    activeTab === 'personal'
                      ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-lg shadow-blue-200'
                      : 'text-blue-800 hover:bg-blue-50/50 hover:shadow-md'
                  }`}
                >
                  <FiUser />
                  <span className="font-medium">Personal Info</span>
                </button>

                <button
                  onClick={() => setActiveTab('password')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                    activeTab === 'password'
                      ? 'bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow-lg shadow-blue-200'
                      : 'text-blue-800 hover:bg-blue-50/50 hover:shadow-md'
                  }`}
                >
                  <FiLock />
                  <span className="font-medium">Password & Security</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-600 hover:bg-rose-50/50 hover:shadow-md transition-all duration-300"
                >
                  <FiLogOut />
                  <span className="font-medium">Logout</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Main Content with Glass Effect */}
          <div className="lg:col-span-3">
            <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg border border-white/50 p-8">
              {/* Personal Info Tab */}
              {activeTab === 'personal' && (
                <div>
                  <h2 className="text-2xl font-bold text-blue-900 mb-6">Personal Information</h2>

                  {/* Profile Image Section */}
                  <div className="mb-8 flex items-center gap-6">
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-sky-100 to-blue-100 border-4 border-white shadow-lg flex items-center justify-center">
                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="Profile"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextElementSibling) {
                                e.target.nextElementSibling.style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        {(!imagePreview || imagePreview === '') && (
                          <FiUser className="w-16 h-16 text-blue-300" />
                        )}
                      </div>
                      <label
                        htmlFor="profile-image"
                        className="absolute bottom-2 right-2 bg-gradient-to-r from-sky-500 to-blue-500 text-white p-3 rounded-full cursor-pointer hover:from-sky-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        {uploadingImage ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <FiCamera className="w-5 h-5" />
                        )}
                      </label>
                      <input
                        id="profile-image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        disabled={uploadingImage}
                      />
                    </div>
                    <div>
                      <h3 className="font-bold text-blue-900 text-xl">{profileData.name || user?.name}</h3>
                      <p className="text-blue-600">{profileData.email || user?.email}</p>
                      <p className="text-blue-400 text-sm mt-2">
                        Click the camera icon to upload a new photo
                      </p>
                    </div>
                  </div>

                  {/* Profile Form */}
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-blue-700 font-semibold mb-2">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          className="w-full px-4 py-3 border border-blue-200/50 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-300"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-blue-700 font-semibold mb-2">
                          Email Address *
                        </label>
                        <div className="relative">
                          <FiMail className="absolute left-3 top-4 text-blue-400" />
                          <input
                            type="email"
                            value={profileData.email}
                            onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 border border-blue-200/50 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-300"
                            required
                            disabled
                          />
                          <span className="text-xs text-blue-500 mt-1 block">
                            Email cannot be changed
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-blue-700 font-semibold mb-2">
                          Phone Number
                        </label>
                        <div className="relative">
                          <FiPhone className="absolute left-3 top-4 text-blue-400" />
                          <input
                            type="tel"
                            value={profileData.phone}
                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 border border-blue-200/50 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-300"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-blue-700 font-semibold mb-2">
                          Address
                        </label>
                        <div className="relative">
                          <FiMapPin className="absolute left-3 top-4 text-blue-400" />
                          <input
                            type="text"
                            value={profileData.address}
                            onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                            className="w-full pl-10 pr-4 py-3 border border-blue-200/50 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-300"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-blue-100">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileData({
                            name: user?.name || '',
                            email: user?.email || '',
                            phone: user?.phone || '',
                            address: user?.address || '',
                            avatar: user?.avatar || ''
                          });
                          setMessage({ type: '', text: '' });
                        }}
                        className="px-6 py-3 text-blue-700 border border-blue-200/50 rounded-xl hover:bg-blue-50/50 transition-all duration-300 backdrop-blur-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-xl hover:from-sky-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50 backdrop-blur-sm"
                      >
                        <FiSave />
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Password & Security Tab */}
              {activeTab === 'password' && (
                <div>
                  <h2 className="text-2xl font-bold text-blue-900 mb-6">Password & Security</h2>

                  <form onSubmit={handlePasswordChange} className="space-y-6 max-w-xl">
                    <div>
                      <label className="block text-blue-700 font-semibold mb-2">
                        Current Password *
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-blue-200/50 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-300"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-blue-700 font-semibold mb-2">
                        New Password *
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-blue-200/50 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-300"
                        required
                        minLength={6}
                      />
                      <p className="text-blue-500 text-sm mt-1">
                        Password must be at least 6 characters long
                      </p>
                    </div>

                    <div>
                      <label className="block text-blue-700 font-semibold mb-2">
                        Confirm New Password *
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-3 border border-blue-200/50 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-300"
                        required
                      />
                    </div>

                    <div className="flex items-center justify-end gap-4 pt-6 border-t border-blue-100">
                      <button
                        type="button"
                        onClick={() => {
                          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                          setMessage({ type: '', text: '' });
                        }}
                        className="px-6 py-3 text-blue-700 border border-blue-200/50 rounded-xl hover:bg-blue-50/50 transition-all duration-300 backdrop-blur-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-xl hover:from-sky-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50 backdrop-blur-sm"
                      >
                        <FiLock />
                        {loading ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>

                  {/* Security Tips with Glass Effect */}
                  <div className="mt-8 p-6 bg-gradient-to-br from-sky-50/50 to-blue-50/50 backdrop-blur-sm rounded-xl border border-blue-200/50">
                    <h3 className="font-semibold text-blue-900 mb-3">Security Tips</h3>
                    <ul className="space-y-2 text-blue-700 text-sm">
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        <span>Use a strong password with a mix of letters, numbers, and symbols</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        <span>Don't share your password with anyone</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        <span>Change your password regularly</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-blue-500">•</span>
                        <span>Enable two-factor authentication for extra security</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;