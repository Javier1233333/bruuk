import { ArrowRight, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import './RadarPromo.css';

type RadarPromoProps = {
  onJoin: () => void;
  variant?: 'default' | 'rack';
};

export function RadarPromo({ onJoin, variant = 'default' }: RadarPromoProps) {
  if (variant === 'rack') {
    return (
      <article className="radar-promo-rack" aria-label="Abrir Señales de Radar Bruuk">
        <div className="radar-promo-rack__visual">
          <div className="radar-promo-rack__visual-top"><span>SEÑAL ENTRANTE</span><span>RADAR / BRUUK</span></div>
          <strong>S</strong>
          <Radio aria-hidden="true" />
          <span className="radar-promo-rack__signal">COMUNIDAD ACTIVA · GDL</span>
        </div>
        <div className="radar-promo-rack__copy">
          <div className="radar-promo-rack__meta"><span><Radio size={14} aria-hidden="true" /> / SEÑALES DE RADAR</span><span>NO ES UN SPOT</span></div>
          <h2>LO QUE ESTÁ POR PASAR NO CABE EN UNA TARJETA.</h2>
          <p>Planes, eventos, aperturas y cosas que pasarán en la ciudad, compartidas por una comunidad activa.</p>
          <div className="radar-promo-rack__actions">
            <Link to="/guadalajara/senales">ENTRAR A SEÑALES <ArrowRight size={17} aria-hidden="true" /></Link>
            <button type="button" onClick={onJoin}>RECIBIR NOVEDADES</button>
          </div>
          <span className="radar-promo-rack__hint">DESLIZA PARA SEGUIR EXPLORANDO ↓</span>
        </div>
      </article>
    );
  }

  return (
    <article className="radar-promo" aria-label="Abrir Señales de Radar Bruuk">
      <span className="radar-promo__eyebrow"><Radio size={15} aria-hidden="true" /> SEÑALES DE RADAR</span>
      <h2>LO QUE ESTÁ POR PASAR NO CABE EN UNA TARJETA.</h2>
      <p>Planes, eventos y cosas que pasarán en la ciudad, compartidas por una comunidad activa.</p>
      <Link to="/guadalajara/senales">ENTRAR A SEÑALES <ArrowRight size={17} aria-hidden="true" /></Link>
      <button className="radar-promo__secondary" type="button" onClick={onJoin}>RECIBIR NOVEDADES</button>
      <span className="radar-promo__hint">DESLIZA PARA SEGUIR EXPLORANDO</span>
    </article>
  );
}
