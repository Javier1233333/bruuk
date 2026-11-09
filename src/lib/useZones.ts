import { ZONES, type ZoneId } from './zones';
import { createCollectionHook } from './useCollection';

// Las 7 zonas con lo curado en el admin (texto corto y top), desde las zonas de /api/app.
// Respaldo sin conexión: las zonas sin texto ni top.
export type ZoneInfo = { id: ZoneId; name: string; short: string; color: string; intro: string; picks: string[]; count: number };

export const useZones = createCollectionHook<ZoneInfo>(
  '/api/app',
  ZONES.map((zone) => ({ id: zone.id, name: zone.name, short: zone.short, color: zone.color, intro: '', picks: [], count: 0 })),
  // /api/app también trae "toda" (para la ruleta): sólo nos quedamos con las 7.
  (data) => {
    const zones = (data as { zones?: { id?: string }[] }).zones;
    return Array.isArray(zones) ? zones.filter((zone) => ZONES.some((item) => item.id === zone.id)) : null;
  },
);

// ?zona=<id> en la URL: la zona elegida al explorar (Spots y Rack).
export const zoneFromParam = (value: string | null): ZoneId | null =>
  value && ZONES.some((zone) => zone.id === value) ? (value as ZoneId) : null;
