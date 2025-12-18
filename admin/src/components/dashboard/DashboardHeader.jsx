import React from 'react';
import { FiSearch, FiRefreshCw, FiBell, FiUser } from 'react-icons/fi';

const DashboardHeader = ({ 
  title, 
  subtitle, 
  searchTerm, 
  setSearchTerm, 
  onRefresh, 
  isLoading,
  notifications,
  showNotifications,
  setShowNotifications
}) => {
  return (
    <header className="sticky top-0 z-40 bg-gray-900/80 backdrop-blur-lg border-b border-gray-800 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="text-gray-400 mt-1">{subtitle}</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white pl-12 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition disabled:opacity-50"
          >
            <FiRefreshCw className={`text-gray-300 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition relative"
            >
              <FiBell className="text-gray-300" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
          </div>

          {/* User Profile */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <FiUser className="text-white" />
            </div>
            <div className="hidden md:block">
              <p className="text-white font-medium">Admin User</p>
              <p className="text-gray-400 text-sm">Administrator</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;