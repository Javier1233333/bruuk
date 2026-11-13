import type { PlanInterest, PlanPlace } from '../data/planBuilder';
import { MOMENT_TIMES, type Itinerary, type ItineraryMoment } from './itinerary';
import { ZONES, ZONE_BY_ID, ZONE_IDS, distanceKm, suggestZone, type ZoneId } from './zones';

/* ============================================================
   "Arma tu plan": cinco respuestas → una ruta de 3 paradas
   armada al instante con los lugares de la guía. Sin IA: cada
   parada tiene un papel (arranque, actividad, cierre) según la
   hora y el ritmo, y se elige lo que mejor encaja y queda cerca
   de la parada anterior.
   ============================================================ */

type Option<T extends string> = { value: T; label: string; hint: string };

export type RouteAnswers = {
  company: 'solo' | 'pareja' | 'amigos' | 'cita';
  moment: ItineraryMoment;
  // Una de las 7 zonas de Bruuk (src/lib/zones.ts) o "sorpresa".
  zone: ZoneId | 'sorpresa';
  rhythm: 'caminar' | 'platicar' | 'comer' | 'cultura';
  mood: 'casual' | 'especial' | 'bailar';
};

export type RouteQuestionId = keyof RouteAnswers;

export const ROUTE_QUESTIONS: { id: RouteQuestionId; question: string; options: Option<string>[] }[] = [
  {
    id: 'company',
    question: '¿Con quién sales?',
    options: [
      { value: 'solo', label: 'Solo', hint: 'A mi ritmo' },
      { value: 'pareja', label: 'En pareja', hint: 'Sin prisa, los dos' },
      { value: 'amigos', label: 'Con amigos', hint: 'Grupo y ambiente' },
      { value: 'cita', label: 'Cita', hint: 'Para platicar sin gritar' },
    ],
  },
  {
    id: 'moment',
    question: '¿Qué momento del día?',
    options: [
      { value: 'manana', label: 'Mañana temprano', hint: 'Café y luz de día' },
      { value: 'tarde', label: 'Tarde tranquila', hint: 'Caminar, buscar, comer' },
      { value: 'noche', label: 'Noche larga', hint: 'Cena, tragos y música' },
    ],
  },
  {
    id: 'zone',
    question: '¿Qué zona prefieres?',
    options: [
      // Las 7 zonas reales; la página muestra cuántos lugares tiene cada una.
      ...ZONES.map((zone) => ({ value: zone.id, label: zone.short, hint: zone.name === zone.short ? '' : zone.name })),
      { value: 'sorpresa', label: 'Sorpréndeme', hint: 'Donde salga mejor' },
    ],
  },
  {
    id: 'rhythm',
    question: '¿Qué ritmo buscas?',
    options: [
      { value: 'caminar', label: 'Caminar y descubrir', hint: 'Tiendas, tianguis, calle' },
      { value: 'platicar', label: 'Sentarse a platicar', hint: 'Horas en la misma mesa' },
      { value: 'comer', label: 'Comer y beber increíble', hint: 'El plan es la mesa' },
      { value: 'cultura', label: 'Cultura y objetos', hint: 'Museos, vinilos, libros' },
    ],
  },
  {
    id: 'mood',
    question: '¿Cómo cierra el plan?',
    options: [
      { value: 'casual', label: 'Casual y de calle', hint: 'Sin gastar de más' },
      { value: 'especial', label: 'Algo especial', hint: 'Vale la cuenta' },
      { value: 'bailar', label: 'Terminar bailando', hint: 'Que la noche decida' },
    ],
  },
];

export const answerLabel = (id: RouteQuestionId, value: string) =>
  ROUTE_QUESTIONS.find((question) => question.id === id)?.options.find((option) => option.value === value)?.label ?? value;

const VIBE_LABEL: Record<RouteAnswers['company'], string> = { solo: 'Solo', pareja: 'Pareja', amigos: 'Amigos', cita: 'Cita' };

// El papel de cada parada: qué categorías sirven, en orden de preferencia.
type Slot = PlanInterest[];

