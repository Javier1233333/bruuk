import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { AppRouteFallback } from './AppRouteFallback';

// En la web solo Spots y Rack son libres: estas rutas piden iniciar sesión.
// Firebase Auth se carga únicamente al entrar a ellas.
export default function RequireLogin() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}

function Gate() {
  const { user, loading } = useAuth();
  const { pathname, search } = useLocation();
  if (loading) return <AppRouteFallback />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(pathname + search)}`} replace />;
  return <Outlet />;
}
