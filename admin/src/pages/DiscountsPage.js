import React, { useState, useEffect } from 'react';
import { FiCreditCard, FiCopy, FiTrash2, FiLink, FiClock, FiDollarSign } from 'react-icons/fi';
import useToastStore from '../store/toastStore';

const DiscountsPage = () => {
  const toast = useToastStore(state => state.add);
  const [form, setForm] = useState({
    title: '',
    planName: 'Essential',
    price: '',
    durationMinutes: '',
    planDuration: '',
    referralFee: '',
    paymentLink: ''
  });
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [coupons, setCoupons] = useState([]);

  const plans = ['Essential', 'Accelerate', 'Prestige'];

  const fetchCoupons = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/admin/coupons?limit=200');
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Fetch coupons failed: ${res.status} ${res.statusText} ${text}`);
      }
      const json = await res.json();
      if (json.success) setCoupons(json.coupons || []);
    } catch (err) {
      console.error('fetchCoupons error', err);
      toast({ type: 'error', message: 'Unable to load coupons: ' + err.message });
    }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const getExpiryTime = (c) => {
    if (!c) return null;
    if (c.expiresAt) {
      const t = Date.parse(c.expiresAt);
      return Number.isNaN(t) ? null : t;
    }
    if (c.createdAt && (c.durationMinutes !== undefined && c.durationMinutes !== null)) {
      const t = Date.parse(c.createdAt);
      if (Number.isNaN(t)) return null;
      return t + Number(c.durationMinutes) * 60000;
    }
    return null;
  };

  const isExpired = (c) => {
    const expiry = getExpiryTime(c);
    if (expiry === null) return false;
    return Date.now() > expiry;
  };

  const StatusBadge = ({ item }) => {
    const expiry = getExpiryTime(item);
    if (expiry === null) return <span className="text-yellow-300">Unknown</span>;
    if (Date.now() > expiry) return <span className="text-rose-400 font-medium">Expired</span>;
    return <span className="text-green-300 font-medium">Available</span>;
  };

  const handleChange = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await fetch('http://localhost:5000/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Generate failed: ${res.status} ${res.statusText} ${text}`);
      }
      const json = await res.json();
      if (json.success) {
        setGenerated(json.coupon);
        toast({ type: 'success', message: 'Coupon generated' });
        // refresh list
        fetchCoupons();
      } else {
        throw new Error(json.message || 'Failed to generate');
      }
    } catch (err) {
      console.error('handleGenerate error', err);
      toast({ type: 'error', message: 'Failed to generate coupon: ' + err.message });
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code);
    toast({ type: 'success', message: 'Code copied' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/admin/coupons/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Delete failed: ${res.status} ${res.statusText} ${text}`);
      }
      const json = await res.json();
      if (json.success) {
        toast({ type: 'success', message: 'Coupon deleted' });
        setCoupons(prev => prev.filter(c => c._id !== id));
        if (generated && generated._id === id) setGenerated(null);
      } else {
        throw new Error(json.message || 'Failed to delete');
      }
    } catch (err) {
      console.error(err);
      toast({ type: 'error', message: 'Failed to delete coupon: ' + err.message });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-md bg-gradient-to-br from-indigo-600 to-blue-500 text-white shadow-lg">
            <FiCreditCard className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Discounts</h2>
            <div className="text-sm text-gray-400">Create and manage promotional coupons</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={handleGenerate} className="lg:col-span-1 bg-gradient-to-b from-white/3 to-white/2 p-6 rounded-2xl border border-white/6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Generate Coupon</h3>
              <p className="text-sm text-gray-400">Quickly issue a one-time coupon code</p>
            </div>
            <div className="text-xs text-gray-300">Plans: {plans.length}</div>
          </div>
          <label className="text-sm text-gray-300">Title*</label>
          <input required value={form.title} onChange={(e) => handleChange('title', e.target.value)} className="w-full p-3 rounded-md mt-1 mb-3 bg-transparent text-white border border-white/10 placeholder-gray-400" placeholder="Summer Promo 2025" />

          <label className="text-sm text-gray-300">Plan*</label>
          <select value={form.planName} onChange={(e)=>handleChange('planName', e.target.value)} className="w-full p-3 rounded-md mt-1 mb-3 bg-transparent text-white border border-white/10">
            {plans.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <label className="text-sm text-gray-300">Price*</label>
          <div className="relative">
            <input required type="number" value={form.price} onChange={(e)=>handleChange('price', e.target.value)} className="w-full p-3 rounded-md mt-1 mb-3 bg-transparent text-white border border-white/10" placeholder="99.00" />
            <div className="absolute right-3 top-3 text-gray-400"><FiDollarSign /></div>
          </div>

          <label className="text-sm text-gray-300">Coupon duration (minutes)*</label>
          <div className="relative">
            <input required type="number" value={form.durationMinutes} onChange={(e)=>handleChange('durationMinutes', e.target.value)} className="w-full p-3 rounded-md mt-1 mb-3 bg-transparent text-white border border-white/10" placeholder="1440" />
            <div className="absolute right-3 top-3 text-gray-400"><FiClock /></div>
          </div>

          <label className="text-sm text-gray-300">Plan duration*</label>
          <input required value={form.planDuration} onChange={(e)=>handleChange('planDuration', e.target.value)} className="w-full p-3 rounded-md mt-1 mb-3 bg-transparent text-white border border-white/10" placeholder="1 month" />

          <label className="text-sm text-gray-300">Referral fee*</label>
          <input required type="number" value={form.referralFee} onChange={(e)=>handleChange('referralFee', e.target.value)} className="w-full p-3 rounded-md mt-1 mb-3 bg-transparent text-white border border-white/10" placeholder="10" />

          <label className="text-sm text-gray-300">Payment Link*</label>
          <div className="relative">
            <input required type="url" value={form.paymentLink} onChange={(e)=>handleChange('paymentLink', e.target.value)} className="w-full p-3 rounded-md mt-1 mb-4 bg-transparent text-white border border-white/10" placeholder="https://buy.example.com/plan" />
            <div className="absolute right-3 top-3 text-gray-400"><FiLink /></div>
          </div>

          <div className="flex gap-3">
            <button disabled={generating} className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-blue-500 text-white rounded-lg shadow-md">{generating ? 'Generating...' : 'Generate Coupon'}</button>
            <button type="button" onClick={()=>setForm({ title:'', planName:'Essential', price:'', durationMinutes:'', planDuration:'', referralFee:'', paymentLink:'' })} className="px-4 py-3 bg-white/6 text-white rounded-lg">Reset</button>
          </div>

          {generated && (
            <div className="mt-4 p-4 bg-gradient-to-r from-black/20 to-white/5 rounded-md border border-white/6">
              <div className="text-sm text-gray-300">Your coupon code:</div>
              <div className="flex items-center gap-3 mt-2">
                <div className="font-mono text-xl text-green-300 bg-black/30 px-3 py-2 rounded">{generated.code}</div>
                <button onClick={()=>copyCode(generated.code)} className="text-sm text-gray-200 flex items-center gap-2"><FiCopy /> Copy</button>
              </div>
              <div className="mt-3">
                <StatusBadge item={generated} />
              </div>
            </div>
          )}
        </form>
        <div className="lg:col-span-2 bg-white/6 p-6 rounded-2xl border border-white/6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Coupons</h3>
            <div className="text-sm text-gray-400">Total: <span className="font-medium text-white">{coupons.length}</span></div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {coupons.map(c => (
              <div key={c._id} className="p-4 rounded-xl bg-gradient-to-br from-black/20 to-white/3 border border-white/6 hover:shadow-lg transition">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm text-gray-300">{c.title}</div>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="px-2 py-1 bg-indigo-600 text-white rounded text-xs">{c.planName}</div>
                      <div className="font-mono text-lg text-green-300">{c.code}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-300">${c.price}</div>
                    <div className="text-xs text-gray-400">{c.durationMinutes} min</div>
                    <div className="text-xs mt-1"><StatusBadge item={c} /></div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-300">Plan: {c.planDuration}</div>
                  <div className="text-sm text-gray-300">Referral: {c.referralFee}%</div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => copyCode(c.code)} className="flex items-center gap-2 px-3 py-1 bg-white/6 rounded text-sm text-gray-200"><FiCopy /> Copy</button>
                    <a href={c.paymentLink} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-3 py-1 bg-white/6 rounded text-sm text-gray-200"><FiLink /> Buy</a>
                  </div>
                  <button onClick={() => handleDelete(c._id)} className="flex items-center gap-2 text-rose-400"><FiTrash2 /> Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscountsPage;
