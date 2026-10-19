// El catálogo vive en la web (src/data) y se comparte tal cual: un solo lugar para editar spots.
import Constants from 'expo-constants';
import {
  PLAN_PLACES,
  PLAN_PLACES_BY_ID,
  type PlanInterest,
  type PlanPlace,
} from '../../../src/data/planBuilder';

export * from '../../../src/data/planBuilder';

export const SITE_URL: string = Constants.expoConfig?.extra?.siteUrl ?? 'https://bruuk.space';

export const imageUri = (place: PlanPlace) => (place.imageUrl ? `${SITE_URL}${place.imageUrl}` : undefined);

export const placesFor = (interests: PlanInterest[]) => PLAN_PLACES.filter((place) => interests.includes(place.interest));

export const getPlace = (id: string) => PLAN_PLACES_BY_ID.get(id);

export const INTEREST_LABELS: Record<PlanInterest, string> = {
  cafe: 'Café',
  comida: 'Comida',
  noche: 'Noche',
  vintage: 'Vintage',
  cultura: 'Cultura',
  atardecer: 'Atardecer',
};
