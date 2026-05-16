import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method === 'GET') {
    const { spot_id } = req.query;
    if (!spot_id) return res.status(400).json({ error: 'Missing spot_id' });

    const { data, error } = await supabase
      .from('spot_reviews')
      .select('id, rating, comment, spot_name, created_at')
      .eq('spot_id', spot_id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'POST') {
    const { spot_id, spot_name, rating, comment, lat, lng } = req.body ?? {};

    if (!spot_name || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'spot_name y rating (1–5) son requeridos' });
    }

    const { error } = await supabase.from('spot_reviews').insert({
      spot_id: spot_id ?? null,
      spot_name,
      rating,
      comment: comment ?? null,
      lat: lat ?? null,
      lng: lng ?? null,
    });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json({ success: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
