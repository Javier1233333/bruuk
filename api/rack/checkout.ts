import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './supabase';
import { getStripe } from './stripe';

/* ============================================================
   POST /api/rack/checkout
   body: { items: [{ id: "<uuid de rack_products>" }] }

   Flujo seguro:
   1. Valida el payload (ids UUID, máx 20 piezas, sin duplicados).
   2. Lee título y PRECIO desde la base de datos — nunca del cliente.
   3. Reserva las piezas de forma atómica (disponible → apartado).
      Si alguien se adelantó con alguna, revierte y responde 409.
   4. Crea la orden 'pending' y la sesión de Stripe Checkout (30 min).
   5. Devuelve { url } para redirigir al checkout hosteado de Stripe.

   El webhook (webhook.ts) cierra el ciclo: paid → agotado,
   expired → vuelve a disponible.
   ============================================================ */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_ITEMS = 20;

function siteUrl(req: VercelRequest): string {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  const host = req.headers.host ?? 'localhost:3000';
  const proto = host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https';
  return `${proto}://${host}`;
}

async function releaseReservation(ids: string[]) {
  if (ids.length === 0) return;
  await supabaseAdmin
    .from('rack_products')
    .update({ status: 'disponible' })
    .in('id', ids)
    .eq('status', 'apartado');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = getStripe();
  if (!stripe) {
    return res.status(503).json({
      error: 'Los pagos aún no están configurados. Falta STRIPE_SECRET_KEY en las variables de entorno.',
      code: 'stripe_not_configured',
    });
  }

  // ── 1. Validar payload ───────────────────────────────
  const rawItems = req.body?.items;
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return res.status(400).json({ error: 'Se requiere items: [{ id }]' });
  }
  if (rawItems.length > MAX_ITEMS) {
    return res.status(400).json({ error: `Máximo ${MAX_ITEMS} piezas por orden` });
  }

  const ids = [...new Set(
    rawItems.map((it: { id?: unknown }) => (typeof it?.id === 'string' ? it.id : ''))
  )];
  if (ids.some((id) => !UUID_RE.test(id))) {
    return res.status(400).json({ error: 'Cada item necesita un id válido' });
  }

  // ── 2. Leer piezas y precios desde la DB ─────────────
  const { data: products, error: fetchError } = await supabaseAdmin
    .from('rack_products')
    .select('id, slug, title, price, currency, status, images, category')
    .in('id', ids);

  if (fetchError) return res.status(500).json({ error: 'Error al leer las piezas' });
  if (!products || products.length !== ids.length) {
    return res.status(404).json({ error: 'Alguna pieza ya no existe', code: 'not_found' });
  }

  const unavailable = products.filter((p) => p.status !== 'disponible');
  if (unavailable.length > 0) {
    return res.status(409).json({
      error: 'Alguien se adelantó con una o más piezas',
      code: 'unavailable',
      unavailable: unavailable.map((p) => ({ id: p.id, title: p.title, status: p.status })),
    });
  }

  // ── 3. Reserva atómica: disponible → apartado ────────
  const { data: reserved, error: reserveError } = await supabaseAdmin
    .from('rack_products')
    .update({ status: 'apartado' })
    .in('id', ids)
    .eq('status', 'disponible')
    .select('id');

  if (reserveError) return res.status(500).json({ error: 'Error al apartar las piezas' });

  const reservedIds = (reserved ?? []).map((r) => r.id as string);
  if (reservedIds.length !== ids.length) {
    // Race condition: alguien ganó alguna pieza entre la lectura y la reserva
    await releaseReservation(reservedIds);
    return res.status(409).json({
      error: 'Alguien se adelantó con una o más piezas',
      code: 'unavailable',
    });
  }

  try {
    // ── 4. Crear orden pending ─────────────────────────
    const amountTotal = products.reduce((sum, p) => sum + p.price, 0);
    const orderItems = products.map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      price: p.price,
      category: p.category,
    }));

    const { data: order, error: orderError } = await supabaseAdmin
      .from('rack_orders')
      .insert({
        status: 'pending',
        items: orderItems,
        amount_total: amountTotal,
        currency: 'MXN',
      })
      .select('id')
      .single();

    if (orderError || !order) throw new Error('No se pudo crear la orden');

    // ── 5. Sesión de Stripe Checkout ───────────────────
    const base = siteUrl(req);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      currency: 'mxn',
      line_items: products.map((p) => ({
        quantity: 1, // piezas únicas
        price_data: {
          currency: 'mxn',
          unit_amount: p.price * 100, // price está en pesos enteros
          product_data: {
            name: p.title,
            metadata: { rack_product_id: p.id },
            ...(Array.isArray(p.images) && p.images.length > 0 ? { images: p.images.slice(0, 1) } : {}),
          },
        },
      })),
      metadata: { rack_order_id: order.id },
      success_url: `${base}/rack/gracias?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/rack/carrito?cancelled=1`,
      // Stripe exige mínimo 30 min; 31 evita rechazos por desfase de reloj.
      // La reserva de las piezas dura lo mismo que la sesión.
      expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
    });

    await supabaseAdmin
      .from('rack_orders')
      .update({ stripe_session_id: session.id })
      .eq('id', order.id);

    return res.status(200).json({ url: session.url, sessionId: session.id });
  } catch (err) {
    // Si algo falla después de reservar, liberar las piezas
    await releaseReservation(reservedIds);
    console.error('checkout error:', err);
    return res.status(500).json({ error: 'No se pudo iniciar el pago. Intenta de nuevo.' });
  }
}
