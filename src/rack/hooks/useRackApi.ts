import { useState, useEffect } from 'react';
import type { RackProduct, Drop, BruukEvent } from '../types/rack';

/* ============================================================
   Generic fetch hook with caching
   ============================================================ */

const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 60_000; // 1 min

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/* Estado inicial derivado del caché — evita setState síncrono en el efecto */
function stateFor<T>(url: string | null): FetchState<T> {
  if (!url) return { data: null, loading: false, error: null };
  const cached = cache.get(url);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return { data: cached.data as T, loading: false, error: null };
  }
  return { data: null, loading: true, error: null };
}

function useFetch<T>(url: string | null) {
  const [state, setState] = useState<FetchState<T>>(() => stateFor<T>(url));
  const [prevUrl, setPrevUrl] = useState(url);

  if (url !== prevUrl) {
    setPrevUrl(url);
    setState(stateFor<T>(url));
  }

  useEffect(() => {
    if (!url) return;

    const cached = cache.get(url);
    if (cached && Date.now() - cached.ts < CACHE_TTL) return;

    const controller = new AbortController();

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.json();
      })
      .then((json: T) => {
        cache.set(url, { data: json, ts: Date.now() });
        setState({ data: json, loading: false, error: null });
      })
      .catch((err) => {
        if (err.name === 'AbortError') return;
        setState({ data: null, loading: false, error: err.message ?? 'Error al cargar' });
      });

    return () => controller.abort();
  }, [url]);

  return state;
}

/* ============================================================
   Specific hooks
   ============================================================ */

export function useRackProducts(category?: string) {
  const params = category && category !== 'all' ? `?category=${category}` : '';
  return useFetch<RackProduct[]>(`/api/rack/products${params}`);
}

export function useRackProduct(slug: string | undefined) {
  const url = slug ? `/api/rack/products?slug=${slug}` : null;
  return useFetch<RackProduct>(url);
}

export function useRackDrops() {
  return useFetch<Drop[]>('/api/rack/drops');
}

export function useRackEvents() {
  return useFetch<BruukEvent[]>('/api/rack/events');
}
