// Copia src/data/rack.json a la colección "rack" de Firestore.
// Conserva los ids y no sobrescribe lugares que ya existan, así que se puede correr de nuevo.
// Los ocultos (active: false) también se copian para poder mostrarlos desde el admin.
//
//   node --env-file=.env scripts/seed-rack.mjs
import { readFile } from 'node:fs/promises';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initAdmin } from './firebase-admin.mjs';

initAdmin();
const db = getFirestore();

const places = JSON.parse(await readFile(new URL('../src/data/rack.json', import.meta.url), 'utf8'));
const existing = new Set((await db.collection('rack').select().get()).docs.map((d) => d.id));

const batch = db.batch();
let created = 0;
for (const { id, ...place } of places) {
  if (existing.has(id)) continue;
  batch.set(db.collection('rack').doc(id), {
    ...place,
    imageUrl: place.imageUrl ?? null,
    coordinates: place.coordinates ?? null,
    zone: null,
    imagePath: null,
    updatedAt: FieldValue.serverTimestamp(),
  });
  created++;
}
await batch.commit();
console.log(`Lugares de Rack creados: ${created}. Ya existían: ${places.length - created}.`);
