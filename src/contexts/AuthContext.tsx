import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { onIdTokenChanged, signOut as firebaseSignOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { rememberSignedIn } from '../lib/appSession';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  // Custom claim puesto con scripts/set-admin.mjs
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // En el modo app AppAuthGate ya envuelve todo; AuthLayout no debe duplicarlo
  const parent = useContext(AuthContext);
  if (parent) return <>{children}</>;
  return <AuthStateProvider>{children}</AuthStateProvider>;
}

function AuthStateProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const readClaims = useCallback(async (u: User | null) => {
    if (!u) {
      setIsAdmin(false);
      return;
    }
    try {
      const { claims } = await u.getIdTokenResult();
      setIsAdmin(claims.admin === true);
    } catch {
      setIsAdmin(false);
    }
  }, []);

  useEffect(() => {
    return onIdTokenChanged(auth, async (u) => {
      await readClaims(u);
      rememberSignedIn(Boolean(u));
      setUser(u);
      setLoading(false);
    });
  }, [readClaims]);

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook y provider conviven a propósito
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return context;
}
