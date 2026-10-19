import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './supabase.js';
import { verifyAuthHeader } from './firebase.js';

/* ============================================================
   /api/app/me
   GET → perfil del usuario (se crea si no existe)

   Auth: ID token de Firebase en Authorization: Bearer <token>
   ============================================================ */

async function ensureProfile(uid: string, email: string | undefined) {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('display_name, avatar_color')
    .eq('id', uid)
    .maybeSingle();
  if (data) return data;

  const profile = {
    id: uid,
    display_name: email?.split('@')[0] ?? '',
    avatar_color: '#6366f1',
  };
  await supabaseAdmin.from('profiles').upsert(profile, { onConflict: 'id', ignoreDuplicates: true });
  return { display_name: profile.display_name, avatar_color: profile.avatar_color };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const decoded = await verifyAuthHeader(req.headers['authorization'] as string | undefined);
  if (!decoded) return res.status(401).json({ error: 'No autenticado' });

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const profile = await ensureProfile(decoded.uid, decoded.email);
  return res.status(200).json({ profile });
}
