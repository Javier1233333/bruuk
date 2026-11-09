// Tipos, opciones del plan y el catálogo empaquetado (sólo respaldo sin conexión).
// Los lugares que se ven en la app vienen de /api/app: ver lib/content.tsx.
import Constants from 'expo-constants';
import type { PlanInterest, PlanPlace } from '../../../src/data/planBuilder';

export * from '../../../src/data/planBuilder';

export const SITE_URL: string = Constants.expoConfig?.extra?.siteUrl ?? 'https://bruuk.space';

// Las fotos del repo son rutas del sitio; las que se suben en el admin ya son URLs completas.
export const imageUri = (place: Pick<PlanPlace, 'imageUrl'>) =>
  !place.imageUrl ? undefined : /^https?:\/\//.test(place.imageUrl) ? place.imageUrl : `${SITE_URL}${place.imageUrl}`;

export const INTEREST_LABELS: Record<PlanInterest, string> = {
  cafe: 'Café',
  comida: 'Comida',
  noche: 'Noche',
  vintage: 'Vintage',
  cultura: 'Cultura',
  atardecer: 'Atardecer',
};

export const shareUrlFor = (place: PlanPlace) =>
  place.interest === 'vintage' || place.interest === 'cultura'
    ? `${SITE_URL}/guadalajara/rack`
    : `${SITE_URL}/guadalajara/spots?spot=${encodeURIComponent(place.id)}`;
