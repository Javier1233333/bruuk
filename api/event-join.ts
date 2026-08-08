import type { VercelRequest, VercelResponse } from '@vercel/node';

const EVENTS: Record<string, { title: string; venue: string; depositAmount: number; depositCurrency: 'MXN' }> = {
  'club-de-vinilos-la-perla': {
    title: 'Club de vinilos: escuchar el disco completo',
    venue: 'La Perla Records & Books',
    depositAmount: 150,
    depositCurrency: 'MXN',
  },
  'intercambio-vintage-bad-people': {
    title: 'Intercambio vintage: una pieza entra, otra sale',
    venue: 'Bad people Gdl Vintage Store',
    depositAmount: 100,
    depositCurrency: 'MXN',
  },
  'ruta-tianguis-cultural': {
    title: 'Ruta Tianguis Cultural: caminar para encontrar',
    venue: 'Tianguis Cultural',
    depositAmount: 80,
    depositCurrency: 'MXN',
  },
};

const clean = (value: unknown) =>
  typeof value === 'string' ? value.trim().slice(0, 180) : '';

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Método no permitido.' });
  }

  const eventSlug = clean(request.body?.eventSlug);
  const name = clean(request.body?.name);
  const email = clean(request.body?.email).toLowerCase();
  const phone = clean(request.body?.phone);
  const instagramRaw = clean(request.body?.instagram).replace(/^@/, '');
  const instagram = instagramRaw.toLowerCase();
  const website = clean(request.body?.website);
  const consent = request.body?.consent === true;
  const displayConsent = request.body?.displayConsent === true;
  const guests = Number(request.body?.guests);
  const event = EVENTS[eventSlug];

  if (website) return response.status(200).json({ success: true, reservationCode: 'BRK-RECIBIDO' });
  if (!event) return response.status(400).json({ error: 'Este evento no está disponible.' });
  if (name.length < 2) return response.status(400).json({ error: 'Escribe tu nombre completo.' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return response.status(400).json({ error: 'Escribe un correo válido.' });
  if (!/^[a-z0-9._]{1,30}$/.test(instagram)) return response.status(400).json({ error: 'Escribe un usuario de Instagram válido.' });
  if (!Number.isInteger(guests) || guests < 1 || guests > 4) return response.status(400).json({ error: 'Selecciona entre 1 y 4 personas.' });
  if (!consent) return response.status(400).json({ error: 'Necesitamos tu autorización para gestionar el registro.' });

  const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
  if (!scriptUrl) return response.status(500).json({ error: 'El registro no está configurado todavía.' });

  const reservationCode = `BRK-${eventSlug.slice(0, 3).toUpperCase()}-${Date.now().toString(36).slice(-5).toUpperCase()}`;

  try {
    const scriptResponse = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: process.env.SHEETS_SECRET,
        email,
        preferences: {
          type: 'event_registration',
          reservationCode,
          eventSlug,
          eventName: event.title,
          venue: event.venue,
          name,
          phone,
          instagram: `@${instagram}`,
          guests,
          consent,
          displayConsent,
          publicName: displayConsent ? name : '',
          publicInstagram: displayConsent ? `@${instagram}` : '',
          paymentStatus: event.depositAmount > 0 ? 'deposit_pending' : 'not_required',
          depositAmount: event.depositAmount,
          depositCurrency: event.depositCurrency,
        },
        timestamp: new Date().toISOString(),
      }),
    });

    if (!scriptResponse.ok) {
      console.error('Event registration Sheets error:', await scriptResponse.text());
      return response.status(502).json({ error: 'No pudimos guardar tu lugar. Inténtalo nuevamente.' });
    }

    return response.status(200).json({ success: true, reservationCode });
  } catch (error) {
    console.error('Event registration error:', error);
    return response.status(500).json({ error: 'No pudimos guardar tu lugar. Inténtalo nuevamente.' });
  }
}
