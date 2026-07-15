import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, preferences } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

  if (!SCRIPT_URL) {
    return res.status(500).json({ error: 'Google Script URL not configured' });
  }

  try {
    const scriptRes = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.SHEETS_SECRET,
        email,
        preferences: preferences ?? {},
        timestamp: new Date().toISOString(),
      }),
    });

    if (!scriptRes.ok) {
      const text = await scriptRes.text();
      console.error('Google Script error:', text);
      return res.status(500).json({ error: 'Error saving to Google Sheets' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Sheets API error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
