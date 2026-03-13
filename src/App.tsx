import React, { useState } from 'react';
import { Sparkles, Map, Globe, ArrowRight } from 'lucide-react';
import { RegistrationModal } from './components/RegistrationModal';
import { ManifestoModal } from './components/ManifestoModal';
import { BruukLogo } from './components/BruukLogo';
import './App.css';

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManifestoOpen, setIsManifestoOpen] = useState(false);

  return (
    <div className="app-wrapper">
      <header className="header">
        <div className="container">
          <div className="logo">
            <BruukLogo />
          </div>
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
              BRUKK no es solo una app. Es una comunidad para quienes creen en vivir más y scrollear menos. Conecta con personas, improvisa planes reales y redescubre tu ciudad.
            </p>
            <div className="hero-actions animate-fade-in delay-2">
              <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
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
                  <Globe size={28} color="#fff" />
                </div>
                <h3>Exploración Pura</h3>
                <p>Descubre lugares auténticos recomendados por la gente, no por algoritmos que quieren retenerte en la pantalla.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <Sparkles size={28} color="#fff" />
                </div>
                <h3>Rompe el Guion</h3>
                <p>Lanza un plan al aire y deja que la espontaneidad organice tu día. Desde un café hasta caminar la ciudad sin rumbo.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <Map size={28} color="#fff" />
                </div>
                <h3>El mapa es la gente</h3>
                <p>Navega a través de historias reales y conexiones humanas. Una ciudad no es un listado de puntos turísticos, es su comunidad.</p>
              </div>
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
                  <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    OBTÉN TU INVITACIÓN <ArrowRight size={20} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <p style={{ fontWeight: 'bold' }}>BRUKK</p>
          <p>&copy; {new Date().getFullYear()} bruuk. No sigas las reglas.</p>
        </div>
      </footer>

      {/* Modal de Registro con Preguntas */}
      <RegistrationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Modal del Manifiesto */}
      <ManifestoModal
        isOpen={isManifestoOpen}
        onClose={() => setIsManifestoOpen(false)}
      />
    </div>
  );
}

export default App;
