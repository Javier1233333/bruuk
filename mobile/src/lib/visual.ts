// Ícono y etiqueta de cada lugar: los mismos de la web (src/lib/spotVisual.ts y placeIcons.ts).
import {
  Coffee, Croissant, Disc3, IceCreamBowl, Landmark, Martini, Moon, Music2, ShoppingBag, Sparkles, Store, Sun, Sunrise, Sunset, Utensils,
  type LucideIcon,
} from 'lucide-react-native';
import { ZONE_BY_ID, type ZoneId } from '../../../src/lib/zones';
import type { PlanInterest, PlanPlace, RouletteMoment } from './catalog';

type Visual = { label: string; Icon: LucideIcon };

const CATEGORY: Record<string, Visual> = {
  cafe: { label: 'CAFÉ', Icon: Coffee },
  bakery: { label: 'PAN', Icon: Croissant },
  food: { label: 'COMIDA', Icon: Utensils },
  bar: { label: 'BAR', Icon: Martini },
  night: { label: 'NOCHE', Icon: Music2 },
  dessert: { label: 'POSTRE', Icon: IceCreamBowl },
  outdoors: { label: 'ATARDECER', Icon: Sunset },
  shop: { label: 'TIENDA', Icon: ShoppingBag },
};

export function spotVisual(type: string): Visual {
  const value = type.toLocaleLowerCase('es');
  if (value.includes('mirador') || value.includes('parque') || value.includes('bosque')) return CATEGORY.outdoors;
  if (value.includes('panader')) return CATEGORY.bakery;
  if (value.includes('helad') || value.includes('postre')) return CATEGORY.dessert;
  if (value.startsWith('café') || value.startsWith('cafe') || value.startsWith('cafetería')) return CATEGORY.cafe;
  if (/^(restaurante|maris|pizz|bagel|sandwich|pollería|hamburgues)/.test(value)) return CATEGORY.food;
  if (value.includes('club') || value.includes('disco') || value.includes('antro') || value.includes('jazz')) return CATEGORY.night;
  if (value.includes('bar') || value.includes('coctel') || value.includes('cervec')) return CATEGORY.bar;
  if (value.includes('boutique') || value.includes('tienda') || value.includes('concept store')) return CATEGORY.shop;
  if (value.includes('café') || value.includes('cafe') || value.includes('brunch')) return CATEGORY.cafe;
  return CATEGORY.food;
}

export const INTEREST_ICONS: Record<PlanInterest, LucideIcon> = {
  cafe: Coffee,
  comida: Utensils,
  noche: Martini,
  vintage: ShoppingBag,
  cultura: Landmark,
  atardecer: Sunset,
};

export const MOMENT_ICONS: Record<RouletteMoment, LucideIcon> = { sorpresa: Sparkles, manana: Sunrise, tarde: Sun, noche: Moon };

export function placeVisual(place: PlanPlace): Visual {
  if (place.interest === 'atardecer') return { label: 'ATARDECER', Icon: Sunset };
  if (place.interest === 'cultura') return { label: 'CULTURA', Icon: Landmark };
  if (place.interest === 'vintage') {
    if (place.category === 'Tianguis') return { label: 'TIANGUIS', Icon: ShoppingBag };
    if (place.category === 'Rack recomienda') return { label: 'VINTAGE', Icon: Store };
    return { label: 'ANTIGÜEDADES', Icon: Disc3 };
  }
  return spotVisual(place.type);
}

// Color de cada lugar: el que eligió el admin o uno por categoría.
const KIND_COLORS: Record<string, string> = { 'Rack recomienda': '#64d23c', 'Vinilos y antigüedades': '#e8a145', Tianguis: '#a78bfa' };
export const accentFor = (place: PlanPlace) =>
  place.colorAccent ?? (place.category ? KIND_COLORS[place.category] : undefined) ?? (place.interest === 'atardecer' ? '#ff9a5c' : place.interest === 'cultura' ? '#6557d8' : '#8b7cf6');

// Nombre corto de la zona para etiquetas ("Americana" en vez de "Americana / Lafayette / Moderna").
export const zoneLabel = (place: Pick<PlanPlace, 'zone' | 'zoneName'>) =>
  (place.zone ? ZONE_BY_ID.get(place.zone as ZoneId)?.short : undefined) ?? place.zoneName ?? '';
