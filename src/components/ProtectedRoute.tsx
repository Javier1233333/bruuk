import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

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

  // TODO: restaurar auth — temporalmente abierto para preview
  // if (!session) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
