import { useState, useEffect, useCallback } from 'react';
import { experienceService } from '../services/experienceService';

export function useExperiences() {
  const [experiences, setExperiences] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetchExperiencesAndEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const expRes = await experienceService.getApprovedExperiences();
      const evtRes = await experienceService.getUpcomingEvents();
      
      if (expRes.error) throw expRes.error;
      if (evtRes.error) throw evtRes.error;

      setExperiences(expRes.data || []);
      setEvents(evtRes.data || []);
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExperiencesAndEvents();
  }, [fetchExperiencesAndEvents]);

  return {
    experiences,
    events,
    loading,
    error,
    refetch: fetchExperiencesAndEvents
  };
}
