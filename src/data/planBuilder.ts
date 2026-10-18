// Catálogo y opciones compartidas entre la página "Arma tu plan" y /api/custom-plan.
// El modelo sólo puede elegir lugares de este catálogo, nunca inventarlos.
import spotsData from './spots.json';
import sunsetData from './atardeceres.json';
import rackData from '../../lugares-mapa-gdl.json';
import { SPOT_IMAGES } from '../rack/spotImages';
import { SPOT_MAP_LINKS } from '../rack/spotMapLinks';

export type PlanInterest = 'cafe' | 'comida' | 'noche' | 'vintage' | 'cultura' | 'atardecer';

export type PlanPlace = {
  id: string;
  name: string;
  interest: PlanInterest;
  type: string;
  description: string;
  price?: string;
  imageUrl?: string;
  mapsUrl: string;
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
};

export type PlanStop = { placeId: string; time: string; why: string; tip: string };
export type CustomPlan = { title: string; intro: string; stops: PlanStop[]; closing: string };

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
  return { moment: input.moment, company: input.company, vibe: input.vibe, budget: input.budget, stops, interests };
};

type Spot = { id: string; name: string; type: string; description: string; highlight?: string; imageUrl?: string; price?: string; mapsLink: string; city: string };
type Sunset = { id: string; name: string; type: string; description: string; mapsLink: string };
type RackPlace = { name: string; category: string; description: string; google_maps_url: string };

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
      description: spot.highlight ? `${spot.description} Ve por: ${spot.highlight}.` : spot.description,
      price: spot.price,
      imageUrl: spot.imageUrl?.endsWith('.webp') ? spot.imageUrl : undefined,
      mapsUrl: spot.mapsLink,
    })),
  ...rackPlaces
    .filter((place) => (place.category === 'Cultura' || place.category === 'Rack recomienda' || place.category === 'Vinilos y antigüedades' || place.category === 'Tianguis') && !tianguisStalls.has(place))
    .map((place) => ({
      id: `rack_${slug(place.name)}`,
      name: place.name,
      interest: (place.category === 'Cultura' ? 'cultura' : 'vintage') as PlanInterest,
      type: place.category === 'Rack recomienda' ? 'Tienda vintage' : place.category,
      description: place.description,
      imageUrl: SPOT_IMAGES[place.name],
      mapsUrl: SPOT_MAP_LINKS[place.name] ?? place.google_maps_url,
    })),
  ...(sunsetData.sunset as Sunset[]).map((sunset) => ({
    id: sunset.id,
    name: sunset.name,
    interest: 'atardecer' as PlanInterest,
    type: sunset.type,
    description: sunset.description,
    mapsUrl: sunset.mapsLink,
  })),
];

export const PLAN_PLACES_BY_ID = new Map(PLAN_PLACES.map((place) => [place.id, place]));
