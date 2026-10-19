import type { VercelRequest, VercelResponse } from '@vercel/node';
import checkout from './_checkout.js';
import drops from './_drops.js';
import events from './_events.js';
import orders from './_orders.js';
import products from './_products.js';

/* ============================================================
   /api/rack/:route → un solo Serverless Function para Rack.
   El plan Hobby de Vercel permite 12 funciones por deploy.
   webhook vive aparte porque necesita bodyParser: false.
   ============================================================ */

type Handler = (req: VercelRequest, res: VercelResponse) => unknown;

const routes: Record<string, Handler> = {
  checkout,
  drops,
  events,
  orders,
  products,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const route = routes[String(req.query.route)];
  if (!route) return res.status(404).json({ error: 'Not found' });
  return route(req, res);
}
