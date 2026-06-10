import { useNavigate } from 'react-router-dom';
import { BruukLogo } from '../components/BruukLogo';
import rackLogo from '../../img/rack-logo.png';
import './rack.css';
import './RackLanding.css';

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

      {/* ── HERO ── */}
      <section className="rack-landing__hero">
        <span className="rack-landing__hero-tag">/ NUEVO</span>

        <img
          src={rackLogo}
          alt="RACK."
          className="rack-landing__hero-logo"
        />

        <p className="rack-landing__hero-subtitle">
          Piezas con historia. Hechas a mano o con segunda vida.
        </p>

        <div className="rack-landing__hero-line" aria-hidden="true" />

        <button
          className="rack-landing__hero-cta"
          onClick={() => navigate('/rack/explorar')}
        >
          ENTRAR
        </button>
      </section>

      {/* ── INFO BAR ── */}
      <div className="rack-landing__info-bar" role="complementary" aria-label="Información de Rack">
        <span className="rack-landing__info-bar-text">PRE-OWNED + ARTESANAL</span>
        <span className="rack-landing__info-bar-text">GDL, MX</span>
      </div>

      {/* ── SELL / COMUNIDAD ── */}
      <section className="rack-landing__sell">
        <span className="rack-landing__sell-eyebrow">/ COMUNIDAD</span>

        <h2 className="rack-landing__sell-title">
          Somos comunidad.
          <span className="rack-landing__sell-title--accent">
            Quieres vender tus cosas. Dale segunda vida a tus cosas con RACK. de bruuk.
          </span>
        </h2>

        <div className="rack-landing__sell-line" aria-hidden="true" />

        <button
          className="rack-landing__sell-cta"
          onClick={() => {
            // TODO: navegar a /rack/vender cuando exista la ruta
          }}
        >
          VENDER
        </button>
      </section>
    </div>
  );
}
