import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminRoute from './components/AdminRoute';
import Sidebar from './components/Sidebar';
import ToastContainer from './components/ToastContainer';
import { useEffect } from 'react';
import useAuthStore from './store/authStore';

// Admin Pages
import AdminDashboard from './pages/DashboardPage';
import AdminPropertiesPage from './pages/PropertiesPage';
import AdminUsersPage from './pages/UsersPage';
import AdminClientsPage from './pages/ClientsPage';
import AdminLeadsPage from './pages/LeadsPage';
import AdvancedSearchPage from './pages/AdvancedSearchPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';


function AdminApp() {
  const { initialize, checkAuth } = useAuthStore();

  useEffect(() => {
    // Initialize from localStorage and then verify token if present.
    const run = async () => {
      const had = initialize();
      if (had) {
        await checkAuth();
      }
    };
    run();
    // Only run once on mount
  }, [initialize, checkAuth]);

  return (
    <div className="flex min-h-screen bg-[#101624]">
      <div className="flex-1 overflow-auto">
        <ToastContainer />
        <Routes>
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/properties" element={<AdminRoute><AdminPropertiesPage /></AdminRoute>} />
          <Route path="/properties/pending" element={<AdminRoute><AdminPropertiesPage pendingOnly={true} /></AdminRoute>} />
          <Route path="/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
          <Route path="/clients" element={<AdminRoute><AdminClientsPage /></AdminRoute>} />
          <Route path="/leads" element={<AdminRoute><AdminLeadsPage /></AdminRoute>} />
          <Route path="/search" element={<AdminRoute><AdvancedSearchPage /></AdminRoute>} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default AdminApp;