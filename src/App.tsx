import { useState } from 'react';
import { Sparkles, Map, Globe, ArrowRight, Compass, Smartphone, Menu, X } from 'lucide-react';
import { ManifestoModal } from './components/ManifestoModal';
import { ComingSoonModal } from './components/ComingSoonModal';
import { RegistrationModal } from './components/RegistrationModal';
import { BruukLogo } from './components/BruukLogo';
import { useNavigate } from 'react-router-dom';
import './App.css';

const NAV_LINKS = [
  { id: 'mar', label: 'El Mar' },
  { id: 'rack', label: 'Rack' },
  { id: 'app', label: 'La App' },
] as const;

function App() {
  const [isComingSoonOpen, setIsComingSoonOpen] = useState(false);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isManifestoOpen, setIsManifestoOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleJoin = () => {
    setIsComingSoonOpen(false);
    setIsRegistrationOpen(true);
  };

  const scrollToSection = (id: string) => {
    setIsMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="app-wrapper">
      <header className="header">
        <div className="container">
          <div className="logo">
            <BruukLogo />
          </div>

          <nav className="header-nav" aria-label="Secciones">
            {NAV_LINKS.map((link) => (
              <button key={link.id} className="header-nav__link" onClick={() => scrollToSection(link.id)}>
                {link.label}
              </button>
            ))}
          </nav>

          <div className="header-right">
            <button className="btn btn-secondary header-login" onClick={() => setIsComingSoonOpen(true)}>
              Inicia sesión
            </button>
            <button
              className="header-menu-toggle"
              onClick={() => setIsMenuOpen((open) => !open)}
              aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X size={26} /> : <Menu size={26} />}
            </button>
          </div>
        </div>

        {/* Menú móvil */}
        {isMenuOpen && (
          <nav className="header-mobile-menu animate-fade-in" aria-label="Secciones">
            {NAV_LINKS.map((link) => (
              <button key={link.id} className="header-mobile-menu__link" onClick={() => scrollToSection(link.id)}>
                {link.label} <ArrowRight size={16} strokeWidth={3} />
              </button>
            ))}
            <button
              className="header-mobile-menu__link header-mobile-menu__link--login"
              onClick={() => { setIsMenuOpen(false); setIsComingSoonOpen(true); }}
            >
              Inicia sesión
            </button>
          </nav>
        )}
      </header>

      <main>
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-bg-glow"></div>
          <div className="container">

            <h1 className="animate-fade-in animate-glitch-loop brand-gradient-text glitch-hover" data-text="Menos Pantalla. Más Mundo.">
              Menos Pantalla. <br /> Más Mundo.
            </h1>
            <p className="animate-fade-in delay-1">
              BRUUK no es solo una app. Es una comunidad para quienes creen en vivir más y scrollear menos. Conecta con personas, improvisa planes reales y redescubre tu ciudad.
            </p>
            <div className="hero-actions animate-fade-in delay-2">
              <button className="btn btn-primary" onClick={() => setIsComingSoonOpen(true)}>
                ACCESO VIP <ArrowRight size={20} strokeWidth={3} />
              </button>
              <button className="btn btn-secondary" onClick={() => setIsManifestoOpen(true)}>
                VER MANIFIESTO
              </button>
            </div>

          </div>
        </section>

        {/* Mar Interactivo Section */}
        <section id="mar" className="mar-section">
          <div className="mar-inner">
            <div className="mar-text">
              <span className="mar-eyebrow">Lista curada · Guadalajara</span>
              <h2 className="mar-title">Explora<br />el mar.</h2>
              <p className="mar-subtitle">Navega lo desconocido.</p>
            </div>
            <div className="mar-action">
              <p className="mar-sub">Nuestro mapa vivo de la ciudad: cafés, bares y rincones donde vale la pena aparecer, curados por la comunidad. Sin algoritmos, sin reseñas pagadas.</p>
              <button className="mar-cta" onClick={() => navigate('/descubrir')}>
                <Compass size={16} strokeWidth={2} />
                Descubrir spots
                <ArrowRight size={16} strokeWidth={2} />
              </button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features">
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <h2 className="brand-gradient-text" style={{ fontSize: '3rem', letterSpacing: '-1px' }}>HAZ QUE SUCEDA</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', fontSize: '1.2rem', maxWidth: '600px', margin: '1rem auto 0' }}>
                Tu teléfono es una herramienta para salir a la calle, no una cárcel. Te damos lo esencial para que dejes de planear y empieces a vivir.
              </p>
            </div>

            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <Sparkles size={28} color="#fff" />
                </div>
                <h3>Eventos Bruuk</h3>
                <p>Organizamos los primeros eventos exclusivos para la comunidad. Noches, experiencias y momentos que no encontrarás en ninguna app.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <Globe size={28} color="#fff" />
                </div>
                <h3>Lista de Asistentes</h3>
                <p>Antes de llegar, ya sabes quién va. Conecta con los asistentes, rompe el hielo y llega conociendo caras, no extraños.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <Map size={28} color="#fff" />
                </div>
                <h3>Acceso VIP Anticipado</h3>
                <p>Antes de lanzar la app, organizamos eventos reales para la comunidad fundadora. Regístrate y sé parte de los primeros encuentros Bruuk.</p>
              </div>
            </div>
          </div>
        </section>

        {/* RACK Section */}
        <section id="rack" className="rack-section">
          <div className="container">
            <div className="rack-inner">
              <span className="nos-tag">/ RACK</span>
              <h2 className="brand-gradient-text rack-title">PIEZAS CON HISTORIA.</h2>
              <p className="rack-subtitle">
                La tienda de la comunidad: moda pre-owned con segunda vida y artesanías locales hechas a mano. Cada pieza es única, tiene historia y un creador con nombre. Curado por Bruuk, desde Guadalajara.
              </p>
              <div className="rack-actions">
                <button className="btn btn-primary" onClick={() => navigate('/rack')}>
                  ENTRAR AL RACK <ArrowRight size={20} strokeWidth={3} />
                </button>
                <button className="btn btn-secondary" onClick={() => setIsComingSoonOpen(true)}>
                  VENDER TUS COSAS
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* La App Section */}
        <section id="app" className="app-section">
          <div className="container">
            <div className="app-inner">
              <div className="app-text">
                <span className="nos-tag">/ La App</span>
                <h2 className="brand-gradient-text app-title">TU PRETEXTO<br />PARA SALIR.</h2>
                <p className="app-subtitle">
                  La app de Bruuk está en construcción: planes improvisados, eventos de la comunidad
                  y la lista de quién va — todo pensado para sacarte de la pantalla, no para atraparte
                  en ella. Primero construimos la comunidad; los primeros en entrar serán quienes ya
                  viven los eventos.
                </p>
                <ul className="app-points">
                  <li><Smartphone size={18} strokeWidth={2.5} /> Propón un plan en segundos y mira quién se apunta</li>
                  <li><Globe size={18} strokeWidth={2.5} /> Eventos Bruuk con lista de asistentes real</li>
                  <li><Compass size={18} strokeWidth={2.5} /> El Mar y el Rack, integrados en tu bolsillo</li>
                </ul>
                <div className="app-actions">
                  <button className="btn btn-primary" onClick={() => setIsComingSoonOpen(true)}>
                    ACCESO VIP ANTICIPADO <ArrowRight size={20} strokeWidth={3} />
                  </button>
                  <button className="btn btn-secondary" onClick={() => setIsManifestoOpen(true)}>
                    VER MANIFIESTO
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Nosotros Section */}
        <section className="nosotros">
          <div className="container">
            <div className="nos-intro">
              <span className="nos-tag">/ Nosotros</span>
              <p className="nos-big">Salir era fácil.<br />Quedarse en casa, también.<br />Bruuk nació en el medio.</p>
            </div>

            <div className="nos-layout">
              <div className="nos-story">
                <p>Un grupo de amigos hartos de que los planes murieran en el chat. Hartos de ver contenido de vida en vez de vivirla. Hartos de que la tecnología nos prometiera conexión y nos diera scroll infinito.</p>
                <p>No tenemos inversores ni oficina bonita. Tenemos una convicción: <strong>las mejores cosas pasan cuando la gente se junta en persona.</strong> El resto es decoración.</p>
                <p>Bruuk no es una app todavía. Es primero una comunidad. Y antes de lanzar nada al mundo, queremos que los primeros eventos los vivan las personas que de verdad lo entienden.</p>
              </div>
            </div>

            <div className="nos-closing">
              <span>Bruuk es el puente.</span>
              <span>Los eventos son el pretexto.</span>
              <span>La comunidad es el punto.</span>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="newsletter">
          <div className="container">
            <div className="newsletter-wrapper">
              <div className="newsletter-content">
                <h2 className="glitch-hover">MENOS SCROLL, MÁS ACCIÓN</h2>
                <p>Únete a la resistencia. Regístrate antes del lanzamiento y descubre qué aventuras te esperan allá afuera.</p>
                <div className="newsletter-form" style={{ justifyContent: 'center' }}>
                  <button className="btn btn-primary" onClick={handleJoin}>
                    ÚNETE AL ACCESO VIP ANTICIPADO <ArrowRight size={20} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <p style={{ fontWeight: 'bold' }}>BRUUK</p>
          <p>&copy; {new Date().getFullYear()} bruuk. No sigas las reglas.</p>
        </div>
      </footer>

      <ComingSoonModal
        isOpen={isComingSoonOpen}
        onClose={() => setIsComingSoonOpen(false)}
        onJoin={handleJoin}
      />

      <RegistrationModal
        isOpen={isRegistrationOpen}
        onClose={() => setIsRegistrationOpen(false)}
      />

      <ManifestoModal
        isOpen={isManifestoOpen}
        onClose={() => setIsManifestoOpen(false)}
      />
    </div>
  );
}

export default App;
