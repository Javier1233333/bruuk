import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ChevronDown,
  Flame,
  Sunset,
} from 'lucide-react';
import { BruukLogo } from './BruukLogo';
import { AsciiSpotsBackground } from './AsciiSpotsBackground';
import { CityNav } from './CityNav';
import { SpotCard } from './SpotCard';
import { HotspotsCard } from './HotspotsCard';
import { FeedLoginWall } from './FeedLoginWall';
import { FREE_SPOTS, isFeedLocked } from '../lib/appSession';
import { useSpots } from '../lib/useSpots';
import { SUNSET_IDS, useSunsetSpots } from '../lib/sunsets';
import { IS_APP_MODE } from '../lib/appMode';
import './OceanLanding.css';

type Spot = {
  id: string;
  name: string;
  type: string;
  description: string;
  imageUrl: string;
  colorAccent: string;
  mapsLink: string;
  city: string;
  rating?: number;
  price?: string;
  highlight?: string;
  hotspot?: number; // 1-3: hotspot de la semana, elegido en /admin/spots
  hotspotDate?: string;
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Atardeceres es una sección aparte: sus lugares no entran a Todos ni a las demás categorías.
type CategoryFilter = 'todos' | 'cafes' | 'restaurantes' | 'bares' | 'atardeceres';

type Slide = Spot | { id: string; wall: true } | { id: string; hotspots: true };

export function OceanLanding() {
  const { city: urlCity } = useParams();
  const activeCity = 'guadalajara';

  const allSpots = useSpots();
  const sunsetSpots = useSunsetSpots();
  // Enlace compartido (?spot=): ese spot va primero; si es un atardecer, abre en su sección
  const [searchParams] = useSearchParams();
  const sharedSpotId = searchParams.get('spot');
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>(() => (sharedSpotId && SUNSET_IDS.has(sharedSpotId) ? 'atardeceres' : 'todos'));
  // Hotspots de la semana: abren el feed en su orden; el resto va al azar
  const hotspots = useMemo(
    () => (allSpots as Spot[]).filter((spot) => spot.city === activeCity && spot.hotspot).sort((a, b) => a.hotspot! - b.hotspot!),
    [allSpots, activeCity],
  );
  const spots = useMemo(() => {
    const shuffled = shuffleArray((allSpots as Spot[]).filter((spot) => spot.city === activeCity && !spot.hotspot && !SUNSET_IDS.has(spot.id)));
    const ordered = [...hotspots, ...shuffled];
    const shared = ordered.find((spot) => String(spot.id) === sharedSpotId);
    return shared ? [shared, ...ordered.filter((spot) => spot !== shared)] : ordered;
  }, [allSpots, activeCity, sharedSpotId, hotspots]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [activeCity]);

  // Categorize spots for filtering
  const getCategoryGroup = (type: string): CategoryFilter => {
    const t = type.toLowerCase();
    if (t.startsWith('café') || t.startsWith('cafe') || t.startsWith('cafetería') || t.startsWith('panader')) return 'cafes';
    if (t.startsWith('restaurante') || t.startsWith('maris') || t.startsWith('pizz') || t.startsWith('bagel') || t.startsWith('sandwich') || t.startsWith('pollería') || t.startsWith('hamburgues')) return 'restaurantes';
    if (t.startsWith('bar') || t.startsWith('rooftop bar') || t.startsWith('club') || t.startsWith('disco') || t.startsWith('coctel') || t.startsWith('cervec')) return 'bares';
    if (t.includes('bar') || t.includes('club') || t.includes('antro') || t.includes('disco') || t.includes('deportivo') || t.includes('jazz') || t.includes('coctel') || t.includes('cervec')) return 'bares';
    if (t.includes('restaurante') || t.includes('comida') || t.includes('pizz') || t.includes('japon') || t.includes('asiat') || t.includes('maris') || t.includes('vegan') || t.includes('vegetar') || t.includes('brunch') || t.includes('hamburgues') || t.includes('ramen') || t.includes('bagel') || t.includes('sandwich') || t.includes('pollería')) return 'restaurantes';
    return 'todos'; // fallback
  };

  const sharedSunset = sunsetSpots.find((spot) => spot.id === sharedSpotId);
  const filteredSpots = activeCategory === 'atardeceres'
    ? (sharedSunset ? [sharedSunset, ...sunsetSpots.filter((spot) => spot !== sharedSunset)] : sunsetSpots) as Spot[]
    : spots.filter(spot => {
    if (activeCategory === 'todos') return true;
    const cat = getCategoryGroup(spot.type);
    if (activeCategory === 'cafes') return cat === 'cafes';
    if (activeCategory === 'bares') return cat === 'bares';
    if (activeCategory === 'restaurantes') return cat === 'restaurantes';
    return true;
  });

  // Sin sesión en la web: 5 spots de prueba y el feed termina en el aviso de login.
  const feedLocked = isFeedLocked();
  const spotSlides: Slide[] = feedLocked
    ? [...filteredSpots.slice(0, FREE_SPOTS), { id: 'login-wall', wall: true }]
    : filteredSpots;
  // En "Todos", la sección de hotspots va justo antes del primero (un spot compartido se queda arriba)
  const firstHotspot = spotSlides.findIndex((slide, i) => (!sharedSpotId || i > 0) && 'hotspot' in slide && slide.hotspot);
  const feedSlides: Slide[] = activeCategory === 'todos' && firstHotspot !== -1
    ? [...spotSlides.slice(0, firstHotspot), { id: 'hotspots', hotspots: true }, ...spotSlides.slice(firstHotspot)]
    : spotSlides;

  const goToSpot = (id: string) => document.getElementById(`spot-slide-${id}`)?.scrollIntoView({ behavior: 'smooth' });

  // Reset scroll to top when category changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [activeCategory]);

  if (urlCity && urlCity !== 'guadalajara') return <Navigate to="/guadalajara/spots" replace />;

  return (
    <div className="tiktok-feed-wrapper">
      <AsciiSpotsBackground />
      <CityNav active="spots" />

      {/* Floating Category Filters */}
      <div className="category-filters-floating">
        <div className="category-filters-inner">
          <button
            className={`filter-btn-floating ${activeCategory === 'todos' ? 'active' : ''}`}
            onClick={() => setActiveCategory('todos')}
          >
            Todos
          </button>
          <button
            className={`filter-btn-floating ${activeCategory === 'cafes' ? 'active' : ''}`}
            onClick={() => setActiveCategory('cafes')}
          >
            Cafés
          </button>
          <button
            className={`filter-btn-floating ${activeCategory === 'restaurantes' ? 'active' : ''}`}
            onClick={() => setActiveCategory('restaurantes')}
          >
            Comida
          </button>
          <button
            className={`filter-btn-floating ${activeCategory === 'bares' ? 'active' : ''}`}
            onClick={() => setActiveCategory('bares')}
          >
            Bares
          </button>
          <button
            className={`filter-btn-floating filter-btn-sunset ${activeCategory === 'atardeceres' ? 'active' : ''}`}
            onClick={() => setActiveCategory('atardeceres')}
          >
            <Sunset size={13} strokeWidth={2.6} aria-hidden="true" /> Atardeceres
          </button>
        </div>
      </div>

      {/* Vertical Snap Scroll Container */}
      <div className="tiktok-scroll-container" ref={containerRef}>
        
        {/* Atardeceres abre con su propia portada (también en la app), para que se lea como otra sección */}
        {activeCategory === 'atardeceres' && <section className="tiktok-slide intro-slide sunset-intro-slide">
          <div className="intro-card-overlay sunset-intro-card">
            <span className="spots-eyebrow">/ Atardeceres</span>
            <h2 className="spots-title">DONDE CAE<br />EL SOL.</h2>
            <p className="spots-subtitle">
              Miradores, parques y un rooftop en Guadalajara, Zapopan y Tlaquepaque. Llega 30 minutos antes.
            </p>
          </div>
        </section>}

        {/* Slide 0: Immersive Intro (en la app se abre directo en los spots) */}
        {!IS_APP_MODE && activeCategory !== 'atardeceres' && <section className="tiktok-slide intro-slide">
          <div className="intro-card-overlay">
            <span className="spots-eyebrow" style={{ textTransform: 'uppercase', letterSpacing: '2px' }}>
              Guadalajara
            </span>
            <h1 className="spots-title brand-gradient-text">COMER Y TOMAR</h1>
            <p className="spots-subtitle" style={{ fontSize: '1rem', marginTop: '10px' }}>
              Una selección honesta de rincones a los que vale la pena ir. Sin rankings pagados ni recomendaciones automáticas.
            </p>
            <div className="scroll-indicator">
              <span>Desliza para explorar spots</span>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                style={{ marginTop: '5px' }}
              >
                <ChevronDown size={20} color="#8b7cf6" strokeWidth={3} />
              </motion.div>
            </div>
          </div>
        </section>}

        {/* Slides 1 to N: The Spot Cards */}
        <AnimatePresence mode="wait">
          {feedSlides.map((slide) => (
            'wall' in slide ? (
              <section className="tiktok-slide login-wall-slide" key={`${slide.id}-${activeCategory}`}>
                <FeedLoginWall />
              </section>
            ) : 'hotspots' in slide ? (
              <section className="tiktok-slide hotspots-slide" key={`${slide.id}-${activeCategory}`}>
                <HotspotsCard hotspots={hotspots} onPick={goToSpot} />
              </section>
            ) : (
              <section className="tiktok-slide card-slide" id={`spot-slide-${slide.id}`} key={`${slide.id}-${activeCategory}`}>
                <div className="card-wrapper-centered">
                  {slide.hotspot ? (
                    <div className="hotspot-card-wrap">
                      <span className="hotspot-tag"><Flame size={12} strokeWidth={3} aria-hidden="true" /> HOTSPOT DE LA SEMANA · {slide.hotspot}/{hotspots.length}</span>
                      <SpotCard spot={slide} />
                    </div>
                  ) : <SpotCard spot={slide} />}
                </div>
              </section>
            )
          ))}
        </AnimatePresence>

        {/* Slide N+1: Snapping Final Footer */}
        {!feedLocked && <section className="tiktok-slide footer-slide">
          <div className="end-slide-card">
            <div className="end-logo-wrap">
              <BruukLogo width={160} />
            </div>
            <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '-0.5px' }}>
              Has llegado al final de la ruta.
            </h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem', marginBottom: '1.5rem', maxWidth: '380px', margin: '0 auto 1.5rem' }}>
              Bruuk es primero una comunidad. Sal a la calle, redescubre tu ciudad y conecta en persona.
            </p>
            <div className="end-contact-links">
              <a href="/sube-un-spot" className="end-email-btn">
                SUBIR UN SPOT
              </a>
              <a href="mailto:contacto@bruuk.space" className="end-email-btn">
                contacto@bruuk.space
              </a>
              <a href="/privacidad" className="end-privacy-btn">
                Aviso de Privacidad
              </a>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.4)', marginTop: '2.5rem' }}>
              &copy; {new Date().getFullYear()} bruuk. No sigas las reglas.
            </p>
          </div>
        </section>}

      </div>
    </div>
  );
}
export default OceanLanding;
