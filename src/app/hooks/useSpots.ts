import { useState, useEffect } from 'react';

export interface Spot {
  id: string;
  name: string;
  type: string;
  description: string;
  imageUrl: string;
  colorAccent: string;
  rating?: number;
  price?: string;
  mapsLink: string;
  coordinates?: { lat: number; lng: number };
}

// Cache de módulo: solo se fetcha una vez por sesión
let cachedSpots: Spot[] | null = null;
let fetchPromise: Promise<Spot[]> | null = null;

function fetchSpots(): Promise<Spot[]> {
  if (fetchPromise) return fetchPromise;
  fetchPromise = fetch('/api/spots')
    .then((r) => {
      if (!r.ok) throw new Error('Error al cargar spots');
      return r.json() as Promise<Spot[]>;
    })
    .then((data) => {
      cachedSpots = data;
      return data;
    })
    .catch((err: unknown) => {
      fetchPromise = null; // permitir retry
      throw err;
    });
  return fetchPromise;
}

interface UseSpotsResult {
  spots: Spot[];
  loading: boolean;
  error: string | null;
}

export function useSpots(): UseSpotsResult {
  const [spots, setSpots] = useState<Spot[]>(cachedSpots ?? []);
  const [loading, setLoading] = useState(!cachedSpots);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cachedSpots) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      setLoading(true);
      try {
        const data = await fetchSpots();
        if (!cancelled) setSpots(data);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, []);

  return { spots, loading, error };
}
