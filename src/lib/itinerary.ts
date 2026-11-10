import { useSyncExternalStore } from 'react';
import type { PlanPlace } from '../data/planBuilder';
import { distanceKm } from './zones';

/* ============================================================
   Itinerario: una secuencia de paradas en orden, lista para
   salir hoy. Lo usan las rutas curadas, "Arma tu plan" y los
   planes guardados o compartidos por link. Las paradas sólo
   guardan el id del lugar: nombre, tipo y "VE POR" salen
   siempre de la guía.
   ============================================================ */

export type ItineraryMoment = 'manana' | 'tarde' | 'noche';

export type ItineraryStop = {
  placeId: string;
  // Hora sugerida ("10:00"); es una guía, no una reservación.
  time?: string;
};

export type Itinerary = {
  id: string;
  title: string;
  // Una línea editorial; opcional en los planes generados.
  blurb?: string;
  // "Solo", "Cita", "Amigos"…
  vibes: string[];
  moment: ItineraryMoment;
  stops: ItineraryStop[];
  source: 'curada' | 'generada';
};

export const MOMENT_LABEL: Record<ItineraryMoment, string> = {
  manana: 'Mañana',
  tarde: 'Tarde',
  noche: 'Noche',
};

// Horas sugeridas por momento del día, una por parada.
export const MOMENT_TIMES: Record<ItineraryMoment, string[]> = {
  manana: ['10:00', '11:30', '13:30'],
  tarde: ['16:30', '18:00', '20:00'],
  noche: ['19:30', '21:30', '23:30'],
};

type GetPlace = (id: string) => PlanPlace | undefined;

export type ResolvedStop = ItineraryStop & { place: PlanPlace };

// Las paradas cuyo lugar sigue en la guía (uno dado de baja se omite).
export const resolveStops = (itinerary: Itinerary, getPlace: GetPlace): ResolvedStop[] =>
  itinerary.stops
    .map((stop) => ({ ...stop, place: getPlace(stop.placeId) }))
    .filter((stop): stop is ResolvedStop => Boolean(stop.place));

/* ---------- Tramos entre paradas ---------- */

export type Leg = { mode: 'pie' | 'bici' | 'coche'; minutes: number; meters: number; label: string };

// La calle no va en línea recta: se estima ~30 % más que la distancia directa.
const DETOUR = 1.3;
const WALK_MAX_M = 1500;
const BIKE_MAX_M = 4500;

// Estimado con las coordenadas de los dos lugares; sin ellas no se inventa.
export function legBetween(from: PlanPlace, to: PlanPlace): Leg | null {
  if (!from.coordinates || !to.coordinates) return null;
  const meters = Math.round(distanceKm(from.coordinates.lat, from.coordinates.lng, to.coordinates.lat, to.coordinates.lng) * 1000 * DETOUR);
  if (meters < 80) return { mode: 'pie', minutes: 1, meters, label: 'A unos pasos' };
  if (meters <= WALK_MAX_M) {
    const minutes = Math.max(2, Math.round(meters / 75));
    return { mode: 'pie', minutes, meters, label: `${minutes} min caminando` };
  }
  if (meters <= BIKE_MAX_M) {
    const minutes = Math.max(5, Math.round(meters / 230));
    return { mode: 'bici', minutes, meters, label: `${minutes} min en bici` };
  }
  const minutes = Math.round(meters / 420) + 5;
  return { mode: 'coche', minutes, meters, label: `${minutes} min en coche` };
}

const formatMeters = (meters: number) => (meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters / 10) * 10} m`);
export const legDetail = (leg: Leg) => (leg.meters < 80 ? leg.label : `${leg.label} · ${formatMeters(leg.meters)}`);

// Cuánto se queda uno en cada tipo de lugar (minutos), para la duración total.
const STAY_MINUTES: Record<PlanPlace['interest'], number> = { cafe: 60, comida: 90, noche: 120, vintage: 45, cultura: 75, atardecer: 60 };

export function durationLabel(stops: ResolvedStop[]): string {
  const total = stops.reduce((sum, stop, index) => {
    const leg = index > 0 ? legBetween(stops[index - 1].place, stop.place) : null;
    return sum + STAY_MINUTES[stop.place.interest] + (leg?.minutes ?? (index > 0 ? 15 : 0));
  }, 0);
  const halves = Math.max(2, Math.round(total / 30));
  return `≈ ${halves % 2 === 0 ? halves / 2 : `${Math.floor(halves / 2)}.5`} h`;
}

// "Col. Americana → Centro": las zonas en el orden en que aparecen.
export function zoneTrail(stops: ResolvedStop[], zoneName: (place: PlanPlace) => string | undefined): string {
  const names: string[] = [];
  for (const stop of stops) {
    const name = zoneName(stop.place);
    if (name && names[names.length - 1] !== name) names.push(name);
  }
  return names.join(' → ');
}

/* ---------- Compartir ---------- */

const SITE = 'https://bruuk.space';

// Link que abre el plan tal cual: /guadalajara/rutas?p=id.id.id&m=tarde&t=Título
export function sharePath(itinerary: Itinerary): string {
  if (itinerary.source === 'curada') return `/guadalajara/rutas#${itinerary.id}`;
  const params = new URLSearchParams({ p: itinerary.stops.map((stop) => stop.placeId).join('.'), m: itinerary.moment, t: itinerary.title });
  return `/guadalajara/rutas?${params}`;
}

