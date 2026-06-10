import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL ?? '';
const serviceKey = process.env.SUPABASE_SERVICE_KEY ?? '';
const anonKey = process.env.SUPABASE_ANON_KEY ?? '';

// Service client (bypasses RLS) — for server-side API writes
export const supabaseAdmin = createClient(url, serviceKey);

// Public client — for reads (respects RLS)
export const supabase = createClient(url, anonKey);
