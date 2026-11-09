import { useEffect, useState } from 'react';

/* ============================================================
   Datos editables en el admin (Firestore) servidos por /api/*.
   Arranca con el JSON del bundle para pintar al instante y lo
   reemplaza cuando llega la API. Si la API falla, se queda con
   el JSON. Una sola petición por carga de página.
   ============================================================ */

// `pick` saca la lista de una respuesta que no es un arreglo (p. ej. /api/app).
export function createCollectionHook<T>(url: string, bundled: T[], pick: (data: unknown) => unknown = (data) => data) {
  let cached: T[] | null = null;
  let request: Promise<T[] | null> | null = null;

  const load = () => {
    request ??= fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .then((raw: unknown) => {
        const data = raw == null ? null : pick(raw);
        if (!Array.isArray(data) || data.length === 0) return null;
        cached = data as T[];
        return cached;
      })
      .catch(() => null);
    return request;
  };

  return function useCollection(): T[] {
    const [items, setItems] = useState<T[]>(() => cached ?? bundled);

    useEffect(() => {
      if (cached) return;
      let alive = true;
      load().then((fresh) => {
        // Solo re-renderiza si algo cambió, para no reordenar la vista de balde
        if (alive && fresh && JSON.stringify(fresh) !== JSON.stringify(bundled)) setItems(fresh);
      });
      return () => {
        alive = false;
      };
    }, []);

    return items;
  };
}
