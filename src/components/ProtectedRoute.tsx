import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children }: { children?: React.ReactNode }) {
  const { session, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-primary)',
        color: 'var(--text-secondary)',
        fontFamily: 'Outfit, sans-serif',
        fontSize: '0.9rem',
        letterSpacing: '0.1em',
      }}>
        BRUUK...
      </div>
    );
  }

  // 1. Si no hay sesión, redirigir a /login
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // 2. Si hay sesión pero no está verificado el código de invitación
  const inviteVerified = session.user.user_metadata?.invite_verified === true;
  if (!inviteVerified) {
    if (location.pathname !== '/verify') {
      return <Navigate to="/verify" replace />;
    }
  } else {
    // Si ya está verificado, no debe poder entrar a /verify
    if (location.pathname === '/verify') {
      return <Navigate to="/app" replace />;
    }
  }

  // 3. Si está verificado pero no tiene el perfil configurado (falta username o ciudad)
  const isProfileIncomplete = !profile || !profile.username || !profile.city;
  if (inviteVerified) {
    if (isProfileIncomplete) {
      if (location.pathname !== '/setup') {
        return <Navigate to="/setup" replace />;
      }
    } else {
      // Si ya está completo, no debe poder entrar a /setup
      if (location.pathname === '/setup') {
        return <Navigate to="/app" replace />;
      }
    }
  }

  return children ? <>{children}</> : <Outlet />;
}
