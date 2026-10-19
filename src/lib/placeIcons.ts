import { Coffee, Disc3, Landmark, Martini, ShoppingBag, Store, Sunset, Utensils, type LucideIcon } from 'lucide-react';
import type { PlanInterest, PlanPlace } from '../data/planBuilder';
import { getSpotVisual } from './spotVisual';

export const INTEREST_ICONS: Record<PlanInterest, LucideIcon> = {
  cafe: Coffee,
  comida: Utensils,
  noche: Martini,
  vintage: ShoppingBag,
  cultura: Landmark,
  atardecer: Sunset,
};

// Los mismos íconos que se ven en la app: los de Spots según el tipo, los de Rack y el de museos.
export const placeIcon = (place: PlanPlace): LucideIcon => {
  if (place.interest === 'atardecer') return Sunset;
  if (place.interest === 'cultura') return Landmark;
  if (place.interest === 'vintage') return place.type === 'Tianguis' ? ShoppingBag : place.type === 'Tienda vintage' ? Store : Disc3;
  return getSpotVisual(place.type).Icon;
};
