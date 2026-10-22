import { useEffect, useState } from 'react';
import { Check, Share, Share2 } from 'lucide-react';
import './ShareButton.css';

type ShareButtonProps = {
  title: string;
  text: string;
  // Ruta dentro de Bruuk, p. ej. /guadalajara/spots?spot=123
  path: string;
  className?: string;
  tabIndex?: number;
};

// iPhone usa su propio ícono de compartir; así se reconoce al instante
const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);

// En el teléfono abre el menú de compartir del sistema; donde no existe, copia el enlace.
export function ShareButton({ title, text, path, className = '', tabIndex }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const Icon = copied ? Check : isIos ? Share : Share2;

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const share = async (event: React.MouseEvent) => {
    event.stopPropagation();
    const url = new URL(path, window.location.origin).href;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // La persona cerró el menú de compartir: no hay nada que hacer.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
    } catch {
      window.prompt('Copia el enlace:', url);
    }
  };

  return (
    <button type="button" className={`share-button ${className}`} onClick={(event) => void share(event)} tabIndex={tabIndex} aria-label={`Compartir ${title}`}>
      <Icon size={15} strokeWidth={2.4} aria-hidden="true" />
      <span aria-live="polite">{copied ? '¡Copiado!' : 'Compartir'}</span>
    </button>
  );
}
