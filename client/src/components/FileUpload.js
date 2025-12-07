import React, { useState } from 'react';
import axios from 'axios';

const FileUpload = ({ propertyId, onUploaded }) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');

  const handleChange = e => setFile(e.target.files[0]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return setError('No file selected');
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await axios.post(`/api/properties/${propertyId}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onUploaded(res.data);
    } catch (err) {
      setError('Upload failed');
    }
  };

  return (
    <form onSubmit={handleUpload} className="space-y-4 p-4 bg-white rounded-xl shadow-subtle">
      <input type="file" onChange={handleChange} className="w-full" />
      {error && <div className="text-red-500">{error}</div>}
      <button type="submit" className="w-full bg-accent text-white py-2 rounded-xl font-bold">Upload</button>
    </form>
  );
};

export default FileUpload;
