import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './supabase';

/* ============================================================
   GET /api/app/event-orders?session_id=cs_...

   Consulta para la página de confirmación (/app?tab=eventos&session_id=...).
   El session_id de Stripe actúa como token opaco.
   Se devuelven solo campos no sensibles — nunca email ni user_id.
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
    .from('app_event_orders')
    .select('status, event_id, amount_total, currency, created_at')
    .eq('stripe_session_id', sessionId)
    .single();

  if (error || !order) {
    return res.status(404).json({ error: 'Orden no encontrada' });
  }

  return res.status(200).json({
    status: order.status,
    event_id: order.event_id,
    amount_total: order.amount_total,
    currency: order.currency,
    created_at: order.created_at,
  });
}
