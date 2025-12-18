import React from 'react';
import { FiChevronLeft, FiChevronRight, FiLogOut, FiSettings } from 'react-icons/fi';

const SidebarNav = ({ 
  activeSection, 
  setActiveSection, 
  sectionTabs, 
  collapsed, 
  onToggle 
}) => {
  return (
    <aside className={`fixed left-0 top-0 h-screen bg-gray-900 border-r border-gray-800 transition-all duration-300 ${
      collapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600"></div>
              <span className="ml-3 text-xl font-bold text-white">Dashboard</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 mx-auto"></div>
          )}
          <button
            onClick={onToggle}
            className="p-2 hover:bg-gray-800 rounded-lg transition"
          >
            {collapsed ? (
              <FiChevronRight className="text-gray-400" />
            ) : (
              <FiChevronLeft className="text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4">
        <ul className="space-y-1">
          {sectionTabs.map((tab) => (
            <li key={tab.id}>
              <button
                onClick={() => setActiveSection(tab.id)}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                  activeSection === tab.id
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center">
                  <span className="text-lg">{tab.icon}</span>
                  {!collapsed && (
                    <span className="ml-3 font-medium">{tab.label}</span>
                  )}
                </div>
                {!collapsed && tab.count > 0 && (
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    activeSection === tab.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
        <div className="space-y-2">
          {!collapsed && (
            <button className="w-full flex items-center p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition">
              <FiSettings className="text-lg" />
              <span className="ml-3 font-medium">Settings</span>
            </button>
          )}
          {collapsed && (
            <button className="w-full p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition">
              <FiSettings className="text-lg mx-auto" />
            </button>
          )}
          
          <button
            onClick={() => {
              // Handle logout
            }}
            className={`w-full flex items-center p-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <FiLogOut className="text-lg" />
            {!collapsed && <span className="ml-3 font-medium">Logout</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default SidebarNav;