// Un plan compartido por link: sólo ids que existan en la guía, de 2 a 4 paradas.
export function itineraryFromParams(params: URLSearchParams, getPlace: GetPlace): Itinerary | null {
  const ids = (params.get('p') ?? '').split('.').filter((id) => id && getPlace(id));
  const unique = [...new Set(ids)].slice(0, 4);
  if (unique.length < 2) return null;
  const moment = (['manana', 'tarde', 'noche'] as const).find((value) => value === params.get('m')) ?? 'tarde';
  const title = (params.get('t') ?? '').replace(/\s+/g, ' ').trim().slice(0, 60) || 'Plan compartido';
  return {
    id: `plan-${unique.join('.')}`,
    title,
    vibes: [],
    moment,
    stops: unique.map((placeId, index) => ({ placeId, time: MOMENT_TIMES[moment][index] })),
    source: 'generada',
  };
}

// Texto limpio para el chat grupal: WhatsApp pone en negritas lo que va entre asteriscos.
export function whatsappText(itinerary: Itinerary, getPlace: GetPlace): string {
  const stops = resolveStops(itinerary, getPlace);
  const lines: string[] = [`*${itinerary.title.toUpperCase()}*`, `Plan Bruuk · ${MOMENT_LABEL[itinerary.moment]} · ${durationLabel(stops)}`, ''];
  stops.forEach((stop, index) => {
    if (index > 0) {
      const leg = legBetween(stops[index - 1].place, stop.place);
      if (leg) lines.push(`   ↓ ${leg.label}`, '');
    }
    lines.push(`*${index + 1}. ${stop.place.name}*${stop.time ? ` · ${stop.time}` : ''}`);
    if (stop.place.tip) lines.push(`Ve por: ${stop.place.tip}`);
    lines.push(stop.place.mapsUrl, '');
  });
  const route = mapsRouteUrl(stops.map((stop) => stop.place));
  if (route) lines.push(`Ruta completa: ${route}`);
  lines.push(`Ver el plan: ${SITE}${sharePath(itinerary)}`, '', '¿Quién jala?');
  return lines.join('\n');
}

export const whatsappUrl = (itinerary: Itinerary, getPlace: GetPlace) =>
  `https://wa.me/?text=${encodeURIComponent(whatsappText(itinerary, getPlace))}`;

// Ruta con varias paradas en Google Maps (URLs oficiales de Maps, sin llave).
export function mapsRouteUrl(places: PlanPlace[]): string | null {
  if (places.length < 2) return null;
  const point = (place: PlanPlace) => (place.coordinates ? `${place.coordinates.lat},${place.coordinates.lng}` : `${place.name}, Guadalajara, Jalisco`);
  const legs = places.slice(1).map((place, index) => legBetween(places[index], place));
  const walkable = legs.every((leg) => leg?.mode === 'pie');
  const params = new URLSearchParams({ api: '1', origin: point(places[0]), destination: point(places[places.length - 1]), travelmode: walkable ? 'walking' : 'driving' });
  const middle = places.slice(1, -1).map(point);
  if (middle.length) params.set('waypoints', middle.join('|'));
  return `https://www.google.com/maps/dir/?${params}`;
}

/* ---------- Guardados (localStorage, sin login) ---------- */

const STORAGE_KEY = 'bruuk:planes-guardados';
const MAX_SAVED = 30;
const listeners = new Set<() => void>();
let cache: Itinerary[] | null = null;

const isItinerary = (value: unknown): value is Itinerary => {
  const item = value as Itinerary;
  return Boolean(item) && typeof item.id === 'string' && typeof item.title === 'string' && Array.isArray(item.stops)
    && item.stops.every((stop) => typeof stop?.placeId === 'string') && Array.isArray(item.vibes)
    && ['manana', 'tarde', 'noche'].includes(item.moment);
};

function read(): Itinerary[] {
  if (cache) return cache;
  try {
    const raw: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
    cache = Array.isArray(raw) ? raw.filter(isItinerary) : [];
  } catch {
    // Modo privado o almacenamiento bloqueado: se queda en memoria.
    cache = [];
  }
  return cache;
}

function write(next: Itinerary[]) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch { /* sin almacenamiento: dura lo que dure la pestaña */ }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    cache = null;
    listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

export const useSavedItineraries = () => useSyncExternalStore(subscribe, read, read);

// Guarda o quita; regresa true si quedó guardado.
export function toggleSaved(itinerary: Itinerary): boolean {
  const saved = read();
  if (saved.some((item) => item.id === itinerary.id)) {
    write(saved.filter((item) => item.id !== itinerary.id));
    return false;
  }
  write([itinerary, ...saved].slice(0, MAX_SAVED));
  return true;
}