const SLOTS: Record<ItineraryMoment, Record<RouteAnswers['rhythm'], [Slot, Slot, Slot]>> = {
  manana: {
    caminar: [['cafe'], ['vintage', 'cultura'], ['comida', 'cafe']],
    platicar: [['cafe'], ['cultura', 'vintage'], ['comida', 'cafe']],
    comer: [['cafe'], ['vintage', 'cultura', 'cafe'], ['comida']],
    cultura: [['cafe'], ['cultura'], ['vintage', 'comida']],
  },
  tarde: {
    caminar: [['cafe'], ['vintage', 'cultura'], ['comida', 'noche']],
    platicar: [['cafe'], ['vintage', 'cultura'], ['noche', 'comida']],
    comer: [['comida', 'cafe'], ['vintage', 'cultura', 'cafe'], ['noche', 'comida']],
    cultura: [['cultura'], ['vintage'], ['cafe', 'noche', 'comida']],
  },
  // De noche las tiendas y museos ya cerraron: todo es mesa, barra y pista.
  noche: {
    caminar: [['comida', 'cafe'], ['noche'], ['noche']],
    platicar: [['comida'], ['noche', 'cafe'], ['noche']],
    comer: [['comida'], ['comida', 'noche'], ['noche']],
    cultura: [['comida', 'cafe'], ['noche'], ['noche']],
  },
};

// Lo que está abierto a cada hora, para cuando la categoría ideal queda lejos.
const AROUND: Record<ItineraryMoment, PlanInterest[]> = {
  manana: ['cafe', 'comida', 'vintage', 'cultura'],
  tarde: ['cafe', 'comida', 'vintage', 'cultura', 'noche'],
  noche: ['comida', 'noche', 'cafe'],
};

const TITLES: Record<ItineraryMoment, Record<RouteAnswers['rhythm'], string>> = {
  manana: {
    caminar: 'Mañana de café y hallazgos',
    platicar: 'Mañana lenta, mesa larga',
    comer: 'Desayuno que se alarga',
    cultura: 'Mañana de museo y objetos',
  },
  tarde: {
    caminar: 'Tarde de calle y hallazgos',
    platicar: 'Tarde de sobremesa',
    comer: 'Tarde para comer bien',
    cultura: 'Tarde de cultura y vinilos',
  },
  noche: {
    caminar: 'Noche de barra en barra',
    platicar: 'Noche para platicar',
    comer: 'Cena y lo que siga',
    cultura: 'Noche con otro ritmo',
  },
};

const DANCE = /club|disco|antro|baile|salsa|dj|electr/i;
const DATE = /vino|coctel|cóctel|café-bar|restaurante|gelat|jazz|terraza/i;
const GROUP = /\bbar\b|cervec|club|disco|pizz|taquer|brunch|tianguis/i;
const SOLO = /caf|librer|vinil|record|museo|galer|panader/i;

// "$100-200" → 150; sin precio no opina.
const priceMid = (price?: string) => {
  const values = (price?.match(/\d+/g) ?? []).map(Number);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
};

// La zona asignada a mano; si falta, la que sugieren las coordenadas.
export const routeZone = (place: PlanPlace): ZoneId | undefined =>
  place.zone ?? suggestZone(place.coordinates?.lat, place.coordinates?.lng)?.id;

// Nombre corto de la zona de un lugar, para etiquetas ("Americana", "Centro").
export const zoneShort = (place: PlanPlace) => {
  const zone = routeZone(place);
  return zone ? ZONE_BY_ID.get(zone)?.short : undefined;
};

const km = (a: PlanPlace, b: PlanPlace) =>
  a.coordinates && b.coordinates ? distanceKm(a.coordinates.lat, a.coordinates.lng, b.coordinates.lat, b.coordinates.lng) : null;

// La ruleta no pregunta compañía ni cierre: sólo hora y ritmo.
type ScoreAnswers = Pick<RouteAnswers, 'moment' | 'rhythm'> & Partial<Pick<RouteAnswers, 'company' | 'mood'>>;

