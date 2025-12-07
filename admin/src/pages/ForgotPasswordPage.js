import React, { useState } from 'react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setMessage(null);

    try {
      const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      setMessage(data.message || 'If the email exists, a reset link has been sent');
    } catch (err) {
      console.error('Forgot password error:', err);
      setMessage('Failed to send reset email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1220] p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-4">Forgot Password</h2>
        <p className="text-sm text-slate-500 mb-4">Enter your admin email and we'll send a password reset link.</p>

        {message && <div className="mb-4 p-3 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Admin email" className="w-full p-3 border rounded-lg" required />

          <div className="flex items-center justify-between">
            <button type="submit" className="bg-[#2c43f5] text-white px-5 py-2 rounded-lg" disabled={sending}>{sending ? 'Sending...' : 'Send Reset Link'}</button>
            <a href="/signin" className="text-sm text-slate-500">Back to sign in</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
