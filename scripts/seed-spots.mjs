// Copia src/data/spots.json a la colección "spots" de Firestore.
// Conserva los ids (los planes guardados referencian spot_id) y no
// sobrescribe spots que ya existan, así que se puede correr de nuevo.
//
//   node --env-file=.env scripts/seed-spots.mjs
import { readFile } from 'node:fs/promises';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initAdmin } from './firebase-admin.mjs';

initAdmin();
const db = getFirestore();

const spots = JSON.parse(await readFile(new URL('../src/data/spots.json', import.meta.url), 'utf8'));
const existing = new Set((await db.collection('spots').select().get()).docs.map((d) => d.id));

const batch = db.batch();
let created = 0;
for (const { id, ...spot } of spots) {
  if (existing.has(id)) continue;
  batch.set(db.collection('spots').doc(id), {
    ...spot,
    rating: spot.rating ?? null,
    price: spot.price ?? null,
    coordinates: spot.coordinates ?? null,
    imagePath: null,
    active: true,
    updatedAt: FieldValue.serverTimestamp(),
  });
  created++;
}
await batch.commit();
console.log(`Spots creados: ${created}. Ya existían: ${spots.length - created}.`);