// Qué tan bien encaja un lugar en una parada, sin contar la distancia.
function fitScore(place: PlanPlace, slot: Slot, slotIndex: number, answers: ScoreAnswers): number {
  const rank = slot.indexOf(place.interest);
  if (rank === -1) return -Infinity;
  const text = `${place.type} ${place.category ?? ''} ${place.description}`;
  let score = 10 - rank * 3;
  if (place.tip) score += 1;
  if (answers.company === 'cita' || answers.company === 'pareja') score += DATE.test(text) ? 2 : 0;
  if (answers.company === 'amigos') score += GROUP.test(text) ? 2 : 0;
  if (answers.company === 'solo') score += SOLO.test(text) ? 2 : 0;
  const price = priceMid(place.price);
  const isLast = slotIndex === 2;
  if (answers.mood === 'casual') {
    if (price !== null) score += price <= 200 ? 2 : price >= 350 ? -2 : 0;
    if (place.category === 'Tianguis') score += 2;
  }
  if (answers.mood === 'especial') {
    if (price !== null) score += price >= 250 ? 2 : 0;
    if ((place.rating ?? 0) >= 4.6) score += 1;
    if (isLast && DATE.test(text)) score += 2;
  }
  if (answers.mood === 'bailar' && isLast) {
    // Cerrar bailando: la última parada es de noche y, si se puede, con pista.
    score += place.interest === 'noche' ? 4 : -4;
    if (DANCE.test(text)) score += 6;
  }
  return score;
}

const pickRandom = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

// Entre los mejores candidatos se elige al azar, para que "otro plan" no repita.
function choose(scored: { place: PlanPlace; score: number }[]): PlanPlace | null {
  const sorted = scored.filter((item) => Number.isFinite(item.score)).sort((a, b) => b.score - a.score);
  if (sorted.length === 0) return null;
  const best = sorted[0].score;
  return pickRandom(sorted.filter((item) => item.score >= best - 2.5).slice(0, 5)).place;
}

type Context = { answers: ScoreAnswers; places: PlanPlace[]; zones: ZoneId[] | null };

// Qué tan lejos queda un lugar de la zona pedida (km al centro más cercano).
const kmToZones = (place: PlanPlace, zones: ZoneId[]) =>
  place.coordinates
    ? Math.min(...zones.map((id) => {
      const { center } = ZONE_BY_ID.get(id)!;
      return distanceKm(place.coordinates!.lat, place.coordinates!.lng, center.lat, center.lng);
    }))
    : null;

// Candidatos para una parada: encaje + zona + cercanía a las paradas vecinas.
// `next` es el papel de la parada siguiente: la primera se elige donde haya con qué seguir.
function pickStop(context: Context, slotIndex: number, slot: Slot, neighbors: PlanPlace[], exclude: Set<string>, next?: Slot): PlanPlace | null {
  const { answers, places, zones } = context;
  const scored = places
    .filter((place) => !exclude.has(place.id))
    .map((place) => {
      let score = fitScore(place, slot, slotIndex, answers);
      if (!Number.isFinite(score)) return { place, score };
      const zone = routeZone(place);
      if (zones) {
        if (zone && zones.includes(zone)) score += 6;
        // Si la zona no tiene de esa categoría, que al menos quede pegado a ella.
        else score -= Math.min(8, (kmToZones(place, zones) ?? 4) * 2);
      }
      for (const neighbor of neighbors) {
        const distance = km(neighbor, place);
        // Sin coordenadas no se puede prometer que queda cerca.
        if (distance === null) score -= 6;
        else score -= distance <= 0.5 ? 0 : distance <= 1 ? 1 : distance <= 1.5 ? 3.5 : distance <= 2.5 ? 8 : 12 + distance;
      }
      if (neighbors.length === 0) {
        // La primera parada necesita ubicación para poder encadenar las demás…
        if (!place.coordinates) score -= 6;
        // …y conviene que tenga cerca con qué seguir.
        else if (next) {
          const nearby = places.filter((other) => other.id !== place.id && next.includes(other.interest) && (km(place, other) ?? 9) <= 0.9).length;
          score += Math.min(nearby, 4) - 2;
        }
      }
      return { place, score };
    });
  return choose(scored);
}

