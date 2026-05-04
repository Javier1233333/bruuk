import type { VercelRequest, VercelResponse } from '@vercel/node';

const HTML = (error = '') => `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BRUUK — Acceso</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg-primary: #0e0d1a;
      --bg-secondary: #16152a;
      --accent-light: #8b7cf6;
      --accent-text: #b8affe;
      --text-primary: #f0eeff;
      --text-secondary: #9490b8;
      --border-color: #252340;
    }

    body {
      min-height: 100dvh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      background: var(--bg-primary);
      font-family: 'DM Sans', sans-serif;
      color: var(--text-primary);
      -webkit-font-smoothing: antialiased;
      position: relative;
      overflow: hidden;
    }

    .bg-glow {
      position: fixed;
      top: -200px;
      left: 50%;
      transform: translateX(-50%);
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(139, 124, 246, 0.15) 0%, transparent 70%);
      pointer-events: none;
      z-index: 0;
    }

    .wrap {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 420px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.75rem;
    }

    .logo {
      font-family: 'Outfit', sans-serif;
      font-size: 3rem;
      font-weight: 900;
      letter-spacing: -1.5px;
      text-transform: uppercase;
      color: #fff;
      text-shadow: 4px 4px 0px var(--accent-light);
    }

    .card {
      width: 100%;
      background: var(--bg-secondary);
      border: 2px solid var(--border-color);
      padding: 2rem;
      box-shadow: 6px 6px 0px #000;
    }

    .tag {
      display: block;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 4px;
      text-transform: uppercase;
      color: var(--accent-light);
      margin-bottom: 0.5rem;
      font-family: 'Outfit', sans-serif;
    }

    .title {
      font-family: 'Outfit', sans-serif;
      font-size: 1.75rem;
      font-weight: 800;
      letter-spacing: -0.5px;
      margin-bottom: 0.4rem;
    }

    .subtitle {
      color: var(--text-secondary);
      font-size: 0.95rem;
      margin-bottom: 1.75rem;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      margin-bottom: 1.1rem;
    }

    .field label {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-secondary);
      font-family: 'Outfit', sans-serif;
    }

    .field input {
      width: 100%;
      padding: 0.75rem 1rem;
      background: var(--bg-primary);
      border: 2px solid var(--border-color);
      color: var(--text-primary);
      font-size: 1rem;
      font-family: 'Outfit', sans-serif;
      outline: none;
      transition: border-color 0.15s;
    }

    .field input:focus {
      border-color: var(--accent-light);
    }

    .field input::placeholder {
      color: rgba(255, 255, 255, 0.3);
    }

    .error-box {
      color: #ff4d4f;
      font-size: 0.875rem;
      background: rgba(255, 77, 79, 0.1);
      border: 2px solid #ff4d4f;
      padding: 0.6rem 0.9rem;
      margin-bottom: 1rem;
    }

    .btn {
      width: 100%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.85rem 2rem;
      font-size: 1rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      cursor: pointer;
      border: 2px solid var(--accent-light);
      background: var(--accent-light);
      color: #fff;
      box-shadow: 4px 4px 0px #000;
      font-family: 'Outfit', sans-serif;
      transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .btn:hover {
      transform: translate(-3px, -3px);
      box-shadow: 7px 7px 0px #000;
    }

    .btn:active {
      transform: translate(2px, 2px);
      box-shadow: 1px 1px 0px #000;
    }
  </style>
</head>
<body>
  <div class="bg-glow"></div>
  <div class="wrap">
    <div class="logo">BRUUK</div>
    <div class="card">
      <span class="tag">/ Acceso restringido</span>
      <h1 class="title">Zona de pruebas</h1>
      <p class="subtitle">Ingresa la contraseña para continuar.</p>
      <form method="POST" action="/api/enter">
        <div class="field">
          <label for="pwd">Contraseña</label>
          <input
            id="pwd"
            type="password"
            name="password"
            placeholder="••••••••"
            autofocus
            autocomplete="current-password"
            required
          />
        </div>
        ${error ? `<div class="error-box">${error}</div>` : ''}
        <button type="submit" class="btn">Entrar</button>
      </form>
    </div>
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
      res.setHeader('Location', '/app');
      return res.status(302).end();
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(401).send(HTML('Contraseña incorrecta.'));
  }

  return res.status(405).end();
}
