import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from './supabase';

/* ============================================================
   /api/app/rsvp
   POST   body: { event_id }  → registrar asistencia (gratis)
   DELETE ?event_id=<uuid>    → cancelar asistencia
   GET    ?                   → listar event_ids del usuario autenticado

   ENMIENDA E1: decremento atómico de capacity_remaining al insertar;
                incremento al cancelar.

   Auth: JWT en Authorization: Bearer <token>
   User ID se toma siempre del JWT, nunca del body.
   ============================================================ */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function getUserFromToken(authHeader: string | undefined): Promise<string | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const userId = await getUserFromToken(req.headers['authorization'] as string | undefined);
  if (!userId) return res.status(401).json({ error: 'No autenticado' });

  // ── GET /api/app/rsvp — listar event_ids del usuario ────
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('app_rsvps')
      .select('event_id')
      .eq('user_id', userId);

    if (error) {
      console.error('rsvp get error:', error);
      return res.status(500).json({ error: 'Error al leer RSVPs' });
    }

    return res.status(200).json((data ?? []).map((r) => r.event_id as string));
  }

  // ── POST /api/app/rsvp — registrar asistencia ───────────
  if (req.method === 'POST') {
    const body = req.body as Record<string, unknown> | null | undefined;
    const event_id = body?.event_id;

    if (typeof event_id !== 'string' || !UUID_RE.test(event_id)) {
      return res.status(400).json({ error: 'event_id inválido' });
    }

    // Leer evento
    const { data: event, error: evError } = await supabaseAdmin
      .from('app_events')
      .select('id, is_active, capacity, capacity_remaining, price_mxn')
      .eq('id', event_id)
      .single();

    if (evError || !event) {
      return res.status(404).json({ error: 'Evento no encontrado' });
    }
    if (!event.is_active) {
      return res.status(400).json({ error: 'Evento inactivo' });
    }
    if ((event.price_mxn as number) > 0) {
      return res.status(400).json({ error: 'Este evento requiere boleto' });
    }

    // E1: reserva atómica vía RPC (una sola sentencia SQL en Postgres)
    const { data: reserved, error: decError } = await supabaseAdmin
      .rpc('app_reserve_event_spot', { p_event_id: event_id });

    if (decError) {
      console.error('rsvp capacity decrement error:', decError);
      return res.status(500).json({ error: 'Error al reservar lugar' });
    }

    if (!reserved) {
      return res.status(409).json({ error: 'El evento está lleno', code: 'full' });
    }

    // Insertar RSVP
    const { data: rsvp, error: insertError } = await supabaseAdmin
      .from('app_rsvps')
      .insert({ user_id: userId, event_id })
      .select('id')
      .single();

    if (insertError) {
      // Si el RSVP ya existe (unique constraint) o cualquier otro error,
      // devolver el lugar reservado
      await supabaseAdmin.rpc('app_release_event_spot', { p_event_id: event_id });

      if (insertError.code === '23505') {
        return res.status(409).json({ error: 'Ya tienes RSVP para este evento' });
      }
      console.error('rsvp insert error:', insertError);
      return res.status(500).json({ error: 'Error al registrar asistencia' });
    }

    return res.status(201).json({
      rsvp_id: rsvp.id,
      event_id,
    });
  }

  // ── DELETE /api/app/rsvp?event_id=<uuid> ────────────────
  if (req.method === 'DELETE') {
    const { event_id } = req.query;

    if (typeof event_id !== 'string' || !UUID_RE.test(event_id)) {
      return res.status(400).json({ error: 'event_id inválido' });
    }

    // Verificar que el RSVP existe antes de eliminar para poder restaurar cupo
    const { data: existing } = await supabaseAdmin
      .from('app_rsvps')
      .select('id')
      .eq('user_id', userId)
      .eq('event_id', event_id)
      .single();

    const { error: deleteError } = await supabaseAdmin
      .from('app_rsvps')
      .delete()
      .eq('user_id', userId)
      .eq('event_id', event_id);

    if (deleteError) {
      console.error('rsvp delete error:', deleteError);
      return res.status(500).json({ error: 'Error al cancelar asistencia' });
    }

    // E1: devolver el lugar solo si había un RSVP activo
    if (existing) {
      await supabaseAdmin.rpc('app_release_event_spot', { p_event_id: event_id });
    }

    return res.status(200).json({ cancelled: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
