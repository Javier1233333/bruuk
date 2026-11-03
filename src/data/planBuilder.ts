// Catálogo y opciones compartidas entre la página "Arma tu plan" y /api/custom-plan.
// El modelo sólo puede elegir lugares de este catálogo, nunca inventarlos.
import spotsData from './spots.json' with { type: 'json' };
import sunsetData from './atardeceres.json' with { type: 'json' };
import rackData from './rack.json' with { type: 'json' };
import cultureData from '../../lugares-mapa-gdl.json' with { type: 'json' };
import { SPOT_MAP_LINKS } from '../rack/spotMapLinks.js';
import { placeZone, spotZone, type PlanZone } from '../lib/zones.js';

export type PlanInterest = 'cafe' | 'comida' | 'noche' | 'vintage' | 'cultura' | 'atardecer';
export type { PlanZone };

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
  // Colonia para la etiqueta de las tarjetas (puede no tener grupo de ruleta).
  zoneName?: string;
  // Categoría de Rack: 'Rack recomienda' | 'Vinilos y antigüedades' | 'Tianguis'.
  category?: string;
  colorAccent?: string;
  rating?: number;
  coordinates?: { lat: number; lng: number };
  // Hotspot de la semana (1-3) y la fecha en que se publicó.
  hotspot?: number;
  hotspotDate?: string;
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

