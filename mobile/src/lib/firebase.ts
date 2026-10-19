import Constants from 'expo-constants';
import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, getReactNativePersistence, initializeAuth, type Auth } from 'firebase/auth';
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
