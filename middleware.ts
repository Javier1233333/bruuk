export const config = {
  matcher: '/(.*)',
};

export default function middleware(request: Request): Response | undefined {
  const { pathname } = new URL(request.url);

  // Dejar pasar: API, assets estáticos y la propia página de acceso
  if (
    pathname.startsWith('/api/') ||
    pathname.includes('.') // archivos estáticos (.js, .css, .png, etc.)
  ) {
    return undefined;
  }

  const cookie = request.headers.get('cookie') ?? '';
  const hasAccess = cookie.split(';').some(c => c.trim().startsWith('bruuk_access='));

  if (!hasAccess) {
    return Response.redirect(new URL('/api/enter', request.url));
  }

  return undefined; // continuar
}
