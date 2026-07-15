import { useState } from 'react';
import { ArrowRight, Compass, Heart, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RegistrationModal } from '../components/RegistrationModal';
import { ManifestoModal } from '../components/ManifestoModal';

// Import local images from the img folder at the root
import bruuk1 from '../../img/bruukcarrusel1.JPG';
import bruuk2 from '../../img/bruukcarrusel2.JPG';
import bruuk3 from '../../img/bruukcarrusel3.JPG';

import './NosotrosPage.css';

export function NosotrosPage() {
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [isManifestoOpen, setIsManifestoOpen] = useState(false);

  return (
    <div className="nosotros-page">
      <main>
        {/* Hero Section */}
        <section className="hero">
          <div className="hero-bg-glow"></div>
          <div className="container">
            <h1 className="animate-fade-in animate-glitch-loop brand-gradient-text glitch-hover" data-text="Menos Pantalla. Más Mundo.">
              Menos Pantalla. <br /> Más Mundo.
            </h1>
            <p className="animate-fade-in delay-1">
              Planes curados para vivir la ciudad de verdad. Para los que vienen de visita y quieren ir más allá del itinerario. Para los que ya viven aquí y la olvidaron. Para los que quieren conocer gente real mientras la recorren.
            </p>
            <div className="hero-actions animate-fade-in delay-2">
              <Link className="btn btn-primary" to="/descubrir">
                EXPLORAR PLANES <ArrowRight size={20} strokeWidth={3} />
              </Link>
              <button className="btn btn-secondary" onClick={() => setIsManifestoOpen(true)}>
                POR QUÉ BRUUK
              </button>
            </div>
          </div>
        </section>

        {/* Story Section 1: The Problem */}
        <section className="nosotros-story-section">
          <div className="nosotros-container nosotros-grid">
            <div className="nosotros-story__content">
              <span className="story-number">01 / El Origen</span>
              <h2>EL ANTÍDOTO AL ALGORITMO.</h2>
              <p>
                BRUUK nació de una observación simple pero alarmante: pasamos más de 7 horas al día interactuando con pantallas, consumiendo itinerarios prefabricados y coleccionando planes en carpetas que nunca abrimos, mientras la ciudad real y sus personas suceden afuera.
              </p>
              <p>
                Nos dimos cuenta de que la tecnología, en lugar de conectarnos con nuestro entorno, nos estaba aislando en burbujas digitales. Queríamos crear algo diferente: un puente, no una barrera. Una herramienta para apagar la pantalla y encender la vida.
              </p>
            </div>
            <div className="nosotros-story__visual">
              <div className="visual-card-wrapper">
                <img src={bruuk1} alt="Explorando rincones locales con Bruuk" />
                <div className="visual-card-badge">BRUUK / ORIGEN</div>
              </div>
            </div>
          </div>
        </section>

        {/* Story Section 2: The Philosophy */}
        <section className="nosotros-story-section nosotros-story-section--reverse">
          <div className="nosotros-container nosotros-grid">
            <div className="nosotros-story__content">
              <span className="story-number">02 / El Propósito</span>
              <h2>LA CIUDAD COMO ESCENARIO, LA CONEXIÓN COMO FIN.</h2>
              <p>
                No somos una red social más, ni un catálogo de recomendación turística tradicional. Creemos que los mejores momentos de la vida ocurren en las conversaciones improvisadas, en un café compartido sin prisas o al caminar sin rumbo fijo por un barrio nuevo.
              </p>
              <p>
                Por eso curamos planes y experiencias auténticas diseñadas para personas que quieren salir de su rutina y conectar de verdad. La ciudad es nuestro pretexto; encontrarnos cara a cara es el punto de todo.
              </p>
            </div>
            <div className="nosotros-story__visual">
              <div className="visual-card-wrapper">
                <img src={bruuk2} alt="Gente conectando en experiencias de Bruuk" />
                <div className="visual-card-badge visual-card-badge--accent">BRUUK / CONEXIONES</div>
              </div>
            </div>
          </div>
        </section>

        {/* Story Section 3: The Philosophy in Action */}
        <section className="nosotros-story-section">
          <div className="nosotros-container nosotros-grid">
            <div className="nosotros-story__content">
              <span className="story-number">03 / El Futuro</span>
              <h2>EL MAPA QUE ESCRIBIMOS JUNTOS.</h2>
              <p>
                Cada ciudad disponible en Bruuk es un mapa vivo trazado por y para la comunidad. Nada de lo que encuentras aquí está dictado por las tendencias del momento o por acuerdos comerciales.
              </p>
              <p>
                Nuestra meta es expandir este movimiento a más rincones y países, creando comunidades locales donde cualquiera pueda proponer una salida, descubrir un lugar secreto y encontrar amigos en el camino.
              </p>
            </div>
            <div className="nosotros-story__visual">
              <div className="visual-card-wrapper">
                <img src={bruuk3} alt="Comunidad activa de Bruuk" />
                <div className="visual-card-badge">BRUUK / COMUNIDAD</div>
              </div>
            </div>
          </div>
        </section>

        {/* Values section */}
        <section className="nosotros-values">
          <div className="nosotros-container">
            <div className="values-header">
              <span className="nosotros-kicker">/ Lo que nos mueve</span>
              <h2>NUESTROS PILARES</h2>
            </div>
            <div className="values-grid">
              <div className="value-card">
                <Heart className="value-card__icon" size={32} />
                <h3>Humanidad</h3>
                <p>Priorizamos el contacto real y las relaciones honestas frente al scroll impersonal y las métricas de vanidad.</p>
              </div>
              <div className="value-card">
                <Compass className="value-card__icon" size={32} />
                <h3>Curaduría</h3>
                <p>Seleccionamos planes con carácter, historia y valor local. Si no vale la pena la vuelta, no está en Bruuk.</p>
              </div>
              <div className="value-card">
                <Users className="value-card__icon" size={32} />
                <h3>Apertura</h3>
                <p>Bruuk es para todos: locales buscando redescubrir su casa, y visitantes queriendo ir más allá del itinerario clásico.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA section */}
        <section className="nosotros-cta">
          <div className="nosotros-container nosotros-cta__content">
            <h2>¿LISTO PARA APAGAR EL SCROLL?</h2>
            <p>Únete a miles de personas que ya están viviendo su ciudad de otra manera.</p>
            <div className="nosotros-cta__actions">
              <Link className="nosotros-btn nosotros-btn--primary" to="/descubrir">
                EXPLORAR LA APP <ArrowRight size={20} />
              </Link>
              <button 
                className="nosotros-btn nosotros-btn--secondary" 
                onClick={() => setIsRegistrationOpen(true)}
              >
                ÚNETE A LA COMUNIDAD
              </button>
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
