import { initializeApp, cert, getApps } from 'firebase-admin/app';
import type { App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import type { DecodedIdToken } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

/* ============================================================
   Firebase Admin — solo servidor.
   Credenciales de una service account (Firebase Console →
   Configuración del proyecto → Cuentas de servicio).
   FIREBASE_PRIVATE_KEY viene con "\n" literales desde Vercel.
   ============================================================ */

const projectId = process.env.FIREBASE_PROJECT_ID ?? '';
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL ?? '';
const privateKey = (process.env.FIREBASE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n');

export const firebaseConfigured = Boolean(projectId && clientEmail && privateKey);

function adminApp(): App {
  return getApps()[0] ?? initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

export const adminAuth = () => getAuth(adminApp());
export const adminDb = () => getFirestore(adminApp());

// Verifica el ID token de Firebase del header Authorization: Bearer <token>
export async function verifyAuthHeader(authHeader: string | undefined): Promise<DecodedIdToken | null> {
  if (!firebaseConfigured) return null;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  try {
    return await adminAuth().verifyIdToken(authHeader.slice(7));
  } catch {
    return null;
  }
}

export async function getUserFromToken(authHeader: string | undefined): Promise<string | null> {
  const decoded = await verifyAuthHeader(authHeader);
  return decoded?.uid ?? null;
}
