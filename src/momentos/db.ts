import Dexie, { type EntityTable } from 'dexie';

// Momentos vive sólo en este navegador (IndexedDB): no hay servidor ni cuenta detrás.
export type Momento = {
  id: string;
  fecha: string; // AAAA-MM-DD
  titulo: string;
  descripcion: string;
  foto: Blob | null;
  etiquetas: string[];
  creadoEn: number;
  destacado?: boolean; // uno de "tus 3" de su año (máximo 3 por año)
};

export const db = new Dexie('bruuk-momentos') as Dexie & { momentos: EntityTable<Momento, 'id'> };

db.version(1).stores({
  // id es la llave; fecha y etiquetas (multi-valor) quedan indexadas para ordenar y filtrar.
  momentos: 'id, fecha, *etiquetas, creadoEn',
});

export const MAX_DESTACADOS = 3;

// Marca o desmarca un momento como uno de "tus 3" de su año. Si ya hay 3 ese año, no hace nada.
export async function alternarDestacado(momento: Momento) {
  if (momento.destacado) {
    await db.momentos.update(momento.id, { destacado: false });
    return 'quitado' as const;
  }
  const anio = momento.fecha.slice(0, 4);
  const delAnio = await db.momentos.where('fecha').startsWith(anio).filter((m) => !!m.destacado).count();
  if (delAnio >= MAX_DESTACADOS) return 'lleno' as const;
  await db.momentos.update(momento.id, { destacado: true });
  return 'agregado' as const;
}

// Pide al navegador que no borre estos datos cuando le falte espacio.
// Se llama al guardar el primer momento: los navegadores lo conceden más fácil tras usar el sitio.
export async function pedirPersistencia() {
  if (!navigator.storage?.persist) return false;
  if (await navigator.storage.persisted()) return true;
  return navigator.storage.persist();
}

export async function estaProtegido() {
  return (await navigator.storage?.persisted?.()) ?? false;
}

export const nuevoId = () =>
  crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

// Fecha local de hoy (toISOString daría la de UTC y de noche saldría mañana).
export const hoy = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};
