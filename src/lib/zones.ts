// Las 7 zonas de Bruuk. La zona de cada lugar la decide el admin (curada a mano);
// la distancia sólo sirve para sugerirla en el admin y para dibujar el mapa.
// Lo que no cae en ninguna (Andares, lejanos, sin coordenadas) queda "sin zona".

export type ZoneId = 'americana' | 'santa-tere' | 'providencia' | 'chapalita' | 'centro' | 'zapopan' | 'tlaquepaque';
// Nombre anterior del tipo (la ruleta y la app lo importan así).
export type PlanZone = ZoneId;

export type Zone = {
  id: ZoneId;
  name: string;
  // Para chips y etiquetas cortas.
  short: string;
  color: string;
  // Centro y radio aproximados: sólo para sugerir y dibujar el círculo en el mapa del admin.
  center: { lat: number; lng: number };
  radiusKm: number;
};

export const ZONES: Zone[] = [
  { id: 'americana', name: 'Americana / Lafayette / Moderna', short: 'Americana', color: '#8b7cf6', center: { lat: 20.6705, lng: -103.3685 }, radiusKm: 1.7 },
  { id: 'santa-tere', name: 'Santa Tere', short: 'Santa Tere', color: '#ff9a5c', center: { lat: 20.6835, lng: -103.365 }, radiusKm: 1 },
  { id: 'providencia', name: 'Providencia', short: 'Providencia', color: '#4fb3a9', center: { lat: 20.6945, lng: -103.3895 }, radiusKm: 1.8 },
  { id: 'chapalita', name: 'Chapalita', short: 'Chapalita', color: '#7fc36a', center: { lat: 20.6655, lng: -103.4 }, radiusKm: 1.6 },
  { id: 'centro', name: 'GDL Centro', short: 'Centro', color: '#d9485f', center: { lat: 20.6767, lng: -103.3475 }, radiusKm: 1.5 },
  { id: 'zapopan', name: 'Zapopan Centro', short: 'Zapopan', color: '#e8c547', center: { lat: 20.7225, lng: -103.391 }, radiusKm: 1.6 },
  { id: 'tlaquepaque', name: 'Tlaquepaque', short: 'Tlaquepaque', color: '#5b8def', center: { lat: 20.6405, lng: -103.3115 }, radiusKm: 1.6 },
];

export const ZONE_BY_ID = new Map(ZONES.map((zone) => [zone.id, zone]));
export const ZONE_IDS = ZONES.map((zone) => zone.id);

const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

// Antes la zona se guardaba con el nombre de la colonia ("Americana", "Centro"…).
// Se aceptan esos nombres para lo ya guardado; "Andares" y las colonias personalizadas quedan sin zona.
const LEGACY_NAMES: Record<string, ZoneId> = {
  americana: 'americana',
  lafayette: 'americana',
  moderna: 'americana',
  'santa tere': 'santa-tere',
  'santa teresita': 'santa-tere',
  providencia: 'providencia',
  chapalita: 'chapalita',
  centro: 'centro',
  'gdl centro': 'centro',
  zapopan: 'zapopan',
  'zapopan centro': 'zapopan',
  tlaquepaque: 'tlaquepaque',
};

export function zoneIdFrom(value?: string | null): ZoneId | undefined {
  if (!value) return undefined;
  const key = normalize(value);
  if (ZONE_BY_ID.has(key as ZoneId)) return key as ZoneId;
  return LEGACY_NAMES[key] ?? ZONES.find((zone) => normalize(zone.name) === key)?.id;
}

// La zona asignada a mano en el admin, o nada. Sin asignar no se adivina: queda pendiente.
export const spotZone = (place: { zone?: string | null }): Zone | undefined => {
  const id = zoneIdFrom(place.zone);
  return id ? ZONE_BY_ID.get(id) : undefined;
};

const distanceKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const rad = (value: number) => (value * Math.PI) / 180;
  const h = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
};

// Margen sobre el radio para sugerir: el círculo es aproximado y la colonia no termina en una línea exacta.
const SUGGEST_MARGIN_KM = 0.6;

// Sugerencia para el admin: la zona más cercana si el lugar cae dentro de su círculo (con margen).
export function suggestZone(lat?: number | null, lng?: number | null): Zone | undefined {
  if (lat == null || lng == null) return undefined;
  let best: { zone: Zone; km: number } | undefined;
  for (const zone of ZONES) {
    const km = distanceKm(lat, lng, zone.center.lat, zone.center.lng);
    if (km <= zone.radiusKm + SUGGEST_MARGIN_KM && (!best || km < best.km)) best = { zone, km };
  }
  return best?.zone;
}

export const suggestZoneFor = (place: { coordinates?: { lat: number; lng: number } | null }) =>
  suggestZone(place.coordinates?.lat, place.coordinates?.lng);
