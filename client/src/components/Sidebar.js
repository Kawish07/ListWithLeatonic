import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiHome,
  FiUser,
  FiGrid,
  FiMessageSquare,
  FiSettings,
  FiLogOut,
  FiPlus,
  FiEye,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiTrendingUp,
  FiUsers,
  FiDollarSign,
  FiSearch
} from 'react-icons/fi';
import useAuthStore from '../store/authStore';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const userNavItems = [
    { path: '/user/dashboard', label: 'Dashboard', icon: <FiHome /> },
    { path: '/user/properties', label: 'My Properties', icon: <FiGrid /> },
    { path: '/add-property', label: 'Add Property', icon: <FiPlus /> },
    { path: '/user/leads', label: 'My Leads', icon: <FiTrendingUp /> },
    { path: '/user/profile', label: 'Profile', icon: <FiUser /> },
  ];

  const adminNavItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: <FiHome /> },
    { path: '/admin/properties', label: 'Properties', icon: <FiGrid /> },
    { path: '/admin/properties/pending', label: 'Pending Review', icon: <FiClock /> },
    { path: '/admin/clients', label: 'Clients', icon: <FiUsers /> },
    { path: '/admin/leads', label: 'Leads', icon: <FiTrendingUp /> },
    { path: '/admin/users', label: 'Users', icon: <FiUser /> },
    { path: '/admin/revenue', label: 'Revenue', icon: <FiDollarSign /> },
    { path: '/admin/search', label: 'Advanced Search', icon: <FiSearch /> },
  ];

  const navItems = user?.role === 'admin' ? adminNavItems : userNavItems;

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  return (
    <div className="w-64 bg-white/80 backdrop-blur-xl min-h-screen flex flex-col border-r border-blue-100 shadow-lg">
      {/* Logo */}
      <div className="p-6 border-b border-blue-100">
        <h1 className="text-2xl font-bold">
          <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 bg-clip-text text-transparent">ListWith</span>
          <span className="text-gray-800">Leatonic</span>
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          {user?.role === 'admin' ? 'Admin Panel' : 'User Dashboard'}
        </p>
      </div>

      {/* User Info */}
      <div className="p-6 border-b border-blue-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-md">
            <span className="text-white font-bold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <h3 className="text-gray-800 font-semibold">{user?.name || 'User'}</h3>
            <p className="text-gray-600 text-sm">{user?.email || ''}</p>
            <span className={`inline-block px-2 py-0.5 text-xs rounded-full mt-1 ${
              user?.role === 'admin' 
                ? 'bg-purple-100 text-purple-600 border border-purple-200' 
                : 'bg-blue-100 text-blue-600 border border-blue-200'
            }`}>
              {user?.role || 'user'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                  location.pathname === item.path
                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                    : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-blue-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-500 transition-all duration-300 w-full"
        >
          <FiLogOut />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;