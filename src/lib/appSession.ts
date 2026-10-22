import { createContext, useContext } from 'react';
import { IS_APP_MODE } from './appMode';

// Sesión del modo app. Vive aparte de AuthContext para que CityNav pueda
// leerla sin meter Firebase en el bundle de la web.
export interface AppSession {
  email: string | null;
  signOut: () => Promise<void>;
}

export const AppSessionContext = createContext<AppSession | null>(null);

export const useAppSession = () => useContext(AppSessionContext);

// Marca de "ya inició sesión en este navegador". AuthContext la escribe; el feed
// la lee para no pedir login otra vez sin cargar Firebase en la web.
const SIGNED_IN_KEY = 'bruuk-signed-in';

export const rememberSignedIn = (signedIn: boolean) => {
  try {
    if (signedIn) window.localStorage.setItem(SIGNED_IN_KEY, '1');
    else window.localStorage.removeItem(SIGNED_IN_KEY);
  } catch {
    // Sin almacenamiento: el feed vuelve a invitar a iniciar sesión.
  }
};

export const hasSignedIn = () => {
  try {
    return window.localStorage.getItem(SIGNED_IN_KEY) === '1';
  } catch {
    return false;
  }
};

// En la web, cada 5 spots el feed pide iniciar sesión; en la app (ya con sesión) sale Radar cada 6.
export const FEED_PROMO_EVERY = IS_APP_MODE ? 6 : 5;