// Elige la parada y, si la zona no tiene de esa categoría y queda lejos, se abre a lo que
// sí haya cerca a esa hora: mejor otra categoría a pie que la ideal a 3 km.
function pickNear(context: Context, index: number, slot: Slot, neighbors: PlanPlace[], used: Set<string>, next?: Slot, strict = false): PlanPlace | null {
  const place = pickStop(context, index, slot, neighbors, used, next);
  if (!place || strict) return place;
  const previous = neighbors[0];
  const inZone = (candidate: PlanPlace) => !context.zones || context.zones.includes(routeZone(candidate) as ZoneId);
  const offRoute = previous ? (km(previous, place) ?? 0) > 1.8 : !inZone(place);
  if (!offRoute) return place;
  const wide = [...slot, ...AROUND[context.answers.moment].filter((interest) => !slot.includes(interest))];
  const near = pickStop(context, index, wide, neighbors, used, next);
  const better = near && (previous ? (km(previous, near) ?? 9) < (km(previous, place) ?? 9) : inZone(near));
  return near && better ? near : place;
}

const slotsFor = (answers: RouteAnswers): [Slot, Slot, Slot] => {
  const slots = SLOTS[answers.moment][answers.rhythm];
  // Para cerrar bailando hace falta un lugar de noche al final, sea la hora que sea.
  return answers.mood === 'bailar' ? [slots[0], slots[1], ['noche']] : slots;
};

const toItinerary = (answers: RouteAnswers, stops: PlanPlace[]): Itinerary => ({
  id: `plan-${stops.map((place) => place.id).join('.')}`,
  title: answers.mood === 'bailar' ? `${TITLES[answers.moment][answers.rhythm]} y a bailar` : TITLES[answers.moment][answers.rhythm],
  vibes: [VIBE_LABEL[answers.company]],
  moment: answers.moment,
  stops: stops.map((place, index) => ({ placeId: place.id, time: MOMENT_TIMES[answers.moment][index] })),
  source: 'generada',
});

const contextFor = (answers: RouteAnswers, places: PlanPlace[]): Context => {
  const zones = answers.zone === 'sorpresa'
    // Sorpréndeme: se sortea una zona con lugares suficientes para empezar.
    ? [pickRandom(ZONE_IDS.filter((zone) => places.filter((place) => routeZone(place) === zone).length >= 3))].filter(Boolean)
    : [answers.zone];
  return { answers, places, zones: zones.length ? zones : null };
};

// Arma la ruta completa. `avoid` son lugares ya vistos, para que "otro plan" cambie.
export function buildRoute(answers: RouteAnswers, places: PlanPlace[], avoid: string[] = []): Itinerary | null {
  const context = contextFor(answers, places);
  const slots = slotsFor(answers);
  const attempt = (skip: string[]) => {
    const used = new Set(skip);
    const stops: PlanPlace[] = [];
    for (const [index, slot] of slots.entries()) {
      const place = pickNear(context, index, slot, stops.slice(-1), used, slots[index + 1], answers.mood === 'bailar' && index === 2);
      if (!place) return null;
      used.add(place.id);
      stops.push(place);
    }
    return stops;
  };
  // Si evitar lo ya visto deja sin opciones, se permite repetir.
  const stops = attempt(avoid) ?? attempt([]);
  return stops ? toItinerary(answers, stops) : null;
}

// Cambia una sola parada por otra que cumpla el mismo papel y quede cerca de sus vecinas.
export function rerollStop(answers: RouteAnswers, places: PlanPlace[], current: Itinerary, index: number, seen: string[] = []): Itinerary | null {
  const byId = new Map(places.map((place) => [place.id, place]));
  const stops = current.stops.map((stop) => byId.get(stop.placeId));
  if (stops.some((place) => !place)) return null;
  const resolved = stops as PlanPlace[];
  const context = contextFor(answers, places);
  // La zona del plan actual manda: la parada nueva se queda donde ya está la ruta.
  const currentZones = [...new Set(resolved.map(routeZone).filter((zone): zone is ZoneId => Boolean(zone)))];
  const neighbors = [resolved[index - 1], resolved[index + 1]].filter((place): place is PlanPlace => Boolean(place));
  const slot = slotsFor(answers)[index] ?? [resolved[index].interest];
  const taken = resolved.map((place) => place.id);
  const scoped = { ...context, zones: currentZones.length ? currentZones : context.zones };
  const next = pickStop(scoped, index, slot, neighbors, new Set([...taken, ...seen]))
    ?? pickStop(scoped, index, slot, neighbors, new Set(taken));
  if (!next) return null;
  const replaced = resolved.map((place, position) => (position === index ? next : place));
  return { ...toItinerary(answers, replaced), title: current.title };
}

/* ---------- Ruleta: plan completo de un giro ---------- */

