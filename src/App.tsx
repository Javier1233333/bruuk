
import { useState } from 'react';
import { Sparkles, Map, Globe, ArrowRight } from 'lucide-react';
import { ManifestoModal } from './components/ManifestoModal';
import { ComingSoonModal } from './components/ComingSoonModal';
import { RegistrationModal } from './components/RegistrationModal';
// import { PhotoCarousel } from './components/PhotoCarousel';
import { BruukLogo } from './components/BruukLogo';
import './App.css';

function App() {
  const [isComingSoonOpen, setIsComingSoonOpen] = useState(false);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isManifestoOpen, setIsManifestoOpen] = useState(false);

  const handleJoin = () => {
    setIsComingSoonOpen(false);
    setIsRegistrationOpen(true);
  };

  return (
    <div className="app-wrapper">
      <header className="header">
        <div className="container">
          <div className="logo">
            <BruukLogo />
          </div>
          <button className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 1.5rem' }} onClick={() => setIsComingSoonOpen(true)}>
            Inicia sesión
          </button>
        </div>
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
              {/* <PhotoCarousel /> */}
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
