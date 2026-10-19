import type { VercelRequest, VercelResponse } from '@vercel/node';
import spotsData from '../src/data/spots.json';
import { adminDb, firebaseConfigured } from './app/firebase';

/* ============================================================
   GET /api/spots → spots activos desde Firestore (colección "spots").
   Se editan en /admin/spots sin redeploy; el cache del CDN es corto
   para que los cambios aparezcan en ~1 minuto.
   Sin credenciales de Firebase (dev local) sirve src/data/spots.json.
   ============================================================ */

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  if (!firebaseConfigured) {
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(spotsData);
  }

  try {
    const snap = await adminDb().collection('spots').where('active', '==', true).get();
    const spots = snap.docs
      .map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          name: d.name,
          type: d.type,
          description: d.description,
          imageUrl: d.imageUrl,
          colorAccent: d.colorAccent,
          rating: d.rating ?? undefined,
          price: d.price ?? undefined,
          mapsLink: d.mapsLink,
          coordinates: d.coordinates ?? undefined,
        };
      })
      .sort((a, b) => String(a.name).localeCompare(String(b.name), 'es'));

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(spots);
  } catch (err) {
    console.error('spots error:', err);
    return res.status(500).json({ error: 'Error al cargar spots' });
  }
}
