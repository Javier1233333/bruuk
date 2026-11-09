import { useEffect, useState } from 'react';
import { PLAN_PLACES, PLAN_PLACES_BY_ID, type PlanPlace } from '../data/planBuilder';

/* ============================================================
   Catálogo de "Arma tu plan" en vivo: los lugares de /api/app
   (lo que hay en el admin, con su zona asignada a mano). Arranca
   con el catálogo empaquetado y lo cambia cuando llega la API;
   si falla, se queda con el empaquetado. Una petición por carga.
   ============================================================ */

let liveById: Map<string, PlanPlace> | null = null;
let livePlaces: PlanPlace[] | null = null;
let request: Promise<PlanPlace[] | null> | null = null;

const load = () => {
  request ??= fetch('/api/app')
    .then((res) => (res.ok ? res.json() : null))
    .then((data: { places?: unknown } | null) => {
      if (!data || !Array.isArray(data.places) || data.places.length === 0) return null;
      livePlaces = data.places as PlanPlace[];
      liveById = new Map(livePlaces.map((place) => [place.id, place]));
      return livePlaces;
    })
    .catch(() => null);
  return request;
};

// Un plan puede traer un id que sólo exista en uno de los dos catálogos.
export const getPlanPlace = (id: string) => liveById?.get(id) ?? PLAN_PLACES_BY_ID.get(id);

export function usePlanCatalog() {
  const [places, setPlaces] = useState<PlanPlace[]>(() => livePlaces ?? PLAN_PLACES);
  useEffect(() => {
    if (livePlaces) return;
    let alive = true;
    void load().then((fresh) => {
      if (alive && fresh) setPlaces(fresh);
    });
    return () => {
      alive = false;
    };
  }, []);
  return { places, getPlace: getPlanPlace };
}
