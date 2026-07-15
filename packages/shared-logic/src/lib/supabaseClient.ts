import { createClient } from '@supabase/supabase-js';
import { storageAdapter } from '../adapters/storageAdapter';

const rawUrl = (import.meta as any).env?.VITE_SUPABASE_URL ?? '';
const rawKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ?? '';

const supabaseUrl = rawUrl.startsWith('https://') ? rawUrl : 'https://placeholder.supabase.co';
const supabaseAnonKey = rawKey.length > 20 ? rawKey : 'placeholder-key-not-configured';

if (!rawUrl.startsWith('https://')) {
  console.warn('[BRUUK] Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu entorno');
}

const customStorage = {
  getItem: (key: string) => {
    return storageAdapter?.getItem(key) ?? null;
  },
  setItem: (key: string, value: string) => {
    storageAdapter?.setItem(key, value);
  },
  removeItem: (key: string) => {
    storageAdapter?.removeItem(key);
  }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    persistSession: true
  }
});
