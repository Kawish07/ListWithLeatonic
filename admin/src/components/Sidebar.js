// client/src/components/AdminSidebar.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import {
  FiHome,
  FiUsers,
  FiTrendingUp,
  FiTarget,
  FiDollarSign,
  FiSettings,
  FiSearch,
  FiGrid,
  FiMessageSquare,
  FiFileText,
  FiLogOut,
  FiUser,
  FiPieChart,
  FiBarChart2,
  FiCalendar
} from 'react-icons/fi';
// import { useAuthStore } from '../store/authStore';

const AdminSidebar = () => {
  const location = useLocation();
  // const { logout, user } = useAuthStore();

  const navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: <FiHome /> },
    { path: '/admin/properties', label: 'Properties', icon: <FiGrid /> },
    { path: '/admin/clients', label: 'Clients', icon: <FiUsers /> },
    { path: '/admin/leads', label: 'Leads', icon: <FiTrendingUp /> },
    { path: '/admin/users', label: 'Users', icon: <FiUser /> },
    { path: '/admin/revenue', label: 'Revenue', icon: <FiDollarSign /> },
    { path: '/admin/search', label: 'Advanced Search', icon: <FiSearch /> },
    { path: '/admin/settings', label: 'Settings', icon: <FiSettings /> },
    // Add a compact logout item so collapsed sidebars still show a logout icon
    { path: '/logout', label: 'Logout', icon: <FiLogOut />, isAction: true }
  ];

  const handleLogout = () => {
    // call logout from auth store (clears token + redirects)
    try {
      const { logout } = useAuthStore.getState ? useAuthStore.getState() : useAuthStore();
      if (typeof logout === 'function') {
        logout();
        return;
      }
    } catch (err) {
      // fallback
    }
    window.location.href = '/signin';
  };

  return (
    <div className="w-64 bg-[#101624] min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold text-white">
          <span className="text-[#2c43f5]">ListWith</span>Litanic
        </h1>
        <p className="text-gray-400 text-sm mt-1">Admin Panel</p>
      </div>

      {/* User Info */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-[#2c43f5] to-[#0519ad] rounded-full flex items-center justify-center">
            <span className="text-white font-bold">A</span>
          </div>
          <div>
            <h3 className="text-white font-medium">Admin</h3>
            <p className="text-gray-400 text-sm">admin@example.com</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              {item.isAction ? (
                <button
                  onClick={handleLogout}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                    'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              ) : (
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                    location.pathname === item.path
                      ? 'bg-[#2c43f5] text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-red-900/20 hover:text-red-400 transition-all duration-300 w-full"
        >
          <FiLogOut />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;