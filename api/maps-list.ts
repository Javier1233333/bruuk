import { randomBytes } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAuthHeader } from './_firebase.js';

/* ============================================================
   POST /api/maps-list { lookup: [{ key, query }] } → coordenadas
   de cada lugar con Google Places (Text Search). Necesita
   GOOGLE_MAPS_API_KEY en Vercel. Va en esta función porque el
   plan de Vercel sólo permite 12.

   POST /api/maps-list { url } → lugares de una lista de Google Maps
   compartida ("Cualquier persona con el vínculo"). Solo admin.
   Usa el endpoint interno que la propia página de la lista llama
   (entitylist/getlist): no es API pública, si Google lo cambia
   esto deja de funcionar y hay que revisar el parseo.
   ============================================================ */

// Solo links de Google: el servidor no debe pedir URLs arbitrarias
const ALLOWED_HOST = /^(maps\.app\.goo\.gl|goo\.gl|(www\.|maps\.)?google\.[a-z.]+)$/;

// El acortador solo responde con un redirect simple a un user agent pelón;
// con uno de Chrome completo sirve una página con JS y no hay redirect.
const SHORTLINK_UA = 'Mozilla/5.0';
const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export interface MapsListPlace {
  name: string;
  address: string | null;
  note: string | null; // la nota que le pusiste al lugar en la lista
  lat: number | null;
  lng: number | null;
  mapsLink: string;
}

class ListError extends Error {}

async function resolveList(url: string): Promise<{ listId: string; token: string | null }> {
  const res = await fetch(url, { headers: { 'User-Agent': SHORTLINK_UA }, redirect: 'follow' });
  // Puede terminar en consent.google.com con la URL original codificada en "continue"
  const finalUrl = decodeURIComponent(res.url);
  const listId = finalUrl.match(/!2s(-?[\w-]+)!/)?.[1] ?? finalUrl.match(/\/placelists\/list\/(-?[\w-]+)/)?.[1];
  if (!listId) throw new ListError('El link no es de una lista de Google Maps (¿es de un solo lugar?).');
  const token = finalUrl.match(/token=([\w-]+)/)?.[1] ?? null;
  return { listId, token };
}

const str = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : null);
const num = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : null);

function parsePlace(raw: unknown): MapsListPlace | null {
  if (!Array.isArray(raw)) return null;
  const info: unknown[] = Array.isArray(raw[1]) ? raw[1] : [];
  const name = str(raw[2]);
  if (!name) return null;
  const latlng: unknown[] = Array.isArray(info[5]) ? info[5] : [];
  const lat = num(latlng[2]);
  const lng = num(latlng[3]);
  const placeId = str(info[7]);
  const query = lat !== null && lng !== null ? `${lat},${lng}` : name;
  const params = new URLSearchParams({ api: '1', query });
  if (placeId) params.set('query_place_id', placeId);
  return {
    name,
    address: str(info[4]),
    note: str(raw[3]),
    lat,
    lng,
    mapsLink: `https://www.google.com/maps/search/?${params}`,
  };
}

async function fetchList(listId: string, token: string | null): Promise<{ title: string | null; places: MapsListPlace[] }> {
  let listPage = `https://www.google.com/maps/placelists/list/${listId}`;
  if (token) listPage += `?token=${token}`;
  // !1s es un id de sesión que genera la página; uno al azar funciona
  const session = randomBytes(12).toString('base64url');
  const pb = `!1m4!1s${listId}!2e1!3m1!1e1!2e2!3e2!4i500!6m3!1s${session}!15i204459!28e2!13s${encodeURIComponent(listPage)}!16b1`;
  const res = await fetch(`https://www.google.com/maps/preview/entitylist/getlist?authuser=0&hl=es&gl=mx&pb=${pb}`, {
    headers: { 'User-Agent': BROWSER_UA },
  });
  if (!res.ok) throw new ListError(`Google respondió ${res.status}.`);

  const text = (await res.text()).replace(/^\)\]\}'/, '');
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ListError('Google no devolvió la lista. Revisa que esté compartida con "Cualquier persona con el vínculo".');
  }
  const list = Array.isArray(data) && Array.isArray(data[0]) ? data[0] : null;
  const rawPlaces = list && Array.isArray(list[8]) ? list[8] : null;
  if (!rawPlaces) throw new ListError('La lista está vacía o no es pública. Compártela con "Cualquier persona con el vínculo".');

  return {
    title: list ? str(list[4]) : null,
    places: rawPlaces.map(parsePlace).filter((place): place is MapsListPlace => place !== null),
  };
}

