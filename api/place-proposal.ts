import type { VercelRequest, VercelResponse } from '@vercel/node';

const clean = (value: unknown, maxLength: number) =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Método no permitido.' });
  }

  const email = clean(request.body?.email, 180).toLowerCase();
  const spotName = clean(request.body?.spotName, 120);
  const city = clean(request.body?.city, 100);
  const location = clean(request.body?.location, 500);
  const reason = clean(request.body?.reason, 1200);
  const website = clean(request.body?.website, 180);

  if (website) return response.status(200).json({ success: true });
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return response.status(400).json({ error: 'Escribe un correo válido.' });
  }
  if (spotName.length < 2) {
    return response.status(400).json({ error: 'Escribe el nombre del spot.' });
  }
  if (city.length < 2) {
    return response.status(400).json({ error: 'Escribe la ciudad del spot.' });
  }
  if (reason.length < 10) {
    return response.status(400).json({ error: 'Cuéntanos por qué te gusta este lugar.' });
  }

  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_SPOTS_CHAT_ID;

  if (!botToken || !chatId) {
    return response.status(500).json({ error: 'La bandeja de spots todavía no está configurada.' });
  }

  const receivedAt = new Date().toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City',
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  const text = [
    '<b>📍 Nuevo spot para Bruuk</b>',
    '',
    `<b>Spot:</b> ${escapeHtml(spotName)}`,
    `<b>Ciudad:</b> ${escapeHtml(city)}`,
    `<b>Ubicación o enlace:</b> ${escapeHtml(location || '—')}`,
    '',
    `<b>Por qué:</b>\n${escapeHtml(reason)}`,
    '',
    `<b>Correo:</b> ${escapeHtml(email)}`,
    `<i>${escapeHtml(receivedAt)} · bruuk.space</i>`,
  ].join('\n');

  try {
    const telegramResponse = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
      }),
    });

    if (!telegramResponse.ok) {
      const telegramText = await telegramResponse.text();
      console.error('Telegram spot submission error:', telegramResponse.status, telegramText);
      return response.status(502).json({ error: 'No pudimos guardar el lugar. Inténtalo nuevamente.' });
    }

    return response.status(200).json({ success: true });
  } catch (error) {
    console.error('Place proposal error:', error);
    return response.status(500).json({ error: 'No pudimos guardar el lugar. Inténtalo nuevamente.' });
  }
}
