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
   Acceso a la colección "spots" de Firestore para /admin/spots.
   Las reglas (firestore.rules / storage.rules) solo dejan escribir
   a cuentas con el custom claim admin. El público lee vía /api/spots.
   ============================================================ */

const db = getFirestore(app);
const storage = getStorage(app);
const spotsCol = collection(db, 'spots');

export interface SpotDoc {
  id: string;
  name: string;
  type: string;
  description: string;
  highlight?: string | null; // "la razón para ir" que muestra la tarjeta
  city: string;
  imageUrl: string;
  imagePath?: string | null; // ruta en Storage si la foto se subió desde el panel
  colorAccent: string;
  rating?: number | null;
  price?: string | null;
  mapsLink: string;
  coordinates?: { lat: number; lng: number } | null;
  zone?: string | null; // colonia asignada a mano; si falta, se calcula con las coordenadas
  active: boolean;
  order?: number; // posición original de spots.json; los nuevos van al final
}

export type SpotInput = Omit<SpotDoc, 'id' | 'order'>;

export function newSpotId(): string {
  return doc(spotsCol).id;
}

export function watchSpots(
  onChange: (spots: SpotDoc[]) => void,
  onError: (err: Error) => void,
): () => void {
  return onSnapshot(
    spotsCol,
    (snap) => {
      const spots = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as SpotDoc);
      spots.sort((a, b) => a.name.localeCompare(b.name, 'es'));
      onChange(spots);
    },
    onError,
  );
}

// merge: conserva campos que el formulario no edita (order)
export async function saveSpot(id: string, data: SpotInput): Promise<void> {
  await setDoc(doc(spotsCol, id), { ...data, updatedAt: serverTimestamp() }, { merge: true });
}

export async function setSpotActive(id: string, active: boolean): Promise<void> {
  await updateDoc(doc(spotsCol, id), { active, updatedAt: serverTimestamp() });
}

export async function setSpotZone(id: string, zone: string | null): Promise<void> {
  await updateDoc(doc(spotsCol, id), { zone, updatedAt: serverTimestamp() });
}

export async function deleteSpot(spot: SpotDoc): Promise<void> {
  await deleteDoc(doc(spotsCol, spot.id));
  if (spot.imagePath) await removeImage(spot.imagePath);
}

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export async function uploadSpotImage(spotId: string, file: File): Promise<{ url: string; path: string }> {
  const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `spots/${spotId}/${Date.now()}.${ext}`;
  const objectRef = ref(storage, path);
  await uploadBytes(objectRef, file, { contentType: file.type, cacheControl: 'public, max-age=31536000' });
  return { url: await getDownloadURL(objectRef), path };
}

// Best effort: si la foto ya no existe no es un error
export async function removeImage(path: string): Promise<void> {
  await deleteObject(ref(storage, path)).catch(() => {});
}
