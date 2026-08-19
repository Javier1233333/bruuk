import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { email, website } = request.body ?? {};

  if (typeof website === 'string' && website.trim()) {
    return response.status(200).json({ success: true, alreadyRegistered: false });
  }

  if (!email) {
    return response.status(400).json({ error: 'Email is required' });
  }

  // Obtenemos las variables de entorno de Vercel configuradas en tu dashboard o .env
  const API_KEY = process.env.BEEHIIV_API_KEY;
  const PUB_ID = process.env.BEEHIIV_PUB_ID;

  if (!API_KEY || !PUB_ID) {
    return response.status(500).json({ error: 'Faltan credenciales de Beehiiv en el servidor' });
  }

  try {
    // Check if subscriber already exists
    let alreadyRegistered = false;
    try {
      const checkRes = await fetch(
        `https://api.beehiiv.com/v2/publications/${PUB_ID}/subscriptions/by_email/${encodeURIComponent(email)}`,
        { method: 'GET', headers: { 'Authorization': `Bearer ${API_KEY}` } }
      );
      alreadyRegistered = checkRes.ok;
    } catch {
      alreadyRegistered = false;
    }

    const res = await fetch(`https://api.beehiiv.com/v2/publications/${PUB_ID}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        email: email,
        reactivate_existing: false,
        send_welcome_email: true,
        opt_in_intent: true,
        cancel_opt_in_intent: false,
        upsert: true
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return response.status(res.status).json(data);
    }

    return response.status(200).json({ success: true, alreadyRegistered, data });
  } catch (error) {
    console.error('Beehiiv API error:', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}
