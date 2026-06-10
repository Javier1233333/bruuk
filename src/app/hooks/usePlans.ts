import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';

export interface PlanStop {
  spot_id: string;
  spot_name: string;
  duration_min: number;
  travel_min: number;
  travel_mode: 'walk' | 'drive';
  maps_link: string;
}

export interface Plan {
  id: string;
  name: string;
  start_time: string;
  stops: PlanStop[];
  created_at: string;
}

interface UsePlansResult {
  plans: Plan[];
  loading: boolean;
  error: string | null;
  savePlan: (plan: Omit<Plan, 'id' | 'created_at'>) => Promise<{ ok: boolean; error?: string }>;
  deletePlan: (id: string) => Promise<{ ok: boolean; error?: string }>;
  reload: () => void;
}

async function getToken(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

export function usePlans(): UsePlansResult {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        if (!cancelled) {
          setError('Sesión expirada');
          setLoading(false);
        }
        return;
      }

      try {
        const r = await fetch('/api/app/plans', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!r.ok) {
          const d = await r.json() as { error?: string };
          throw new Error(d.error ?? 'Error al cargar planes');
        }
        const data = await r.json() as Plan[];
        if (!cancelled) setPlans(data);
      } catch (err) {
        if (!cancelled) setError((err as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };
  }, [tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  const savePlan = useCallback(async (plan: Omit<Plan, 'id' | 'created_at'>): Promise<{ ok: boolean; error?: string }> => {
    const token = await getToken();
    if (!token) return { ok: false, error: 'No autenticado' };

    const res = await fetch('/api/app/plans', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(plan),
    });

    if (res.ok) {
      const newPlan = await res.json() as Plan;
      setPlans((prev) => [newPlan, ...prev]);
      return { ok: true };
    }

    const data = await res.json() as { error?: string };
    return { ok: false, error: data.error ?? 'Error al guardar plan' };
  }, []);

  const deletePlan = useCallback(async (id: string): Promise<{ ok: boolean; error?: string }> => {
    const token = await getToken();
    if (!token) return { ok: false, error: 'No autenticado' };

    const res = await fetch(`/api/app/plans?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok) {
      setPlans((prev) => prev.filter((p) => p.id !== id));
      return { ok: true };
    }

    const data = await res.json() as { error?: string };
    return { ok: false, error: data.error ?? 'Error al eliminar plan' };
  }, []);

  return { plans, loading, error, savePlan, deletePlan, reload };
}
