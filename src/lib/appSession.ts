import { createContext, useContext } from 'react';

// Sesión del modo app. Vive aparte de AuthContext para que CityNav pueda
// leerla sin meter Firebase en el bundle de la web.
export interface AppSession {
  email: string | null;
  signOut: () => Promise<void>;
}

export const AppSessionContext = createContext<AppSession | null>(null);

export const useAppSession = () => useContext(AppSessionContext);
