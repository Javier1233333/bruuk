import { useEffect, useState, type ReactNode } from 'react';
import { ArrowRight, Dices, Download, EllipsisVertical, Globe, Plus, Radio, Share, SquarePlus, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { isStandalone } from '../lib/appMode';
import './InstallAppPrompt.css';

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> };
type Platform = 'ios' | 'android';

const DISMISS_KEY = 'bruuk-install-dismissed';
const DISMISS_DAYS = 30;
// Sólo en las portadas: en feeds y formularios estorbaría a las acciones de abajo.
const PROMPT_ROUTES = new Set(['/', '/guadalajara']);

const isIos = () => {
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
};

// Safari en iPhone/iPad no tiene botón de instalar: sólo "Compartir → Agregar a inicio".
const isIosSafari = () => isIos() && !/crios|fxios|edgios/i.test(navigator.userAgent);

// Desde Instagram, TikTok o Facebook no se puede instalar: primero hay que abrir el navegador.
const isInAppBrowser = () => /instagram|fban|fbav|tiktok|musical_ly|bytedance/i.test(navigator.userAgent);

// La guía completa es para teléfonos; en computadora la web se queda como siempre.
const isPhone = () => (isIos() || /android/i.test(navigator.userAgent)) && window.location.hostname !== 'museos.bruuk.space';

const wasDismissed = (key: string) => {
  try {
    const at = Number(window.localStorage.getItem(key));
    return Boolean(at) && Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
};

const rememberDismiss = (key: string) => {
  try {
    window.localStorage.setItem(key, String(Date.now()));
  } catch {
    // Sin almacenamiento: el aviso puede volver a salir en otra visita.
  }
};

const STEPS: Record<Platform, { icon: typeof Share; text: ReactNode }[]> = {
  ios: [
    { icon: Share, text: <>Toca <b>Compartir</b> en la barra de Safari. Si no lo ves, ábrelo desde el menú <b>⋯</b>.</> },
    { icon: SquarePlus, text: <>Desliza hacia abajo y elige <b>Agregar a inicio</b>.</> },
    { icon: Plus, text: <>Toca <b>Agregar</b> arriba a la derecha.</> },
    { icon: ArrowRight, text: <>Abre Bruuk desde el ícono en tu pantalla de inicio.</> },
  ],
  android: [
    { icon: EllipsisVertical, text: <>Toca el menú <b>⋮</b> de Chrome, arriba a la derecha.</> },
    { icon: Download, text: <>Elige <b>Instalar app</b> o <b>Agregar a pantalla principal</b>.</> },
    { icon: Plus, text: <>Confirma con <b>Instalar</b>.</> },
    { icon: ArrowRight, text: <>Abre Bruuk desde el ícono en tu pantalla de inicio.</> },
  ],
};

const APP_FEATURES = [
  { icon: Plus, title: 'Menú abajo', copy: 'Inicio, Rack, Plan y Radar a un toque, y el botón + para subir un spot.' },
  { icon: Dices, title: 'Ruleta de planes', copy: 'Gira entre todos los lugares de la guía y la IA encuentra qué los une.' },
  { icon: Radio, title: 'Sin buscar la página', copy: 'Se abre como cualquier app y guarda lo último que viste para cuando no tengas señal.' },
];

export function InstallAppPrompt() {
  const { pathname } = useLocation();
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [hidden, setHidden] = useState(() => isStandalone() || wasDismissed(DISMISS_KEY));
  // La guía sale cada vez que se abre Bruuk en el teléfono (no en los enlaces de los correos).
  const [showGuide, setShowGuide] = useState(() => !isStandalone() && isPhone() && window.location.pathname !== '/auth/action');
  // Si la persona acaba de cerrar la guía, el aviso chico espera a la siguiente visita.
  const [guideClosedNow, setGuideClosedNow] = useState(false);
  const [platform, setPlatform] = useState<Platform>(() => (isIos() ? 'ios' : 'android'));

  useEffect(() => {
    if (hidden && !showGuide) return;
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallEvent);
    };
    const onInstalled = () => {
      setHidden(true);
      setShowGuide(false);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    const iosTimer = isIosSafari() ? window.setTimeout(() => setShowIosHelp(true), 4000) : undefined;
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      window.clearTimeout(iosTimer);
    };
  }, [hidden, showGuide]);

  useEffect(() => {
    if (!showGuide) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [showGuide]);

  const install = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    setInstallEvent(null);
    if (outcome === 'accepted') {
      setHidden(true);
      setShowGuide(false);
    } else if (!showGuide) {
      dismiss();
    }
  };

  const dismiss = () => {
    rememberDismiss(DISMISS_KEY);
    setHidden(true);
  };

  const closeGuide = () => {
    setShowGuide(false);
    setGuideClosedNow(true);
  };

  if (showGuide) {
    const inAppBrowser = isInAppBrowser();
    return (
      <div className="install-guide" role="dialog" aria-modal="true" aria-labelledby="install-guide-title">
        <div className="install-guide-sheet">
          <header className="install-guide-top">
            <img src="/icons/icon-192.png" alt="" width="40" height="40" />
            <span>/ BRUUK EN TU INICIO</span>
            <button type="button" className="install-guide-close" onClick={closeGuide} aria-label="Cerrar y ver el sitio web"><X size={20} /></button>
          </header>

          <h2 id="install-guide-title">LLEVA BRUUK<br /><em>COMO APP.</em></h2>
          <p className="install-guide-lead">Agrégala a tu pantalla de inicio en menos de un minuto. No pasa por ninguna tienda y no ocupa casi espacio.</p>

          <ul className="install-guide-features">
            {APP_FEATURES.map(({ icon: Icon, title, copy }) => (
              <li key={title}><Icon size={18} aria-hidden="true" /><div><strong>{title}</strong><span>{copy}</span></div></li>
            ))}
          </ul>

          <section className="install-guide-steps" aria-labelledby="install-guide-steps-title">
            <div className="install-guide-steps-head">
              <h3 id="install-guide-steps-title">CÓMO AGREGARLA</h3>
              <div className="install-guide-platforms" role="tablist" aria-label="Tu teléfono">
                {(['ios', 'android'] as const).map((value) => (
                  <button key={value} type="button" role="tab" aria-selected={platform === value} className={platform === value ? 'is-active' : ''} onClick={() => setPlatform(value)}>
                    {value === 'ios' ? 'IPHONE' : 'ANDROID'}
                  </button>
                ))}
              </div>
            </div>

            {inAppBrowser && (
              <p className="install-guide-warning">
                Estás dentro de otra app (Instagram, TikTok…). Primero abre <b>bruuk.space</b> en {platform === 'ios' ? 'Safari' : 'Chrome'}: toca <b>⋯</b> y elige <b>Abrir en el navegador</b>.
              </p>
            )}

            <ol>
              {STEPS[platform].map(({ icon: Icon, text }, index) => (
                <li key={index}>
                  <b>{String(index + 1).padStart(2, '0')}</b>
                  <Icon size={18} aria-hidden="true" />
                  <p>{text}</p>
                </li>
              ))}
            </ol>
          </section>

          <div className="install-guide-actions">
            {installEvent && platform === 'android' && (
              <button type="button" className="install-guide-primary" onClick={() => void install()}>
                <Download size={18} aria-hidden="true" /> INSTALAR BRUUK
              </button>
            )}
            <button type="button" className="install-guide-web" onClick={closeGuide}>
              <Globe size={18} aria-hidden="true" /> SITIO WEB <ArrowRight size={16} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (hidden || guideClosedNow || !PROMPT_ROUTES.has(pathname) || (!installEvent && !showIosHelp)) return null;

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
