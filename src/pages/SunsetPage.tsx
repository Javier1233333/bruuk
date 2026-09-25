import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BruukLogo } from '../components/BruukLogo';
import { AsciiSpotsBackground } from '../components/AsciiSpotsBackground';
import { SpotCard } from '../components/SpotCard';
import spotsData from '../data/spots.json';
import sunsetData from '../data/atardeceres.json';
import '../components/OceanLanding.css';
import './SunsetPage.css';

type Spot = {
  id: string;
  name: string;
  type: string;
  description: string;
  highlight?: string;
  imageUrl: string;
  colorAccent: string;
  mapsLink: string;
  city: string;
  rating?: number;
  price?: string;
};

// La lista acepta el id de un spot existente o un spot completo
// (útil para miradores o parques que no pertenecen al feed de Spots).
type SunsetEntry = string | Spot;

const ALL_SPOTS = spotsData as Spot[];

const resolveEntries = (entries: SunsetEntry[]) =>
  entries
    .map((entry) => (typeof entry === 'string' ? ALL_SPOTS.find((spot) => spot.id === entry) : entry))
    .filter((spot): spot is Spot => Boolean(spot));

const SUNSET_SPOTS = resolveEntries(sunsetData.sunset as SunsetEntry[]);

export function SunsetPage() {
  return (
    <div className="tiktok-feed-wrapper sunset-feed">
      <AsciiSpotsBackground />

      <header className="sunset-nav">
        <Link to="/" aria-label="Ir a Bruuk"><BruukLogo width={96} /></Link>
        <Link className="sunset-nav-link" to="/guadalajara">VER TODO BRUUK <ArrowRight size={15} /></Link>
      </header>

      <div className="tiktok-scroll-container">
        <section className="tiktok-slide intro-slide">
          <div className="intro-card-overlay">
            <span className="spots-eyebrow">Guadalajara · Selección Bruuk</span>
            <h1 className="spots-title">ATARDECERES<br />EN GUADALAJARA</h1>
            <p className="spots-subtitle" style={{ fontSize: '1rem', marginTop: '10px' }}>
              Miradores, parques y un rooftop para ver caer el sol en Guadalajara, Zapopan y Tlaquepaque.
            </p>
            <div className="scroll-indicator">
              <span>Desliza para ver los lugares</span>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ marginTop: '5px' }}
              >
                <ChevronDown size={20} color="#ff9a5c" strokeWidth={3} />
              </motion.div>
            </div>
          </div>
        </section>

        {SUNSET_SPOTS.map((spot) => (
          <section className="tiktok-slide card-slide" key={spot.id}>
            <div className="card-wrapper-centered">
              <SpotCard spot={spot} />
            </div>
          </section>
        ))}

        <section className="tiktok-slide footer-slide">
          <div className="end-slide-card">
            <div className="end-logo-wrap">
              <BruukLogo width={160} />
            </div>
            <h3 className="sunset-end-title">¿Conoces un buen atardecer en GDL?</h3>
            <p className="sunset-end-copy">
              Mándanoslo y lo sumamos a la lista. También puedes seguir explorando el resto de Guadalajara.
            </p>
            <div className="end-contact-links">
              <Link to="/sube-un-spot" className="end-email-btn">SUBIR UN SPOT</Link>
              <Link to="/guadalajara/spots" className="end-email-btn">VER DÓNDE COMER Y TOMAR</Link>
              <Link to="/guadalajara" className="end-privacy-btn">Explorar Bruuk</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default SunsetPage;
