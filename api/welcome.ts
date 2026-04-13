import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.RESEND_FROM_EMAIL;
  const TEMPLATE_ID = process.env.RESEND_TEMPLATE_ID;

  if (!RESEND_API_KEY || !FROM_EMAIL || !TEMPLATE_ID) {
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
        template_id: TEMPLATE_ID,
      }),
    });

    if (!resendRes.ok) {
      const err = await resendRes.json();
      console.error('Resend error:', err);
      return res.status(500).json({ error: 'Failed to send email' });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Welcome email error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