/* ---------- Coordenadas con Google Places ---------- */

export interface PlaceLookup {
  key: string;
  found: boolean;
  name?: string;
  address?: string;
  lat?: number;
  lng?: number;
  mapsLink?: string;
}

const MAX_LOOKUPS = 25;
// Sesgo hacia el área metropolitana de Guadalajara (30 km alrededor del centro).
const GDL_BIAS = { circle: { center: { latitude: 20.6736, longitude: -103.3440 }, radius: 30000 } };

async function lookupPlace(key: string, query: string, apiKey: string): Promise<PlaceLookup> {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri',
    },
    body: JSON.stringify({ textQuery: query, languageCode: 'es', regionCode: 'MX', locationBias: GDL_BIAS, pageSize: 1 }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new ListError(res.status === 403 || res.status === 400
      ? `Google rechazó la llave (${res.status}). Revisa que GOOGLE_MAPS_API_KEY tenga activada "Places API (New)".`
      : `Google respondió ${res.status}. ${detail.slice(0, 120)}`);
  }
  const data = await res.json() as { places?: { displayName?: { text?: string }; formattedAddress?: string; location?: { latitude?: number; longitude?: number }; googleMapsUri?: string }[] };
  const place = data.places?.[0];
  const lat = num(place?.location?.latitude);
  const lng = num(place?.location?.longitude);
  if (!place || lat === null || lng === null) return { key, found: false };
  return { key, found: true, name: str(place.displayName?.text) ?? undefined, address: str(place.formattedAddress) ?? undefined, lat, lng, mapsLink: str(place.googleMapsUri) ?? undefined };
}

async function handleLookup(raw: unknown, res: VercelResponse) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'Falta la variable GOOGLE_MAPS_API_KEY en Vercel (con "Places API (New)" activada).' });
  const items = (Array.isArray(raw) ? raw : [])
    .map((item) => ({ key: str((item as { key?: unknown })?.key), query: str((item as { query?: unknown })?.query) }))
    .filter((item): item is { key: string; query: string } => Boolean(item.key && item.query))
    .map((item) => ({ key: item.key.slice(0, 120), query: item.query.slice(0, 200) }));
  if (items.length === 0 || items.length > MAX_LOOKUPS) return res.status(400).json({ error: `Manda de 1 a ${MAX_LOOKUPS} lugares por vez.` });
  try {
    // De 5 en 5 para no pegarle de golpe a Google.
    const results: PlaceLookup[] = [];
    for (let index = 0; index < items.length; index += 5) {
      results.push(...await Promise.all(items.slice(index, index + 5).map((item) => lookupPlace(item.key, item.query, apiKey))));
    }
    return res.status(200).json({ results });
  } catch (err) {
    if (err instanceof ListError) return res.status(502).json({ error: err.message });
    console.error('maps-list lookup error:', err);
    return res.status(502).json({ error: 'No se pudo consultar Google.' });
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const decoded = await verifyAuthHeader(req.headers.authorization);
  if (decoded?.admin !== true) return res.status(403).json({ error: 'Solo admin' });

  if (req.body?.lookup !== undefined) return handleLookup(req.body.lookup, res);

  const url = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
  let host = '';
  try {
    const parsed = new URL(url);
    if (parsed.protocol === 'https:') host = parsed.hostname;
  } catch { /* se responde abajo */ }
  if (!ALLOWED_HOST.test(host)) return res.status(400).json({ error: 'Pega un link de Google Maps (https://maps.app.goo.gl/...).' });

  try {
    const { listId, token } = await resolveList(url);
    return res.status(200).json(await fetchList(listId, token));
  } catch (err) {
    if (err instanceof ListError) return res.status(422).json({ error: err.message });
    console.error('maps-list error:', err);
    return res.status(502).json({ error: 'No se pudo leer la lista de Google Maps.' });
  }
}
