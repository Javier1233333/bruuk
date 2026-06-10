import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './supabase';

/* ============================================================
   /api/app/plans
   GET    → planes del usuario autenticado (ordenados por created_at desc)
   POST   body: { name, start_time, stops[] } → crear plan
   DELETE ?id=<uuid>                          → eliminar plan propio

   Auth: JWT en Authorization: Bearer <token>
   User ID se toma del JWT, nunca del body.
   ============================================================ */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TIME_RE = /^\d{2}:\d{2}$/;

async function getUserFromToken(authHeader: string | undefined): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
}

interface Stop {
  spot_id: string;
  spot_name: string;
  duration_min: number;
  travel_min: number;
  travel_mode: 'walk' | 'drive';
  maps_link: string;
}

function validateStop(stop: unknown): stop is Stop {
  if (!stop || typeof stop !== 'object') return false;
  const s = stop as Record<string, unknown>;
  if (typeof s.spot_id !== 'string' || s.spot_id.length === 0) return false;
  if (typeof s.spot_name !== 'string' || s.spot_name.length === 0 || s.spot_name.length > 120) return false;
  if (typeof s.duration_min !== 'number' || s.duration_min < 5 || s.duration_min > 480) return false;
  if (typeof s.travel_min !== 'number' || s.travel_min < 0 || s.travel_min > 120) return false;
  if (s.travel_mode !== 'walk' && s.travel_mode !== 'drive') return false;
  if (typeof s.maps_link !== 'string' || s.maps_link.length > 500 || !s.maps_link.startsWith('http')) return false;
  return true;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await getUserFromToken(req.headers['authorization'] as string | undefined);
  if (!userId) return res.status(401).json({ error: 'No autenticado' });

  // ── GET /api/app/plans ───────────────────────────────────
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('app_plans')
      .select('id, name, start_time, stops, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('plans get error:', error);
      return res.status(500).json({ error: 'Error al cargar planes' });
    }

    return res.status(200).json(data ?? []);
  }

  // ── POST /api/app/plans ──────────────────────────────────
  if (req.method === 'POST') {
    const body = req.body as Record<string, unknown> | null | undefined;
    if (!body) return res.status(400).json({ error: 'Body requerido' });

    const { name, start_time, stops } = body;

    if (typeof name !== 'string' || name.length < 1 || name.length > 60) {
      return res.status(400).json({ error: 'name debe tener entre 1 y 60 caracteres' });
    }
    if (typeof start_time !== 'string' || !TIME_RE.test(start_time)) {
      return res.status(400).json({ error: 'start_time debe ser formato HH:MM' });
    }
    if (!Array.isArray(stops) || stops.length < 1 || stops.length > 6) {
      return res.status(400).json({ error: 'stops debe tener entre 1 y 6 paradas' });
    }
    if (!stops.every(validateStop)) {
      return res.status(400).json({ error: 'Una o más paradas tienen datos inválidos' });
    }

    const { data, error } = await supabaseAdmin
      .from('app_plans')
      .insert({ user_id: userId, name, start_time, stops })
      .select('id, name, start_time, stops, created_at')
      .single();

    if (error) {
      console.error('plan insert error:', error);
      return res.status(400).json({ error: error.message });
    }

    return res.status(201).json(data);
  }

  // ── DELETE /api/app/plans?id=<uuid> ─────────────────────
  if (req.method === 'DELETE') {
    const { id } = req.query;

    if (typeof id !== 'string' || !UUID_RE.test(id)) {
      return res.status(400).json({ error: 'id inválido' });
    }

    // Verificar que el plan pertenece al usuario
    const { data: existing } = await supabaseAdmin
      .from('app_plans')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'Plan no encontrado o no tienes permiso para eliminarlo' });
    }

    const { error } = await supabaseAdmin
      .from('app_plans')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('plan delete error:', error);
      return res.status(500).json({ error: 'Error al eliminar plan' });
    }

    return res.status(200).json({ deleted: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
