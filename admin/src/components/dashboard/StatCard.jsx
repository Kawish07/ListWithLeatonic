import React from 'react';
import { FiTrendingUp, FiTrendingDown } from 'react-icons/fi';

const StatCard = ({ title, value, change, icon, color, trend, description }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    teal: 'from-teal-500 to-teal-600',
    red: 'from-red-500 to-red-600'
  };

  const bgColorClasses = {
    blue: 'bg-blue-500/10',
    green: 'bg-green-500/10',
    purple: 'bg-purple-500/10',
    orange: 'bg-orange-500/10',
    teal: 'bg-teal-500/10',
    red: 'bg-red-500/10'
  };

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6 hover:border-gray-600 transition-all duration-300 hover:scale-[1.02]">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center mb-4">
            <div className={`p-3 rounded-xl ${bgColorClasses[color]}`}>
              {icon}
            </div>
          </div>
          <p className="text-gray-400 text-sm font-medium mb-2">{title}</p>
          <p className="text-3xl font-bold text-white mb-2">{value}</p>
          <div className="flex items-center">
            {trend === 'up' ? (
              <FiTrendingUp className="text-green-500 mr-2" />
            ) : trend === 'down' ? (
              <FiTrendingDown className="text-red-500 mr-2" />
            ) : null}
            <span className={`text-sm font-medium ${
              change.includes('+') ? 'text-green-400' :
              change.includes('Requires') ? 'text-orange-400' :
              'text-red-400'
            }`}>
              {change}
            </span>
            <span className="text-gray-500 text-sm ml-2">• {description}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatCard;