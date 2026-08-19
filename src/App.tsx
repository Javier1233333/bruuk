import { useState } from 'react';
import { Sparkles, Map, Globe, ArrowRight, Compass, Check, Mail, MapPin, Radio, RefreshCw } from 'lucide-react';
import * as validator from 'email-validator';
import { ManifestoModal } from './components/ManifestoModal';
import { PrivacyModal } from './components/PrivacyModal';
import { UsagePolicyModal } from './components/UsagePolicyModal';
import { BruukLogo } from './components/BruukLogo';
import { useNavigate } from 'react-router-dom';
import './App.css';

const CAROUSEL_IMAGES = [
  { src: '/img/bruukcarrusel1.JPG', alt: 'Comunidad Bruuk 1' },
  { src: '/img/bruukcarrusel2.JPG', alt: 'Comunidad Bruuk 2' },
  { src: '/img/bruukcarrusel3.JPG', alt: 'Comunidad Bruuk 3' },
];

const BRUUKO_CITIES = [
  'Ciudad de México',
  'Monterrey',
  'Madrid',
  'Buenos Aires',
  'Bogotá',
  'Barcelona',
];

const CITY_SUGGESTIONS = [
  'Barcelona', 'Bogotá', 'Buenos Aires', 'Ciudad de México', 'Guadalajara', 'Lima',
  'Madrid', 'Medellín', 'Monterrey', 'Oaxaca', 'Quito', 'Santiago de Chile',
  'San José', 'San Juan', 'Santo Domingo', 'Sevilla', 'Valencia', 'Zaragoza',
];

