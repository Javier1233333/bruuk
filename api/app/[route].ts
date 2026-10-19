import type { VercelRequest, VercelResponse } from '@vercel/node';
import eventCheckout from './_event-checkout.js';
import eventOrders from './_event-orders.js';
import events from './_events.js';
import me from './_me.js';
import plans from './_plans.js';
import rsvp from './_rsvp.js';

/* ============================================================
   /api/app/:route → un solo Serverless Function para la app.
   El plan Hobby de Vercel permite 12 funciones por deploy.
   event-webhook vive aparte porque necesita bodyParser: false.
   ============================================================ */

type Handler = (req: VercelRequest, res: VercelResponse) => unknown;

const routes: Record<string, Handler> = {
  'event-checkout': eventCheckout,
  'event-orders': eventOrders,
  events,
  me,
  plans,
  rsvp,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const route = routes[String(req.query.route)];
  if (!route) return res.status(404).json({ error: 'Not found' });
  return route(req, res);
}
