import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { AppSessionContext } from '../lib/appSession';
import { AppRouteFallback } from './AppRouteFallback';

// Pantallas que se ven sin sesión dentro del modo app
const PUBLIC_PATHS = new Set(['/login', '/auth/action', '/privacidad']);

// Modo app: hay que iniciar sesión para usar Bruuk. En el navegador la web sigue abierta.
export default function AppAuthGate({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <Gate>{children}</Gate>
    </AuthProvider>
  );
}

function Gate({ children }: { children: ReactNode }) {
  const { user, loading, signOut } = useAuth();
  const { pathname, search } = useLocation();

  if (!PUBLIC_PATHS.has(pathname)) {
    if (loading) return <AppRouteFallback />;
    if (!user) return <Navigate to={`/login?next=${encodeURIComponent(pathname + search)}`} replace />;
  }

  return (
    <AppSessionContext.Provider value={user ? { email: user.email, signOut } : null}>
      {children}
    </AppSessionContext.Provider>
  );
}