function App() {
  const [isManifestoOpen, setIsManifestoOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isUsagePolicyOpen, setIsUsagePolicyOpen] = useState(false);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [bruukoEmail, setBruukoEmail] = useState('');
  const [bruukoCity, setBruukoCity] = useState('');
  const [otherBruukoCity, setOtherBruukoCity] = useState('');
  const [bruukoStatus, setBruukoStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [bruukoError, setBruukoError] = useState('');
  const navigate = useNavigate();

  const nextPhoto = () => setCarouselIdx((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
  const prevPhoto = () => setCarouselIdx((prev) => (prev - 1 + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length);

  const handleBruukoSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = bruukoEmail.trim().toLowerCase();

    if (!validator.validate(email)) {
      setBruukoStatus('error');
      setBruukoError('Escribe un correo válido para continuar.');
      return;
    }

    const selectedCity = bruukoCity === 'other' ? otherBruukoCity.trim() : bruukoCity;

    if (!selectedCity) {
      setBruukoStatus('error');
      setBruukoError('Elige o busca la ciudad desde la que quieres activar Bruuk.');
      return;
    }

    setBruukoStatus('loading');
    setBruukoError('');

    try {
      const joinResponse = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, tags: ['Bruuko', selectedCity] }),
      });

      if (!joinResponse.ok) throw new Error('No se pudo registrar el correo.');

      await Promise.allSettled([
        fetch('/api/sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, preferences: { type: 'bruuko', city: selectedCity } }),
        }),
        fetch('/api/welcome', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        }),
      ]);

      setBruukoStatus('success');
      setBruukoEmail('');
      setBruukoCity('');
      setOtherBruukoCity('');
    } catch {
      setBruukoStatus('error');
      setBruukoError('No pudimos enviar tu registro. Inténtalo de nuevo en un momento.');
    }
  };

  return (
    <div className="app-wrapper">
      <header className="header">
        <div className="container">
          <div className="logo">
            <BruukLogo />
          </div>
          <button
            className="header-secondary-link"
            type="button"
            onClick={() => navigate('/guadalajara/spots')}
          >
            EXPLORAR SPOTS <ArrowRight size={15} strokeWidth={2.5} />
          </button>
        </div>
      </header>

      <main>
        {/* Spacious Dark Main Hero Section */}
        <section className="hero-main-dark">
          <div className="container">
            <h1 className="animate-fade-in animate-glitch-loop brand-gradient-text glitch-hover" data-text="Menos pantalla. Más mundo.">
              Menos pantalla.<br />Más mundo.
            </h1>
            <p className="hero-subtitle-p animate-fade-in delay-1">
              Spots, Rack y rincones donde vale la pena aparecer. Navega Guadalajara sin algoritmos, sin filtros patrocinados y con recomendaciones de personas reales.
            </p>
            <div className="hero-actions animate-fade-in delay-2">
              <button className="btn btn-primary btn-mega" onClick={() => navigate('/guadalajara')}>
                <Compass size={22} strokeWidth={2.5} />
                EXPLORAR GUADALAJARA <ArrowRight size={20} strokeWidth={3} />
              </button>
            </div>
          </div>
        </section>

        {/* Cities Map Section */}
        <section className="cities-map-section">
          <div className="container cities-map-container">
            <div className="cities-map-content">
              <span className="cities-eyebrow">/ El mapa apenas empieza</span>
              <h2 className="cities-title">
                Empezamos por GDL<br />Vamos por más.
              </h2>
              <p className="cities-subtitle">
                Las ciudades disponibles son el inicio de una red diseñada para crecer lugar por lugar.
              </p>
            </div>
            <div className="cities-buttons">
              <button className="city-map-btn btn-guadalajara" onClick={() => navigate('/guadalajara')}>
                <span>GUADALAJARA</span>
                <ArrowRight size={22} strokeWidth={3} />
              </button>
              <button className="city-map-btn btn-mas-ciudades" disabled>
                <span>MÁS CIUDADES</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.6 }}>PRÓXIMAMENTE</span>
              </button>
            </div>
          </div>
        </section>

        <section className="bruuk-explainer-section" aria-labelledby="bruuk-explainer-title">
          <div className="container bruuk-explainer-grid">
            <div className="bruuk-explainer-copy">
              <span className="bruuk-explainer-eyebrow">/ QUÉ ES BRUUK</span>
              <h2 id="bruuk-explainer-title">
                UNA GUÍA VIVA<br />DE LA CIUDAD.
              </h2>
              <p>
                Bruuk reúne spots, tiendas y planes que vale la pena vivir en persona.
                Seleccionamos lo esencial para que pases menos tiempo buscando y más tiempo en la ciudad.
              </p>
            </div>

            <div className="bruuk-explainer-board" aria-label="Cómo funciona Bruuk">
              <div className="bruuk-explainer-points">
                <article>
                  <span>01</span>
                  <div><strong><Compass size={19} aria-hidden="true" /> SELECCIÓN</strong><p>Recomendaciones claras para encontrar un lugar y salir.</p></div>
                </article>
                <article>
                  <span>02</span>
                  <div><strong><RefreshCw size={19} aria-hidden="true" /> SIEMPRE CAMBIA</strong><p>Revisamos, agregamos y actualizamos el contenido conforme cambia la ciudad.</p></div>
                </article>
                <article>
                  <span>03</span>
                  <div><strong><Radio size={19} aria-hidden="true" /> RADAR BRUUK</strong><p>La comunidad que recibe nuevos spots, planes y actualizaciones antes que nadie.</p></div>
                </article>
              </div>
            </div>

            <div className="bruuk-explainer-footer">
              <span>GUADALAJARA / EDICIÓN 001</span>
              <div className="bruuk-explainer-actions">
                <button type="button" className="bruuk-explainer-radar-link" onClick={() => navigate('/radar')}>
                  ABRIR RADAR <Radio size={18} />
                </button>
                <button
                  className="bruuk-explainer-cta"
                  onClick={() => navigate('/guadalajara')}
                >
                  EXPLORAR GUADALAJARA <ArrowRight size={20} strokeWidth={3} />
                </button>
              </div>
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
                <h3>Spots Curados</h3>
                <p>Una selección honesta de locales en Guadalajara. Cafés, bares y rincones auténticos donde de verdad vale la pena aparecer.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <Globe size={28} color="#fff" />
                </div>
                <h3>Sin Algoritmos</h3>
                <p>Feeds aleatorios y transparentes. Sin publicidad oculta, sin contenido patrocinado y sin reseñas de influencers comprados.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">
                  <Map size={28} color="#fff" />
                </div>
                <h3>Navegación Visual</h3>
                <p>Navega la ciudad a toda velocidad con nuestro feed de spots vertical. Rápido, visual y optimizado para móvil.</p>
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
                <p>Bruuk no es simplemente otra aplicación móvil. Empezamos como una comunidad y evolucionaremos en el futuro para integrar encuentros y dinámicas presenciales. De momento, queremos construir las bases con las personas que de verdad quieren volver al mundo real.</p>
              </div>

              <div className="nos-carousel">
                <div className="carousel-view">
                  <img src={CAROUSEL_IMAGES[carouselIdx].src} alt={CAROUSEL_IMAGES[carouselIdx].alt} key={carouselIdx} className="carousel-img animate-fade-in" />
                  <div className="carousel-counter">
                    {carouselIdx + 1} / {CAROUSEL_IMAGES.length}
                  </div>
                </div>
                <div className="carousel-nav">
                  <button className="carousel-btn" onClick={prevPhoto} aria-label="Anterior">
                    &larr;
                  </button>
                  <button className="carousel-btn" onClick={nextPhoto} aria-label="Siguiente">
                    &rarr;
                  </button>
                </div>
              </div>
            </div>

            <div className="nos-closing">
              <span>Bruuk es el puente.</span>
              <span>El encuentro es el fin.</span>
              <span>La comunidad es el punto.</span>
            </div>
          </div>
        </section>

        {false && <section id="lleva-bruuk" className="bruuko-callout" aria-labelledby="bruuko-title">
          <div className="container">
            <div className="bruuko-grid">
              <div className="bruuko-intro">
                <span className="bruuko-eyebrow"><MapPin size={16} /> / Expande Bruuk</span>
                <h2 id="bruuko-title">LLEVA BRUUK A TU CIUDAD.</h2>
                <p>Bruuk crece con gente que conoce su ciudad y quiere compartirla. Si te mueven los lugares con historia, las comunidades reales y los planes fuera del feed, ayúdanos a abrir el siguiente punto del mapa.</p>
                <p className="bruuko-note">No necesitas ser influencer ni experto: buscamos ojos locales, curiosidad y ganas de activar experiencias para la gente de tu ciudad.</p>
              </div>
              <div className="bruuko-form-card">
                {bruukoStatus === 'success' ? (
                  <div className="bruuko-success" role="status">
                    <span className="bruuko-success-icon"><Check size={30} strokeWidth={3} /></span>
                    <h3>YA ERES PARTE DEL MAPA.</h3>
                    <p>Te escribiremos cuando sea momento de llevar Bruuk a tu ciudad.</p>
                    <button className="bruuko-reset" type="button" onClick={() => setBruukoStatus('idle')}>Registrar otra ciudad</button>
                  </div>
                ) : (
                  <form onSubmit={handleBruukoSubmit} noValidate>
                    <label className="bruuko-label" htmlFor="bruuko-email"><Mail size={16} /> Tu correo</label>
                    <input id="bruuko-email" className="bruuko-email-input" type="email" inputMode="email" autoComplete="email" placeholder="tu@correo.com" value={bruukoEmail} onChange={(event) => setBruukoEmail(event.target.value)} disabled={bruukoStatus === 'loading'} required />
                    <fieldset className="bruuko-cities" disabled={bruukoStatus === 'loading'}>
                      <legend>¿En qué ciudad estás?</legend>
                      <div className="bruuko-city-options">
                        {BRUUKO_CITIES.map((city) => (
                          <label className={`bruuko-city-option ${bruukoCity === city ? 'is-selected' : ''}`} key={city}>
                            <input type="radio" name="bruuko-city" value={city} checked={bruukoCity === city} onChange={() => { setBruukoCity(city); setOtherBruukoCity(''); }} />
                            <span>{city}</span>
                          </label>
                        ))}
                        <label className={`bruuko-city-option bruuko-city-search ${bruukoCity === 'other' ? 'is-selected' : ''}`}>
                          <input type="radio" name="bruuko-city" value="other" checked={bruukoCity === 'other'} onChange={() => setBruukoCity('other')} />
                          <span>¿No ves tu ciudad?</span>
                          <input className="bruuko-city-input" type="search" list="bruuko-city-suggestions" placeholder="Escribe o busca tu ciudad" value={otherBruukoCity} onFocus={() => setBruukoCity('other')} onChange={(event) => { setOtherBruukoCity(event.target.value); setBruukoCity('other'); }} aria-label="Busca tu ciudad" />
                          <datalist id="bruuko-city-suggestions">{CITY_SUGGESTIONS.map((city) => <option key={city} value={city} />)}</datalist>
                        </label>
                      </div>
                    </fieldset>
                    {bruukoStatus === 'error' && <p className="bruuko-error" role="alert">{bruukoError}</p>}
                    <button className="btn btn-primary bruuko-submit" type="submit" disabled={bruukoStatus === 'loading'}>
                      {bruukoStatus === 'loading' ? 'ENVIANDO...' : <>PROPONER MI CIUDAD <ArrowRight size={19} strokeWidth={3} /></>}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>}

        {/* Newsletter Section */}
        <section className="newsletter">
          <div className="container">
            <div className="newsletter-wrapper">
              <div className="newsletter-content">
                <h2 className="glitch-hover">EXPLORA LA CIUDAD</h2>
                <p>Descubre una selección curada de spots, tiendas, antigüedades y tianguis. Sal a la calle hoy.</p>
                <div className="newsletter-form" style={{ justifyContent: 'center', gap: '1.2rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={() => navigate('/guadalajara')}>
                    EXPLORAR GUADALAJARA <ArrowRight size={20} strokeWidth={3} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="container">
          <div className="site-footer-topline">
            <BruukLogo width={112} />
          </div>

          <div className="site-footer-main">
            <div className="site-footer-statement">
              <span>UNA GUÍA HECHA POR PERSONAS</span>
              <strong>MENOS PANTALLA.<br />MÁS MUNDO.</strong>
              <p>Spots, hallazgos y rutas para volver a mirar la ciudad.</p>
            </div>

            <nav className="site-footer-nav" aria-label="Navegación del pie de página">
              <div>
                <span>EXPLORAR</span>
                <a href="/guadalajara/spots">Spots</a>
                <a href="/guadalajara/rack">Vintage y tianguis</a>
                <a href="/radar">Radar editorial</a>
              </div>
              <div>
                <span>PARTICIPAR</span>
                <a href="/lleva-bruuk">Expande Bruuk</a>
                <a href="mailto:contacto@bruuk.space">Contacto</a>
              </div>
            </nav>

          </div>

          <div className="site-footer-bottom">
            <p>&copy; {new Date().getFullYear()} BRUUK.</p>
            <div className="site-footer-legal">
              <button type="button" onClick={() => setIsPrivacyOpen(true)}>Privacidad</button>
              <button type="button" onClick={() => setIsUsagePolicyOpen(true)}>Políticas de uso</button>
              <button type="button" onClick={() => setIsManifestoOpen(true)}>Manifiesto</button>
            </div>
            <p>NO SIGAS LAS REGLAS. SIGUE LA SEÑAL.</p>
          </div>
        </div>
      </footer>

      <ManifestoModal
        isOpen={isManifestoOpen}
        onClose={() => setIsManifestoOpen(false)}
      />

      <PrivacyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />

      <UsagePolicyModal
        isOpen={isUsagePolicyOpen}
        onClose={() => setIsUsagePolicyOpen(false)}
      />
    </div>
  );
}

export default App;
