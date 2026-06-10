import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './supabase';

/* ============================================================
   GET /api/rack/orders?session_id=cs_...

   Consulta para la página de confirmación (/rack/gracias).
   El session_id de Stripe actúa como token: solo quien completó
   el checkout lo tiene. Se devuelven solo campos no sensibles —
   nunca el email ni datos de pago.
   ============================================================ */

const SESSION_RE = /^cs_(test|live)_[A-Za-z0-9]+$/;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { session_id: sessionId } = req.query;
  if (typeof sessionId !== 'string' || !SESSION_RE.test(sessionId)) {
    return res.status(400).json({ error: 'session_id inválido' });
  }

  const { data: order, error } = await supabaseAdmin
    .from('rack_orders')
    .select('status, items, amount_total, currency, created_at')
    .eq('stripe_session_id', sessionId)
    .single();

  if (error || !order) {
    return res.status(404).json({ error: 'Orden no encontrada' });
  }

  const items = Array.isArray(order.items)
    ? order.items.map((it: { title?: string; price?: number; category?: string }) => ({
        title: it.title,
        price: it.price,
        category: it.category,
      }))
    : [];

  return res.status(200).json({
    status: order.status,
    items,
    amountTotal: order.amount_total,
    currency: order.currency,
    createdAt: order.created_at,
  });
}
