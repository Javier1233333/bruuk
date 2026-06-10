import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

interface UseRsvpResult {
  rsvpedEventIds: Set<string>;
  loading: boolean;
  rsvp: (eventId: string) => Promise<{ ok: boolean; error?: string }>;
  cancelRsvp: (eventId: string) => Promise<{ ok: boolean; error?: string }>;
}

async function getToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

export function useRsvp(): UseRsvpResult {
  const [rsvpedEventIds, setRsvpedEventIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Cargar RSVPs del usuario al montar
  useEffect(() => {
    let cancelled = false;

    getToken().then((token) => {
      if (!token) {
        if (!cancelled) setLoading(false);
        return;
      }

      fetch('/api/app/rsvp', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => {
          if (!r.ok) throw new Error('rsvp fetch failed');
          return r.json() as Promise<string[]>;
        })
        .then((ids) => {
          if (!cancelled) setRsvpedEventIds(new Set(ids));
        })
        .catch(() => {
          // No bloquear UI si falla la carga inicial
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    });

    return () => { cancelled = true; };
  }, []);

  const rsvp = useCallback(async (eventId: string): Promise<{ ok: boolean; error?: string }> => {
    const token = await getToken();
    if (!token) return { ok: false, error: 'No autenticado' };

    const res = await fetch('/api/app/rsvp', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ event_id: eventId }),
    });

    if (res.ok) {
      setRsvpedEventIds((prev) => new Set([...prev, eventId]));
      return { ok: true };
    }

    const data = await res.json() as { error?: string; code?: string };
    return { ok: false, error: data.error ?? 'Error al registrar asistencia' };
  }, []);

  const cancelRsvp = useCallback(async (eventId: string): Promise<{ ok: boolean; error?: string }> => {
    const token = await getToken();
    if (!token) return { ok: false, error: 'No autenticado' };

    const res = await fetch(`/api/app/rsvp?event_id=${eventId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      setRsvpedEventIds((prev) => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
      return { ok: true };
    }

    const data = await res.json() as { error?: string };
    return { ok: false, error: data.error ?? 'Error al cancelar' };
  }, []);

  return { rsvpedEventIds, loading, rsvp, cancelRsvp };
}
