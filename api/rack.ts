import type { VercelRequest, VercelResponse } from '@vercel/node';
import rackData from '../src/data/rack.json' with { type: 'json' };
import { adminDb, firebaseConfigured } from './_firebase.js';

/* ============================================================
   GET /api/rack → lugares activos de Rack desde Firestore
   (colección "rack"), editables en /admin/spots → Rack.
   Sin credenciales de Firebase o con la colección vacía
   sirve src/data/rack.json.
   ============================================================ */

// Campos internos del panel que el sitio no necesita
const INTERNAL_FIELDS = new Set(['active', 'imagePath', 'updatedAt', 'order']);

const bundled = () =>
  rackData
    .filter((place) => place.active)
    .map((place) => Object.fromEntries(Object.entries(place).filter(([key]) => !INTERNAL_FIELDS.has(key))));

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  if (!firebaseConfigured) return res.status(200).json(bundled());

  try {
    const snap = await adminDb().collection('rack').where('active', '==', true).get();
    // Antes de correr scripts/seed-rack.mjs la colección está vacía: se sirve el JSON
    if (snap.empty) return res.status(200).json(bundled());

    const places = snap.docs
      .map((doc) => ({ id: doc.id, data: doc.data() }))
      .sort((a, b) => (a.data.order ?? Infinity) - (b.data.order ?? Infinity)
        || String(a.data.name).localeCompare(String(b.data.name), 'es'))
      .map(({ id, data }) => {
        const place: Record<string, unknown> = { id };
        for (const [key, value] of Object.entries(data)) {
          if (!INTERNAL_FIELDS.has(key) && value !== null && value !== '') place[key] = value;
        }
        return place;
      });
    return res.status(200).json(places);
  } catch (err) {
    console.error('rack error:', err);
    return res.status(500).json({ error: 'Error al cargar Rack' });
  }
}
