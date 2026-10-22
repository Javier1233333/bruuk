import Constants from 'expo-constants';
import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
  sendEmailVerification,
  sendPasswordResetEmail,
  type Auth,
  type User,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SITE_URL } from './catalog';

// Mismo proyecto de Firebase que bruuk.space (config pública en app.json → extra.firebase).
const firebaseConfig = Constants.expoConfig?.extra?.firebase as FirebaseOptions;

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// La sesión se guarda en AsyncStorage para no pedir login cada vez que se abre la app.
// Con Fast Refresh el módulo se vuelve a evaluar y initializeAuth no se puede llamar dos veces.
function createAuth(): Auth {
  try {
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    return getAuth(app);
  }
}

export const auth = createAuth();
auth.languageCode = 'es';

// Después de verificar o cambiar la contraseña, la página de Firebase ofrece volver a Bruuk.
export const emailActionSettings = { url: `${SITE_URL}/login` };

// Los correos de cuenta salen de /api/auth-email de la web (diseño de Bruuk y
// enlace a /auth/action). Si esa API falla, Firebase manda su correo de siempre.
async function postAuthEmail(body: object, idToken?: string): Promise<boolean> {
  try {
    const response = await fetch(`${SITE_URL}/api/auth-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      },
      body: JSON.stringify(body),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function sendVerificationEmail(user: User): Promise<void> {
  const sent = await postAuthEmail({ type: 'verify' }, await user.getIdToken());
  if (!sent) await sendEmailVerification(user, emailActionSettings);
}

export async function sendResetEmail(email: string): Promise<void> {
  const sent = await postAuthEmail({ type: 'reset', email });
  if (!sent) await sendPasswordResetEmail(auth, email, emailActionSettings);
}
