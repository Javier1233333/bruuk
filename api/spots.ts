import type { VercelRequest, VercelResponse } from '@vercel/node';
import spotsData from '../src/data/spots.json' with { type: 'json' };
import { adminDb, firebaseConfigured } from './_firebase.js';

/* ============================================================
   GET /api/spots → spots activos desde Firestore (colección "spots").
   Se editan en /admin/spots sin redeploy; el cache del CDN es corto
   para que los cambios aparezcan en ~1 minuto.
   Sin credenciales de Firebase (dev local) sirve src/data/spots.json.
   ============================================================ */

// Campos internos del panel que el sitio no necesita
const INTERNAL_FIELDS = new Set(['active', 'imagePath', 'updatedAt', 'order']);

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  if (!firebaseConfigured) {
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(spotsData);
  }

  try {
    const [snap, hotspotsDoc] = await Promise.all([
      adminDb().collection('spots').where('active', '==', true).get(),
      adminDb().collection('meta').doc('hotspots').get(),
    ]);
    // Hotspots de la semana (pestaña Hotspots del admin): cada uno lleva su lugar 1-3 y la fecha en que se publicaron
    const hotspotIds: string[] = hotspotsDoc.data()?.ids ?? [];
    const hotspotDate: string | undefined = hotspotsDoc.data()?.publishedAt?.toDate().toISOString().slice(0, 10);
    const spots = snap.docs
      .map((doc) => ({ id: doc.id, data: doc.data() }))
      // El orden de spots.json se guarda en "order"; los nuevos van al final
      .sort((a, b) => (a.data.order ?? Infinity) - (b.data.order ?? Infinity)
        || String(a.data.name).localeCompare(String(b.data.name), 'es'))
      .map(({ id, data }) => {
        const spot: Record<string, unknown> = { id };
        for (const [key, value] of Object.entries(data)) {
          if (!INTERNAL_FIELDS.has(key) && value !== null && value !== '') spot[key] = value;
        }
        const rank = hotspotIds.indexOf(id);
        if (rank !== -1) Object.assign(spot, { hotspot: rank + 1, hotspotDate });
        return spot;
      });

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json(spots);
  } catch (err) {
    console.error('spots error:', err);
    return res.status(500).json({ error: 'Error al cargar spots' });
  }
}
