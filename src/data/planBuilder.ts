// Catálogo y opciones compartidas entre la página "Arma tu plan" y /api/custom-plan.
// El modelo sólo puede elegir lugares de este catálogo, nunca inventarlos.
import spotsData from './spots.json' with { type: 'json' };
import sunsetData from './atardeceres.json' with { type: 'json' };
import rackData from '../../lugares-mapa-gdl.json' with { type: 'json' };
import { SPOT_IMAGES } from '../rack/spotImages.js';
import { SPOT_MAP_LINKS } from '../rack/spotMapLinks.js';

export type PlanInterest = 'cafe' | 'comida' | 'noche' | 'vintage' | 'cultura' | 'atardecer';
export type PlanZone = 'centro' | 'americana' | 'poniente';

export type PlanPlace = {
  id: string;
  name: string;
  interest: PlanInterest;
  type: string;
  description: string;
  // Texto escrito por Bruuk; se muestra tal cual como tip, nunca lo genera la IA.
  tip?: string;
  price?: string;
  imageUrl?: string;
  mapsUrl: string;
  // Sólo si el lugar tiene coordenadas; sin ellas no entra a la ruleta por zona.
  zone?: PlanZone;
};

type Option<T extends string> = { value: T; label: string; hint: string };

export const MOMENT_OPTIONS: Option<'manana' | 'tarde' | 'noche' | 'dia'>[] = [
  { value: 'manana', label: 'Mañana', hint: 'Desayuno, café y luz de día' },
  { value: 'tarde', label: 'Tarde', hint: 'Caminar, buscar y comer' },
  { value: 'noche', label: 'Noche', hint: 'Cena, tragos y música' },
  { value: 'dia', label: 'Todo el día', hint: 'De la mañana hasta que se acabe' },
];

export const COMPANY_OPTIONS: Option<'solo' | 'cita' | 'amigos' | 'familia'>[] = [
  { value: 'solo', label: 'Solo', hint: 'A tu ritmo' },
  { value: 'cita', label: 'Cita', hint: 'Para platicar sin gritar' },
  { value: 'amigos', label: 'Amigos', hint: 'Grupo y buen ambiente' },
  { value: 'familia', label: 'Familia', hint: 'Que nadie se aburra' },
];

export const INTEREST_OPTIONS: Option<PlanInterest>[] = [
  { value: 'cafe', label: 'Café', hint: 'Especialidad, pan y sobremesa' },
  { value: 'comida', label: 'Comida', hint: 'Desayunos, brunch, cenas' },
  { value: 'noche', label: 'Bares y noche', hint: 'Coctelería, clubs y jazz' },
  { value: 'vintage', label: 'Vintage y tianguis', hint: 'Ropa, vinilos y mercados' },
  { value: 'cultura', label: 'Cultura', hint: 'Museos, cine y galerías' },
  { value: 'atardecer', label: 'Atardecer', hint: 'Miradores para ver caer el sol' },
];

export const VIBE_OPTIONS: Option<'tranquilo' | 'social' | 'explorar' | 'creativo'>[] = [
  { value: 'tranquilo', label: 'Tranquilo', hint: 'Sin prisa, sin ruido' },
  { value: 'social', label: 'Social', hint: 'Gente, ambiente y movimiento' },
  { value: 'explorar', label: 'Explorar', hint: 'Lugares que no conoces' },
  { value: 'creativo', label: 'Creativo', hint: 'Arte, diseño y hallazgos' },
];

export const BUDGET_OPTIONS: Option<'bajo' | 'medio' | 'alto'>[] = [
  { value: 'bajo', label: '$', hint: 'Hasta $300 por persona' },
  { value: 'medio', label: '$$', hint: '$300 a $700 por persona' },
  { value: 'alto', label: '$$$', hint: 'Sin pensar mucho en la cuenta' },
];

export const STOP_OPTIONS = [2, 3, 4] as const;
export const MAX_INTERESTS = 3;

export type PlanChoices = {
  moment: (typeof MOMENT_OPTIONS)[number]['value'];
  company: (typeof COMPANY_OPTIONS)[number]['value'];
  interests: PlanInterest[];
  vibe: (typeof VIBE_OPTIONS)[number]['value'];
  budget: (typeof BUDGET_OPTIONS)[number]['value'];
  stops: (typeof STOP_OPTIONS)[number];
  note: string;
};

export const MAX_NOTE_LENGTH = 200;

