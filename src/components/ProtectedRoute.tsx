import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

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

  if (!session) return <Navigate to="/login" replace />;

  // Usuario de Google que aún no verificó código
  const isGoogleUser = session.user.app_metadata?.provider === 'google';
  const inviteVerified = session.user.user_metadata?.invite_verified === true;

  if (isGoogleUser && !inviteVerified) {
    return <Navigate to="/verify" replace />;
  }

  return <>{children}</>;
}
