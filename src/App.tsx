import { useState } from 'react';
import { Sparkles, Map, Globe, ArrowRight, Compass, Check, Mail, MapPin, Store, Disc3, ShoppingBag } from 'lucide-react';
import * as validator from 'email-validator';
import { ManifestoModal } from './components/ManifestoModal';
import { ComingSoonModal } from './components/ComingSoonModal';
import { RegistrationModal } from './components/RegistrationModal';
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
  const [isComingSoonOpen, setIsComingSoonOpen] = useState(false);
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
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

  const handleJoin = () => {
    setIsComingSoonOpen(false);
    setIsRegistrationOpen(true);
  };

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
          <button className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 1.5rem' }} onClick={() => setIsComingSoonOpen(true)}>
            Registrarme
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
              Navega la ciudad. Cafés, bares y rincones donde vale la pena aparecer. Sin algoritmos, sin filtros patrocinados, recomendado por personas reales.
            </p>
            <div className="hero-actions animate-fade-in delay-2">
              <button className="btn btn-primary btn-mega" onClick={() => navigate('/descubrir')}>
                <Compass size={22} strokeWidth={2.5} />
                DESCUBRIR SPOTS <ArrowRight size={20} strokeWidth={3} />
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
              {/* <button className="city-map-btn btn-hermosillo" onClick={() => navigate('/descubrir/hermosillo')}>
                <span>HERMOSILLO</span>
                <ArrowRight size={22} strokeWidth={3} />
              </button> */}
              <button className="city-map-btn btn-guadalajara" onClick={() => navigate('/descubrir/guadalajara')}>
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

        {/* Rack Places — nueva sección que convive con el landing actual */}
        <section className="rack-portal-section" aria-labelledby="rack-portal-title">
          <div className="container rack-portal-grid">
            <div className="rack-portal-copy">
              <span className="rack-portal-eyebrow">/ RACK EN LA CALLE · GDL</span>
              <h2 id="rack-portal-title">
                BUSCA ALGO<br />QUE NO ESTÁ<br />EN EL FEED.
              </h2>
              <p>
                Tiendas, archivo, vinilos, antigüedades y tianguis. Una ruta curada
                para encontrar piezas con historia y lugares a los que sí vale la pena ir.
              </p>
              <button
                className="rack-portal-cta"
                onClick={() => navigate('/rack/lugares')}
              >
                EXPLORAR RACK <ArrowRight size={20} strokeWidth={3} />
              </button>
            </div>

            <div className="rack-portal-board" aria-label="46 lugares seleccionados">
              <div className="rack-portal-board-top">
                <span>RACK.</span>
                <span>GDL / 2026</span>
              </div>
              <strong>46</strong>
              <span className="rack-portal-board-label">LUGARES SELECCIONADOS</span>
              <div className="rack-portal-categories" aria-label="Abrir Rack por categoría">
                <button
                  type="button"
                  onClick={() => navigate('/rack/lugares?filter=tiendas')}
                >
                  <Store size={18} aria-hidden="true" /> 24 TIENDAS
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/rack/lugares?filter=antiguedades')}
                >
                  <Disc3 size={18} aria-hidden="true" /> 13 ANTIGÜEDADES
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/rack/lugares?filter=tianguis')}
                >
                  <ShoppingBag size={18} aria-hidden="true" /> 9 TIANGUIS
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

        <section className="bruuko-callout" aria-labelledby="bruuko-title">
          <div className="container">
            <div className="bruuko-grid">
              <div className="bruuko-intro">
                <span className="bruuko-eyebrow"><MapPin size={16} /> / Expande Bruuk</span>
                <h2 id="bruuko-title">TU CIUDAD NECESITA BRUUK.</h2>
                <p>Conviértete en un Bruuko: una persona local con ganas de compartir sus rincones favoritos, descubrir nuevas historias y acercar a la gente a lo mejor de su ciudad.</p>
                <p className="bruuko-note">Juntos construimos una guía viva, hecha por quienes sí salen, conocen el barrio y quieren que más personas vivan la ciudad de verdad.</p>
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
                    <input
                      id="bruuko-email"
                      className="bruuko-email-input"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="tu@correo.com"
                      value={bruukoEmail}
                      onChange={(event) => setBruukoEmail(event.target.value)}
                      disabled={bruukoStatus === 'loading'}
                      required
                    />

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
                          <input
                            className="bruuko-city-input"
                            type="search"
                            list="bruuko-city-suggestions"
                            placeholder="Escribe o busca tu ciudad"
                            value={otherBruukoCity}
                            onFocus={() => setBruukoCity('other')}
                            onChange={(event) => { setOtherBruukoCity(event.target.value); setBruukoCity('other'); }}
                            aria-label="Busca tu ciudad"
                          />
                          <datalist id="bruuko-city-suggestions">
                            {CITY_SUGGESTIONS.map((city) => <option key={city} value={city} />)}
                          </datalist>
                        </label>
                      </div>
                    </fieldset>

                    {bruukoStatus === 'error' && <p className="bruuko-error" role="alert">{bruukoError}</p>}

                    <button className="btn btn-primary bruuko-submit" type="submit" disabled={bruukoStatus === 'loading'}>
                      {bruukoStatus === 'loading' ? 'ENVIANDO...' : <>QUIERO SER BRUUKO <ArrowRight size={19} strokeWidth={3} /></>}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="newsletter">
          <div className="container">
            <div className="newsletter-wrapper">
              <div className="newsletter-content">
                <h2 className="glitch-hover">EXPLORA LA CIUDAD</h2>
                <p>Descubre la lista curada de locales y eventos en tiempo real. Sal a la calle hoy.</p>
                <div className="newsletter-form" style={{ justifyContent: 'center', gap: '1.2rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={() => navigate('/descubrir')}>
                    EXPLORAR SPOTS <ArrowRight size={20} strokeWidth={3} />
                  </button>
                  <button className="btn btn-secondary" onClick={handleJoin} style={{ fontSize: '0.9rem', padding: '0.65rem 1.6rem' }}>
                    Registrarse gratis
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <div className="footer-logo-wrap" style={{ display: 'flex', alignItems: 'center' }}>
              <BruukLogo width={80} />
            </div>
            <a href="#" onClick={(e) => { e.preventDefault(); setIsPrivacyOpen(true); }} style={{ color: 'rgba(255, 255, 255, 0.95)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.15s' }} onMouseOver={e => e.currentTarget.style.color = '#000'} onMouseOut={e => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.95)'}>Aviso de Privacidad</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setIsUsagePolicyOpen(true); }} style={{ color: 'rgba(255, 255, 255, 0.95)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.15s' }} onMouseOver={e => e.currentTarget.style.color = '#000'} onMouseOut={e => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.95)'}>Políticas de uso</a>
            <a href="#" onClick={(e) => { e.preventDefault(); setIsManifestoOpen(true); }} style={{ color: 'rgba(255, 255, 255, 0.95)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.15s' }} onMouseOver={e => e.currentTarget.style.color = '#000'} onMouseOut={e => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.95)'}>Manifiesto</a>
            <a href="mailto:contacto@bruuk.space" style={{ color: 'rgba(255, 255, 255, 0.95)', textDecoration: 'none', fontSize: '0.9rem', transition: 'color 0.15s' }} onMouseOver={e => e.currentTarget.style.color = '#000'} onMouseOut={e => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.95)'}>contacto@bruuk.space</a>
          </div>
          <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} bruuk. No sigas las reglas.</p>
        </div>
      </footer>

      <ComingSoonModal
        isOpen={isComingSoonOpen}
        onClose={() => setIsComingSoonOpen(false)}
        onJoin={handleJoin}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
      />

      <RegistrationModal
        isOpen={isRegistrationOpen}
        onClose={() => setIsRegistrationOpen(false)}
      />

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
