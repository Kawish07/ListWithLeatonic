import React, { useState } from 'react';
import api from '../utils/api';
import { FiSend, FiMail, FiPhone, FiUser, FiMessageSquare, FiAlertCircle, FiCheck } from 'react-icons/fi';

const ContactAdminForm = ({ initialName = '', initialEmail = '' }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setResult(null);

    try {
      const payload = { name, email, phone, subject, message };
      const res = await api.post('/contact', payload);
      if (res.data && res.data.success) {
        setResult({ success: true, message: 'Message sent to admin successfully.' });
        setSubject('');
        setMessage('');
      } else {
        setResult({ success: false, message: res.data?.message || 'Failed to send message' });
      }
    } catch (err) {
      console.error('Contact form error:', err);
      setResult({ success: false, message: err.response?.data?.message || err.message || 'Failed to send message' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mt-8 bg-white/80 backdrop-blur-lg rounded-2xl shadow-lg p-6 border border-white/50">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-gradient-to-r from-sky-500 to-blue-500 rounded-xl">
          <FiMail className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-blue-900">Contact Admin</h3>
          <p className="text-blue-600 text-sm">Have a question or need help? Send a message and we'll get back to you.</p>
        </div>
      </div>

      {result && (
        <div className={`mb-6 p-4 rounded-xl backdrop-blur-md border flex items-center gap-3 ${
          result.success 
            ? 'bg-emerald-500/10 border-emerald-200/50 text-emerald-800' 
            : 'bg-rose-500/10 border-rose-200/50 text-rose-800'
        }`}>
          {result.success ? <FiCheck className="text-emerald-600" /> : <FiAlertCircle className="text-rose-600" />}
          <span>{result.message}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <FiUser className="absolute left-3 top-3.5 text-blue-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full pl-10 pr-4 py-3 border border-blue-200/50 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-300"
              required
            />
          </div>

          <div className="relative">
            <FiMail className="absolute left-3 top-3.5 text-blue-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              className="w-full pl-10 pr-4 py-3 border border-blue-200/50 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-300"
              required
            />
          </div>
        </div>

        <div className="relative">
          <FiPhone className="absolute left-3 top-3.5 text-blue-400" />
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone (optional)"
            className="w-full pl-10 pr-4 py-3 border border-blue-200/50 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-300"
          />
        </div>

        <div className="relative">
          <FiMessageSquare className="absolute left-3 top-3.5 text-blue-400" />
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
            className="w-full pl-10 pr-4 py-3 border border-blue-200/50 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-300"
          />
        </div>

        <div className="relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="How can we help you?"
            rows={5}
            className="w-full px-4 py-3 border border-blue-200/50 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white/50 backdrop-blur-sm transition-all duration-300 resize-none"
            required
          />
          <div className="absolute bottom-3 right-3 text-blue-400 text-sm">
            {message.length}/500
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-blue-100">
          <button
            type="submit"
            disabled={sending}
            className="px-6 py-3 bg-gradient-to-r from-sky-500 to-blue-500 text-white rounded-xl hover:from-sky-600 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
          >
            {sending ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Sending...
              </>
            ) : (
              <>
                <FiSend />
                Send Message
              </>
            )}
          </button>
          <p className="text-sm text-blue-500">We will reply to your email within 24 hours.</p>
        </div>
      </form>
    </div>
  );
};

export default ContactAdminForm;