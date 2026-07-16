import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';
import { authService, userService } from '../services';

export interface SessionState {
  session: Session | null;
  user: User | null;
  profile: any | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: any | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<Session | null>;
  refreshProfile: () => Promise<any | null>;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  
  initialize: async () => {
    set({ loading: true });
    try {
      const { data } = await authService.getSession();
      const session = data.session;
      set({ session, user: session?.user ?? null });
      if (session?.user?.id) {
        const { data: profile } = await userService.getProfile(session.user.id);
        set({ profile });
      }
    } catch {
      // Ignore if Supabase not configured
    } finally {
      set({ loading: false });
    }
    
    try {
      authService.onAuthStateChange(async (_event, newSession) => {
        set({ session: newSession, user: newSession?.user ?? null });
        if (newSession?.user?.id) {
          const { data: profile } = await userService.getProfile(newSession.user.id);
          set({ profile });
        } else {
          set({ profile: null });
        }
      });
    } catch {
      // Ignore if Supabase not configured
    }
  },
  
  signOut: async () => {
    try {
      await authService.signOut();
    } catch {
      // Ignore
    } finally {
      set({ session: null, user: null, profile: null });
    }
  },
  
  refreshSession: async () => {
    try {
      const { data, error } = await authService.refreshSession();
      if (error) throw error;
      const session = data.session;
      set({ session, user: session?.user ?? null });
      if (session?.user?.id) {
        const { data: profile } = await userService.getProfile(session.user.id);
        set({ profile });
      }
      return session;
    } catch (err) {
      console.warn('[BRUUK] Falló al refrescar la sesión:', err);
      try {
        const { data } = await authService.getSession();
        const session = data.session;
        set({ session, user: session?.user ?? null });
        if (session?.user?.id) {
          const { data: profile } = await userService.getProfile(session.user.id);
          set({ profile });
        }
        return session;
      } catch {
        return null;
      }
    }
  },
  
  refreshProfile: async () => {
    const currentUserId = get().session?.user?.id;
    if (!currentUserId) {
      set({ profile: null });
      return null;
    }
    try {
      const { data: profile } = await userService.getProfile(currentUserId);
      set({ profile });
      return profile;
    } catch {
      set({ profile: null });
      return null;
    }
  }
}));
