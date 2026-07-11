import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Menu, X } from 'lucide-react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { BruukLogo } from './BruukLogo';
import { RegistrationModal } from './RegistrationModal';
import './MarketingLayout.css';

const marketingLinks = [
  { label: 'Inicio', to: '/', end: true },
  { label: 'Descubre', to: '/explora', end: false },
] as const;

export function MarketingLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const location = useLocation();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const scrollToLocation = () => {
      setIsMenuOpen(false);
      if (location.hash) {
        const target = document.getElementById(location.hash.slice(1));
        target?.scrollIntoView({ block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    };

    const frame = window.requestAnimationFrame(scrollToLocation);
    const retry = window.setTimeout(scrollToLocation, 120);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(retry);
    };
  }, [location.hash, location.pathname]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const previouslyFocused = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const menuButton = menuButtonRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsMenuOpen(false);
        return;
      }

      if (event.key !== 'Tab' || !mobileMenuRef.current) return;

      const focusable = Array.from(
        mobileMenuRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    window.requestAnimationFrame(() => {
      mobileMenuRef.current?.querySelector<HTMLElement>('a[href]')?.focus();
    });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      (previouslyFocused ?? menuButton)?.focus();
    };
  }, [isMenuOpen]);

  const openRegistration = () => {
    setIsMenuOpen(false);
    window.requestAnimationFrame(() => setIsRegistrationOpen(true));
  };

  return (
    <div className="marketing-shell">
      <header className="marketing-header">
        <div className="marketing-header__inner">
          <Link className="marketing-brand" to="/" aria-label="Bruuk, ir al inicio">
            <BruukLogo width={146} />
          </Link>

          <nav className="marketing-nav" aria-label="Navegación principal">
            {marketingLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `marketing-nav__link ${isActive ? 'is-active' : ''}`}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="marketing-header__actions">
            <button className="marketing-register" type="button" onClick={openRegistration}>
              Registro anticipado
            </button>
            <Link className="marketing-explore" to="/descubrir">
              Explorar <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>

          <button
            ref={menuButtonRef}
            className="marketing-menu-toggle"
            type="button"
            aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={isMenuOpen}
            aria-controls="marketing-mobile-menu"
            onClick={() => setIsMenuOpen(open => !open)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {isMenuOpen && (
        <>
          <button
            type="button"
            className="marketing-menu-backdrop"
            aria-label="Cerrar menú"
            onClick={() => setIsMenuOpen(false)}
          />
          <nav
            ref={mobileMenuRef}
            id="marketing-mobile-menu"
            className="marketing-mobile-menu"
            aria-label="Navegación móvil"
          >
            {marketingLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) => `marketing-mobile-menu__link ${isActive ? 'is-active' : ''}`}
              >
                {link.label}
              </NavLink>
            ))}
            <div className="marketing-mobile-menu__divider" />
            <button className="marketing-mobile-menu__register" type="button" onClick={openRegistration}>
              Registro anticipado
            </button>
            <Link className="marketing-mobile-menu__cta" to="/descubrir">
              Explorar ahora <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </nav>
        </>
      )}

      <div className="marketing-page">
        <Outlet />
      </div>

      <footer className="marketing-footer">
        <div className="marketing-footer__inner">
          <Link to="/" aria-label="Bruuk, ir al inicio">
            <BruukLogo width={118} />
          </Link>
          <p>© {new Date().getFullYear()} Bruuk. Menos pantalla. Más mundo.</p>
          <div className="marketing-footer__links">
            <Link to="/explora">Descubre</Link>
            <button type="button" onClick={openRegistration}>Registro anticipado</button>
          </div>
        </div>
      </footer>

      <RegistrationModal
        isOpen={isRegistrationOpen}
        onClose={() => setIsRegistrationOpen(false)}
      />
    </div>
  );
}
