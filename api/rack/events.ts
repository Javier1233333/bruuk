import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './supabase';

/* GET /api/rack/events — próximos eventos Bruuk */

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  const { data, error } = await supabase
    .from('rack_events')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  const events = (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    date: row.date_label,
    location: row.location,
    link: row.link,
  }));

  return res.status(200).json(events);
}
