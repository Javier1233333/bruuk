import { supabase } from '../lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';

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
  },
  requestPasswordReset: async (email: string) => {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    });
  },
  updatePassword: async (newPassword: string) => {
    return await supabase.auth.updateUser({ password: newPassword });
  },
  resendConfirmationEmail: async (email: string) => {
    return await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: window.location.origin + '/setup'
      }
    });
  },
  updateEmail: async (newEmail: string) => {
    return await supabase.auth.updateUser({ email: newEmail });
  },
  checkEmailAvailability: async (email: string) => {
    const { data, error } = await supabase.rpc('is_email_available', { email_to_check: email });
    return { isAvailable: error ? false : !!data, error };
  }
};
