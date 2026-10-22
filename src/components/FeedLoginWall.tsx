import { ArrowRight, UserRound } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { FREE_SPOTS } from '../lib/appSession';
import './FeedLoginWall.css';

// Fin del feed sin sesión en la web: después de FREE_SPOTS spots pide iniciar sesión.
// Las clases radar-promo* vienen del antiguo anuncio de Radar, que reemplazó.
export function FeedLoginWall({ variant = 'default' }: { variant?: 'default' | 'rack' }) {
  const { pathname, search } = useLocation();
  const next = encodeURIComponent(pathname + search);
  const login = `/login?next=${next}`;
  const signup = `/login?modo=crear&next=${next}`;

  if (variant === 'rack') {
    return (
      <article className="radar-promo-rack" aria-label="Inicia sesión en Bruuk">
        <div className="radar-promo-rack__visual">
          <div className="radar-promo-rack__visual-top"><span>TU CUENTA</span><span>BRUUK / GDL</span></div>
          <strong>B</strong>
          <UserRound aria-hidden="true" />
          <span className="radar-promo-rack__signal">GRATIS · MENOS DE UN MINUTO</span>
        </div>
        <div className="radar-promo-rack__copy">
          <div className="radar-promo-rack__meta"><span><UserRound size={14} aria-hidden="true" /> / CUENTA BRUUK</span><span>NO ES UN SPOT</span></div>
          <h2>¿TE ESTÁ GUSTANDO? ENTRA A BRUUK.</h2>
          <p>Ya viste tus {FREE_SPOTS} spots de prueba. Inicia sesión o crea tu cuenta gratis con tu correo o con Google para ver todos.</p>
          <div className="radar-promo-rack__actions">
            <Link to={login}>INICIAR SESIÓN <ArrowRight size={17} aria-hidden="true" /></Link>
            <Link to={signup} className="radar-promo-rack__secondary">CREAR CUENTA</Link>
          </div>
          <span className="radar-promo-rack__hint">ENTRA PARA SEGUIR VIENDO SPOTS</span>
        </div>
      </article>
    );
  }

  return (
    <article className="radar-promo" aria-label="Inicia sesión en Bruuk">
      <span className="radar-promo__eyebrow"><UserRound size={15} aria-hidden="true" /> TU CUENTA BRUUK</span>
      <h2>¿TE ESTÁ GUSTANDO? ENTRA A BRUUK.</h2>
      <p>Ya viste tus {FREE_SPOTS} spots de prueba. Inicia sesión o crea tu cuenta gratis para ver todos. Toma menos de un minuto.</p>
      <Link to={login}>INICIAR SESIÓN <ArrowRight size={17} aria-hidden="true" /></Link>
      <Link to={signup} className="radar-promo__secondary">CREAR CUENTA</Link>
      <span className="radar-promo__hint">ENTRA PARA SEGUIR VIENDO SPOTS</span>
    </article>
  );
}
