import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import useToastStore from '../store/toastStore';

const LeadsPage = () => {
  const [leads, setLeads] = useState([]);
  const [agents, setAgents] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', status: '' });
  const [viewLead, setViewLead] = useState(null);

  // Status options - keep values canonical (match server) but show friendly labels
  const STATUS_OPTIONS = useMemo(() => ([
    { value: '', label: 'Select status' },
    { value: 'pending', label: 'Pending' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'in_process', label: 'In Process' },
    { value: 'closed', label: 'Closed' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'non-viable', label: 'Non-viable' }
  ]), []);

  const formatStatus = (status) => {
    if (!status) return '—';
    const found = STATUS_OPTIONS.find(s => s.value === status);
    return found ? found.label : String(status);
  };

  useEffect(() => {
    axios.get('/api/leads').then(res => setLeads(res.data));
    // fetch agents with membership info
    axios.get('/api/admin/agents').then(res => {
      if (res.data && res.data.agents) setAgents(res.data.agents);
    }).catch(() => {});
  }, []);

  // Poll for updates so admin sees agent changes dynamically
  useEffect(() => {
    const interval = setInterval(() => {
      axios.get('/api/leads').then(res => setLeads(res.data)).catch(() => {});
    }, 10000); // every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const handleEdit = (lead) => {
    setEditing(lead._id);
    setForm({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      status: lead.status || ''
    });
  };

  // Deletion by agents/admin from this UI removed per request

  const handleSave = async () => {
    if (editing) {
      const res = await axios.put(`/api/leads/${editing}`, form);
      setLeads(leads.map(l => l._id === editing ? res.data : l));
      setEditing(null);
    } else {
      const res = await axios.post('/api/leads', form);
      setLeads([...leads, res.data]);
    }
    setForm({ name: '', email: '', phone: '', status: '' });
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4 text-white">Manage Leads</h2>
      {/* Agents membership suggestions */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {agents.map(agent => {
          const assigned = leads.filter(l => l.assignedTo && (String(l.assignedTo._id || l.assignedTo) === String(agent._id))).length;
          const membership = agent.agentInfo?.membership || { program: 'Realizty', plan: '', leadsPerMonth: 0 };
          return (
            <div key={agent._id} className="bg-[#0b1220] p-4 rounded-lg border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-semibold">{agent.name}</div>
                  <div className="text-gray-400 text-sm">{agent.email}</div>
                </div>
                <div className="text-right text-sm">
                  <div className="text-gray-400">Plan</div>
                  <div className="text-white">{membership.plan || '—'}</div>
                </div>
              </div>
              <div className="mt-3 text-sm text-gray-400">Suggested: <span className="text-white">{membership.leadsPerMonth || 0}</span> leads / month</div>
              <div className="mt-1 text-sm text-gray-400">Assigned: <span className="text-white">{assigned}</span></div>
            </div>
          );
        })}
      </div>
      <div className="mb-6 bg-[#181C2A] p-4 rounded-xl">
        <input className="mb-2 p-2 rounded w-full" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input className="mb-2 p-2 rounded w-full" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <input className="mb-2 p-2 rounded w-full" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        <select className="mb-2 p-2 rounded w-full" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button className="bg-[#2c43f5] text-white px-4 py-2 rounded" onClick={handleSave}>{editing ? 'Update' : 'Add'} Lead</button>
        {editing && <button className="ml-2 px-4 py-2 rounded bg-gray-600 text-white" onClick={() => setEditing(null)}>Cancel</button>}
      </div>
      <table className="w-full text-white bg-[#181C2A] rounded-xl">
        <thead>
          <tr>
            <th className="p-2">Name</th>
            <th className="p-2">Email</th>
            <th className="p-2">Phone</th>
            <th className="p-2">Status</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {leads.map(lead => (
            <tr key={lead._id}>
              <td className="p-2">{lead.name}</td>
              <td className="p-2">{lead.email}</td>
              <td className="p-2">{lead.phone}</td>
              <td className="p-2">{formatStatus(lead.status)}</td>
              <td className="p-2">
                <button className="px-2 py-1 bg-blue-600 rounded mr-2" onClick={() => handleEdit(lead)}>Edit</button>
                <button
                  className="px-2 py-1 bg-gray-600 rounded mr-2"
                  onClick={() => setViewLead(lead)}
                >View</button>
                <button
                  className="px-2 py-1 bg-gray-500 rounded"
                  onClick={async () => {
                    const note = prompt('Add a note for this lead:', lead.internalNote || '');
                    if (note !== null) {
                      try {
                        await axios.put(`/api/leads/${lead._id}`, { internalNote: note });
                        useToastStore.getState().add({ type: 'success', message: 'Note saved' });
                        const res = await axios.get('/api/leads');
                        setLeads(res.data);
                      } catch (err) {
                        useToastStore.getState().add({ type: 'error', message: 'Failed to save note' });
                      }
                    }
                  }}
                >Add Note</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {viewLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setViewLead(null)}></div>
          <div className="relative bg-[#0b1220] text-white w-11/12 max-w-lg p-6 rounded-lg shadow-lg z-10">
            <h3 className="text-xl font-semibold mb-2">{viewLead.name || viewLead.firstName}</h3>
            <div className="text-sm text-gray-300 mb-2">Email: {viewLead.email}</div>
            <div className="text-sm text-gray-300 mb-2">Phone: {viewLead.phone}</div>
            <div className="text-sm text-gray-300 mb-2">Status: {formatStatus(viewLead.status)}</div>
            <div className="text-sm text-gray-300 mb-4">Notes: {viewLead.internalNote || '—'}</div>
            <div className="flex justify-end">
              <button className="px-4 py-2 bg-gray-600 rounded" onClick={() => setViewLead(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsPage;
