import { File, Paths } from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { dataUrlAFoto, fotoADataUrl, guardarMomentos, leerMomentos, nuevoId, type Momento } from './db';

// Copia de seguridad: un JSON con todos los momentos y sus fotos (como data URL).
// Mismo formato que src/momentos/backup.ts: se puede pasar de la web a la app y al revés.
const FORMATO = 'bruuk-momentos';

type MomentoExportado = Omit<Momento, 'foto'> & { foto: string | null };
type Respaldo = { formato: typeof FORMATO; version: 1; exportadoEn: string; momentos: MomentoExportado[] };

export async function exportarRespaldo(): Promise<number> {
  const momentos = (await leerMomentos()).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const respaldo: Respaldo = {
    formato: FORMATO,
    version: 1,
    exportadoEn: new Date().toISOString(),
    momentos: await Promise.all(momentos.map(async (m) => ({ ...m, foto: await fotoADataUrl(m.foto) }))),
  };
  const file = new File(Paths.cache, `bruuk-momentos-${respaldo.exportadoEn.slice(0, 10)}.json`);
  file.write(JSON.stringify(respaldo));
  // El menú de compartir deja guardarlo en Archivos, Drive o mandarlo por chat.
  await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Respaldo de Momentos', UTI: 'public.json' });
  return momentos.length;
}

const esTexto = (value: unknown): value is string => typeof value === 'string';

// Restaura sin borrar lo que ya hay: un momento con el mismo id se reemplaza, los demás se suman.
// Devuelve null si la persona canceló.
export async function importarRespaldo(): Promise<number | null> {
  const elegido = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/plain', '*/*'], copyToCacheDirectory: true });
  if (elegido.canceled || !elegido.assets?.[0]) return null;

  let datos: Partial<Respaldo>;
  try {
    datos = JSON.parse(await new File(elegido.assets[0].uri).text());
  } catch {
    throw new Error('Ese archivo no es una copia de Momentos.');
  }
  if (datos.formato !== FORMATO || !Array.isArray(datos.momentos)) throw new Error('Ese archivo no es una copia de Momentos.');

  const momentos: Momento[] = [];
  for (const m of datos.momentos) {
    if (!m || !esTexto(m.titulo) || !esTexto(m.fecha) || !/^\d{4}-\d{2}-\d{2}$/.test(m.fecha)) continue;
    const id = esTexto(m.id) && m.id ? m.id : nuevoId();
    momentos.push({
      id,
      fecha: m.fecha,
      titulo: m.titulo,
      descripcion: esTexto(m.descripcion) ? m.descripcion : '',
      etiquetas: Array.isArray(m.etiquetas) ? m.etiquetas.filter(esTexto) : [],
      foto: esTexto(m.foto) && m.foto.startsWith('data:image/') ? await dataUrlAFoto(m.foto, id) : null,
      creadoEn: typeof m.creadoEn === 'number' ? m.creadoEn : Date.now(),
      destacado: m.destacado === true,
    });
  }
  await guardarMomentos(momentos);
  return momentos.length;
}
