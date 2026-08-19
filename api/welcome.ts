import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, website } = req.body ?? {};

  if (typeof website === 'string' && website.trim()) {
    return res.status(200).json({ success: true });
  }

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.RESEND_FROM_EMAIL;

  if (!RESEND_API_KEY || !FROM_EMAIL) {
    return res.status(500).json({ error: 'Resend not configured' });
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

    const resendBody = await resendRes.json();

    if (!resendRes.ok) {
      console.error('Resend error status:', resendRes.status);
      console.error('Resend error body:', JSON.stringify(resendBody));
      return res.status(500).json({ error: 'Failed to send email', detail: resendBody });
    }

    console.log('Resend success:', JSON.stringify(resendBody));
    return res.status(200).json({ success: true, data: resendBody });
  } catch (error) {
    console.error('Welcome email error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
