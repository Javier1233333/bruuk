import type { VercelRequest, VercelResponse } from '@vercel/node';
import type Stripe from 'stripe';
import { supabaseAdmin } from './supabase';
import { getStripe } from './stripe';

/* ============================================================
   POST /api/rack/webhook — recibe eventos de Stripe

   Seguridad: la firma del header `stripe-signature` se verifica
   contra STRIPE_WEBHOOK_SECRET sobre el body CRUDO. Por eso se
   desactiva el bodyParser. Sin firma válida → 400.

   Eventos manejados:
   - checkout.session.completed → orden 'paid', piezas 'agotado'
   - checkout.session.expired   → orden 'expired', piezas vuelven a 'disponible'
   ============================================================ */

export const config = { api: { bodyParser: false } };

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function itemIds(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((it: { id?: unknown }) => (typeof it?.id === 'string' ? it.id : ''))
    .filter(Boolean);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return res.status(503).json({ error: 'Webhook no configurado' });
  }

  const signature = req.headers['stripe-signature'];
  if (typeof signature !== 'string') {
    return res.status(400).json({ error: 'Falta firma' });
  }

  let event: Stripe.Event;
  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Firma inválida' });
  }

  if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.rack_order_id;
    if (!orderId) return res.status(200).json({ received: true });

    const { data: order } = await supabaseAdmin
      .from('rack_orders')
      .select('id, status, items')
      .eq('id', orderId)
      .single();

    // Idempotencia: Stripe puede reintentar el mismo evento
    if (!order || order.status !== 'pending') {
      return res.status(200).json({ received: true });
    }

    const ids = itemIds(order.items);

    if (event.type === 'checkout.session.completed') {
      await supabaseAdmin
        .from('rack_orders')
        .update({
          status: 'paid',
          customer_email: session.customer_details?.email ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      if (ids.length > 0) {
        await supabaseAdmin
          .from('rack_products')
          .update({ status: 'agotado' })
          .in('id', ids);
      }
    } else {
      await supabaseAdmin
        .from('rack_orders')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', orderId);

      if (ids.length > 0) {
        await supabaseAdmin
          .from('rack_products')
          .update({ status: 'disponible' })
          .in('id', ids)
          .eq('status', 'apartado');
      }
    }
  }

  return res.status(200).json({ received: true });
}
