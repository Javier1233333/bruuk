import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { authService } from '../features/auth/services/authService';
import { userService } from '../features/users/services/userService';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<Session | null>;
  refreshProfile: () => Promise<any | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const data = await userService.getProfile(userId);
      if (!data) return null;
      return data;
    } catch {
      return null;
    }
  };

  const refreshProfile = async () => {
    const currentUserId = session?.user?.id;
    if (!currentUserId) {
      setProfile(null);
      return null;
    }
    const p = await fetchProfile(currentUserId);
    setProfile(p);
    return p;
  };

  useEffect(() => {
    let subscription: { unsubscribe: () => void } | null = null;

    const init = async () => {
      try {
        const { data } = await authService.getSession();
        setSession(data.session);
        if (data.session?.user?.id) {
          const p = await fetchProfile(data.session.user.id);
          setProfile(p);
        }
      } catch {
        // Supabase no está configurado aún — la app sigue funcionando
      } finally {
        setLoading(false);
      }

      try {
        const { data } = authService.onAuthStateChange(async (_event, newSession) => {
          setSession(newSession);
          if (newSession?.user?.id) {
            const p = await fetchProfile(newSession.user.id);
            setProfile(p);
          } else {
            setProfile(null);
          }
        });
        subscription = data.subscription;
      } catch {
        // Ignorar si Supabase no está disponible
      }
    };

    init();

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await authService.signOut();
    } catch {
      // Ignorar
    } finally {
      setSession(null);
      setProfile(null);
    }
  };

  const refreshSession = async () => {
    try {
      const { data, error } = await authService.refreshSession();
      if (error) throw error;
      setSession(data.session);
      if (data.session?.user?.id) {
        const p = await fetchProfile(data.session.user.id);
        setProfile(p);
      }
      return data.session;
    } catch (err) {
      console.warn('[BRUUK] Falló al refrescar la sesión:', err);
      // Intentar obtener la sesión actual si el refresco falla
      const { data } = await authService.getSession();
      setSession(data.session);
      if (data.session?.user?.id) {
        const p = await fetchProfile(data.session.user.id);
        setProfile(p);
      }
      return data.session;
    }
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, loading, signOut, refreshSession, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return context;
}
