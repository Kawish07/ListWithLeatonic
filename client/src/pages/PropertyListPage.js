import React, { useEffect, useState } from 'react';
import axios from 'axios';

const PropertyListPage = () => {
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    axios.get('/api/properties').then(res => setProperties(res.data));
  }, []);

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-4 text-white">Available Properties</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map(property => (
          <div key={property._id} className="bg-[#181C2A] p-4 rounded-xl text-white">
            <h3 className="text-xl font-semibold mb-2">{property.title}</h3>
            <p className="mb-1">Price: {property.price}</p>
            <p className="mb-1">Location: {property.location}</p>
            <p className="mb-1">{property.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PropertyListPage;
