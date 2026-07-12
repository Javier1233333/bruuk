import { useRef, useState } from 'react';
import { ArrowRight, ChevronLeft, ChevronRight, Compass, MapPinned, Sparkles, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RegistrationModal } from './components/RegistrationModal';
import citiesData from './data/cities.json';
import './App.css';

const carouselSlides = [
  {
    id: 'descubre',
    eyebrow: 'Explora sin algoritmo',
    title: 'ENCUENTRA LO QUE NO ESTABAS BUSCANDO.',
    description: 'Rincones locales y lugares curados para salir de las listas de siempre.',
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=85',
    badge: 'LUGAR CURADO',
    cardTitle: 'Rincones que valen la vuelta',
    meta: 'CERCA DE TI',
  },
  {
    id: 'vive',
    eyebrow: 'Planes que sí pasan',
    title: 'VIVE LA CIUDAD, NO SOLO LA GUARDES.',
    description: 'Experiencias concretas para moverte, probar algo nuevo y aparecer en el mundo real.',
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=1200&q=85',
    badge: 'EXPERIENCIA',
    cardTitle: 'Una salida distinta empieza aquí',
    meta: 'GRUPOS PEQUEÑOS',
  },
  {
    id: 'conecta',
    eyebrow: 'Comunidad en movimiento',
    title: 'LA CIUDAD ES EL PRETEXTO. CONECTAR ES EL PUNTO.',
    description: 'Personas con ganas de romper la rutina, compartir un plan y conocer su ciudad de otra forma.',
    image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=1200&q=85',
    badge: 'COMUNIDAD',
    cardTitle: 'Más personas. Más ciudades. Más mundo.',
    meta: 'BRUUK CRECE CONTIGO',
  },
] as const;

