import sunsetData from '../data/atardeceres.json';
import { useSpots } from './useSpots';

// Atardeceres: miradores, parques y rooftops para ver caer el sol (src/data/atardeceres.json).
// La lista acepta el id de un spot existente o un spot completo
// (útil para miradores o parques que no pertenecen al feed de Spots).
export type SunsetSpot = {
  id: string;
  name: string;
  type: string;
  description: string;
  highlight?: string;
  imageUrl: string;
  colorAccent: string;
  mapsLink: string;
  city: string;
  rating?: number;
  price?: string;
};

type SunsetEntry = string | SunsetSpot;

export const SUNSET_IDS = new Set((sunsetData.sunset as SunsetEntry[]).map((entry) => (typeof entry === 'string' ? entry : entry.id)));

// En el orden de la lista: es una selección, no va al azar.
export function useSunsetSpots(): SunsetSpot[] {
  const allSpots = useSpots() as SunsetSpot[];
  return (sunsetData.sunset as SunsetEntry[])
    .map((entry) => (typeof entry === 'string' ? allSpots.find((spot) => spot.id === entry) : entry))
    .filter((spot): spot is SunsetSpot => Boolean(spot));
}
