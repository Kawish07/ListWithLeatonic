import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../utils/api';
import {
  FiArrowLeft,
  FiPhone,
  FiMail,
  FiMapPin,
  FiCalendar,
  FiEdit,
  FiFileText,
  FiUser,
  FiActivity,
  FiCheckCircle,
  FiXCircle
} from 'react-icons/fi';

const UserLeadDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    const fetchLead = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`/users/leads/${id}`);
        const data = res.data.lead || res.data;
        setLead(data);
      } catch (err) {
        console.error('Failed to load lead', err);
        alert('Failed to load lead details');
        navigate('/user/leads');
      } finally {
        setLoading(false);
      }
    };

    fetchLead();
  }, [id, navigate]);

  const prettyStatus = (s) => s ? s.replace(/_/g, ' ').replace(/-/g, ' ') : 'N/A';

  const handleAddNote = async () => {
    const note = prompt('Add a note for this lead:', lead?.internalNote || '');
    if (note === null) return;
    setSavingNote(true);
    try {
      await axios.put(`users/leads/${id}`, { internalNote: note });
      setLead(prev => ({ ...prev, internalNote: note }));
      alert('Note saved');
    } catch (err) {
      console.error('Error saving note', err);
      alert('Failed to save note');
    } finally {
      setSavingNote(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await axios.put(`users/leads/${id}`, { status: newStatus });
      setLead(prev => ({ ...prev, status: newStatus }));
      alert('Status updated');
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Failed to update status');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-gray-600">Loading lead...</div>
    </div>
  );

  if (!lead) return null;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 rounded hover:bg-gray-100">
              <FiArrowLeft />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{lead.firstName} {lead.lastName}</h1>
              <p className="text-sm text-gray-500">{lead.email} • {lead.phone || 'No phone'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-gray-500">Created</p>
              <p className="text-sm text-gray-800">{new Date(lead.createdAt).toLocaleString()}</p>
            </div>
            <div className="px-3 py-1 bg-gray-100 rounded text-sm text-gray-700">{prettyStatus(lead.status)}</div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Overview</h3>
              <p className="text-gray-700">{lead.requirements || 'No requirements provided.'}</p>
            </div>

            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-xs text-gray-500">Company</p>
                <p className="text-sm text-gray-800">{lead.company || 'N/A'}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-xs text-gray-500">Category</p>
                <p className="text-sm text-gray-800">{lead.category || 'N/A'}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Notes</h3>
              <div className="bg-gray-50 p-4 rounded min-h-[120px]">
                {lead.internalNote ? (
                  <p className="text-gray-700 whitespace-pre-wrap">{lead.internalNote}</p>
                ) : (
                  <p className="text-gray-500">No notes yet. Use Add Note to record interactions.</p>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={handleAddNote} disabled={savingNote} className="px-4 py-2 bg-blue-600 text-white rounded">{savingNote ? 'Saving...' : 'Add / Edit Note'}</button>

              <div className="relative">
                <select value={lead.status || 'pending'} onChange={(e) => handleStatusChange(e.target.value)} className="px-3 py-2 border rounded">
                  <option value="pending">Pending</option>
                  <option value="contacted">Contacted</option>
                  <option value="in_process">In Process</option>
                  <option value="closed">Closed</option>
                  <option value="rejected">Rejected</option>
                  <option value="non-viable">Non-viable</option>
                </select>
              </div>
            </div>
          </div>

          <aside className="bg-gray-50 p-4 rounded">
            <h4 className="text-sm text-gray-600 mb-3">Contact</h4>
            <div className="flex items-center gap-2 mb-2">
              <FiMail className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-800">{lead.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <FiPhone className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-800">{lead.phone || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <FiMapPin className="text-gray-400" />
              <div>
                <p className="text-sm text-gray-800">{lead.city || 'N/A'}</p>
                <p className="text-xs text-gray-500">{lead.stateProvince || ''} {lead.country || ''}</p>
              </div>
            </div>

            <div className="mt-4">
              <h5 className="text-xs text-gray-500 mb-2">Source</h5>
              <div className="text-sm text-gray-800">{lead.source || 'admin'}</div>
            </div>

            <div className="mt-6">
              <h5 className="text-xs text-gray-500 mb-2">Assigned Agent</h5>
              {lead.assignedTo ? (
                <div className="text-sm text-gray-800">{lead.assignedTo.name} <div className="text-xs text-gray-500">{lead.assignedTo.email}</div></div>
              ) : (
                <div className="text-sm text-gray-500">Not assigned</div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default UserLeadDetailPage;
