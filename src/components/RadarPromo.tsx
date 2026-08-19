import { ArrowRight, Radio } from 'lucide-react';
import './RadarPromo.css';

type RadarPromoProps = {
  onJoin: () => void;
  variant?: 'default' | 'rack';
};

export function RadarPromo({ onJoin, variant = 'default' }: RadarPromoProps) {
  if (variant === 'rack') {
    return (
      <article className="radar-promo-rack" aria-label="Únete al Radar de Bruuk">
        <div className="radar-promo-rack__visual">
          <div className="radar-promo-rack__visual-top"><span>INTERRUPCIÓN 01</span><span>RADAR / BRUUK</span></div>
          <strong>R</strong>
          <Radio aria-hidden="true" />
          <span className="radar-promo-rack__signal">SEÑAL ABIERTA · GDL</span>
        </div>
        <div className="radar-promo-rack__copy">
          <div className="radar-promo-rack__meta"><span><Radio size={14} aria-hidden="true" /> / RADAR BRUUK</span><span>NO ES UN SPOT</span></div>
          <h2>LO QUE SIGUE NO SIEMPRE SALE EN EL FEED.</h2>
          <p>Únete a la comunidad y recibe nuevos spots, hallazgos y planes antes de que aparezcan aquí.</p>
          <button type="button" onClick={onJoin}>UNIRME AL RADAR <ArrowRight size={17} aria-hidden="true" /></button>
          <span className="radar-promo-rack__hint">DESLIZA PARA SEGUIR EXPLORANDO ↓</span>
        </div>
      </article>
    );
  }

  return (
    <article className="radar-promo" aria-label="Únete al Radar de Bruuk">
      <span className="radar-promo__eyebrow"><Radio size={15} aria-hidden="true" /> RADAR BRUUK</span>
      <h2>LO QUE SIGUE NO SIEMPRE SALE EN EL FEED.</h2>
      <p>Únete a la comunidad y recibe nuevos spots, hallazgos y planes antes que nadie.</p>
      <button type="button" onClick={onJoin}>UNIRME AL RADAR <ArrowRight size={17} aria-hidden="true" /></button>
      <span className="radar-promo__hint">DESLIZA PARA SEGUIR EXPLORANDO</span>
    </article>
  );
}
