import { useEffect, useState } from 'react';
import { Plus, Share, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import './InstallAppPrompt.css';

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };

const DISMISS_KEY = 'bruuk-install-dismissed';
const DISMISS_DAYS = 30;
// Sólo en las portadas: en feeds y formularios estorbaría a las acciones de abajo.
const PROMPT_ROUTES = new Set(['/', '/guadalajara']);

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;

// Safari en iPhone/iPad no tiene botón de instalar: sólo "Compartir → Agregar a inicio".
const isIosSafari = () => {
  const ua = navigator.userAgent;
  const iOS = /iphone|ipad|ipod/i.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
  return iOS && !/crios|fxios|edgios/i.test(ua);
};

const wasDismissed = () => {
  try {
    const at = Number(window.localStorage.getItem(DISMISS_KEY));
    return Boolean(at) && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
};

const rememberDismiss = () => {
  try {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // Sin almacenamiento: el aviso puede volver a salir en otra visita.
  }
};

export function InstallAppPrompt() {
  const { pathname } = useLocation();
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [hidden, setHidden] = useState(() => isStandalone() || wasDismissed());

  useEffect(() => {
    if (hidden) return;
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
    };
    const onInstalled = () => setHidden(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    const iosTimer = isIosSafari() ? window.setTimeout(() => setShowIosHelp(true), 4000) : undefined;
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      window.clearTimeout(iosTimer);
    };
  }, [hidden]);

  if (hidden || !PROMPT_ROUTES.has(pathname) || (!installEvent && !showIosHelp)) return null;

  const dismiss = () => {
    rememberDismiss();
    setHidden(true);
  };

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    setInstallEvent(null);
    if (outcome === 'accepted') setHidden(true);
    else dismiss();
  };

  return (
    <aside className="install-app" role="dialog" aria-label="Agregar Bruuk a tu pantalla de inicio">
      <img src="/icons/icon-192.png" alt="" width="44" height="44" />
      <div className="install-app-copy">
        <strong>Lleva Bruuk en tu inicio</strong>
        {installEvent ? (
          <span>Ábrelo como app, sin buscar la página.</span>
        ) : (
          <span>
            Toca <Share size={14} aria-label="Compartir" /> y luego <b><Plus size={13} aria-hidden="true" /> Agregar a inicio</b>.
          </span>
        )}
      </div>
      {installEvent && <button type="button" className="install-app-action" onClick={() => void install()}>AGREGAR</button>}
      <button type="button" className="install-app-close" onClick={dismiss} aria-label="Cerrar"><X size={18} /></button>
    </aside>
  );
}
