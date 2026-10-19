// Da (o quita con --remove) permisos de admin del gestor de spots a una cuenta.
// La cuenta debe existir en Firebase Auth (entrar una vez al sitio primero).
//
//   node --env-file=.env scripts/set-admin.mjs tu@correo.com
//   node --env-file=.env scripts/set-admin.mjs tu@correo.com --remove
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from './firebase-admin.mjs';

const email = process.argv[2];
const remove = process.argv.includes('--remove');
if (!email) {
  console.error('Uso: node --env-file=.env scripts/set-admin.mjs <email> [--remove]');
  process.exit(1);
}

initAdmin();
const auth = getAuth();
const user = await auth.getUserByEmail(email);
const claims = { ...user.customClaims, admin: !remove };
if (remove) delete claims.admin;
await auth.setCustomUserClaims(user.uid, claims);
console.log(`${email}: admin ${remove ? 'removido' : 'activado'}. Cierra sesión y vuelve a entrar para verlo.`);
