import React, { useEffect, useState } from 'react';
import { useParams, useLocation as useRouterLocation } from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import PropertyCard from '../components/PropertyCard';
import api from '../utils/api';

const LOCATIONS = [
  { id: 'california', name: 'California', image: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=1400&h=900&fit=crop' },
  { id: 'newyork', name: 'New York', image: 'https://images.unsplash.com/photo-1543716091-a840c05249ec?w=1400&h=900&fit=crop' },
  { id: 'texas', name: 'Texas', image: 'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=1400&h=900&fit=crop' },
  { id: 'florida', name: 'Florida', image: 'https://images.unsplash.com/photo-1506812574058-fc75fa93fead?w=1400&h=900&fit=crop' }
];

const LocationPage = () => {
  const { id } = useParams();
  const routerLocation = useRouterLocation();
  const rawState = routerLocation.state || null;
  const stateLocation = rawState && (rawState.location ? rawState.location : rawState);

  const [locationInfo, setLocationInfo] = useState(() => {
    if (stateLocation) return stateLocation;
    return LOCATIONS.find(l => l.id === id) || { id, name: id, image: '' };
  });

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // If we navigated with state (either { location } or a simple object), ensure local info is set
    if (stateLocation) setLocationInfo(stateLocation);
  }, [stateLocation]);

  useEffect(() => {
    const fetchAndFilter = async () => {
      setLoading(true);
      setError('');
      try {
        // Use centralized axios helper so the request goes to the configured backend base URL
        const res = await api.get('/properties');
        // api returns the full axios response; property list expected at res.data.properties or res.data
        let data = res.data?.properties ?? res.data ?? [];

        if (!Array.isArray(data)) {
          console.warn('Expected an array of properties but received:', data);
          setError('Invalid property data returned from server.');
          setProperties([]);
          setLoading(false);
          return;
        }

        const name = (locationInfo && locationInfo.name) ? locationInfo.name.toLowerCase() : (id || '').toLowerCase();

        const filtered = (data || []).filter(p => {
          if (!p) return false;
          const fields = [p.city, p.location, p.address, p.state, p.country, p.area, p.title, p.description].filter(Boolean);
          return fields.some(f => String(f).toLowerCase().includes(name));
        });

        setProperties(filtered);
      } catch (err) {
        console.error(err);
        setError('Could not load properties.');
      } finally {
        setLoading(false);
      }
    };

    fetchAndFilter();
  }, [id, locationInfo]);

  return (
    <div className="app-theme">
      <HeroSection
        overrideImage={locationInfo.image}
        overrideTitle={`${locationInfo.name} Properties`}
        overrideSubtitle={`Browse the latest listings in ${locationInfo.name}.`}
        overrideCta={`Browse ${locationInfo.name}`}
        overrideHighlight={locationInfo.name}
      />

      <div className="max-w-6xl mx-auto py-12 px-4">
        <h2 className="text-3xl font-bold mb-6">Properties in {locationInfo.name}</h2>

        {loading && <div className="text-slate-600">Loading properties…</div>}
        {error && <div className="text-red-500">{error}</div>}

        {!loading && properties.length === 0 && (
          <div className="rounded-xl bg-white shadow p-8 text-center">
            <p className="text-lg text-slate-700">No properties found for {locationInfo.name}.</p>
            <p className="text-sm text-slate-500 mt-2">Showing all properties is available from the homepage.</p>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
          {properties.map(prop => (
            <PropertyCard key={prop._id || prop.id} property={prop} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LocationPage;
