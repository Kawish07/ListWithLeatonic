// client/src/components/ProtectedRoute.js - Updated
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children, allowedRoles = [], redirectTo = '/' }) => {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // If specific roles are required
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
};

// Specific route helpers
export const ClientRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['client']} redirectTo="/user/dashboard">
    {children}
  </ProtectedRoute>
);

export const AgentRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['agent', 'admin']} redirectTo="/user/dashboard">
    {children}
  </ProtectedRoute>
);

export const AdminRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin']} redirectTo="/user/dashboard">
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;