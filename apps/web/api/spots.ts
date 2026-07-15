import type { VercelRequest, VercelResponse } from '@vercel/node';
import spotsData from '../src/data/spots.json';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
  return res.status(200).json(spotsData);
}
