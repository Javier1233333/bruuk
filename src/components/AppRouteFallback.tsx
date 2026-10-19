import { useEffect } from 'react';
import { RecommendationLoadingScreen } from './RecommendationTransition';

// En el modo app la pantalla de carga sólo sale al abrir; entre pestañas se queda el fondo.
let hasLoadedFirstRoute = false;

export function AppRouteFallback() {
  return hasLoadedFirstRoute ? <div className="app-route-fallback" aria-busy="true" /> : <RecommendationLoadingScreen />;
}

// Ya cargó la primera pantalla: precarga las pestañas para que cambiar sea instantáneo.
export function FirstRouteLoaded() {
  useEffect(() => {
    if (hasLoadedFirstRoute) return;
    hasLoadedFirstRoute = true;
    void Promise.all([
      import('./OceanLanding'),
      import('../rack/RackPlaces'),
      import('../pages/SubmitSpotPage'),
      import('../pages/PlanBuilderPage'),
      import('../pages/EventsPage'),
      import('../pages/RadarPage'),
      import('../pages/SunsetPage'),
    ]).catch(() => undefined);
  }, []);
  return null;
}
