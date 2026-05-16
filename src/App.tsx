
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Globe, ArrowRight, Users, Compass } from 'lucide-react';
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
          <Link to="/login" className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 1.5rem' }}>
            Inicia sesión
          </Link>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-bg-glow"></div>
          <div className="container">
            <div className="animate-fade-in" style={{ marginBottom: '1.2rem', textAlign: 'center' }}>
              <span style={{
                fontSize: '0.9rem', fontWeight: 500, letterSpacing: '0.15em',
                color: 'var(--text-secondary)', textTransform: 'uppercase',
              }}>
                Más ciudades pronto
              </span>
            </div>
            <h1 className="animate-fade-in animate-glitch-loop brand-gradient-text glitch-hover" data-text="Guadalajara tiene más de lo que crees.">
              Guadalajara tiene<br />más de lo que crees.
            </h1>
            <p className="animate-fade-in delay-1">
              Planes curados para vivir la ciudad de verdad. Para los que vienen de visita y quieren ir más allá del itinerario. Para los que ya viven aquí y la olvidaron. Para los que quieren conocer gente real mientras la recorren.
            </p>
            <div className="hero-actions animate-fade-in delay-2">
              <button className="btn btn-primary" onClick={() => setIsComingSoonOpen(true)}>
                EXPLORAR PLANES <ArrowRight size={20} strokeWidth={3} />
              </button>
              <button className="btn btn-secondary" onClick={() => setIsManifestoOpen(true)}>
                POR QUÉ BRUUK
              </button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features">
          <div className="container">
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <h2 className="brand-gradient-text" style={{ fontSize: '3rem', letterSpacing: '-1px' }}>UNA CIUDAD, DESCUBIERTA DE VERDAD</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '1rem', fontSize: '1.2rem', maxWidth: '600px', margin: '1rem auto 0' }}>
                No guías de turista. No listas de influencers. Planes pensados para que te pierdas en lo bueno y encuentres personas en el camino.
              </p>
            </div>

            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <Sparkles size={28} color="#fff" />
                </div>
                <h3>Planes curados</h3>
                <p>Cada plan fue pensado para sacar lo mejor de Guadalajara: sus colonias, su comida, su música, su gente. Nada genérico, nada de lo que ya conoces.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <Users size={28} color="#fff" />
                </div>
                <h3>Planes con desconocidos</h3>
                <p>¿Vienes solo o quieres conocer gente nueva? Algunos planes están diseñados para hacerse con extraños que comparten el mismo interés. La ciudad es el pretexto, la conexión es el punto.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <Globe size={28} color="#fff" />
                </div>
                <h3>Para visitantes y locales</h3>
                <p>Si vienes de visita, te mostramos la Guadalajara que los tapatíos quieren que veas. Si ya vives aquí, te apostamos que hay rincones que todavía no conoces.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <Compass size={28} color="#fff" />
                </div>
                <h3>Más ciudades en camino</h3>
                <p>Guadalajara es el inicio. BRUUK está construyendo lo mismo para Ciudad de México, Monterrey, Oaxaca y más. Cada ciudad, descubierta de manera auténtica.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Nosotros Section */}
        <section className="nosotros">
          <div className="container">
            <div className="nos-intro">
              <span className="nos-tag">/ Por qué existe esto</span>
              <p className="nos-big">Viniste a Guadalajara.<br />Viste lo mismo que todos.<br />Bruuk nació para eso.</p>
            </div>

            <div className="nos-layout">
              <div className="nos-story">
                <p>Hay una versión de Guadalajara que no sale en TripAdvisor. Que no aparece en los reels. Que solo conocen los que saben preguntar a las personas correctas.</p>
                <p>Nosotros la mapeamos, la destilamos y la convertimos en planes concretos para que cualquiera pueda vivirla, sin importar si llegas hoy o llevas años aquí.</p>
                <p>Y si quieres vivirla con alguien, también. <strong>Algunos de nuestros mejores planes están diseñados para hacerse con desconocidos que se vuelven conocidos.</strong> Esa es la magia.</p>
              </div>
            </div>

            <div className="nos-closing">
              <span>Bruuk es la bruújula.</span>
              <span>Los planes son el pretexto.</span>
              <span>La conexión es el destino.</span>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="newsletter">
          <div className="container">
            <div className="newsletter-wrapper">
              <div className="newsletter-content">
                <h2 className="glitch-hover">GUADALAJARA TE ESPERA</h2>
                <p>Acceso anticipado a los primeros planes curados de BRUUK. Sé parte de la comunidad que está redescubriendo la ciudad.</p>
                <div className="newsletter-form" style={{ justifyContent: 'center' }}>
                  <button className="btn btn-primary" onClick={handleJoin}>
                    QUIERO EXPLORAR <ArrowRight size={20} strokeWidth={3} />
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
