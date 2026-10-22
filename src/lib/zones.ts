// Zona de un lugar. Lo usan la ruleta (zonas agrupadas), las tarjetas de Spots y Rack
// (etiqueta con la colonia) y el admin de spots (asignar colonia a mano).
export type PlanZone = 'centro' | 'americana' | 'poniente';

// Centro de cada colonia; el lugar va a la más cercana si está a menos de 3.5 km.
// zone: grupo de la ruleta. Las colonias sin grupo sólo salen en "Toda la ciudad".
const ZONE_CENTERS: { name: string; zone?: PlanZone; lat: number; lng: number }[] = [
  { name: 'Centro', zone: 'centro', lat: 20.6767, lng: -103.3475 },
  { name: 'Americana', zone: 'americana', lat: 20.6735, lng: -103.3705 },
  { name: 'Providencia', zone: 'poniente', lat: 20.6945, lng: -103.3895 },
  { name: 'Chapalita', zone: 'poniente', lat: 20.6655, lng: -103.4 },
  { name: 'Zapopan', zone: 'poniente', lat: 20.7225, lng: -103.391 },
  { name: 'Andares', zone: 'poniente', lat: 20.7095, lng: -103.413 },
  { name: 'Tlaquepaque', lat: 20.6405, lng: -103.3115 },
];
const MAX_ZONE_KM = 3.5;

// Colonias que se pueden asignar a mano en el admin
export const ZONE_NAMES = ZONE_CENTERS.map((center) => center.name);

const distanceKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const rad = (value: number) => (value * Math.PI) / 180;
  const h = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
};

export type PlaceZone = { name: string; zone?: PlanZone };

// Sin coordenadas o lejos de todas las colonias: sin zona (no se adivina).
export const placeZone = (lat?: number | null, lng?: number | null): PlaceZone | undefined => {
  if (lat == null || lng == null) return undefined;
  let best: { center: (typeof ZONE_CENTERS)[number]; km: number } | undefined;
  for (const center of ZONE_CENTERS) {
    const km = distanceKm(lat, lng, center.lat, center.lng);
    if (!best || km < best.km) best = { center, km };
  }
  return best && best.km <= MAX_ZONE_KM ? { name: best.center.name, zone: best.center.zone } : undefined;
};

// La colonia asignada a mano en el admin gana; si no hay, se calcula con las coordenadas.
// Las colonias agregadas en el admin (meta/zones) no tienen grupo: en la ruleta sólo salen en "Toda".
export const spotZone = (spot: { zone?: string | null; coordinates?: { lat: number; lng: number } | null }): (PlaceZone & { manual: boolean }) | undefined => {
  const manualName = spot.zone?.trim();
  if (manualName) {
    const center = ZONE_CENTERS.find((item) => item.name === manualName);
    return { name: manualName, zone: center?.zone, manual: true };
  }
  const auto = placeZone(spot.coordinates?.lat, spot.coordinates?.lng);
  return auto && { ...auto, manual: false };
};
