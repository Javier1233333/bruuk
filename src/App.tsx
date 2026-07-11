import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Globe, ArrowRight, Users, Compass, MapPinned } from 'lucide-react';
import { ManifestoModal } from './components/ManifestoModal';
import { RegistrationModal } from './components/RegistrationModal';
import citiesData from './data/cities.json';
import './App.css';

function App() {
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isManifestoOpen, setIsManifestoOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="app-wrapper">
      <main>
        {/* Hero Section */}
        <section className="hero" id="inicio">
          <div className="hero-bg-glow"></div>
          <div className="container">
            <h1 className="animate-fade-in animate-glitch-loop brand-gradient-text glitch-hover" data-text="Menos Pantalla. Más Mundo.">
              Menos Pantalla. <br /> Más Mundo.
            </h1>
            <p className="animate-fade-in delay-1">
              Planes curados para vivir la ciudad de verdad. Para los que vienen de visita y quieren ir más allá del itinerario. Para los que ya viven aquí y la olvidaron. Para los que quieren conocer gente real mientras la recorren.
            </p>
            <div className="hero-actions animate-fade-in delay-2">
              <button className="btn btn-primary" onClick={() => navigate('/descubrir')}>
                EXPLORAR PLANES <ArrowRight size={20} strokeWidth={3} />
              </button>
              <button className="btn btn-secondary" onClick={() => setIsManifestoOpen(true)}>
                POR QUÉ BRUUK
              </button>
            </div>

          </div>
        </section>

        {/* Scroll Interactivo Section */}
        <section className="scroll-section">
          <div className="scroll-inner">
            <div className="scroll-text">
              <span className="scroll-eyebrow">Rincones locales · Sin algoritmos</span>
              <h2 className="scroll-title">Explora<br />la ciudad.</h2>
              <p className="scroll-subtitle">Desliza sin algoritmos.</p>
            </div>
            <div className="scroll-action">
              <p className="scroll-sub">Cafés, bares y rincones donde vale la pena aparecer. Sin algoritmos.</p>
              
              <div className="home-city-selector">
                {citiesData.map(c => (
                  <button
                    key={c.id}
                    className="home-city-btn"
                    onClick={() => navigate(`/descubrir/${c.id}`)}
                    style={{ '--btn-accent': c.accentColor } as React.CSSProperties}
                  >
                    {c.name}
                    <ArrowRight size={14} />
                  </button>
                ))}
                <button
                  className="home-city-btn home-city-btn--all"
                  onClick={() => navigate('/descubrir')}
                >
                  <Compass size={14} /> Elige ciudad
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* App Product Teaser */}
        <section className="home-app-teaser" aria-labelledby="home-app-title">
          <div className="container home-app-teaser__layout">
            <div className="home-app-teaser__content">
              <span className="home-app-teaser__eyebrow">/ Descubre Bruuk</span>
              <h2 id="home-app-title">TU PRÓXIMA SALIDA EMPIEZA AQUÍ.</h2>
              <p>
                Descubre lugares, experiencias y personas que sí quieren salir. Una forma distinta de dejar de guardar planes y empezar a vivirlos.
              </p>
              <Link className="btn btn-primary" to="/explora">
                CONOCE LA APP <ArrowRight size={20} strokeWidth={3} />
              </Link>
            </div>

            <div className="home-app-teaser__preview" aria-hidden="true">
              <div className="home-app-teaser__preview-header">
                <span>BRUUK / EXPLORA</span>
                <Compass size={20} />
              </div>
              <div className="home-app-teaser__preview-card home-app-teaser__preview-card--primary">
                <MapPinned size={26} />
                <span>Lugares que valen la vuelta</span>
              </div>
              <div className="home-app-teaser__preview-card">
                <Sparkles size={26} />
                <span>Experiencias que sí pasan</span>
              </div>
              <div className="home-app-teaser__preview-card">
                <Users size={26} />
                <span>Gente real, fuera de la pantalla</span>
              </div>
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
                <p>Cada plan fue pensado para sacar lo mejor de cada ciudad: sus barrios, su comida, su música, su gente. Nada genérico, nada de lo que ya conoces.</p>
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
                <p>Si vienes de visita, te mostramos la ciudad que sus locales quieren que veas. Si ya vives ahí, te apostamos que todavía guarda rincones que no conoces.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <Compass size={28} color="#fff" />
                </div>
                <h3>Más ciudades en camino</h3>
                <p>Las primeras ciudades son solo el inicio. BRUUK está trazando nuevas rutas para llegar a más lugares. Cada ciudad, descubierta de manera auténtica.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="newsletter">
          <div className="container">
            <div className="newsletter-wrapper">
              <div className="newsletter-content">
                <h2 className="glitch-hover">TU CIUDAD TE ESPERA</h2>
                <p>Acceso anticipado a nuevas rutas, planes y experiencias de BRUUK. Sé parte de una comunidad que está redescubriendo sus ciudades.</p>
                <div className="newsletter-form newsletter-actions">
                  <button className="btn btn-primary" onClick={() => navigate('/descubrir')}>
                    QUIERO EXPLORAR <ArrowRight size={20} strokeWidth={3} />
                  </button>
                  <button className="btn newsletter-community" onClick={() => setIsRegistrationOpen(true)}>
                    ÚNETE A LA COMUNIDAD
                  </button>
                </div>
               
              </div>
            </div>
          </div>
        </section>
      </main>

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
