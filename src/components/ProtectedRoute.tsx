import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const location = useLocation();

  // TODO: reactivar loading y auth cuando Supabase esté configurado
  // if (loading) {
  //   return (
  //     <div style={{
  //       minHeight: '100vh',
  //       display: 'flex',
  //       alignItems: 'center',
  //       justifyContent: 'center',
  //       background: 'var(--bg-primary)',
  //       color: 'var(--text-secondary)',
  //       fontFamily: 'Outfit, sans-serif',
  //       fontSize: '0.9rem',
  //       letterSpacing: '0.1em',
  //     }}>
  //       BRUUK...
  //     </div>
  //   );
  // }

  // TODO: quitar todo este bloque comentado cuando se active auth real
  // if (!session) return <Navigate to="/login" replace />;

  // TODO: reactivar verificación de Google OAuth
  // const isGoogleUser = session.user.app_metadata?.provider === 'google';
  // const inviteVerified = session.user.user_metadata?.invite_verified === true;
  // if (isGoogleUser && !inviteVerified) {
  //   return <Navigate to="/verify" replace />;
  // }

  // TODO: reactivar redirect a /setup cuando perfil no esté completo
  // const profileDone = localStorage.getItem('bruuk_profile_done') === 'true';
  // if (!profileDone && location.pathname !== '/setup') {
  //   return <Navigate to="/setup" replace />;
  // }
  return <>{children}</>;
}
