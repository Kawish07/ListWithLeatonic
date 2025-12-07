import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const SignInPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, initialize, isAuthenticated, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // Reset flow states
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetMessage, setResetMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    initialize();
    if (isAuthenticated) {
      navigate('/dashboard');
    }
    // Parse reset params if present
    try {
      const params = new URLSearchParams(location.search);
      const reset = params.get('reset');
      const token = params.get('token');
      const e = params.get('email');
      if (reset === 'true' && token) {
        setIsResetMode(true);
        setResetToken(token);
        if (e) setResetEmail(decodeURIComponent(e));
        if (e) setEmail(decodeURIComponent(e));
      }
    } catch (err) {
      // ignore
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const result = await login(email, password);
    if (result.success) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } else {
      setMessage(result.error || result.message || 'Login failed');
    }

    setSubmitting(false);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setResetMessage(null);
    if (!resetToken || !resetEmail) return setResetMessage('Invalid reset link');
    if (newPassword !== confirmPassword) return setResetMessage('Passwords do not match');
    if (newPassword.length < 6) return setResetMessage('Password must be at least 6 characters');

    setResetSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail, token: resetToken, newPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResetMessage('Password updated. You can now sign in.');
        // pre-fill sign-in email and clear reset UI
        setEmail(resetEmail);
        setIsResetMode(false);
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setResetMessage(data.message || 'Reset failed');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setResetMessage('Reset failed');
    } finally {
      setResetSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1220] p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Admin Sign In</h2>
        <p className="text-sm text-slate-500 mb-4">Sign in with your administrator account to access the admin panel.</p>

        {message && (
          <div className="mb-4 p-3 rounded bg-red-50 text-red-700 border border-red-100">{message}</div>
        )}

        {/* Reset form shown when coming from reset link */}
        {isResetMode && (
          <form onSubmit={handleReset} className="space-y-3 mb-4">
            <div className="p-3 bg-yellow-50 border border-yellow-100 rounded">
              <p className="text-sm text-yellow-800 mb-2">Reset password for <strong>{resetEmail}</strong></p>
              {resetMessage && <div className="mb-2 p-2 rounded bg-emerald-50 text-emerald-700">{resetMessage}</div>}
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="w-full p-3 border rounded-lg mb-2"
                required
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full p-3 border rounded-lg"
                required
              />
              <div className="flex items-center justify-end mt-3">
                <button type="submit" className="bg-[#2c43f5] text-white px-4 py-2 rounded-lg" disabled={resetSubmitting}>
                  {resetSubmitting ? 'Saving...' : 'Save New Password'}
                </button>
              </div>
            </div>
          </form>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full p-3 border rounded-lg"
            required
          />

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-3 border rounded-lg"
            required
          />

          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-[#2c43f5] text-white px-5 py-2 rounded-lg"
              disabled={submitting}
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
            <div className="flex flex-col items-end">
              <a href="/forgot-password" className="text-sm text-blue-600 hover:underline mb-1">Forgot password?</a>
            </div>
          </div>
        </form>

        <div className="mt-4 text-sm text-slate-500">{isLoading ? 'Checking session...' : ''}</div>
      </div>
    </div>
  );
};

export default SignInPage;
