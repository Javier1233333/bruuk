import { useNavigate } from 'react-router-dom';
import { ArrowDown, ArrowRight } from 'lucide-react';
import { BruukLogo } from '../components/BruukLogo';
import rackLogo from '../../img/rack-logo.png';
import './rack.css';
import './RackLanding.css';

/* Fotos de curaduría — placeholders de Unsplash.
   Reemplazar por fotos reales de piezas destacadas cuando existan. */
const CURATED = [
  {
    src: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=900&q=80',
    alt: 'Chamarra vintage de piel',
    label: 'Chamarra vintage',
    tag: 'Pre-owned',
    tagClass: 'preowned',
  },
  {
    src: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=700&q=80',
    alt: 'Cerámica artesanal hecha a mano',
    label: 'Cerámica artesanal',
    tag: 'Hecho a mano',
    tagClass: 'artesanal',
  },
  {
    src: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=700&q=80',
    alt: 'Rack de ropa con piezas curadas',
    label: 'Curaduría semanal',
    tag: 'Drops',
    tagClass: 'drops',
  },
];

export function RackLanding() {
  const navigate = useNavigate();

  return (
    <div className="rack-landing">
      {/* ── HEADER ── */}
      <header className="rack-landing__header">
        <div className="rack-landing__header-logo">
          <BruukLogo width={100} />
        </div>
        <button className="rack-landing__header-menu" aria-label="Abrir menú">
          MENÚ
        </button>
      </header>

      {/* ── BLOQUE 1 · HERO (comprar) ── */}
      <section className="rack-landing__hero">
        <div className="rack-landing__hero-inner">
          <span className="rack-landing__hero-micro">
            Pre-owned + Artesanal · GDL, MX
          </span>

          <img
            src={rackLogo}
            alt="RACK."
            className="rack-landing__hero-logo"
          />

          <p className="rack-landing__hero-subtitle">
            Piezas con historia. Hechas a mano o de segunda vida.
          </p>

          <button
            className="rack-landing__hero-cta"
            onClick={() => navigate('/rack/explorar')}
          >
            EXPLORAR RACK <ArrowRight size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div className="rack-landing__scroll" aria-hidden="true">
          <div className="rack-landing__scroll-line" />
          <ArrowDown size={13} strokeWidth={2} />
        </div>
      </section>

      {/* ── BLOQUE 2 · GANCHO VISUAL (curaduría) ── */}
      <section className="rack-landing__curated">
        <div className="rack-landing__section-inner">
          <span className="rack-landing__eyebrow">/ CURADURÍA</span>
          <h2 className="rack-landing__curated-title">
            Cada pieza, elegida a mano.
          </h2>

          <div className="rack-landing__curated-grid">
            {CURATED.map((item, i) => (
              <button
                key={item.label}
                className={`rack-landing__curated-item rack-landing__curated-item--${i + 1}`}
                onClick={() => navigate('/rack/explorar')}
                aria-label={`Ver ${item.label} en el catálogo`}
              >
                <img src={item.src} alt={item.alt} loading="lazy" />
                <span
                  className={`rack-landing__curated-tag rack-landing__curated-tag--${item.tagClass}`}
                >
                  {item.tag}
                </span>
                <span className="rack-landing__curated-label">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── BLOQUE 3 · COMUNIDAD (vender) ── */}
      <section className="rack-landing__sell">
        <div className="rack-landing__section-inner">
          <span className="rack-landing__eyebrow">/ COMUNIDAD</span>

          <h2 className="rack-landing__sell-title">
            Dale una segunda vida<br />a tu clóset.
          </h2>

          <p className="rack-landing__sell-text">
            ¿Tienes piezas únicas hechas a mano o que ya no usas?
            Súmalas a nuestra comunidad.
          </p>

          <button
            className="rack-landing__sell-cta"
            onClick={() => {
              // TODO: navegar a /rack/vender cuando exista la ruta
            }}
          >
            EMPEZAR A VENDER
          </button>
        </div>
      </section>

      {/* ── FOOTER MINIMALISTA ── */}
      <footer className="rack-landing__footer">
        <span>RACK. POR BRUUK</span>
        <span>PRE-OWNED + ARTESANAL · GDL, MX</span>
      </footer>
    </div>
  );
}