const RHYTHMS: RouteAnswers['rhythm'][] = ['caminar', 'platicar', 'comer', 'cultura'];
export const SPIN_STOPS = 3;
// Tramo máximo entre paradas para llamarlo caminable, y cuántas veces se sortea el ritmo buscándolo.
const WALK_KM = 1.15;
const SPIN_TRIES = 8;

// Zonas donde un giro puede armar algo que se camine: algún lugar de la zona, abierto a esa
// hora, con al menos otros dos a pie. Una zona con tres lugares regados no cuenta.
export const spinZones = (places: PlanPlace[], moment: ItineraryMoment): ZoneId[] => {
  const open = places.filter((place) => place.coordinates && AROUND[moment].includes(place.interest));
  return ZONE_IDS.filter((zone) => open.some((place) => routeZone(place) === zone
    && open.filter((other) => other.id !== place.id && (km(place, other) ?? 9) <= WALK_KM).length >= SPIN_STOPS - 1));
};

// Tres paradas cercanas entre sí y en orden (arranque, actividad, cierre) para esa zona y hora.
// `kept` son las paradas fijas con candado, cada una en su posición: no se tocan y lo demás
// se acomoda cerca de ellas. El ritmo se sortea para que cada giro salga distinto.
export function spinRoute({ zone, moment, kept = [], avoid = [] }: { zone: ZoneId; moment: ItineraryMoment; kept?: (PlanPlace | null | undefined)[]; avoid?: string[] }, places: PlanPlace[]): Itinerary | null {
  const fixed = Array.from({ length: SPIN_STOPS }, (_, index) => kept[index] ?? null);
  const fixedPlaces = fixed.filter((place): place is PlanPlace => place !== null);
  // Con paradas fijas manda la zona donde ya están.
  const fixedZones = [...new Set(fixedPlaces.map(routeZone).filter((id): id is ZoneId => Boolean(id)))];
  const attempt = (pool: PlanPlace[], skip: string[]) => {
    const rhythm = pickRandom(RHYTHMS);
    const slots = SLOTS[moment][rhythm];
    const context: Context = { answers: { moment, rhythm }, places: pool, zones: fixedZones.length ? fixedZones : [zone] };
    const used = new Set([...skip, ...fixedPlaces.map((place) => place.id)]);
    const stops: (PlanPlace | null)[] = [...fixed];
    for (let index = 0; index < SPIN_STOPS; index += 1) {
      if (stops[index]) continue;
      const beside = [stops[index - 1], stops[index + 1]].filter((place): place is PlanPlace => Boolean(place));
      // Sin vecina inmediata, que al menos quede cerca de la parada fija que haya.
      const neighbors = beside.length ? beside : fixedPlaces.slice(0, 1);
      const place = pickNear(context, index, slots[index], neighbors, used, stops[index + 1] ? undefined : slots[index + 1]);
      if (!place) return null;
      used.add(place.id);
      stops[index] = place;
    }
    return { rhythm, stops: stops as PlanPlace[] };
  };
  // La promesa es que se camina: sólo lugares con ubicación, y ningún tramo largo entre paradas libres.
  const located = places.filter((place) => place.coordinates);
  const walkable = (stops: PlanPlace[]) => stops.every((place, index) => {
    if (index === 0 || (fixed[index] && fixed[index - 1])) return true;
    const distance = km(stops[index - 1], place);
    return distance !== null && distance <= WALK_KM;
  });
  const tryFor = (skip: string[]) => {
    for (let round = 0; round < SPIN_TRIES; round += 1) {
      const candidate = attempt(located, skip);
      if (candidate && walkable(candidate.stops)) return candidate;
    }
    return null;
  };
  // Primero sin repetir lo ya visto; si ya no alcanza, se repite antes que mandar lejos.
  const result = tryFor(avoid) ?? tryFor([]) ?? attempt(located, []) ?? attempt(places, []);
  if (!result) return null;
  return {
    id: `ruleta-${result.stops.map((place) => place.id).join('.')}`,
    title: TITLES[moment][result.rhythm],
    vibes: [],
    moment,
    stops: result.stops.map((place, index) => ({ placeId: place.id, time: MOMENT_TIMES[moment][index] })),
    source: 'generada',
  };
}
