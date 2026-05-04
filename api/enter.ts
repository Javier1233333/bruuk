import type { VercelRequest, VercelResponse } from '@vercel/node';

const HTML = (error = '') => `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BRUUK — Acceso</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0a0a0a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #fff;
    }
    .card {
      width: 100%;
      max-width: 380px;
      padding: 2.5rem 2rem;
      background: #111;
      border: 1px solid #222;
      border-radius: 16px;
      text-align: center;
    }
    .logo {
      font-size: 1.8rem;
      font-weight: 900;
      letter-spacing: -1px;
      background: linear-gradient(135deg, #a78bfa, #ec4899);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 0.4rem;
    }
    .sub {
      font-size: 0.8rem;
      color: #555;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 2rem;
    }
    input[type="password"] {
      width: 100%;
      padding: 0.85rem 1rem;
      background: #1a1a1a;
      border: 1px solid #333;
      border-radius: 10px;
      color: #fff;
      font-size: 1rem;
      text-align: center;
      letter-spacing: 4px;
      outline: none;
      transition: border-color 0.2s;
    }
    input[type="password"]:focus { border-color: #a78bfa; }
    input[type="password"]::placeholder { letter-spacing: 1px; color: #444; }
    button {
      width: 100%;
      margin-top: 1rem;
      padding: 0.85rem;
      background: linear-gradient(135deg, #7c3aed, #db2777);
      border: none;
      border-radius: 10px;
      color: #fff;
      font-size: 0.95rem;
      font-weight: 700;
      letter-spacing: 1px;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    button:hover { opacity: 0.85; }
    .error {
      margin-top: 0.75rem;
      font-size: 0.82rem;
      color: #f87171;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">BRUUK</div>
    <div class="sub">Acceso restringido</div>
    <form method="POST" action="/api/enter">
      <input
        type="password"
        name="password"
        placeholder="Contraseña"
        autofocus
        autocomplete="current-password"
        required
      />
      ${error ? `<div class="error">${error}</div>` : ''}
      <button type="submit">Entrar</button>
    </form>
  </div>
</body>
</html>`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(HTML());
  }

  if (req.method === 'POST') {
    const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

    if (!ACCESS_TOKEN) {
      return res.status(500).send(HTML('Servidor no configurado.'));
    }

    const { password } = req.body as { password?: string };

    if (password === ACCESS_TOKEN) {
      const maxAge = 60 * 60 * 24 * 7; // 7 días
      res.setHeader(
        'Set-Cookie',
        `bruuk_access=1; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax; Secure`
      );
      res.setHeader('Location', '/');
      return res.status(302).end();
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(401).send(HTML('Contraseña incorrecta.'));
  }

  return res.status(405).end();
}
