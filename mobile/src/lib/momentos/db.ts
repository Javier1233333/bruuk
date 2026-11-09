import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

/* ============================================================
   Momentos vive sólo en este teléfono: no hay servidor ni cuenta.
   - Los datos (título, fecha, etiquetas…) van en AsyncStorage como JSON.
   - Las fotos van como archivos JPG en la carpeta de documentos de la app,
     reducidas a ~1600 px (una foto del cel pesa 3–8 MB; así queda en ~300 KB).
   Mismo modelo que src/momentos/db.ts de la web, para que el respaldo sirva en los dos.
   ============================================================ */

export type Momento = {
  id: string;
  fecha: string; // AAAA-MM-DD
  titulo: string;
  descripcion: string;
  // Nombre del archivo en la carpeta de fotos (o data URL en la versión web de pruebas).
  foto: string | null;
  etiquetas: string[];
  creadoEn: number;
  destacado?: boolean; // uno de "tus 3" de su año (máximo 3 por año)
};

const KEY = 'bruuk-momentos-v1';
const MAX_LADO = 1600;
export const MAX_DESTACADOS = 3;

const photosDir = () => new Directory(Paths.document, 'momentos');

export const nuevoId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

// Fecha local de hoy (toISOString daría la de UTC y de noche saldría mañana).
export const hoy = (offsetDays = 0) => {
  const now = new Date();
  now.setDate(now.getDate() + offsetDays);
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

export async function leerMomentos(): Promise<Momento[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? (list as Momento[]) : [];
  } catch {
    return [];
  }
}

async function escribir(momentos: Momento[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(momentos));
}

// Inserta o reemplaza por id.
export async function guardarMomentos(nuevos: Momento[]) {
  const actuales = await leerMomentos();
  const porId = new Map(actuales.map((m) => [m.id, m]));
  for (const momento of nuevos) porId.set(momento.id, momento);
  await escribir([...porId.values()]);
}

export async function borrarMomento(momento: Momento) {
  await escribir((await leerMomentos()).filter((m) => m.id !== momento.id));
  borrarFoto(momento.foto);
}

// Marca o desmarca un momento como uno de "tus 3" de su año. Si ya hay 3 ese año, no hace nada.
export async function alternarDestacado(momento: Momento): Promise<'quitado' | 'agregado' | 'lleno'> {
  const todos = await leerMomentos();
  if (momento.destacado) {
    await escribir(todos.map((m) => (m.id === momento.id ? { ...m, destacado: false } : m)));
    return 'quitado';
  }
  const anio = momento.fecha.slice(0, 4);
  if (todos.filter((m) => m.destacado && m.fecha.startsWith(anio)).length >= MAX_DESTACADOS) return 'lleno';
  await escribir(todos.map((m) => (m.id === momento.id ? { ...m, destacado: true } : m)));
  return 'agregado';
}

/* ---------------- Fotos ---------------- */

// URI para pintar la foto (archivo local, o data URL en web).
export const fotoUri = (foto: string | null) => {
  if (!foto) return undefined;
  if (foto.startsWith('data:') || Platform.OS === 'web') return foto;
  return new File(photosDir(), foto).uri;
};

// Reduce la foto elegida de la galería (sólo si mide más de MAX_LADO por el lado largo)
// y la copia a la carpeta de la app. Devuelve el nombre del archivo.
export async function guardarFoto(uriOriginal: string, id: string, ancho?: number, alto?: number): Promise<string> {
  const contexto = ImageManipulator.manipulate(uriOriginal);
  if (ancho && alto && Math.max(ancho, alto) > MAX_LADO) {
    contexto.resize(ancho >= alto ? { width: MAX_LADO } : { height: MAX_LADO });
  }
  const imagen = await contexto.renderAsync();
  const guardada = await imagen.saveAsync({ format: SaveFormat.JPEG, compress: 0.82, base64: Platform.OS === 'web' });
  if (Platform.OS === 'web') return `data:image/jpeg;base64,${guardada.base64}`;

  const dir = photosDir();
  if (!dir.exists) dir.create({ intermediates: true });
  const nombre = `${id}-${Date.now().toString(36)}.jpg`;
  new File(guardada.uri).copySync(new File(dir, nombre));
  return nombre;
}

export function borrarFoto(foto: string | null) {
  if (!foto || foto.startsWith('data:') || Platform.OS === 'web') return;
  try {
    const file = new File(photosDir(), foto);
    if (file.exists) file.delete();
  } catch {
    // Si ya no está, no pasa nada.
  }
}

// Para el respaldo: la foto como data URL (así el JSON es compatible con el de la web).
export async function fotoADataUrl(foto: string | null): Promise<string | null> {
  if (!foto) return null;
  if (foto.startsWith('data:')) return foto;
  try {
    return `data:image/jpeg;base64,${await new File(photosDir(), foto).base64()}`;
  } catch {
    return null;
  }
}

export async function dataUrlAFoto(dataUrl: string, id: string): Promise<string | null> {
  const match = /^data:image\/[\w.+-]+;base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  if (Platform.OS === 'web') return dataUrl;
  const dir = photosDir();
  if (!dir.exists) dir.create({ intermediates: true });
  const nombre = `${id}-${Date.now().toString(36)}.jpg`;
  new File(dir, nombre).write(match[1], { encoding: 'base64' });
  return nombre;
}
