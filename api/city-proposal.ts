import type { VercelRequest, VercelResponse } from '@vercel/node';

const clean = (value: unknown, maxLength: number) =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Método no permitido.' });
  }

  const email = clean(request.body?.email, 180).toLowerCase();
  const city = clean(request.body?.city, 120);
  const website = clean(request.body?.website, 180);

  if (website) return response.status(200).json({ success: true });
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return response.status(400).json({ error: 'Escribe un correo válido.' });
  }
  if (city.length < 2) {
    return response.status(400).json({ error: 'Escribe una ciudad válida.' });
  }

  const scriptUrl = process.env.CITY_PROPOSALS_SCRIPT_URL;
  const secret = process.env.CITY_PROPOSALS_SECRET;

  if (!scriptUrl || !secret) {
    return response.status(500).json({ error: 'La hoja de propuestas de ciudad no está configurada.' });
  }

  try {
    const scriptResponse = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret,
        submissionType: 'city_proposal',
        email,
        city,
        timestamp: new Date().toISOString(),
      }),
    });

    const scriptText = await scriptResponse.text();
    let scriptResult: { success?: boolean } = {};
    try { scriptResult = JSON.parse(scriptText); } catch { /* respuesta inválida */ }

    if (!scriptResponse.ok || scriptResult.success !== true) {
      console.error('City proposal Apps Script error:', scriptText);
      return response.status(502).json({ error: 'No pudimos guardar la ciudad. Inténtalo nuevamente.' });
    }

    return response.status(200).json({ success: true });
  } catch (error) {
    console.error('City proposal error:', error);
    return response.status(500).json({ error: 'No pudimos guardar la ciudad. Inténtalo nuevamente.' });
  }
}
