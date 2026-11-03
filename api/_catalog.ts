import {
  BUNDLED_SUNSETS,
  PLAN_PLACES,
  PLAN_PLACES_BY_ID,
  buildPlanPlaces,
  type CatalogRack,
  type CatalogSpot,
  type PlanPlace,
} from '../src/data/planBuilder.js';
import { adminDb, firebaseConfigured } from './_firebase.js';

/* ============================================================
   Catálogo en vivo para las APIs: spots y Rack de Firestore
   (lo que se edita en /admin/spots) + cultura y atardeceres del
   repo. Lo usan /api/app (la app nativa) y /api/custom-plan.
   Se cachea 60 s por instancia; si Firestore falla o no está
   configurado, se usa el catálogo empaquetado.
   ============================================================ */

const CACHE_MS = 60 * 1000;
// Campos internos del panel que los clientes no necesitan
const INTERNAL_FIELDS = new Set(['active', 'imagePath', 'updatedAt', 'order']);

export type LiveCatalog = {
  places: PlanPlace[];
  byId: Map<string, PlanPlace>;
  hotspots: { ids: string[]; date?: string };
  live: boolean;
};

const bundledCatalog = (): LiveCatalog => ({
  places: PLAN_PLACES,
  byId: PLAN_PLACES_BY_ID,
  hotspots: { ids: [] },
  live: false,
});

type Doc = { id: string; data: Record<string, unknown> };

const publicDocs = (docs: Doc[]) =>
  docs
    // El orden de los JSON se guarda en "order"; los nuevos van al final
    .sort((a, b) => ((a.data.order as number) ?? Infinity) - ((b.data.order as number) ?? Infinity)
      || String(a.data.name).localeCompare(String(b.data.name), 'es'))
    .map(({ id, data }) => {
      const item: Record<string, unknown> = { id };
      for (const [key, value] of Object.entries(data)) {
        if (!INTERNAL_FIELDS.has(key) && value !== null && value !== '') item[key] = value;
      }
      return item;
    });

async function loadLiveCatalog(): Promise<LiveCatalog> {
  const db = adminDb();
  const [spotsSnap, rackSnap, hotspotsDoc] = await Promise.all([
    db.collection('spots').where('active', '==', true).get(),
    db.collection('rack').where('active', '==', true).get(),
    db.collection('meta').doc('hotspots').get(),
  ]);
  const hotspotIds: string[] = hotspotsDoc.data()?.ids ?? [];
  const hotspotDate: string | undefined = hotspotsDoc.data()?.publishedAt?.toDate().toISOString().slice(0, 10);

  const spots = publicDocs(spotsSnap.docs.map((doc) => ({ id: doc.id, data: doc.data() }))).map((spot) => {
    const rank = hotspotIds.indexOf(spot.id as string);
    return rank === -1 ? spot : { ...spot, hotspot: rank + 1, hotspotDate };
  }) as CatalogSpot[];
  const rack = publicDocs(rackSnap.docs.map((doc) => ({ id: doc.id, data: doc.data() }))) as CatalogRack[];

  // Con una colección vacía (antes de los scripts de seed) se queda lo empaquetado
  if (spots.length === 0) return bundledCatalog();
  const places = buildPlanPlaces({
    spots,
    rack: rack.length > 0 ? rack : PLAN_PLACES.filter((place) => place.interest === 'vintage').map(toCatalogRack),
    sunsets: BUNDLED_SUNSETS,
  });
  return {
    places,
    byId: new Map(places.map((place) => [place.id, place])),
    hotspots: { ids: hotspotIds.filter((id) => places.some((place) => place.id === id)), date: hotspotDate },
    live: true,
  };
}

const toCatalogRack = (place: PlanPlace): CatalogRack => ({
  id: place.id,
  name: place.name,
  category: place.category ?? 'Rack recomienda',
  description: place.description,
  imageUrl: place.imageUrl,
  mapsLink: place.mapsUrl,
  coordinates: place.coordinates,
  zone: place.zoneName,
});

let cached: { at: number; catalog: LiveCatalog } | null = null;
let pending: Promise<LiveCatalog> | null = null;

export async function getLiveCatalog(): Promise<LiveCatalog> {
  if (!firebaseConfigured) return bundledCatalog();
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.catalog;
  pending ??= loadLiveCatalog()
    .then((catalog) => {
      cached = { at: Date.now(), catalog };
      return catalog;
    })
    .catch((error) => {
      console.error('Live catalog error:', error);
      // Mejor un catálogo de hace unos minutos que ninguno
      return cached?.catalog ?? bundledCatalog();
    })
    .finally(() => {
      pending = null;
    });
  return pending;
}

// Busca primero en vivo y luego en lo empaquetado: la web y versiones viejas de la app
// mandan ids del JSON, y un lugar recién ocultado no debe romper un plan ya armado.
export const findPlace = (catalog: LiveCatalog, id: string) => catalog.byId.get(id) ?? PLAN_PLACES_BY_ID.get(id);
