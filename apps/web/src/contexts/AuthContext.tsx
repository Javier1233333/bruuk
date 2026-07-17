import { createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessionStore } from '@bruuk/shared-logic/stores';

interface AuthContextType {
  session: any;
  user: any;
  profile: any;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<any>;
  refreshProfile: () => Promise<any>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSessionStore((state) => state.session);
  const user = useSessionStore((state) => state.user);
  const profile = useSessionStore((state) => state.profile);
  const loading = useSessionStore((state) => state.loading);
  
  const initialize = useSessionStore((state) => state.initialize);
  const signOut = useSessionStore((state) => state.signOut);
  const refreshSession = useSessionStore((state) => state.refreshSession);
  const refreshProfile = useSessionStore((state) => state.refreshProfile);

  const navigate = useNavigate();

  useEffect(() => {
    initialize();

    // Revisar el flag PASSWORD_RECOVERY que pone sessionStore cuando
    // Supabase dispara el evento (esto es correcto: el SDK ya procesó los tokens)
    const checkRecovery = setInterval(() => {
      if ((window as any).__bruuk_password_recovery) {
        (window as any).__bruuk_password_recovery = false;
        clearInterval(checkRecovery);
        navigate('/reset-password', { replace: true });
      }
    }, 100);

    // Limpiar el intervalo si el componente se desmonta antes de 10s
    const timeout = setTimeout(() => clearInterval(checkRecovery), 10000);

    return () => {
      clearInterval(checkRecovery);
      clearTimeout(timeout);
    };
  }, [initialize, navigate]);

  return (
    <AuthContext.Provider value={{ session, user, profile, loading, signOut, refreshSession, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return context;
}
