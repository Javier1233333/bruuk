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

// Las fotos se guardan como bytes, no como Blob: en Safari (iPhone) un Blob leído de IndexedDB
// deja de poder leerse cuando la página se va a segundo plano (p. ej. al compartir a Instagram)
// y la foto desaparece. Al leer se arma un Blob en memoria, que no tiene ese problema.
type FotoGuardada = { datos: ArrayBuffer; tipo: string };

const esFotoGuardada = (foto: unknown): foto is FotoGuardada =>
  !!foto && typeof foto === 'object' && (foto as FotoGuardada).datos instanceof ArrayBuffer;

db.momentos.hook('reading', (momento) => {
  const foto: unknown = momento.foto;
  if (esFotoGuardada(foto)) momento.foto = new Blob([foto.datos], { type: foto.tipo });
  return momento;
});

const fotoAGuardar = async (foto: Blob): Promise<FotoGuardada> => ({ datos: await foto.arrayBuffer(), tipo: foto.type || 'image/jpeg' });

// Guardar siempre por aquí (no con db.momentos.put directo) para que la foto vaya como bytes.
export async function guardarMomentos(momentos: Momento[]) {
  const listos = await Promise.all(momentos.map(async (m) => ({ ...m, foto: m.foto ? await fotoAGuardar(m.foto) : null })));
  await db.momentos.bulkPut(listos as unknown as Momento[]);
}

// Los momentos guardados antes tienen la foto como Blob: se pasan a bytes una vez, al abrir Momentos.
// Una foto que ya no se puede leer se deja como está.
export async function migrarFotos() {
  const viejos = (await db.momentos.toCollection().raw().toArray()).filter((m) => m.foto instanceof Blob);
  for (const momento of viejos) {
    try {
      const foto = await fotoAGuardar(momento.foto!);
      await db.transaction('rw', db.momentos, async () => {
        // Si lo editaron mientras tanto, no se pisa la foto nueva
        const actual = await db.momentos.where('id').equals(momento.id).raw().first();
        if (actual?.foto instanceof Blob && actual.foto.size === foto.datos.byteLength) {
          await db.momentos.update(momento.id, { foto: foto as unknown as Blob });
        }
      });
    } catch {
      // sigue con los demás
    }
  }
}

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
