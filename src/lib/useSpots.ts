import { useEffect, useState } from 'react';
import spotsData from '../data/spots.json';

// Forma común de un spot; cada página castea a su propio tipo.
export type SpotRecord = (typeof spotsData)[number] & Record<string, unknown>;

/* ============================================================
   Spots desde /api/spots (Firestore, editables en /admin/spots).
   Arranca con src/data/spots.json para pintar al instante y
   lo reemplaza cuando llega la API. Si la API falla, se queda
   con el JSON. Una sola petición por carga de página.
   ============================================================ */

const bundled = spotsData as SpotRecord[];
let cached: SpotRecord[] | null = null;
let request: Promise<SpotRecord[] | null> | null = null;

function loadSpots(): Promise<SpotRecord[] | null> {
  request ??= fetch('/api/spots')
    .then((res) => (res.ok ? res.json() : null))
    .then((data: unknown) => {
      if (!Array.isArray(data) || data.length === 0) return null;
      cached = data as SpotRecord[];
      return cached;
    })
    .catch(() => null);
  return request;
}

export function useSpots(): SpotRecord[] {
  const [spots, setSpots] = useState<SpotRecord[]>(() => cached ?? bundled);

  useEffect(() => {
    if (cached) return;
    let alive = true;
    loadSpots().then((fresh) => {
      // Solo re-renderiza si algo cambió, para no reordenar la vista de balde
      if (alive && fresh && JSON.stringify(fresh) !== JSON.stringify(bundled)) setSpots(fresh);
    });
    return () => {
      alive = false;
    };
  }, []);

  return spots;
}
