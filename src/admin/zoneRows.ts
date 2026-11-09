import { rackCategory, spotCategory } from './adminCategories';
import { rackStore, setSpotZone } from './spotsStore';
import type { RackDoc, SpotDoc } from './spotsStore';

// Spots y lugares de Rack juntos, para las pestañas Zonas y Mapa del admin.
export type PlaceRow = { key: string; source: 'spots' | 'rack'; item: SpotDoc | RackDoc };

export const placeRows = (spots: SpotDoc[], rack: RackDoc[]): PlaceRow[] => [
  ...spots.map((item) => ({ key: `spots/${item.id}`, source: 'spots' as const, item })),
  ...rack.map((item) => ({ key: `rack/${item.id}`, source: 'rack' as const, item })),
];

export const setRowZone = (row: PlaceRow, zoneId: string | null) =>
  (row.source === 'spots' ? setSpotZone : rackStore.setZone)(row.item.id, zoneId);

export const rowCategory = (row: PlaceRow) => (row.source === 'spots' ? spotCategory(row.item as SpotDoc) : rackCategory(row.item as RackDoc));
export const rowKind = (row: PlaceRow) => (row.source === 'spots' ? (row.item as SpotDoc).type : `Rack · ${(row.item as RackDoc).category}`);
