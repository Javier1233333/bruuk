import { Coffee, Croissant, IceCreamBowl, Martini, Music2, ShoppingBag, Sunset, Utensils, type LucideIcon } from 'lucide-react';

// Ícono, etiqueta e imagen de respaldo de cada categoría de Spots (tarjetas e imagen para compartir).
export type SpotVisual = {
  label: string;
  imageUrl?: string;
  Icon: LucideIcon;
};

const CATEGORY_VISUALS: Record<string, SpotVisual> = {
  cafe: {
    label: 'CAFÉ',
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=480&q=74',
    Icon: Coffee,
  },
  bakery: {
    label: 'PAN',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=480&q=74',
    Icon: Croissant,
  },
  food: {
    label: 'COMIDA',
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=480&q=74',
    Icon: Utensils,
  },
  bar: {
    label: 'BAR',
    imageUrl: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?auto=format&fit=crop&w=480&q=74',
    Icon: Martini,
  },
  night: {
    label: 'NOCHE',
    imageUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=480&q=74',
    Icon: Music2,
  },
  dessert: {
    label: 'POSTRE',
    imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=480&q=74',
    Icon: IceCreamBowl,
  },
  outdoors: {
    label: 'ATARDECER',
    Icon: Sunset,
  },
  shop: {
    label: 'TIENDA',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=480&q=74',
    Icon: ShoppingBag,
  },
};

export function getSpotVisual(type: string): SpotVisual {
  const value = type.toLocaleLowerCase('es');
  if (value.includes('mirador') || value.includes('parque') || value.includes('bosque')) return CATEGORY_VISUALS.outdoors;
  if (value.includes('panader')) return CATEGORY_VISUALS.bakery;
  if (value.includes('helad') || value.includes('postre')) return CATEGORY_VISUALS.dessert;
  if (value.startsWith('café') || value.startsWith('cafe') || value.startsWith('cafetería')) return CATEGORY_VISUALS.cafe;
  if (value.startsWith('restaurante') || value.startsWith('maris') || value.startsWith('pizz') || value.startsWith('bagel') || value.startsWith('sandwich') || value.startsWith('pollería') || value.startsWith('hamburgues')) return CATEGORY_VISUALS.food;
  if (value.includes('club') || value.includes('disco') || value.includes('antro') || value.includes('jazz')) return CATEGORY_VISUALS.night;
  if (value.includes('bar') || value.includes('coctel') || value.includes('cervec')) return CATEGORY_VISUALS.bar;
  if (value.includes('boutique') || value.includes('tienda') || value.includes('concept store')) return CATEGORY_VISUALS.shop;
  if (value.includes('café') || value.includes('cafe') || value.includes('brunch')) return CATEGORY_VISUALS.cafe;
  return CATEGORY_VISUALS.food;
}
