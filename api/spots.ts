import type { VercelRequest, VercelResponse } from '@vercel/node';
import spotsData from '../src/data/spots.json';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
  if (!ACCESS_TOKEN) return res.status(500).json({ error: 'Servidor no configurado' });

  const crypto = await import('crypto');
  const expected = crypto.createHmac('sha256', ACCESS_TOKEN).update('bruuk_session').digest('hex');
  const cookie = req.headers.cookie ?? '';
  const cookieValue = cookie.split(';').find(c => c.trim().startsWith('bruuk_access='))?.split('=')[1];
  if (!cookieValue || cookieValue !== expected) return res.status(401).json({ error: 'No autorizado' });

  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  return res.status(200).json(spotsData);
}
