// Configuración de la app nativa que se cambia sin publicar otra versión.
// La API la lee de Firestore meta/app y completa lo que falte con estos valores;
// la app los usa mientras no ha descargado /api/app por primera vez.
export type AppConfig = {
  // La app más vieja que sigue funcionando; abajo de esto pide actualizar.
  minVersion: string;
  features: { ruleta: boolean; preguntas: boolean; momentos: boolean; subirSpot: boolean };
  copy: { homeKicker: string; homeTitle: string; homeAccent: string; homeLead: string; planLead: string; momentosLead: string };
  // Si no hay hotspots publicados, estos van primero en Inicio.
  featuredSpotIds: string[];
  banner: { text: string; url?: string } | null;
  // ios/android: enlaces de la tienda para la pantalla "Actualiza Bruuk" (se llenan al publicar).
  links: { contacto: string; privacidad: string; instagram: string; web: string; ios: string; android: string };
};

export const DEFAULT_CONFIG: AppConfig = {
  minVersion: '1.0.0',
  features: { ruleta: true, preguntas: true, momentos: true, subirSpot: true },
  copy: {
    homeKicker: '/ GUADALAJARA',
    homeTitle: 'Menos pantalla.',
    homeAccent: 'Más mundo.',
    homeLead: 'Dónde comer y tomar, vintage y planes para salir. Elegidos por personas reales, sin rankings pagados.',
    planLead: 'Gira, fija los que te laten y sal.',
    momentosLead: 'Lo que viviste, guardado sólo en tu teléfono.',
  },
  featuredSpotIds: ['spot_003', 'spot_018', 'spot_105', 'spot_131'],
  banner: null,
  links: {
    contacto: 'mailto:contacto@bruuk.space',
    privacidad: 'https://bruuk.space/privacidad',
    instagram: 'https://instagram.com/bruuk.space',
    web: 'https://bruuk.space',
    ios: 'https://bruuk.space',
    android: 'https://play.google.com/store/apps/details?id=space.bruuk.app',
  },
};
