// client/src/hooks/usePropertyUpdates.js
import { useEffect } from 'react';
import axios from '../utils/api';

const usePropertyUpdates = (propertyId, onUpdate) => {
  useEffect(() => {
    if (!propertyId) return;
    
    // Poll for updates every 30 seconds
    const interval = setInterval(async () => {
      try {
        const response = await axios.get(`/properties/${propertyId}`);
        if (response.data.success) {
          onUpdate(response.data.property);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [propertyId, onUpdate]);
};

export default usePropertyUpdates;