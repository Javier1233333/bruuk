import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './supabase';
import { getStripe } from '../rack/stripe';

/* ============================================================
   POST /api/app/event-checkout

   Comprar boleto para un evento de pago.
   Auth: JWT en Authorization: Bearer <token>

   ENMIENDA E1: reserva atómica con capacity_remaining antes de
                crear la sesión de Stripe. Si la sesión falla,
                se restaura el cupo.
   ENMIENDA E2: usa price_data on-the-fly (sin stripe_price_id),
                igual que api/rack/checkout.ts.
   ============================================================ */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function siteUrl(req: VercelRequest): string {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  const host = req.headers.host ?? 'localhost:3000';
  const proto = host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https';
  return `${proto}://${host}`;
}

async function getUserFromToken(authHeader: string | undefined): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = await getUserFromToken(req.headers['authorization'] as string | undefined);
  if (!userId) return res.status(401).json({ error: 'No autenticado' });

  const stripe = getStripe();
  if (!stripe) {
    return res.status(503).json({
      error: 'Los pagos aún no están configurados.',
      code: 'stripe_not_configured',
    });
  }

  const body = req.body as Record<string, unknown> | null | undefined;
  const { event_id } = body ?? {};

  if (typeof event_id !== 'string' || !UUID_RE.test(event_id)) {
    return res.status(400).json({ error: 'event_id inválido' });
  }

  // Leer evento
  const { data: event, error: evError } = await supabaseAdmin
    .from('app_events')
    .select('id, title, is_active, price_mxn, capacity, capacity_remaining')
    .eq('id', event_id)
    .single();

  if (evError || !event) return res.status(404).json({ error: 'Evento no encontrado' });
  if (!event.is_active) return res.status(400).json({ error: 'Evento inactivo' });
  if ((event.price_mxn as number) === 0) {
    return res.status(400).json({ error: 'Usa RSVP para eventos gratuitos' });
  }

  // E1: reserva atómica de cupo — RPC que decrementa en una sola
  // sentencia SQL (read-modify-write desde aquí sobrevende bajo concurrencia)
  const { data: reserved, error: decError } = await supabaseAdmin
    .rpc('app_reserve_event_spot', { p_event_id: event_id });

  if (decError) {
    console.error('event-checkout capacity decrement error:', decError);
    return res.status(500).json({ error: 'Error al reservar lugar' });
  }

  if (!reserved) {
    return res.status(409).json({ error: 'El evento está lleno', code: 'full' });
  }

  let orderId: string | null = null;

  try {
    // Crear orden pending
    const { data: order, error: orderError } = await supabaseAdmin
      .from('app_event_orders')
      .insert({
        user_id: userId,
        event_id,
        status: 'pending',
        amount_total: (event.price_mxn as number) * 100,
        currency: 'MXN',
      })
      .select('id')
      .single();

    if (orderError || !order) throw new Error('No se pudo crear la orden');
    orderId = (order as { id: string }).id;

    // E2: price_data on-the-fly (sin stripe_price_id)
    const base = siteUrl(req);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      currency: 'mxn',
      line_items: [{
        quantity: 1,
        price_data: {
          currency: 'mxn',
          unit_amount: (event.price_mxn as number) * 100,
          product_data: {
            name: event.title as string,
          },
        },
      }],
      metadata: {
        app_event_order_id: orderId,
        event_id,
        user_id: userId,
      },
      success_url: `${base}/app?tab=eventos&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/app?tab=eventos&cancelled=1`,
      expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
    });

    // Guardar session_id en la orden
    await supabaseAdmin
      .from('app_event_orders')
      .update({ stripe_session_id: session.id })
      .eq('id', orderId);

    return res.status(200).json({ url: session.url, session_id: session.id });
  } catch (err) {
    // Restaurar el lugar si algo falló después de reservarlo
    await supabaseAdmin.rpc('app_release_event_spot', { p_event_id: event_id });

    // Marcar orden como cancelled si se llegó a crear
    if (orderId) {
      await supabaseAdmin
        .from('app_event_orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', orderId);
    }

    console.error('event-checkout error:', err);
    return res.status(500).json({ error: 'No se pudo iniciar el pago. Intenta de nuevo.' });
  }
}
