import spotsData from '../data/spots.json';
import { createCollectionHook } from './useCollection';

// Forma común de un spot; cada página castea a su propio tipo.
export type SpotRecord = (typeof spotsData)[number] & Record<string, unknown>;

// Spots desde /api/spots (Firestore, editables en /admin/spots); respaldo: src/data/spots.json.
export const useSpots = createCollectionHook<SpotRecord>('/api/spots', spotsData as SpotRecord[]);
