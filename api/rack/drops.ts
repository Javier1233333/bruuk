import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from './supabase';

/* GET /api/rack/drops — lista de próximos drops */

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

  const { data, error } = await supabase
    .from('rack_drops')
    .select('*')
    .order('date_iso', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  const drops = (data ?? []).map((row) => ({
    id: row.id,
    date: row.date_label,
    dateISO: row.date_iso,
    title: row.title,
    category: row.category,
    pieceCount: row.piece_count,
    teaser: row.teaser,
  }));

  return res.status(200).json(drops);
}
