import { useState, useCallback } from 'react';
import { experienceService } from '../services/experienceService';

export function useBooking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  const createBooking = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    try {
      const res = await experienceService.createBooking(data);
      if (res.error) throw res.error;
      return { success: true, data: res.data };
    } catch (err: any) {
      setError(err);
      return { success: false, error: err };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createBooking,
    loading,
    error
  };
}
