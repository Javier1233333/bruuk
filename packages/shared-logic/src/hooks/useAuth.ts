import { useSessionStore } from '../stores/sessionStore';

export function useAuth() {
  const session = useSessionStore((state) => state.session);
  const user = useSessionStore((state) => state.user);
  const profile = useSessionStore((state) => state.profile);
  const loading = useSessionStore((state) => state.loading);
  const signOut = useSessionStore((state) => state.signOut);
  const refreshSession = useSessionStore((state) => state.refreshSession);
  const refreshProfile = useSessionStore((state) => state.refreshProfile);

  return {
    session,
    user,
    profile,
    loading,
    signOut,
    refreshSession,
    refreshProfile
  };
}

export const useSession = useAuth;
