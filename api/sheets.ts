import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sheetSafe } from './_security.js';

/* ============================================================
   POST /api/sheets → respuestas del registro (RegistrationModal).
   El secreto de Sheets autentica a este servidor, así que aquí sólo
   pasan las preguntas y opciones conocidas: nada de lo que mande el
   navegador se reenvía tal cual (antes se podían inventar reservas
   de eventos mandando preferences.type = 'event_registration').
   ============================================================ */

// Mismas preguntas y opciones que src/components/RegistrationModal.tsx
const ALLOWED_ANSWERS: Record<string, readonly string[]> = {
  weekend_vibe: ['underground', 'gastronomy', 'chill'],
  cultural_interest: ['arts', 'music', 'urban'],
  routine_breaker: ['spontaneous', 'experience', 'outdoors'],
  social_goal: ['creatives', 'party', 'networking'],
};

const isEmail = (value: unknown): value is string =>
  typeof value === 'string' && value.length <= 254 && /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(value);

const pickAnswers = (raw: unknown) => {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const answers: Record<string, string> = {};
  for (const [question, options] of Object.entries(ALLOWED_ANSWERS)) {
    const value = source[question];
    if (typeof value === 'string' && options.includes(value)) answers[question] = value;
  }
  return answers;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { preferences, website } = req.body ?? {};

  if (typeof website === 'string' && website.trim()) {
    return res.status(200).json({ success: true });
  }

  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!isEmail(email)) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
  const SHEETS_SECRET = process.env.SHEETS_SECRET;

  if (!SCRIPT_URL || !SHEETS_SECRET) {
    return res.status(500).json({ error: 'Google Sheets credentials not configured' });
  }

  try {
    const scriptRes = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: SHEETS_SECRET,
        email: sheetSafe(email),
        preferences: pickAnswers(preferences),
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
