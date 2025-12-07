import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SignUpPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('http://localhost:5000/api/auth/register-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_user', JSON.stringify(data.user));
        window.location.href = '/dashboard';
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      console.error('Admin signup error:', err);
      setError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1220] p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Create Admin Account</h2>
        <p className="text-sm text-slate-500 mb-4">Create the first admin account. If an admin already exists, you must be logged in as admin to create another.</p>

        {error && <div className="mb-4 p-3 rounded bg-red-50 text-red-700 border border-red-100">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="w-full p-3 border rounded-lg" required />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full p-3 border rounded-lg" required />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full p-3 border rounded-lg" required />
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" className="w-full p-3 border rounded-lg" />

          <div className="flex items-center justify-between">
            <button type="submit" className="bg-[#2c43f5] text-white px-5 py-2 rounded-lg" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Admin'}
            </button>
            <a href="/signin" className="text-sm text-slate-500">Already have account?</a>
          </div>
        </form>
      </div>
    </div>
  );
};
export default SignUpPage;
