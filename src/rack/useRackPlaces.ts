import rackData from '../data/rack.json';
import { createCollectionHook } from '../lib/useCollection';

export type RackCategory = 'Rack recomienda' | 'Vinilos y antigüedades' | 'Tianguis';

export interface RackPlace {
  id: string;
  name: string;
  category: RackCategory;
  description: string;
  imageUrl?: string;
  mapsLink: string;
  coordinates?: { lat: number; lng: number };
  zone?: string; // colonia asignada a mano en el admin
}

// Los ocultos del JSON (puestos sueltos, lugares retirados) sólo se ven en el admin
const bundled = (rackData as (RackPlace & { active: boolean })[]).filter((place) => place.active);

// Lugares de Rack desde /api/rack (Firestore, editables en /admin/spots → Rack); respaldo: src/data/rack.json.
export const useRackPlaces = createCollectionHook<RackPlace>('/api/rack', bundled);
