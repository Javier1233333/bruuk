import type { VercelRequest, VercelResponse } from '@vercel/node';
import type Stripe from 'stripe';
import { supabaseAdmin } from './supabase';
import { getStripe } from '../rack/stripe';

/* ============================================================
   POST /api/app/event-webhook — recibe eventos de Stripe

   Seguridad: firma verificada sobre body crudo con
   STRIPE_WEBHOOK_SECRET_APP (variable distinta a STRIPE_WEBHOOK_SECRET
   de Rack para tener secrets separados por endpoint en Stripe Dashboard).

   ENMIENDA E1: checkout.session.expired → restaurar capacity_remaining
                solo si la orden estaba pending.

   Eventos manejados:
   - checkout.session.completed → orden 'paid'
   - checkout.session.expired   → orden 'expired' + restaurar cupo
   ============================================================ */

export const config = { api: { bodyParser: false } };

async function readRawBody(req: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_APP;
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
    console.error('event-webhook signature verification failed:', err);
    return res.status(400).json({ error: 'Firma inválida' });
  }

  if (
    event.type === 'checkout.session.completed' ||
    event.type === 'checkout.session.expired'
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.app_event_order_id;
    if (!orderId) return res.status(200).json({ received: true });

    const { data: order } = await supabaseAdmin
      .from('app_event_orders')
      .select('id, status, event_id')
      .eq('id', orderId)
      .single();

    // Idempotencia: Stripe puede reintentar el mismo evento
    if (!order || (order.status as string) !== 'pending') {
      return res.status(200).json({ received: true });
    }

    if (event.type === 'checkout.session.completed') {
      await supabaseAdmin
        .from('app_event_orders')
        .update({
          status: 'paid',
          customer_email: session.customer_details?.email ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

    } else {
      // checkout.session.expired — restaurar cupo (E1: idempotente, solo si pending)
      await supabaseAdmin
        .from('app_event_orders')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', orderId);

      // Devolver el lugar al evento (RPC atómica con cap en capacity)
      const eventId = order.event_id as string;
      if (eventId) {
        await supabaseAdmin.rpc('app_release_event_spot', { p_event_id: eventId });
      }
    }
  }

  return res.status(200).json({ received: true });
}
