import { timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './supabase';

/* ============================================================
   /api/app/events
   GET  → Lista todos los eventos activos (público)
   POST → Crear evento (admin con x-admin-key)

   ENMIENDA E1: capacity_remaining inicializado = capacity al crear.
   ENMIENDA E2: Sin stripe_price_id — el precio se maneja on-the-fly
                en event-checkout.ts con price_data.
   ============================================================ */

const APP_ADMIN_KEY_ENV = 'APP_ADMIN_KEY';

function isAdmin(req: VercelRequest): boolean {
  const expected = process.env[APP_ADMIN_KEY_ENV];
  const provided = req.headers['x-admin-key'];
  if (!expected || typeof provided !== 'string') return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ── GET /api/app/events ──────────────────────────────────
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

    const { data: events, error } = await supabaseAdmin
      .from('app_events')
      .select('id, title, description, date_iso, date_label, location_text, location_maps_link, category, category_color, capacity, capacity_remaining, price_mxn, is_active')
      .eq('is_active', true)
      .order('date_iso', { ascending: true });

    if (error) {
      console.error('events fetch error:', error);
      return res.status(500).json({ error: 'Error al cargar eventos' });
    }

    // Obtener conteo de RSVPs por evento via service key
    const { data: rsvpCounts } = await supabaseAdmin
      .from('app_rsvps')
      .select('event_id')
      .in('event_id', (events ?? []).map((e) => e.id));

    const countMap: Record<string, number> = {};
    for (const row of rsvpCounts ?? []) {
      const eid = row.event_id as string;
      countMap[eid] = (countMap[eid] ?? 0) + 1;
    }

    const result = (events ?? []).map((ev) => {
      const rsvp_count = countMap[ev.id] ?? 0;
      const is_free = ev.price_mxn === 0;
      // Para eventos gratuitos: cupo disponible = capacity_remaining del campo atómico
      // Para eventos de pago: cupo disponible = capacity_remaining del campo atómico
      const is_full = (ev.capacity_remaining as number) <= 0;
      return {
        id: ev.id,
        title: ev.title,
        description: ev.description,
        date_label: ev.date_label,
        location_text: ev.location_text,
        location_maps_link: ev.location_maps_link ?? null,
        category: ev.category,
        category_color: ev.category_color,
        capacity: ev.capacity,
        capacity_remaining: ev.capacity_remaining,
        price_mxn: ev.price_mxn,
        is_free,
        rsvp_count,
        is_full,
      };
    });

    return res.status(200).json(result);
  }

  // ── POST /api/app/events (admin) ─────────────────────────
  if (req.method === 'POST') {
    if (!isAdmin(req)) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    const body = req.body as Record<string, unknown> | null | undefined;
    if (!body) return res.status(400).json({ error: 'Body requerido' });

    const {
      title,
      description,
      date_iso,
      date_label,
      location_text,
      location_maps_link,
      category,
      category_color,
      capacity,
      price_mxn,
    } = body;

    // Validaciones básicas
    if (!title || !date_iso || !date_label || !location_text || !category || !category_color || capacity === undefined || capacity === null) {
      return res.status(400).json({
        error: 'Campos requeridos: title, date_iso, date_label, location_text, category, category_color, capacity',
      });
    }

    if (typeof title !== 'string' || title.length < 1 || title.length > 120) {
      return res.status(400).json({ error: 'title debe tener entre 1 y 120 caracteres' });
    }
    if (typeof description === 'string' && description.length > 800) {
      return res.status(400).json({ error: 'description no puede superar 800 caracteres' });
    }
    if (typeof location_text !== 'string' || location_text.length > 200) {
      return res.status(400).json({ error: 'location_text no puede superar 200 caracteres' });
    }
    if (typeof category_color !== 'string' || !HEX_COLOR_RE.test(category_color)) {
      return res.status(400).json({ error: 'category_color debe ser formato hex "#rrggbb"' });
    }

    const capacityNum = Number(capacity);
    if (!Number.isInteger(capacityNum) || capacityNum <= 0) {
      return res.status(400).json({ error: 'capacity debe ser entero positivo' });
    }

    const priceMxn = price_mxn !== undefined ? Number(price_mxn) : 0;
    if (!Number.isInteger(priceMxn) || priceMxn < 0) {
      return res.status(400).json({ error: 'price_mxn debe ser entero >= 0' });
    }

    const { data: newEvent, error: insertError } = await supabaseAdmin
      .from('app_events')
      .insert({
        title: (title as string).slice(0, 120),
        description: typeof description === 'string' ? description.slice(0, 800) : '',
        date_iso,
        date_label: typeof date_label === 'string' ? date_label.slice(0, 60) : date_label,
        location_text: (location_text as string).slice(0, 200),
        location_maps_link: typeof location_maps_link === 'string' ? location_maps_link : null,
        category,
        category_color,
        capacity: capacityNum,
        capacity_remaining: capacityNum,  // E1: inicializar igual a capacity
        price_mxn: priceMxn,
        is_active: true,
      })
      .select('id, title, date_label, price_mxn')
      .single();

    if (insertError) {
      console.error('event insert error:', insertError);
      return res.status(400).json({ error: insertError.message });
    }

    return res.status(201).json(newEvent);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
