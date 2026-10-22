import { Disc3, ShoppingBag, Store, type LucideIcon } from 'lucide-react';
import { getSpotVisual } from '../lib/spotVisual';
import type { RackDoc, SpotDoc } from './spotsStore';

// Categorías y agrupación que comparten las secciones del admin (Spots, Rack y Zonas).

export type Category = { label: string; Icon: LucideIcon };

// Spots: mismas categorías que las tarjetas del sitio (getSpotVisual)
export const spotCategory = (spot: Pick<SpotDoc, 'type'>): Category => {
  const { label, Icon } = getSpotVisual(spot.type);
  return { label, Icon };
};

// Rack: las tres categorías del feed
const RACK_CATEGORIES: Record<RackDoc['category'], Category> = {
  'Rack recomienda': { label: 'TIENDAS VINTAGE', Icon: Store },
  'Vinilos y antigüedades': { label: 'ANTIGÜEDADES Y VINILOS', Icon: Disc3 },
  Tianguis: { label: 'TIANGUIS', Icon: ShoppingBag },
};
export const RACK_CATEGORY_NAMES = Object.keys(RACK_CATEGORIES) as RackDoc['category'][];
export const rackCategory = (place: Pick<RackDoc, 'category'>): Category =>
  RACK_CATEGORIES[place.category] ?? RACK_CATEGORIES['Rack recomienda'];

// Orden de los grupos: primero las de Spots, luego las de Rack
const CATEGORY_ORDER = ['CAFÉ', 'PAN', 'POSTRE', 'COMIDA', 'BAR', 'NOCHE', 'TIENDA', 'ATARDECER', ...Object.values(RACK_CATEGORIES).map((category) => category.label)];

export function groupByCategory<T>(items: T[], categoryOf: (item: T) => Category, hasZone: (item: T) => boolean) {
  const groups = new Map<string, { category: Category; items: T[] }>();
  for (const item of items) {
    const category = categoryOf(item);
    const group = groups.get(category.label) ?? { category, items: [] };
    group.items.push(item);
    groups.set(category.label, group);
  }
  return [...groups.values()]
    .sort((a, b) => CATEGORY_ORDER.indexOf(a.category.label) - CATEGORY_ORDER.indexOf(b.category.label))
    .map(({ category, items: groupItems }) => ({
      ...category,
      items: groupItems,
      missingZone: groupItems.filter((item) => !hasZone(item)).length,
    }));
}
