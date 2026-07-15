import { supabase } from '../../../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

export const authService = {
  getSession: async () => {
    return await supabase.auth.getSession();
  },
  onAuthStateChange: (callback: (event: string, session: Session | null) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  },
  signOut: async () => {
    return await supabase.auth.signOut();
  },
  refreshSession: async () => {
    return await supabase.auth.refreshSession();
  },
  signInWithPassword: async (credentials: any) => {
    return await supabase.auth.signInWithPassword(credentials);
  },
  signUp: async (credentials: any) => {
    return await supabase.auth.signUp(credentials);
  },
  signInWithOAuth: async (options: any) => {
    return await supabase.auth.signInWithOAuth(options);
  }
};
