import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    axios.get('/api/clients').then(res => setClients(res.data));
  }, []);

  const handleEdit = (client) => {
    setEditing(client._id);
    setForm({
      name: client.name,
      email: client.email,
      phone: client.phone
    });
  };

  const handleDelete = async (id) => {
    await axios.delete(`/api/clients/${id}`);
    setClients(clients.filter(c => c._id !== id));
  };

  const handleSave = async () => {
    if (editing) {
      const res = await axios.put(`/api/clients/${editing}`, form);
      setClients(clients.map(c => c._id === editing ? res.data : c));
      setEditing(null);
    } else {
      const res = await axios.post('/api/clients', form);
      setClients([...clients, res.data]);
    }
    setForm({ name: '', email: '', phone: '' });
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4 text-white">Manage Clients</h2>
      <div className="mb-6 bg-[#181C2A] p-4 rounded-xl">
        <input className="mb-2 p-2 rounded w-full" placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        <input className="mb-2 p-2 rounded w-full" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
        <input className="mb-2 p-2 rounded w-full" placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        <button className="bg-[#2c43f5] text-white px-4 py-2 rounded" onClick={handleSave}>{editing ? 'Update' : 'Add'} Client</button>
        {editing && <button className="ml-2 px-4 py-2 rounded bg-gray-600 text-white" onClick={() => setEditing(null)}>Cancel</button>}
      </div>
      <table className="w-full text-white bg-[#181C2A] rounded-xl">
        <thead>
          <tr>
            <th className="p-2">Name</th>
            <th className="p-2">Email</th>
            <th className="p-2">Phone</th>
            <th className="p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {clients.map(client => (
            <tr key={client._id}>
              <td className="p-2">{client.name}</td>
              <td className="p-2">{client.email}</td>
              <td className="p-2">{client.phone}</td>
              <td className="p-2">
                <button className="px-2 py-1 bg-blue-600 rounded mr-2" onClick={() => handleEdit(client)}>Edit</button>
                <button className="px-2 py-1 bg-red-600 rounded" onClick={() => handleDelete(client._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClientsPage;
