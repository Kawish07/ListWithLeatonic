import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const t = searchParams.get('token');
    const e = searchParams.get('email');
    if (t) setToken(t);
    if (e) setEmail(decodeURIComponent(e));
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    if (newPassword !== confirmPassword) return setMessage('Passwords do not match');
    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:5000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, newPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessage('Password reset successful. Redirecting to sign in...');
        setTimeout(() => navigate('/signin'), 2000);
      } else {
        setMessage(data.message || 'Reset failed');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      setMessage('Reset failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1220] p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Reset Password</h2>
        <p className="text-sm text-slate-500 mb-4">Set a new password for your admin account.</p>

        {message && <div className="mb-4 p-3 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password" className="w-full p-3 border rounded-lg" required />
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" className="w-full p-3 border rounded-lg" required />

          <div className="flex items-center justify-between">
            <button type="submit" className="bg-[#2c43f5] text-white px-5 py-2 rounded-lg" disabled={submitting}>{submitting ? 'Saving...' : 'Save New Password'}</button>
            <a href="/signin" className="text-sm text-slate-500">Back to sign in</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
