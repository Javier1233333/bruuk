import type { VercelRequest, VercelResponse } from '@vercel/node';

const clean = (value: unknown, maxLength: number) =>
  typeof value === 'string' ? value.trim().slice(0, maxLength) : '';

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const receivedAt = () =>
  new Date().toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

const sendToTelegram = async (text: string) => {
  const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: process.env.TELEGRAM_SPOTS_CHAT_ID,
      text,
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
    }),
  });
  if (!response.ok) console.error('Telegram error:', response.status, await response.text());
  return response.ok;
};

// Negocios que piden una reseña (bruuk.space/negocios, sólo por enlace directo).
// Va al mismo chat de Telegram que los spots, marcado como negocio.
const handleBusiness = async (request: VercelRequest, response: VercelResponse) => {
  const businessName = clean(request.body?.businessName, 120);
  const link = clean(request.body?.link, 300);
  const email = clean(request.body?.email, 180).toLowerCase();
  const phone = clean(request.body?.phone, 30);
  const accepted = request.body?.accepted === true;

  if (businessName.length < 2) return response.status(400).json({ error: 'Escribe el nombre de tu negocio.' });
  if (link.length < 4) return response.status(400).json({ error: 'Pega el Instagram o el Google Maps del negocio.' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return response.status(400).json({ error: 'Escribe un correo válido.' });
  if (!accepted) return response.status(400).json({ error: 'Confirma que entiendes cómo funciona la reseña.' });

  const text = [
    '<b>🏪 Negocio pide reseña</b>',
    '',
    `<b>Negocio:</b> ${escapeHtml(businessName)}`,
    `<b>Instagram / Maps:</b> ${escapeHtml(link)}`,
    `<b>Correo:</b> ${escapeHtml(email)}`,
    `<b>WhatsApp:</b> ${escapeHtml(phone || '—')}`,
    '',
    '<i>Aceptó: reseña honesta, sin pago ni intercambio.</i>',
    `<i>${escapeHtml(receivedAt())} · bruuk.space/negocios</i>`,
  ].join('\n');

  try {
    if (!(await sendToTelegram(text))) return response.status(502).json({ error: 'No pudimos enviar tu solicitud. Inténtalo nuevamente.' });
    return response.status(200).json({ success: true });
  } catch (error) {
    console.error('Business review request error:', error);
    return response.status(500).json({ error: 'No pudimos enviar tu solicitud. Inténtalo nuevamente.' });
  }
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Método no permitido.' });
  }
  if (clean(request.body?.website, 180)) return response.status(200).json({ success: true });
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_SPOTS_CHAT_ID) {
    return response.status(500).json({ error: 'La bandeja de Bruuk todavía no está configurada.' });
  }
  if (request.body?.kind === 'negocio') return handleBusiness(request, response);

  const email = clean(request.body?.email, 180).toLowerCase();
  const spotName = clean(request.body?.spotName, 120);
  const city = clean(request.body?.city, 100);
  const location = clean(request.body?.location, 500);
  const reason = clean(request.body?.reason, 1200);

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
    `<i>${escapeHtml(receivedAt())} · bruuk.space</i>`,
  ].join('\n');

  try {
    if (!(await sendToTelegram(text))) return response.status(502).json({ error: 'No pudimos guardar el lugar. Inténtalo nuevamente.' });
    return response.status(200).json({ success: true });
  } catch (error) {
    console.error('Place proposal error:', error);
    return response.status(500).json({ error: 'No pudimos guardar el lugar. Inténtalo nuevamente.' });
  }
}