export type PlanStop = { placeId: string; time: string; why: string };
// "thread" sólo viene en los planes de la ruleta: lo que une a las paradas.
export type CustomPlan = { title: string; intro: string; stops: PlanStop[]; closing: string; thread?: string };

// Ruleta: el azar elige lugares de toda la guía y la IA encuentra el hilo entre ellos.
export const ROULETTE_MOMENTS: Option<'sorpresa' | 'manana' | 'tarde' | 'noche'>[] = [
  { value: 'sorpresa', label: 'Sorpréndeme', hint: 'Cualquier hora' },
  { value: 'manana', label: 'Mañana', hint: 'Café y luz de día' },
  { value: 'tarde', label: 'Tarde', hint: 'Caminar y buscar' },
  { value: 'noche', label: 'Noche', hint: 'Cena y tragos' },
];

export type RouletteMoment = (typeof ROULETTE_MOMENTS)[number]['value'];

// Zonas con suficientes lugares para una ruta caminable. Las colonias chicas se agrupan.
export const ROULETTE_ZONES: Option<'toda' | PlanZone>[] = [
  { value: 'toda', label: 'Toda', hint: 'Toda la ciudad' },
  { value: 'centro', label: 'Centro', hint: 'Centro histórico' },
  { value: 'americana', label: 'Americana', hint: 'Americana, Lafayette y Chapultepec' },
  { value: 'poniente', label: 'Poniente', hint: 'Providencia, Chapalita y Zapopan' },
];

export type RouletteZone = (typeof ROULETTE_ZONES)[number]['value'];

// Qué categorías tienen sentido a cada hora; así la ruleta no saca un bar para desayunar.
export const MOMENT_INTERESTS: Record<RouletteMoment, PlanInterest[]> = {
  sorpresa: ['cafe', 'comida', 'noche', 'vintage', 'cultura', 'atardecer'],
  manana: ['cafe', 'comida', 'vintage', 'cultura'],
  tarde: ['cafe', 'comida', 'vintage', 'cultura', 'atardecer'],
  noche: ['comida', 'noche', 'atardecer'],
};

export type RouletteRequest = { placeIds: string[]; locked: string[]; moment: RouletteMoment; zone: RouletteZone };

export const parseRouletteRequest = (body: unknown): RouletteRequest | null => {
  if (!body || typeof body !== 'object') return null;
  const input = body as Record<string, unknown>;
  const ids = (value: unknown) => (Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string'))] : []);
  const placeIds = ids(input.placeIds);
  const locked = ids(input.locked).filter((id) => placeIds.includes(id));
  if (
    !isOneOf(ROULETTE_MOMENTS, input.moment) ||
    !STOP_OPTIONS.some((count) => count === placeIds.length) ||
    !placeIds.every((id) => PLAN_PLACES_BY_ID.has(id))
  ) {
    return null;
  }
  const zone = isOneOf(ROULETTE_ZONES, input.zone) ? input.zone : 'toda';
  return { placeIds, locked, moment: input.moment, zone };
};

export const labelFor = <T extends string>(options: Option<T>[], value: T) =>
  options.find((option) => option.value === value)?.label ?? value;

const isOneOf = <T extends string>(options: Option<T>[], value: unknown): value is T =>
  options.some((option) => option.value === value);

// Valida lo que llega del cliente antes de llamar al modelo.
export const parsePlanChoices = (body: unknown): PlanChoices | null => {
  if (!body || typeof body !== 'object') return null;
  const input = body as Record<string, unknown>;
  const interests = Array.isArray(input.interests)
    ? [...new Set(input.interests.filter((value): value is PlanInterest => isOneOf(INTEREST_OPTIONS, value)))]
    : [];
  const stops = STOP_OPTIONS.find((value) => value === input.stops);
  if (
    !isOneOf(MOMENT_OPTIONS, input.moment) ||
    !isOneOf(COMPANY_OPTIONS, input.company) ||
    !isOneOf(VIBE_OPTIONS, input.vibe) ||
    !isOneOf(BUDGET_OPTIONS, input.budget) ||
    !stops ||
    interests.length === 0 ||
    interests.length > MAX_INTERESTS
  ) {
    return null;
  }
  const note = typeof input.note === 'string' ? input.note.replace(/\s+/g, ' ').trim().slice(0, MAX_NOTE_LENGTH) : '';
  return { moment: input.moment, company: input.company, vibe: input.vibe, budget: input.budget, stops, interests, note };
};

type Spot = { id: string; name: string; type: string; description: string; highlight?: string; imageUrl?: string; price?: string; mapsLink: string; city: string; coordinates?: { lat: number; lng: number } };
type Sunset = { id: string; name: string; type: string; description: string; highlight?: string; mapsLink: string };
type RackPlace = { name: string; category: string; description: string; google_maps_url: string; geometry?: { latitude?: number | null; longitude?: number | null } };

// Centro de cada colonia; el lugar va a la más cercana si está a menos de 3.5 km.
const ZONE_CENTERS: { zone: PlanZone; lat: number; lng: number }[] = [
  { zone: 'centro', lat: 20.6767, lng: -103.3475 },
  { zone: 'americana', lat: 20.6735, lng: -103.3705 },
  { zone: 'poniente', lat: 20.6945, lng: -103.3895 }, // Providencia
  { zone: 'poniente', lat: 20.6655, lng: -103.4 }, // Chapalita
  { zone: 'poniente', lat: 20.7225, lng: -103.391 }, // Zapopan centro
  { zone: 'poniente', lat: 20.7095, lng: -103.413 }, // Andares
];
const MAX_ZONE_KM = 3.5;

const distanceKm = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const rad = (value: number) => (value * Math.PI) / 180;
  const h = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
};

