import { createHash } from 'node:crypto';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminDb, firebaseConfigured } from './_firebase.js';

/* ============================================================
   Correo de bienvenida al registrarse.
   Sin sesión, así que se limita en Firestore (sólo Admin SDK):
   - welcomeEmails/{hash}: una bienvenida por correo, nunca dos.
   - welcomeIps/{hash}: máx. MAX_PER_IP envíos por IP cada hora.
   Guardamos hashes, no correos ni IPs.
   ============================================================ */

const MAX_PER_IP = 5;
const IP_WINDOW_MS = 60 * 60 * 1000;

const isEmail = (value: unknown): value is string =>
  typeof value === 'string' && value.length <= 254 && /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/.test(value);

const hash = (value: string) => createHash('sha256').update(value).digest('hex');

const clientIp = (req: VercelRequest) => {
  const forwarded = req.headers['x-forwarded-for'];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim();
  return (req.headers['x-real-ip'] as string | undefined) || first || 'unknown';
};

// true si la IP todavía tiene envíos disponibles en esta hora (y cuenta este)
async function takeIpSlot(ip: string): Promise<boolean> {
  const ref = adminDb().collection('welcomeIps').doc(hash(ip));
  return adminDb().runTransaction(async (tx) => {
    const now = Date.now();
    const data = (await tx.get(ref)).data();
    const inWindow = data && now - data.windowStart < IP_WINDOW_MS;
    const count = inWindow ? data.count : 0;
    if (count >= MAX_PER_IP) return false;
    tx.set(ref, { count: count + 1, windowStart: inWindow ? data.windowStart : now });
    return true;
  });
}

// true si es la primera bienvenida para este correo (create falla si ya existe)
async function claimEmail(email: string): Promise<boolean> {
  try {
    await adminDb().collection('welcomeEmails').doc(hash(email)).create({ sentAt: new Date() });
    return true;
  } catch (error) {
    if ((error as { code?: number })?.code === 6) return false; // ALREADY_EXISTS
    throw error;
  }
}

// Si Resend falla, se libera el correo para que pueda reintentar
const releaseEmail = (email: string) =>
  adminDb().collection('welcomeEmails').doc(hash(email)).delete().catch(() => {});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { website } = req.body ?? {};

  if (typeof website === 'string' && website.trim()) {
    return res.status(200).json({ success: true });
  }

  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  if (!isEmail(email)) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.RESEND_FROM_EMAIL;

  // Sin Firestore no hay límite de envíos: mejor no mandar nada
  if (!firebaseConfigured || !RESEND_API_KEY || !FROM_EMAIL) {
    return res.status(503).json({ error: 'Email not configured' });
  }

  try {
    if (!(await takeIpSlot(clientIp(req)))) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    // Ya recibió su bienvenida: misma respuesta, sin volver a mandarla
    if (!(await claimEmail(email))) {
      return res.status(200).json({ success: true });
    }
  } catch (error) {
    console.error('Welcome rate limit error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `BRUUK <${FROM_EMAIL}>`,
        to: [email],
        subject: 'Gracias por no seguir las reglas. — BRUUK',
        html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
<head>
  <meta content="width=device-width" name="viewport" />
  <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
  <meta name="x-apple-disable-message-reformatting" />
  <meta content="IE=edge" http-equiv="X-UA-Compatible" />
  <meta content="telephone=no,address=no,email=no,date=no,url=no" name="format-detection" />
</head>
<body style="background-color:#ffffff">
  <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0" data-skip-in-text="true">
    Te uniste porque sentías que algo faltaba. Aquí empieza.
  </div>
  <table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation" align="center">
    <tbody>
      <tr>
        <td style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;font-size:1em;min-height:100%;line-height:155%;background-color:#ffffff">
          <table align="left" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;align:left;width:100%;color:#000000;background-color:#ffffff;padding:0;border-radius:0;border-color:#000000;line-height:155%">
            <tbody>
              <tr style="width:100%">
                <td>
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em"><br /></p>
                  <img alt='The Bruuk logo in purple letters with a starburst in the middle of the double "u".' src="https://resend-attachments.s3.amazonaws.com/0daaddd0-e470-413b-8c19-06ee7cac9752" style="display:block;outline:none;border:none;text-decoration:none;max-width:100%;border-radius:8px" width="30%" />
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em"><em><strong>Gracias por no seguir</strong></em></p>
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em"><em><strong>las reglas.</strong></em></p>
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em"><br /></p>
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em">Hola, gracias por unirte.</p>
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em">Te uniste porque algo te hace falta.</p>
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em">Bruuk no busca ser una app más. Queremos que gente real se atreva a vivir fuera de la pantalla.</p>
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em">Proponemos planes: un café improvisado, una caminata sin dirección, un viaje a una ciudad que no conoces. No es &quot;networking&quot;. Es conectar de verdad.</p>
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em">Cada encuentro empieza una historia. Cada plan puede cambiar tu día.</p>
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em">Vivimos en un mundo virtual pero solos. Eso cansa. Por eso existe Bruuk.</p>
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em">Acceso VIP abre pronto. Vas a ser de los primeros.</p>
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em">Mientras tanto, síguenos en <a href="https://www.instagram.com/bruuk_espacio?igsh=MXB1bTQ5ZzZ2NXd3Yg==" rel="noopener noreferrer nofollow" style="color:#6366f1;text-decoration:underline" target="_blank">Instagram</a>.</p>
                  <p style="margin:0;padding:0;font-size:1em;padding-top:0.5em;padding-bottom:0.5em">Nos vemos afuera.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>`,
      }),
    });

    if (!resendRes.ok) {
      console.error('Resend error:', resendRes.status, await resendRes.text());
      await releaseEmail(email);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Welcome email error:', error);
    await releaseEmail(email);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
