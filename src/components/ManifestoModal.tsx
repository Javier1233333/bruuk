import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import './ManifestoModal.css';

interface ManifestoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ManifestoModal({ isOpen, onClose }: ManifestoModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'Tab') {
        event.preventDefault();
        closeButtonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="manifesto-modal-overlay" onClick={onClose} role="presentation">
      <div
        className="manifesto-modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="manifesto-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button ref={closeButtonRef} className="manifesto-close-btn" onClick={onClose} aria-label="Cerrar manifiesto">
          <X size={32} />
        </button>

        <div className="manifesto-modal-bg-text">BRUUK</div>
        
        <div className="manifesto-modal-inner">
          <h2 id="manifesto-modal-title" className="manifesto-lead">
            Creemos que la vida ocurre fuera de la pantalla.
          </h2>
          
          <div className="manifesto-block">
            <p className="manifesto-text">En conversaciones con desconocidos,</p>
            <p className="manifesto-text">en un café improvisado,</p>
            <p className="manifesto-text">en caminar sin rumbo por la ciudad.</p>
          </div>

          <div className="manifesto-block manifesto-rotate-right">
            <p className="manifesto-text bold">BRUUK existe para conectar personas a través de experiencias reales.</p>
            <p className="manifesto-text">Para redescubrir lugares, compartir momentos y conocer gente nueva.</p>
            <br />
            <p className="manifesto-text accent-bold">No somos solo una app.</p>
            <p className="manifesto-text">Somos una comunidad que cree en vivir más y scrollear menos.</p>
          </div>

          <ul className="manifesto-list">
            <li>Cada encuentro es una historia que empieza.</li>
            <li>Cada ciudad es un mapa por descubrir.</li>
            <li>Cada persona puede proponer un plan.</li>
            <li>Cada plan puede convertirse en una conexión.</li>
            <li>Y cada conexión puede cambiar tu día.</li>
          </ul>

          <div className="manifesto-conclusion glitch-hover">
            <span>Menos pantalla.</span>
            Más mundo.
          </div>
        </div>
      </div>
    </div>
  );
}
