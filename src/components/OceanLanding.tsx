import { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { BruukLogo } from './BruukLogo';
import { SpotCard } from './SpotCard';
import { OceanCanvas } from './OceanCanvas';
import { ChevronDown, MapPin, Loader2 } from 'lucide-react';
import spotsData from '../data/spots.json';
import citiesData from '../data/cities.json';
import './OceanLanding.css';

type Spot = {
  id: string;
  name: string;
  type: string;
  description: string;
  imageUrl: string;
  colorAccent: string;
  mapsLink: string;
  rating?: number;
  price?: string;
};

/* ── Handmade ripple types ── */
interface RippleParams {
  id: string;
  x: number;
  y: number;
  freq: number;        // turbulence frequency — controls wobble density
  displacement: number; // how "broken" the circle looks
  seed: number;        // unique noise pattern per click
  rings: number;       // 2–4 rings
  strokeWidth: number; // base stroke thickness
  hue: number;         // slight hue shift per click
}

interface ActiveSpot {
  id: string;
  spot: Spot;
  x: number;
  y: number;
}

// Cached at module level — only computed once
const RIPPLE_SIZE = Math.max(window.innerWidth, window.innerHeight) * 1.9;
const RIPPLE_C    = RIPPLE_SIZE / 2;

/* ── Per-ring animated SVG circle ── */
function HandmadeRing({
  cx, cy, filterId, ringIndex, hue,
}: {
  cx: number; cy: number; filterId: string;
  ringIndex: number; hue: number;
}) {
  const delay  = ringIndex * 0.18;
  const dur    = 1.8 + ringIndex * 0.3;
  const alpha  = 0.85 - ringIndex * 0.2;
  const finalR = 100 + ringIndex * 90;

  return (
    <motion.circle
      cx={cx} cy={cy}
      fill="none"
      stroke={`hsla(${hue}, 88%, 82%, ${alpha})`}
      strokeWidth={3}
      filter={`url(#${filterId})`}
      initial={{ r: 10, opacity: alpha }}
      animate={{ r: finalR, opacity: 0 }}
      transition={{ delay, duration: dur, ease: [0.04, 0.72, 0.22, 1] }}
    />
  );
}

/* ── Full ripple: SVG with turbulence filter ── */
function HandmadeRipple({ r }: { r: RippleParams }) {
  const filterId = `wob-${r.id}`;

  return (
    <motion.svg
      style={{
        position: 'fixed',
        left: r.x - RIPPLE_C,
        top:  r.y - RIPPLE_C,
        width: RIPPLE_SIZE,
        height: RIPPLE_SIZE,
        pointerEvents: 'none',
        zIndex: 20,
        overflow: 'visible',
        willChange: 'opacity',
      }}
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <defs>
        <filter id={filterId} x="-40%" y="-40%" width="180%" height="180%">
          <feTurbulence
            type="turbulence"
            baseFrequency={r.freq}
            numOctaves={2}
            seed={r.seed}
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic" in2="noise"
            scale={r.displacement}
            xChannelSelector="R" yChannelSelector="G"
          />
        </filter>
      </defs>

      {/* Expanding wobbly rings */}
      {Array.from({ length: r.rings }, (_, i) => (
        <HandmadeRing
          key={i} cx={RIPPLE_C} cy={RIPPLE_C}
          filterId={filterId} ringIndex={i}
          hue={r.hue}
        />
      ))}
    </motion.svg>
  );
}

/* ── Random params generator — different every click ── */
function makeRipple(x: number, y: number, hueRange: [number, number] = [255, 325]): RippleParams {
  const minHue = hueRange[0];
  const maxHue = hueRange[1];
  return {
    id:           `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    x, y,
    freq:         0.010 + Math.random() * 0.016,   // tighter range, cheaper
    displacement: 10 + Math.random() * 18,          // 10–28 px
    seed:         Math.floor(Math.random() * 999),
    rings:        2,                                 // always 2 rings
    strokeWidth:  3,
    hue:          minHue + Math.random() * (maxHue - minHue),
  };
}

/* ─────────────────────────────────────────────────────── */
export function OceanLanding() {
  const { city } = useParams();
  return <OceanLandingInner key={city || 'default'} />;
}

function OceanLandingInner() {
  const navigate = useNavigate();
  const { city } = useParams();

  const [showIntro, setShowIntro]     = useState(true);
  const [ripple, setRipple]           = useState<RippleParams | null>(null);
  const [activeSpot, setActiveSpot]   = useState<ActiveSpot | null>(null);
  const [clickCount, setClickCount]   = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLocating, setIsLocating]     = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [isMobile] = useState(() => window.innerWidth <= 768);
  const [videoFailed, setVideoFailed] = useState(false);
  
  const spotsQueue  = useRef<Spot[]>([]);
  const lastSpotId  = useRef<string | null>(null);
  const rippleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Find active city config (or Hermosillo as fallback for backdrop visualization)
  const currentCityConfig = citiesData.find(c => c.id === city);
  const activeCityConfig = currentCityConfig || citiesData.find(c => c.id === 'hermosillo') || citiesData[0];

  // Filter spots dynamically
  const spots = spotsData.filter(s => s.city === activeCityConfig.id) as Spot[];

  useEffect(() => {
    return () => { if (rippleTimer.current) clearTimeout(rippleTimer.current); };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClose = () => setIsDropdownOpen(false);
    document.addEventListener('click', handleClose);
    return () => document.removeEventListener('click', handleClose);
  }, [isDropdownOpen]);

  const getNextSpot = useCallback(() => {
    if (spotsQueue.current.length === 0) {
      const s = [...spots].sort(() => Math.random() - 0.5);
      if (lastSpotId.current && s[s.length - 1]?.id === lastSpotId.current) {
        const last = s.pop()!;
        s.splice(Math.floor(Math.random() * (s.length - 1)), 0, last);
      }
      spotsQueue.current = s;
    }
    const spot = spotsQueue.current.pop()!;
    lastSpotId.current = spot.id;
    return spot;
  }, [spots]);

  const handleOceanClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!currentCityConfig) return; // Block ripples while the selector modal is open
    if (spots.length === 0) return;
    const t = e.target as HTMLElement;
    if (
      t.closest('.spot-card')      ||
      t.closest('.ocean-back-btn') ||
      t.closest('.city-switcher-container') ||
      t.closest('.city-selector-modal') ||
      t.closest('.modal-overlay')
    ) return;

    const { clientX: x, clientY: y } = e;

    // New unique ripple every click
    if (rippleTimer.current) clearTimeout(rippleTimer.current);
    const rp = makeRipple(x, y, activeCityConfig.hueRange as [number, number]);
    setRipple(rp);
    rippleTimer.current = setTimeout(() => setRipple(null), 3200);

    setActiveSpot({ id: rp.id, spot: getNextSpot(), x, y });
    setClickCount(n => n + 1);
  }, [spots, getNextSpot, activeCityConfig, currentCityConfig]);

  const handleAutoLocation = useCallback(() => {
    if (navigator.geolocation) {
      setIsLocating(true);
      setLocationError(null);
      console.log("Requesting geolocation...");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          const { latitude: lat, longitude: lng } = position.coords;
          console.log(`Geolocation success: lat=${lat}, lng=${lng}`);
          
          let closestCity = citiesData[0];
          let minDistance = Infinity;
          citiesData.forEach(c => {
            const dist = Math.pow(c.defaultCoordinates.lat - lat, 2) + Math.pow(c.defaultCoordinates.lng - lng, 2);
            if (dist < minDistance) {
              minDistance = dist;
              closestCity = c;
            }
          });
          console.log(`Closest city detected: ${closestCity.name} (${closestCity.id})`);
          navigate(`/descubrir/${closestCity.id}`);
        },
        (error) => {
          setIsLocating(false);
          console.error("Geolocation error:", error);
          let msg = "No pudimos detectar tu ubicación. Selecciona una ciudad manualmente.";
          if (error.code === error.PERMISSION_DENIED) {
            msg = "Permiso de ubicación denegado. Selecciona una ciudad manualmente.";
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            msg = "La información de ubicación no está disponible.";
          } else if (error.code === error.TIMEOUT) {
            msg = "Se agotó el tiempo de espera para obtener la ubicación.";
          }
          setLocationError(msg);
        },
        {
          enableHighAccuracy: false,
          timeout: 6000,
          maximumAge: 600000
        }
      );
    } else {
      setLocationError("Tu navegador no soporta geolocalización o estás en HTTP.");
    }
  }, [navigate]);

  // Automatically trigger location detection on mount if no city parameter is active
  useEffect(() => {
    if (!currentCityConfig) {
      handleAutoLocation();
    }
  }, [currentCityConfig, handleAutoLocation]);

  return (
    <div 
      className="ocean-container" 
      onClick={handleOceanClick}
      style={{
        '--city-accent': activeCityConfig.accentColor
      } as React.CSSProperties}
    >

      {/* Background */}
      <div className="ocean-bg">
        {isMobile ? (
          <>
            <img
              className="ocean-video"
              src="/ocean-frame.jpg"
              alt=""
              draggable={false}
            />
            <div className="ocean-line" />
          </>
        ) : videoFailed ? (
          <OceanCanvas />
        ) : (
          <video
            className="ocean-video"
            src="/ocean.mp4"
            autoPlay loop muted playsInline
            onError={() => setVideoFailed(true)}
          />
        )}
        <div className="ocean-overlay" style={{ background: activeCityConfig.overlayGradient }} />
      </div>

      {/* ── Intro overlay ── */}
      <AnimatePresence>
        {showIntro && currentCityConfig && (
          <motion.div
            className="ocean-intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6 } }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="ocean-intro__card"
              initial={{ opacity: 0, y: 32 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.15, duration: 0.55, ease: [0.1, 0.9, 0.2, 1] }}
            >
              <span className="ocean-intro__tag">/ Lista curada · {activeCityConfig.name}</span>

              <h1 className="ocean-intro__title">
                {activeCityConfig.introTitle.split('\n').map((line, idx) => (
                  <span key={idx}>
                    {line}
                    {idx < activeCityConfig.introTitle.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </h1>

              <p className="ocean-intro__body">
                {activeCityConfig.introBody}
              </p>

              <p className="ocean-intro__sub">Navega lo desconocido.</p>

              <button
                className="ocean-intro__cta"
                onClick={() => setShowIntro(false)}
              >
                Explorar el mar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint */}
      <AnimatePresence>
        {clickCount === 0 && currentCityConfig && (
          <motion.div
            className="ocean-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.8, duration: 1 }}
          >
            Toca el mar para descubrir
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ripple */}
      <AnimatePresence>
        {ripple && (
          isMobile ? (
            <motion.div
              key={ripple.id}
              className="mobile-ripple"
              style={{
                left: ripple.x,
                top: ripple.y,
              }}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mobile-ripple__flash" />
              <div className="mobile-ripple__ring mobile-ripple__ring--1" />
              <div className="mobile-ripple__ring mobile-ripple__ring--2" />
              <div className="mobile-ripple__slash mobile-ripple__slash--1" />
              <div className="mobile-ripple__slash mobile-ripple__slash--2" />
            </motion.div>
          ) : (
            <HandmadeRipple key={ripple.id} r={ripple} />
          )
        )}
      </AnimatePresence>

      {/* Spot card */}
      <AnimatePresence>
        {activeSpot && (
          <SpotCard
            key={activeSpot.id}
            spot={activeSpot.spot}
            clickX={activeSpot.x}
            clickY={activeSpot.y}
            cityName={activeCityConfig.name}
            onClose={() => setActiveSpot(null)}
          />
        )}
      </AnimatePresence>

      {/* Back */}
      <button className="ocean-back-btn" onClick={() => navigate('/')}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Inicio
      </button>

      {/* City Switcher Dropdown */}
      {currentCityConfig && (
        <div className="city-switcher-container">
          <button 
            className="city-switcher-btn" 
            onClick={(e) => {
              e.stopPropagation();
              setIsDropdownOpen(!isDropdownOpen);
            }}
          >
            {activeCityConfig.name} <ChevronDown size={14} />
          </button>
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                className="city-switcher-menu"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.12 }}
                onClick={(e) => e.stopPropagation()}
              >
                {citiesData.map(c => (
                  <button
                    key={c.id}
                    className="city-switcher-item"
                    onClick={() => {
                      navigate(`/descubrir/${c.id}`);
                      setIsDropdownOpen(false);
                    }}
                  >
                    {c.name}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Logo */}
      <div className="ocean-logo-container">
        <BruukLogo />
      </div>

      {/* City Selector Modal Overlay */}
      <AnimatePresence>
        {!currentCityConfig && (
          <motion.div
            className="city-selector-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="city-selector-modal"
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            >
              <div className="city-selector-handle" />
              <div className="city-selector-logo">
                <BruukLogo />
              </div>
              <h1 className="city-selector-title">Elige tu mar</h1>
              <p className="city-selector-subtitle">Selecciona una ciudad para descubrir rincones únicos sin algoritmos.</p>
              
              <div className="city-options-grid">
                {citiesData.map(c => (
                  <button
                    key={c.id}
                    className="city-option-btn"
                    onClick={() => navigate(`/descubrir/${c.id}`)}
                    style={{ '--btn-accent': c.accentColor } as React.CSSProperties}
                  >
                    <span className="city-option-name">{c.name}</span>
                    <span className="city-option-desc">
                      {c.id === 'hermosillo' ? 'Desierto y Café' : 'Rincones y Barra'}
                    </span>
                  </button>
                ))}
              </div>

              {locationError && (
                <div style={{ color: '#ff7a45', fontSize: '0.8rem', marginTop: '1rem', fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.5px' }}>
                  {locationError}
                </div>
              )}

              <div className="city-selector-divider">o</div>

              <button
                className="geolocation-btn"
                onClick={handleAutoLocation}
                disabled={isLocating}
              >
                {isLocating ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Detectando ubicación...
                  </>
                ) : (
                  <>
                    <MapPin size={16} />
                    Detectar ubicación automática
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