export default function App() {
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const slide = carouselSlides[activeSlide];

  const showPreviousSlide = () => {
    setActiveSlide(current => (current - 1 + carouselSlides.length) % carouselSlides.length);
  };

  const showNextSlide = () => {
    setActiveSlide(current => (current + 1) % carouselSlides.length);
  };

  return (
    <div className="explore-landing">
      <main>
        <section className="explore-hero" aria-labelledby="explore-hero-title">
          <div className="explore-hero__glow" aria-hidden="true" />
          <div className="explore-container explore-hero__layout">
            <div className="explore-hero__content">
              <span className="explore-kicker">/ Bruuk en cada ciudad</span>
              <h1 id="explore-hero-title">LA CIUDAD NO VIENE CON ALGORITMO.</h1>
              <p>
                Bruuk reúne lugares, experiencias y personas para que dejes de guardar planes y empieces a vivirlos.
              </p>
              <div className="explore-actions">
                <Link
                  className="explore-cta explore-cta--primary"
                  to="/descubrir"
                >
                  EMPEZAR AHORA <ArrowRight size={20} aria-hidden="true" />
                </Link>
                <a className="explore-cta explore-cta--secondary" href="#recorrido">
                  VER EL RECORRIDO <ArrowRight size={18} aria-hidden="true" />
                </a>
              </div>
            </div>

            <div className="explore-hero__signal" aria-label="Todo lo que encuentras en Bruuk">
              <div className="explore-hero__signal-title">
                <Compass size={24} aria-hidden="true" />
                <span>Tu brújula local</span>
              </div>
              <div className="explore-hero__signal-row">
                <MapPinned size={21} aria-hidden="true" />
                <span>Lugares que no salen en las listas de siempre</span>
              </div>
              <div className="explore-hero__signal-row">
                <Sparkles size={21} aria-hidden="true" />
                <span>Experiencias para aparecer, no solo mirar</span>
              </div>
              <div className="explore-hero__signal-row">
                <Users size={21} aria-hidden="true" />
                <span>Personas con ganas de salir de la rutina</span>
              </div>
            </div>
          </div>
        </section>

        <section id="recorrido" className="explore-carousel" aria-labelledby="explore-carousel-title">
          <div className="explore-container explore-carousel__intro">
            <div>
              <span className="explore-kicker">/ Así se vive Bruuk</span>
              <h2 id="explore-carousel-title">UN RECORRIDO. MUCHAS FORMAS DE SALIR.</h2>
            </div>
            <p>
              Recorre las ideas que mueven Bruuk: descubrir sin algoritmo, vivir planes reales y conectar con nuevas personas.
            </p>
          </div>

          <div
            className="explore-carousel__shell"
            role="region"
            aria-roledescription="carrusel"
            aria-label="Recorrido por Bruuk"
            tabIndex={0}
            onKeyDown={event => {
              if (event.key === 'ArrowLeft') showPreviousSlide();
              if (event.key === 'ArrowRight') showNextSlide();
            }}
            onTouchStart={event => {
              touchStartX.current = event.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={event => {
              if (touchStartX.current === null) return;
              const distance = event.changedTouches[0].clientX - touchStartX.current;
              if (Math.abs(distance) > 45) {
                if (distance > 0) showPreviousSlide();
                else showNextSlide();
              }
              touchStartX.current = null;
            }}
          >
            <div className="explore-carousel__viewport" aria-live="polite" aria-atomic="true">
              <article key={slide.id} className="explore-carousel__slide">
                <div className="explore-carousel__copy">
                  <span>{slide.eyebrow}</span>
                  <h3>{slide.title}</h3>
                  <p>{slide.description}</p>
                  <Link
                    className="explore-carousel__link"
                    to="/descubrir"
                  >
                    EMPEZAR AHORA <ArrowRight size={18} aria-hidden="true" />
                  </Link>
                </div>

                <div className="explore-carousel__screen">
                  <img src={slide.image} alt="" loading="lazy" draggable="false" />
                  <div className="explore-carousel__screen-top">
                    <Compass size={20} aria-hidden="true" />
                    <span>BRUUK / EXPLORA</span>
                  </div>
                  <div className="explore-carousel__screen-card">
                    <span>{slide.badge}</span>
                    <strong>{slide.cardTitle}</strong>
                    <small>{slide.meta}</small>
                  </div>
                </div>
              </article>
            </div>

            <div className="explore-carousel__controls">
              <button type="button" onClick={showPreviousSlide} aria-label="Ver pantalla anterior">
                <ChevronLeft size={22} aria-hidden="true" />
              </button>
              <div className="explore-carousel__dots" aria-label="Elegir pantalla">
                {carouselSlides.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    className={index === activeSlide ? 'is-active' : ''}
                    aria-label={`Ir a pantalla ${index + 1}: ${item.eyebrow}`}
                    aria-current={index === activeSlide ? 'true' : undefined}
                    onClick={() => setActiveSlide(index)}
                  />
                ))}
              </div>
              <button type="button" onClick={showNextSlide} aria-label="Ver pantalla siguiente">
                <ChevronRight size={22} aria-hidden="true" />
              </button>
            </div>
          </div>
        </section>

        <section className="explore-pillars" aria-labelledby="explore-pillars-title">
          <div className="explore-container">
            <div className="explore-pillars__heading">
              <span className="explore-kicker">/ Todo en una experiencia</span>
              <h2 id="explore-pillars-title">DESCUBRE. VIVE. CONECTA.</h2>
            </div>
            <div className="explore-pillars__grid">
              <article>
                <MapPinned size={30} aria-hidden="true" />
                <h3>Lugares que valen la vuelta</h3>
                <p>Cafés, bares y rincones elegidos por su vibra, no por cuántas veces aparecen en tu pantalla.</p>
              </article>
              <article>
                <Sparkles size={30} aria-hidden="true" />
                <h3>Experiencias que sí pasan</h3>
                <p>Planes concretos para aprender, moverte, comer, escuchar y dejar que la ciudad te sorprenda.</p>
              </article>
              <article>
                <Users size={30} aria-hidden="true" />
                <h3>Personas con ganas de salir</h3>
                <p>La ciudad es el pretexto. La conexión empieza cuando decides aparecer.</p>
              </article>
            </div>
          </div>
        </section>

        <section className="explore-cities" aria-labelledby="explore-cities-title">
          <div className="explore-container explore-cities__layout">
            <div>
              <span className="explore-kicker">/ El mapa apenas empieza</span>
              <h2 id="explore-cities-title">EMPEZAMOS EN DOS. VAMOS POR MÁS.</h2>
              <p>Las ciudades disponibles son el inicio de una red diseñada para crecer lugar por lugar.</p>
            </div>
            <div className="explore-cities__grid">
              {citiesData.map(city => (
                <Link
                  key={city.id}
                  className="explore-city-card"
                  to={`/descubrir/${city.id}`}
                  style={{ '--city-color': city.accentColor } as React.CSSProperties}
                >
                  <span>{city.name}</span>
                  <ArrowRight size={22} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="explore-closing" aria-labelledby="explore-closing-title">
          <div className="explore-container explore-closing__content">
            <h2 id="explore-closing-title">MENOS PANTALLA. MÁS MUNDO.</h2>
            <p>Tu próximo lugar, plan o conexión no necesita otra lista. Necesita que aparezcas.</p>
            <div className="explore-actions explore-actions--center">
              <Link
                className="explore-cta explore-cta--dark"
                to="/descubrir"
              >
                EMPEZAR AHORA <ArrowRight size={20} aria-hidden="true" />
              </Link>
              <button
                className="explore-cta explore-cta--light"
                type="button"
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
    </div>
  );
}
