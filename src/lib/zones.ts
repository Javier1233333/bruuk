// Zona de un lugar a partir de sus coordenadas. Lo usan la ruleta (zonas agrupadas)
// y las tarjetas de Spots y Rack (etiqueta con la colonia).
export type PlanZone = 'centro' | 'americana' | 'poniente';

// Centro de cada colonia; el lugar va a la más cercana si está a menos de 3.5 km.
const ZONE_CENTERS: { name: string; zone: PlanZone; lat: number; lng: number }[] = [
  { name: 'Centro', zone: 'centro', lat: 20.6767, lng: -103.3475 },
  { name: 'Americana', zone: 'americana', lat: 20.6735, lng: -103.3705 },
  { name: 'Providencia', zone: 'poniente', lat: 20.6945, lng: -103.3895 },
  { name: 'Chapalita', zone: 'poniente', lat: 20.6655, lng: -103.4 },
  { name: 'Zapopan', zone: 'poniente', lat: 20.7225, lng: -103.391 },
  { name: 'Andares', zone: 'poniente', lat: 20.7095, lng: -103.413 },
];
const MAX_ZONE_KM = 3.5;

const distanceKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const rad = (value: number) => (value * Math.PI) / 180;
  const h = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
};

// Sin coordenadas o lejos de todas las colonias: sin zona (no se adivina).
export const placeZone = (lat?: number | null, lng?: number | null) => {
  if (lat == null || lng == null) return undefined;
  let best: { name: string; zone: PlanZone; km: number } | undefined;
  for (const center of ZONE_CENTERS) {
    const km = distanceKm(lat, lng, center.lat, center.lng);
    if (!best || km < best.km) best = { name: center.name, zone: center.zone, km };
  }
  return best && best.km <= MAX_ZONE_KM ? { name: best.name, zone: best.zone } : undefined;
};
