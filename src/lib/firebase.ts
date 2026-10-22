import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, sendEmailVerification, sendPasswordResetEmail, type User } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

if (!firebaseConfig.apiKey) {
  console.warn('[BRUUK] Configura las variables VITE_FIREBASE_* en tu .env');
}

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
auth.languageCode = 'es';
export const googleProvider = new GoogleAuthProvider();

// Firestore y Storage solo se usan en /admin/spots: se importan ahí
// para que no entren al bundle principal.

// ID token para las APIs (Authorization: Bearer <token>)
export async function getIdToken(forceRefresh = false): Promise<string | null> {
  try {
    return (await auth.currentUser?.getIdToken(forceRefresh)) ?? null;
  } catch {
    return null;
  }
}

// Al terminar en la página de acción de Firebase (verificar correo, cambiar
// contraseña) muestra "Continuar" de regreso a Bruuk. El dominio debe estar
// en Authentication → Dominios autorizados.
export const emailActionSettings = () => ({ url: `${window.location.origin}/login` });

// Los correos de cuenta salen de /api/auth-email (diseño de Bruuk y enlace a
// /auth/action). Si esa API falla, Firebase manda su correo de siempre.
async function postAuthEmail(body: object, idToken?: string): Promise<boolean> {
  try {
    const response = await fetch('/api/auth-email', {
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
  if (!sent) await sendEmailVerification(user, emailActionSettings());
}

export async function sendResetEmail(email: string): Promise<void> {
  const sent = await postAuthEmail({ type: 'reset', email });
  if (!sent) await sendPasswordResetEmail(auth, email, emailActionSettings());
}
