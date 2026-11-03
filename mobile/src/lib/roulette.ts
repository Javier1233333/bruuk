// Lógica de la ruleta, igual que src/pages/PlanRoulette.tsx de la web, pero sobre el catálogo
// en vivo de /api/app (así un spot nuevo del admin también puede salir).
import { MOMENT_INTERESTS, type PlanInterest, type PlanPlace, type RouletteMoment, type RouletteZone } from './catalog';

export type RouletteSlot = { placeId: string; locked: boolean };
export type RouletteState = { moment: RouletteMoment; zone: RouletteZone; interests: PlanInterest[]; count: number; slots: RouletteSlot[] };

export const randomItem = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
};

// Categorías que entran al giro: las elegidas que tengan sentido a esa hora; si no hay, todas las de esa hora.
const allowedInterests = ({ moment, interests }: Pick<RouletteState, 'moment' | 'interests'>) => {
  const forMoment = MOMENT_INTERESTS[moment];
  const chosen = interests.filter((interest) => forMoment.includes(interest));
  return chosen.length > 0 ? chosen : forMoment;
};

export const roulettePool = (places: PlanPlace[], state: Pick<RouletteState, 'moment' | 'interests' | 'zone'>) => {
  const interests = allowedInterests(state);
  return places.filter((place) => interests.includes(place.interest) && (state.zone === 'toda' || place.zone === state.zone));
};

// Llena las casillas sin fijar repartiendo categorías, para que no salgan tres cafés seguidos.
// Con "Toda la ciudad", después de la primera parada busca lugares de la misma zona: así la ruta se puede caminar.
export const pickSlots = (places: PlanPlace[], byId: Map<string, PlanPlace>, state: RouletteState): RouletteSlot[] => {
  const pool = roulettePool(places, state);
  const kept = state.slots.slice(0, state.count);
  const used = new Set(kept.filter((slot) => slot.locked).map((slot) => slot.placeId));
  let anchorZone = kept.map((slot) => (slot.locked ? byId.get(slot.placeId)?.zone : undefined)).find(Boolean);
  const interests = shuffle([...new Set(pool.map((place) => place.interest))]);
  let turn = 0;
  return Array.from({ length: state.count }, (_, index) => {
    const current = kept[index];
    if (current?.locked) return current;
    const interest = interests[turn++ % interests.length];
    const options = pool.filter((place) => !used.has(place.id));
    const nearby = anchorZone ? options.filter((place) => place.zone === anchorZone) : options;
    const candidates = nearby.length > 0 ? nearby : options;
    const preferred = candidates.filter((place) => place.interest === interest);
    const place = randomItem(preferred.length > 0 ? preferred : candidates);
    if (!place) return null;
    used.add(place.id);
    anchorZone ??= place.zone;
    return { placeId: place.id, locked: false };
  }).filter((slot): slot is RouletteSlot => slot !== null);
};
