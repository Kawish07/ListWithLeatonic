import React, { useState } from 'react';
import axios from 'axios';

const AdvancedSearchPage = () => {
  const [filters, setFilters] = useState({ keyword: '', location: '', priceMin: '', priceMax: '', type: '', amenities: '' });
  const [results, setResults] = useState([]);

  const handleChange = e => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    // Example: send filters to backend (implement backend logic for advanced search)
    const res = await axios.get('/api/properties', { params: filters });
    setResults(res.data);
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4">Advanced Property Search</h2>
      <form onSubmit={handleSearch} className="space-y-4 mb-8">
        <input name="keyword" type="text" placeholder="Keyword" value={filters.keyword} onChange={handleChange} className="w-full p-2 border rounded" />
        <input name="location" type="text" placeholder="Location" value={filters.location} onChange={handleChange} className="w-full p-2 border rounded" />
        <input name="priceMin" type="number" placeholder="Min Price" value={filters.priceMin} onChange={handleChange} className="w-full p-2 border rounded" />
        <input name="priceMax" type="number" placeholder="Max Price" value={filters.priceMax} onChange={handleChange} className="w-full p-2 border rounded" />
        <input name="type" type="text" placeholder="Type" value={filters.type} onChange={handleChange} className="w-full p-2 border rounded" />
        <input name="amenities" type="text" placeholder="Amenities (comma separated)" value={filters.amenities} onChange={handleChange} className="w-full p-2 border rounded" />
        <button type="submit" className="w-full bg-accent text-white py-2 rounded-xl font-bold">Search</button>
      </form>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map(property => (
          <div key={property._id} className="bg-white rounded-xl shadow-subtle p-4">
            <h3 className="text-xl font-bold text-accent mb-2">{property.title}</h3>
            <div className="mb-2">{property.location}</div>
            <div className="mb-2">${property.price}</div>
            <div className="mb-2">{property.type}</div>
            <div className="mb-2">Amenities: {property.amenities?.join(', ')}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdvancedSearchPage;
