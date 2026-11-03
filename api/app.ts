import { createHash } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { BUNDLED_SUNSETS, ROULETTE_ZONES } from '../src/data/planBuilder.js';
import { getLiveCatalog } from './_catalog.js';
import { adminDb, firebaseConfigured } from './_firebase.js';

/* ============================================================
   GET /api/app → todo lo que pinta la app nativa en una llamada:
   lugares (spots + Rack + cultura + atardeceres), hotspots de la
   semana y la configuración editable sin publicar otra versión.

   La configuración vive en Firestore meta/app (se edita desde la
   consola de Firebase). Cualquier campo que falte usa el valor de
   DEFAULT_CONFIG, así que el documento puede no existir.
   ============================================================ */

type AppConfig = {
  // La app más vieja que sigue funcionando; abajo de esto pide actualizar.
  minVersion: string;
  features: { ruleta: boolean; preguntas: boolean; momentos: boolean; subirSpot: boolean };
  copy: { homeKicker: string; homeTitle: string; homeAccent: string; homeLead: string; planLead: string; momentosLead: string };
  // Si no hay hotspots publicados, estos van primero en Inicio.
  featuredSpotIds: string[];
  banner: { text: string; url?: string } | null;
  links: { contacto: string; privacidad: string; instagram: string; web: string };
};

const DEFAULT_CONFIG: AppConfig = {
  minVersion: '1.0.0',
  features: { ruleta: true, preguntas: true, momentos: true, subirSpot: true },
  copy: {
    homeKicker: '/ GUADALAJARA',
    homeTitle: 'Menos pantalla.',
    homeAccent: 'Más mundo.',
    homeLead: 'Dónde comer y tomar, vintage y planes para salir. Elegidos por personas reales, sin rankings pagados.',
    planLead: 'Gira, fija los que te laten y sal.',
    momentosLead: 'Lo que viviste, guardado sólo en tu teléfono.',
  },
  featuredSpotIds: ['spot_003', 'spot_018', 'spot_105', 'spot_131'],
  banner: null,
  links: {
    contacto: 'mailto:contacto@bruuk.space',
    privacidad: 'https://bruuk.space/privacidad',
    instagram: 'https://instagram.com/bruuk.space',
    web: 'https://bruuk.space',
  },
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

// Sólo se aceptan las llaves conocidas y del mismo tipo que el valor por defecto:
// un error al editar meta/app no puede tumbar la app.
function mergeConfig<T>(defaults: T, override: unknown): T {
  if (!isPlainObject(defaults) || !isPlainObject(override)) return defaults;
  const result: Record<string, unknown> = { ...defaults };
  for (const [key, fallback] of Object.entries(defaults)) {
    const value = override[key];
    if (value === undefined) continue;
    if (key === 'banner') {
      result.banner = isPlainObject(value) && typeof value.text === 'string' && value.text.trim()
        ? { text: value.text.trim().slice(0, 200), url: typeof value.url === 'string' && /^https?:\/\//.test(value.url) ? value.url : undefined }
        : null;
    } else if (Array.isArray(fallback)) {
      if (Array.isArray(value)) result[key] = value.filter((item) => typeof item === 'string');
    } else if (isPlainObject(fallback)) {
      result[key] = mergeConfig(fallback, value);
    } else if (typeof value === typeof fallback) {
      result[key] = value;
    }
  }
  return result as T;
}

async function loadConfig(): Promise<AppConfig> {
  if (!firebaseConfigured) return DEFAULT_CONFIG;
  try {
    const doc = await adminDb().collection('meta').doc('app').get();
    return mergeConfig(DEFAULT_CONFIG, doc.data());
  } catch (error) {
    console.error('App config error:', error);
    return DEFAULT_CONFIG;
  }
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'Método no permitido.' });

  const [catalog, config] = await Promise.all([getLiveCatalog(), loadConfig()]);
  const placeIds = new Set(catalog.places.map((place) => place.id));
  const sunsets = BUNDLED_SUNSETS.map((entry) => (typeof entry === 'string' ? entry : entry.id)).filter((id) => placeIds.has(id));

  const content = {
    config,
    places: catalog.places,
    hotspots: catalog.hotspots,
    sunsets,
    zones: ROULETTE_ZONES,
  };
  // La app compara este número para saber si algo cambió sin revisar todo.
  const version = createHash('sha1').update(JSON.stringify(content)).digest('hex').slice(0, 12);

  response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  return response.status(200).json({ version, live: catalog.live, ...content });
}
