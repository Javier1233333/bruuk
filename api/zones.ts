import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getLiveCatalog, publicZones } from './_catalog.js';

/* ============================================================
   GET /api/zones → las 7 zonas de Bruuk con lo curado en el admin
   (texto corto y top de cada zona, de meta/zoneGuides) y cuántos
   lugares tiene asignados cada una. La web lo usa para explorar
   por zona; la app lo recibe dentro de /api/app.
   ============================================================ */
export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'GET') return response.status(405).json({ error: 'Método no permitido.' });
  const catalog = await getLiveCatalog();
  response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  return response.status(200).json(publicZones(catalog));
}