// `isKnown` permite validar contra el catálogo en vivo de la API; por defecto, el empaquetado.
export const parseRouletteRequest = (body: unknown, isKnown: (id: string) => boolean = (id) => PLAN_PLACES_BY_ID.has(id)): RouletteRequest | null => {
  if (!body || typeof body !== 'object') return null;
  const input = body as Record<string, unknown>;
  const ids = (value: unknown) => (Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string'))] : []);
  const placeIds = ids(input.placeIds);
  const locked = ids(input.locked).filter((id) => placeIds.includes(id));
  if (
    !isOneOf(ROULETTE_MOMENTS, input.moment) ||
    !STOP_OPTIONS.some((count) => count === placeIds.length) ||
    !placeIds.every(isKnown)
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

// Formas de los datos tal como llegan de /api/spots, /api/rack y atardeceres.json.
export type CatalogSpot = {
  id: string; name: string; type: string; description: string; highlight?: string; imageUrl?: string; price?: string;
  mapsLink: string; city?: string; coordinates?: { lat: number; lng: number }; zone?: string; colorAccent?: string;
  rating?: number; hotspot?: number; hotspotDate?: string;
};
export type CatalogRack = {
  id: string; name: string; category: string; description: string; imageUrl?: string; mapsLink: string;
  coordinates?: { lat: number; lng: number }; zone?: string; active?: boolean;
};
export type CatalogSunset = { id: string; name: string; type: string; description: string; highlight?: string; imageUrl?: string; mapsLink: string; colorAccent?: string; coordinates?: { lat: number; lng: number }; zone?: string };
export type CatalogSunsetEntry = string | CatalogSunset;

type CulturePlace = { name: string; category: string; description: string; google_maps_url: string; geometry?: { latitude?: number | null; longitude?: number | null } };

const NIGHT_TYPES = /bar|club|discoteca|coctel|cervecer|jazz|vinos/i;
const CAFE_TYPES = /caf|panader|bagel|helad|gelat/i;

const spotInterest = (spot: CatalogSpot): PlanInterest => {
  if (NIGHT_TYPES.test(spot.type)) return 'noche';
  if (CAFE_TYPES.test(spot.type)) return 'cafe';
  return 'comida';
};

const slug = (value: string) =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// Fotos reales (relativas del sitio o absolutas de Firebase Storage); los SVG de relleno no cuentan.
const realImage = (url?: string) => (url && /\.(webp|jpe?g|png|avif)(\?|$)/i.test(url) ? url : undefined);

const zoneFields = (place: { zone?: string; coordinates?: { lat: number; lng: number } }) => {
  const zone = spotZone(place);
  return { zone: zone?.zone, zoneName: zone?.name };
};

// Museos y espacios culturales: todavía no están en el admin, salen del mapa original.
const CULTURE_PLACES: PlanPlace[] = (cultureData.places as CulturePlace[])
  .filter((place) => place.category === 'Cultura')
  .map((place) => {
    const zone = placeZone(place.geometry?.latitude, place.geometry?.longitude);
    return {
      id: `rack_${slug(place.name)}`,
      name: place.name,
      interest: 'cultura' as PlanInterest,
      type: 'Cultura',
      description: place.description,
      tip: place.description,
      mapsUrl: SPOT_MAP_LINKS[place.name] ?? place.google_maps_url,
      zone: zone?.zone,
      zoneName: zone?.name,
      coordinates: place.geometry?.latitude != null && place.geometry?.longitude != null
        ? { lat: place.geometry.latitude, lng: place.geometry.longitude }
        : undefined,
    };
  });

// Un solo catálogo para la web (JSON empaquetado), la API (Firestore en vivo) y la app.
export function buildPlanPlaces({ spots, rack, sunsets }: { spots: CatalogSpot[]; rack: CatalogRack[]; sunsets: CatalogSunsetEntry[] }): PlanPlace[] {
  const spotsById = new Map(spots.map((spot) => [spot.id, spot]));
  const sunsetIds = new Set(sunsets.map((entry) => (typeof entry === 'string' ? entry : entry.id)));
  const places: PlanPlace[] = [
    ...spots
      .filter((spot) => (spot.city ?? 'guadalajara') === 'guadalajara' && !sunsetIds.has(spot.id))
      .map((spot) => ({
        id: spot.id,
        name: spot.name,
        interest: spotInterest(spot),
        type: spot.type,
        description: spot.description,
        tip: spot.highlight,
        price: spot.price,
        imageUrl: realImage(spot.imageUrl),
        mapsUrl: spot.mapsLink,
        colorAccent: spot.colorAccent,
        rating: spot.rating,
        coordinates: spot.coordinates,
        hotspot: spot.hotspot,
        hotspotDate: spot.hotspotDate,
        ...zoneFields(spot),
      })),
    ...rack
      .filter((place) => place.active !== false)
      .map((place) => ({
        id: place.id,
        name: place.name,
        interest: 'vintage' as PlanInterest,
        type: place.category === 'Rack recomienda' ? 'Tienda vintage' : place.category,
        category: place.category,
        description: place.description,
        tip: place.description,
        // Los tianguis no llevan foto: cambian cada semana.
        imageUrl: place.category === 'Tianguis' ? undefined : realImage(place.imageUrl),
        mapsUrl: place.mapsLink,
        coordinates: place.coordinates,
        ...zoneFields(place),
      })),
    ...CULTURE_PLACES,
    ...sunsets
      .map((entry) => (typeof entry === 'string' ? spotsById.get(entry) : entry))
      .filter((sunset): sunset is CatalogSunset | CatalogSpot => Boolean(sunset))
      .map((sunset) => ({
        id: sunset.id,
        name: sunset.name,
        interest: 'atardecer' as PlanInterest,
        type: sunset.type,
        description: sunset.description,
        tip: sunset.highlight,
        imageUrl: realImage(sunset.imageUrl),
        mapsUrl: sunset.mapsLink,
        colorAccent: sunset.colorAccent,
        ...zoneFields(sunset),
      })),
  ];
  // Un id repetido entre colecciones se queda con la primera aparición.
  const seen = new Set<string>();
  return places.filter((place) => !seen.has(place.id) && seen.add(place.id));
}

export const BUNDLED_SUNSETS = sunsetData.sunset as CatalogSunsetEntry[];

// Catálogo empaquetado: lo que usa la web mientras no carga la API y el respaldo sin conexión.
export const PLAN_PLACES: PlanPlace[] = buildPlanPlaces({
  spots: spotsData as CatalogSpot[],
  rack: rackData as CatalogRack[],
  sunsets: BUNDLED_SUNSETS,
});

export const PLAN_PLACES_BY_ID = new Map(PLAN_PLACES.map((place) => [place.id, place]));
