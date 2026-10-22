import type { VercelRequest, VercelResponse } from '@vercel/node';
import { adminAuth, firebaseConfigured, verifyAuthHeader } from './_firebase.js';

/* ============================================================
   Correos de cuenta (verificar correo, cambiar contraseña).
   Firebase no deja editar sus plantillas en este proyecto
   (EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED), así que generamos el
   enlace con Admin, lo apuntamos a /auth/action de Bruuk y lo
   mandamos con Resend.
   ============================================================ */

const SITE_URL = 'https://bruuk.space';

type EmailType = 'verify' | 'reset';

const COPY: Record<EmailType, { subject: string; preview: string; title: string; body: string; button: string; footer: string }> = {
  verify: {
    subject: 'Confirma tu correo — BRUUK',
    preview: 'Un clic y tu cuenta queda lista.',
    title: 'Confirma tu correo.',
    body: 'Un clic y tu cuenta de Bruuk queda lista. Así sabemos que este correo es tuyo.',
    button: 'Confirmar correo',
    footer: 'Si no creaste una cuenta en Bruuk, ignora este correo.',
  },
  reset: {
    subject: 'Cambia tu contraseña — BRUUK',
    preview: 'Elige una contraseña nueva para entrar a Bruuk.',
    title: 'Cambia tu contraseña.',
    body: 'Alguien pidió cambiar la contraseña de tu cuenta de Bruuk. Si fuiste tú, elige una nueva aquí.',
    button: 'Elegir contraseña nueva',
    footer: 'Si no lo pediste tú, ignora este correo: tu contraseña sigue igual.',
  },
};

const isEmail = (value: unknown): value is string =>
  typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

// El enlace de Admin apunta a firebaseapp.com/__/auth/action; nos quedamos con
// sus parámetros (mode, oobCode, continueUrl…) y los mandamos a nuestra página.
function toBruukLink(firebaseLink: string): string {
  const { searchParams } = new URL(firebaseLink);
  return `${SITE_URL}/auth/action?${searchParams.toString()}`;
}

function renderEmail(type: EmailType, link: string): string {
  const copy = COPY[type];
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta content="width=device-width" name="viewport" />
  <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
  <meta name="x-apple-disable-message-reformatting" />
</head>
<body style="margin:0;padding:0;background-color:#ffffff">
  <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0">${copy.preview}</div>
  <table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tbody>
      <tr>
        <td style="padding:32px 20px;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif;color:#000000;line-height:155%">
          <table align="left" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px">
            <tbody>
              <tr>
                <td>
                  <img alt="Bruuk" src="https://resend-attachments.s3.amazonaws.com/0daaddd0-e470-413b-8c19-06ee7cac9752" width="120" style="display:block;border:none;border-radius:8px;margin-bottom:28px" />
                  <p style="margin:0 0 12px;font-size:1.5em;line-height:1.25"><em><strong>${copy.title}</strong></em></p>
                  <p style="margin:0 0 28px;font-size:1em">${copy.body}</p>
                  <a href="${link}" target="_blank" style="display:inline-block;background-color:#8b7cf6;color:#ffffff;text-decoration:none;font-weight:600;padding:14px 24px;border-radius:999px">${copy.button}</a>
                  <p style="margin:28px 0 0;font-size:0.85em;color:#555555">Si el botón no funciona, copia este enlace en tu navegador:</p>
                  <p style="margin:4px 0 0;font-size:0.8em;word-break:break-all"><a href="${link}" target="_blank" style="color:#6366f1">${link}</a></p>
                  <p style="margin:28px 0 0;font-size:0.85em;color:#555555">${copy.footer}</p>
                  <p style="margin:20px 0 0;font-size:1em">Nos vemos afuera.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.RESEND_FROM_EMAIL;
  if (!firebaseConfigured || !RESEND_API_KEY || !FROM_EMAIL) {
    return res.status(503).json({ error: 'Correo no configurado.' });
  }

  const type = req.body?.type as EmailType;
  if (type !== 'verify' && type !== 'reset') {
    return res.status(400).json({ error: 'Tipo de correo inválido.' });
  }

  // verify: solo al dueño de la sesión, con el correo de su token.
  // reset: cualquiera puede pedirlo, como con Firebase.
  let email: string;
  if (type === 'verify') {
    const decoded = await verifyAuthHeader(req.headers.authorization);
    if (!decoded?.email) return res.status(401).json({ error: 'Inicia sesión de nuevo.' });
    if (decoded.email_verified) return res.status(200).json({ success: true });
    email = decoded.email;
  } else {
    const raw = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!isEmail(raw)) return res.status(400).json({ error: 'Correo inválido.' });
    email = raw;
  }

  const actionCodeSettings = { url: `${SITE_URL}/login` };
  let firebaseLink: string;
  try {
    firebaseLink = type === 'verify'
      ? await adminAuth().generateEmailVerificationLink(email, actionCodeSettings)
      : await adminAuth().generatePasswordResetLink(email, actionCodeSettings);
  } catch (error) {
    // Mismo resultado exista o no la cuenta, para no revelar qué correos están registrados
    if ((error as { code?: string })?.code === 'auth/user-not-found') {
      return res.status(200).json({ success: true });
    }
    console.error('auth-email link error:', error);
    return res.status(500).json({ error: 'No pudimos generar el enlace.' });
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
        subject: COPY[type].subject,
        html: renderEmail(type, toBruukLink(firebaseLink)),
      }),
    });

    if (!resendRes.ok) {
      console.error('auth-email Resend error:', resendRes.status, await resendRes.text());
      return res.status(500).json({ error: 'No pudimos enviar el correo.' });
    }
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('auth-email error:', error);
    return res.status(500).json({ error: 'No pudimos enviar el correo.' });
  }
}
