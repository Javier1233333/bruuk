export const config = {
  matcher: '/(.*)',
};

export default function middleware(request: Request): Response | undefined {
  const { pathname } = new URL(request.url);

  // Solo proteger /app y sus subrutas
  if (!pathname.startsWith('/app')) {
    return undefined;
  }

  const cookie = request.headers.get('cookie') ?? '';
  const hasAccess = cookie.split(';').some(c => c.trim().startsWith('bruuk_access='));

  if (!hasAccess) {
    return Response.redirect(new URL('/api/enter', request.url));
  }

  return undefined; // continuar
}
