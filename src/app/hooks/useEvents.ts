import { useState, useEffect, useCallback } from 'react';

export interface AppEvent {
  id: string;
  title: string;
  description: string;
  date_label: string;
  location_text: string;
  location_maps_link: string | null;
  category: string;
  category_color: string;
  capacity: number;
  capacity_remaining: number;
  price_mxn: number;
  is_free: boolean;
  rsvp_count: number;
  is_full: boolean;
}

interface UseEventsResult {
  events: AppEvent[];
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useEvents(): UseEventsResult {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch('/api/app/events');
        if (!r.ok) {
          const d = await r.json() as { error?: string };
          throw new Error(d.error ?? 'Error al cargar eventos');
        }
        const data = await r.json() as AppEvent[];
        if (!cancelled) setEvents(data);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  return { events, loading, error, reload };
}
