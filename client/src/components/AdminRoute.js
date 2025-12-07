import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import LoadingSpinner from './LoadingSpinner';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    // Redirect to signin page with return URL
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (user?.role !== 'admin') {
    // Redirect to user dashboard if not admin
    return <Navigate to="/user/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;