import { createHash } from 'node:crypto';
import type { VercelRequest } from '@vercel/node';
import { adminDb } from './_firebase.js';

/* ============================================================
   Utilidades de seguridad compartidas por las APIs.
   - takeSlot: límite de envíos por ventana guardado en Firestore
     (solo Admin SDK; las reglas niegan el acceso desde el navegador).
   - sheetSafe: evita que un texto se ejecute como fórmula en Sheets.
   ============================================================ */

export const hash = (value: string) => createHash('sha256').update(value).digest('hex');

// En Vercel, x-real-ip y x-forwarded-for los pone la plataforma (no se pueden falsificar)
export const clientIp = (req: VercelRequest) => {
  const forwarded = req.headers['x-forwarded-for'];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim();
  return (req.headers['x-real-ip'] as string | undefined) || first || 'unknown';
};

/**
 * true si `key` todavía tiene envíos disponibles en la ventana (y cuenta este).
 * Guarda el hash de la llave, no la IP ni el correo.
 */
export async function takeSlot(collection: string, key: string, max: number, windowMs: number): Promise<boolean> {
  const ref = adminDb().collection(collection).doc(hash(key));
  return adminDb().runTransaction(async (tx) => {
    const now = Date.now();
    const data = (await tx.get(ref)).data();
    const inWindow = data && now - data.windowStart < windowMs;
    const count = inWindow ? data.count : 0;
    if (count >= max) return false;
    tx.set(ref, { count: count + 1, windowStart: inWindow ? data.windowStart : now });
    return true;
  });
}

/**
 * Google Sheets (appendRow / setValues) interpreta como fórmula todo lo que
 * empieza con = + - @ (o tab / retorno). Un apóstrofo inicial lo deja como texto
 * y Sheets no lo muestra.
 */
export const sheetSafe = (value: string) => (/^[=+\-@\t\r]/.test(value) ? `'${value}` : value);
