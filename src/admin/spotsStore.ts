import {
  collection,
  deleteDoc,
  doc,
  getFirestore,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { deleteObject, getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { app } from '../lib/firebase';

/* ============================================================
   Acceso a las colecciones "spots" y "rack" de Firestore para
   /admin/spots. Las reglas (firestore.rules / storage.rules) solo
   dejan escribir a cuentas con el custom claim admin. El público
   lee vía /api/spots y /api/rack.
   ============================================================ */

const db = getFirestore(app);
const storage = getStorage(app);

// Campos que comparten spots y lugares de Rack en el panel
interface PlaceDocBase {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  imagePath?: string | null; // ruta en Storage si la foto se subió desde el panel
  mapsLink: string;
  coordinates?: { lat: number; lng: number } | null;
  zone?: string | null; // colonia asignada a mano; si falta, se calcula con las coordenadas
  active: boolean;
  order?: number; // posición original del JSON; los nuevos van al final
}

export interface SpotDoc extends PlaceDocBase {
  type: string;
  highlight?: string | null; // "la razón para ir" que muestra la tarjeta
  city: string;
  colorAccent: string;
  rating?: number | null;
  price?: string | null;
}

export interface RackDoc extends PlaceDocBase {
  category: 'Rack recomienda' | 'Vinilos y antigüedades' | 'Tianguis';
}

export type SpotInput = Omit<SpotDoc, 'id' | 'order'>;
export type RackInput = Omit<RackDoc, 'id' | 'order'>;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

// Mismas operaciones para cada colección; las fotos van a Storage bajo el mismo nombre.
function placeStore<Doc extends PlaceDocBase, Input>(name: 'spots' | 'rack') {
  const col = collection(db, name);
  return {
    newId: () => doc(col).id,
    watch(onChange: (items: Doc[]) => void, onError: (err: Error) => void): () => void {
      return onSnapshot(
        col,
        (snap) => {
          const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Doc);
          items.sort((a, b) => a.name.localeCompare(b.name, 'es'));
          onChange(items);
        },
        onError,
      );
    },
    // merge: conserva campos que el formulario no edita (order)
    save: async (id: string, data: Input) => {
      await setDoc(doc(col, id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
    },
    setActive: async (id: string, active: boolean) => {
      await updateDoc(doc(col, id), { active, updatedAt: serverTimestamp() });
    },
    setZone: async (id: string, zone: string | null) => {
      await updateDoc(doc(col, id), { zone, updatedAt: serverTimestamp() });
    },
    remove: async (item: Doc) => {
      await deleteDoc(doc(col, item.id));
      if (item.imagePath) await removeImage(item.imagePath);
    },
    async uploadImage(id: string, file: File): Promise<{ url: string; path: string }> {
      const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
      const path = `${name}/${id}/${Date.now()}.${ext}`;
      const objectRef = ref(storage, path);
      await uploadBytes(objectRef, file, { contentType: file.type, cacheControl: 'public, max-age=31536000' });
      return { url: await getDownloadURL(objectRef), path };
    },
  };
}

export const spotsStore = placeStore<SpotDoc, SpotInput>('spots');
export const rackStore = placeStore<RackDoc, RackInput>('rack');

// Nombres de siempre para el gestor de spots
export const newSpotId = spotsStore.newId;
export const watchSpots = spotsStore.watch;
export const saveSpot = spotsStore.save;
export const setSpotActive = spotsStore.setActive;
export const setSpotZone = spotsStore.setZone;
export const deleteSpot = spotsStore.remove;
export const uploadSpotImage = spotsStore.uploadImage;

// Best effort: si la foto ya no existe no es un error
export async function removeImage(path: string): Promise<void> {
  await deleteObject(ref(storage, path)).catch(() => {});
}