const zoneFor = (lat?: number | null, lng?: number | null): PlanZone | undefined => {
  if (lat == null || lng == null) return undefined;
  let best: { zone: PlanZone; km: number } | undefined;
  for (const center of ZONE_CENTERS) {
    const km = distanceKm(lat, lng, center.lat, center.lng);
    if (!best || km < best.km) best = { zone: center.zone, km };
  }
  return best && best.km <= MAX_ZONE_KM ? best.zone : undefined;
};

const NIGHT_TYPES = /bar|club|discoteca|coctel|cervecer|jazz|vinos/i;
const CAFE_TYPES = /caf|panader|bagel|helad|gelat/i;

const spotInterest = (spot: Spot): PlanInterest => {
  if (NIGHT_TYPES.test(spot.type)) return 'noche';
  if (CAFE_TYPES.test(spot.type)) return 'cafe';
  return 'comida';
};

const slug = (value: string) =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const rackPlaces = rackData.places as RackPlace[];
// Los primeros diez "Tianguis" son puestos sueltos dentro de un tianguis, no lugares para una ruta.
const tianguisStalls = new Set(rackPlaces.filter((place) => place.category === 'Tianguis').slice(0, 10));

export const PLAN_PLACES: PlanPlace[] = [
  ...(spotsData as Spot[])
    .filter((spot) => spot.city === 'guadalajara')
    .map((spot) => ({
      id: spot.id,
      name: spot.name,
      interest: spotInterest(spot),
      type: spot.type,
      description: spot.description,
      tip: spot.highlight,
      price: spot.price,
      imageUrl: spot.imageUrl?.endsWith('.webp') ? spot.imageUrl : undefined,
      mapsUrl: spot.mapsLink,
      zone: zoneFor(spot.coordinates?.lat, spot.coordinates?.lng),
    })),
  ...rackPlaces
    .filter((place) => (place.category === 'Cultura' || place.category === 'Rack recomienda' || place.category === 'Vinilos y antigüedades' || place.category === 'Tianguis') && !tianguisStalls.has(place))
    .map((place) => ({
      id: `rack_${slug(place.name)}`,
      name: place.name,
      interest: (place.category === 'Cultura' ? 'cultura' : 'vintage') as PlanInterest,
      type: place.category === 'Rack recomienda' ? 'Tienda vintage' : place.category,
      description: place.description,
      tip: place.description,
      imageUrl: SPOT_IMAGES[place.name],
      mapsUrl: SPOT_MAP_LINKS[place.name] ?? place.google_maps_url,
      zone: zoneFor(place.geometry?.latitude, place.geometry?.longitude),
    })),
  ...(sunsetData.sunset as Sunset[]).map((sunset) => ({
    id: sunset.id,
    name: sunset.name,
    interest: 'atardecer' as PlanInterest,
    type: sunset.type,
    description: sunset.description,
    tip: sunset.highlight,
    mapsUrl: sunset.mapsLink,
  })),
];

export const PLAN_PLACES_BY_ID = new Map(PLAN_PLACES.map((place) => [place.id, place]));
