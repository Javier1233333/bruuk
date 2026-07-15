import { createClient } from '@supabase/supabase-js';
import { storageAdapter } from './adapters/storageAdapter';

const rawUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

// Usa valores reales solo si parecen válidos
const supabaseUrl = rawUrl.startsWith('https://') ? rawUrl : 'https://placeholder.supabase.co';
const supabaseAnonKey = rawKey.length > 20 ? rawKey : 'placeholder-key-not-configured';

if (!rawUrl.startsWith('https://')) {
  console.warn('[BRUUK] Configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storageAdapter,
    persistSession: true
  }
});
