import { createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
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

  useEffect(() => {
    initialize();
  }, [initialize]);

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
