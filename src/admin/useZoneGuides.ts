import { useSyncExternalStore } from 'react';
import { ZONE_IDS, readShape, type ZoneShapes } from '../lib/zones';
import { watchZoneGuides, type ZoneGuide } from './spotsStore';

/* ============================================================
   meta/zoneGuides compartido por las pestañas Zonas y Mapa, el
   selector de zona y el importador: una sola suscripción mientras
   alguien lo use. De ahí salen el texto, el top y los trazos.
   ============================================================ */

type State = { guides: Record<string, ZoneGuide>; shapes: ZoneShapes; error: string | null };

let state: State = { guides: {}, shapes: {}, error: null };
const listeners = new Set<() => void>();
let stop: (() => void) | null = null;

const emit = (next: State) => {
  state = next;
  listeners.forEach((listener) => listener());
};

const toShapes = (guides: Record<string, ZoneGuide>): ZoneShapes => {
  const shapes: ZoneShapes = {};
  for (const id of ZONE_IDS) {
    const shape = readShape(guides[id]?.shape);
    if (shape) shapes[id] = shape;
  }
  return shapes;
};

function subscribe(listener: () => void) {
  listeners.add(listener);
  stop ??= watchZoneGuides(
    (guides) => emit({ guides, shapes: toShapes(guides), error: null }),
    (err) => emit({ ...state, error: `No se pudieron cargar las zonas: ${err.message}` }),
  );
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      stop?.();
      stop = null;
    }
  };
}

export const useZoneGuides = () => useSyncExternalStore(subscribe, () => state);
