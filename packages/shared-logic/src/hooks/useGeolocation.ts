import { useState, useCallback } from 'react';
import { geoAdapter } from '../adapters/geoAdapter';
import type { GeolocationPosition } from '../adapters/geoAdapter';

export function useGeolocation() {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const getPosition = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!geoAdapter) {
        throw new Error('Geolocation adapter not registered.');
      }
      const pos = await geoAdapter.getCurrentPosition();
      setPosition(pos);
      return pos;
    } catch (err: any) {
      setError(err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    position,
    loading,
    error,
    getPosition
  };
}
