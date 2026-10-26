import { db, nuevoId, type Momento } from './db';
import { blobADataUrl, dataUrlABlob } from './photo';

// Copia de seguridad: un JSON con todos los momentos y sus fotos (como data URL),
// para pasarlos a otro teléfono o guardarlos donde la persona quiera.
const FORMATO = 'bruuk-momentos';

type MomentoExportado = Omit<Momento, 'foto'> & { foto: string | null };
type Respaldo = { formato: typeof FORMATO; version: 1; exportadoEn: string; momentos: MomentoExportado[] };

export async function exportarRespaldo() {
  const momentos = await db.momentos.orderBy('fecha').toArray();
  const respaldo: Respaldo = {
    formato: FORMATO,
    version: 1,
    exportadoEn: new Date().toISOString(),
    momentos: await Promise.all(momentos.map(async (m) => ({ ...m, foto: m.foto ? await blobADataUrl(m.foto) : null }))),
  };
  const nombre = `bruuk-momentos-${respaldo.exportadoEn.slice(0, 10)}.json`;
  const file = new File([JSON.stringify(respaldo)], nombre, { type: 'application/json' });

  // En el teléfono (sobre todo la app instalada en iPhone) descargar no siempre funciona:
  // el menú de compartir deja guardarlo en Archivos, Drive o mandarlo por chat.
  const esTactil = window.matchMedia('(pointer: coarse)').matches;
  if (esTactil && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Momentos de Bruuk' });
      return momentos.length;
    } catch (error) {
      if ((error as DOMException).name === 'AbortError') return null;
    }
  }
  const url = URL.createObjectURL(file);
  const link = Object.assign(document.createElement('a'), { href: url, download: nombre });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return momentos.length;
}

const esTexto = (value: unknown): value is string => typeof value === 'string';

// Restaura sin borrar lo que ya hay: un momento con el mismo id se reemplaza, los demás se suman.
export async function importarRespaldo(file: File) {
  let datos: Partial<Respaldo>;
  try {
    datos = JSON.parse(await file.text());
  } catch {
    throw new Error('Ese archivo no es una copia de Momentos.');
  }
  if (datos.formato !== FORMATO || !Array.isArray(datos.momentos)) throw new Error('Ese archivo no es una copia de Momentos.');

  const momentos: Momento[] = [];
  for (const m of datos.momentos) {
    if (!m || !esTexto(m.titulo) || !esTexto(m.fecha) || !/^\d{4}-\d{2}-\d{2}$/.test(m.fecha)) continue;
    momentos.push({
      id: esTexto(m.id) && m.id ? m.id : nuevoId(),
      fecha: m.fecha,
      titulo: m.titulo,
      descripcion: esTexto(m.descripcion) ? m.descripcion : '',
      etiquetas: Array.isArray(m.etiquetas) ? m.etiquetas.filter(esTexto) : [],
      foto: esTexto(m.foto) && m.foto.startsWith('data:image/') ? await dataUrlABlob(m.foto) : null,
      creadoEn: typeof m.creadoEn === 'number' ? m.creadoEn : Date.now(),
    });
  }
  await db.momentos.bulkPut(momentos);
  return momentos.length;
}
