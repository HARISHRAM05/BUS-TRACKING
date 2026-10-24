// Loads routes + bus positions for the map and refreshes them every few seconds
import { useEffect, useState } from 'react';
import { trackingApi, getErrorMessage } from '../services/api';

const useLiveTracking = (intervalMs = 8000) => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const data = await trackingApi.list();
        if (active) {
          setRoutes(data);
          setError('');
        }
      } catch (err) {
        if (active) setError(getErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    };

    load();
    const timer = setInterval(load, intervalMs);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [intervalMs]);

  return { routes, loading, error };
};

export default useLiveTracking;
