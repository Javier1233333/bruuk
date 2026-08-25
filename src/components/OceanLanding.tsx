import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Navigate, useParams } from 'react-router-dom';
import {
  ChevronDown,
} from 'lucide-react';
import { BruukLogo } from './BruukLogo';
import { AsciiSpotsBackground } from './AsciiSpotsBackground';
import { CityNav } from './CityNav';
import { SpotCard } from './SpotCard';
import { RadarPromo } from './RadarPromo';
import { RegistrationModal } from './RegistrationModal';
import spotsData from '../data/spots.json';
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
};

const shuffleArray = <T,>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

type CategoryFilter = 'todos' | 'cafes' | 'restaurantes' | 'bares';

export function OceanLanding() {
  const { city: urlCity } = useParams();
  const activeCity = 'guadalajara';

  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('todos');
  const [isRadarOpen, setIsRadarOpen] = useState(false);
  const spots = useMemo(
    () =>
      shuffleArray(
        (spotsData as Spot[]).filter(
          (spot) => spot.city === activeCity,
        ),
      ),
    [activeCity],
  );
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

  const filteredSpots = spots.filter(spot => {
    if (activeCategory === 'todos') return true;
    const cat = getCategoryGroup(spot.type);
    if (activeCategory === 'cafes') return cat === 'cafes';
    if (activeCategory === 'bares') return cat === 'bares';
    if (activeCategory === 'restaurantes') return cat === 'restaurantes';
    return true;
  });

  const feedSlides = filteredSpots.flatMap((spot, index) => {
    const isRadarMoment = (index + 1) % 6 === 0 && index < 18;
    return isRadarMoment ? [spot, { id: `radar-${index}`, radar: true }] : [spot];
  });

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
        </div>
      </div>

      {/* Vertical Snap Scroll Container */}
      <div className="tiktok-scroll-container" ref={containerRef}>
        
        {/* Slide 0: Immersive Intro */}
        <section className="tiktok-slide intro-slide">
          <div className="intro-card-overlay">
            <span className="spots-eyebrow" style={{ textTransform: 'uppercase', letterSpacing: '2px' }}>
              Guadalajara
            </span>
            <h1 className="spots-title brand-gradient-text">SPOTS CURADOS</h1>
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
        </section>

        {/* Slides 1 to N: The Spot Cards */}
        <AnimatePresence mode="wait">
          {feedSlides.map((slide) => (
            'radar' in slide ? (
              <section className="tiktok-slide radar-slide" key={`${slide.id}-${activeCategory}`}>
                <RadarPromo onJoin={() => setIsRadarOpen(true)} />
              </section>
            ) : (
              <section className="tiktok-slide card-slide" key={`${slide.id}-${activeCategory}`}>
                <div className="card-wrapper-centered">
                  <SpotCard spot={slide} />
                </div>
              </section>
            )
          ))}
        </AnimatePresence>

        {/* Slide N+1: Snapping Final Footer */}
        <section className="tiktok-slide footer-slide">
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
        </section>

      </div>
      <RegistrationModal isOpen={isRadarOpen} onClose={() => setIsRadarOpen(false)} />
    </div>
  );
}
export default OceanLanding;
