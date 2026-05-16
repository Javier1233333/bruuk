declare const process: { env: Record<string, string | undefined> };

export const config = {
  matcher: '/(.*)',
};

export default async function middleware(request: Request): Promise<Response | undefined> {
  const { pathname } = new URL(request.url);

  // Solo proteger /app y sus subrutas
  if (!pathname.startsWith('/app')) {
    return undefined;
  }

  const ACCESS_TOKEN = process.env.ACCESS_TOKEN ?? '';
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(ACCESS_TOKEN),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode('bruuk_session'));
  const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');

  const cookie = request.headers.get('cookie') ?? '';
  const cookieValue = cookie.split(';').find(c => c.trim().startsWith('bruuk_access='))?.split('=')[1];

  if (cookieValue !== expected) {
    return Response.redirect(new URL('/api/enter', request.url));
  }

  return undefined;
}
