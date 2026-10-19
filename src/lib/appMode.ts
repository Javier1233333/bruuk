// "Modo app": sólo cuando Bruuk se abre desde el ícono de inicio (PWA instalada).
// Ahí hay menú inferior y no aparece la portada de marketing; en el navegador la web sigue igual.
export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

// En desarrollo, ?app=1 permite ver el modo app sin instalar nada.
export const IS_APP_MODE = isStandalone() || (import.meta.env.DEV && new URLSearchParams(window.location.search).get('app') === '1');

if (IS_APP_MODE) document.documentElement.classList.add('is-app-mode');
