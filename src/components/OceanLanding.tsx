import { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BruukLogo } from './BruukLogo';
import { SpotCard } from './SpotCard';
import { OceanCanvas } from './OceanCanvas';
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
function makeRipple(x: number, y: number): RippleParams {
  return {
    id:           `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    x, y,
    freq:         0.010 + Math.random() * 0.016,   // tighter range, cheaper
    displacement: 10 + Math.random() * 18,          // 10–28 px
    seed:         Math.floor(Math.random() * 999),
    rings:        2,                                 // always 2 rings
    strokeWidth:  3,
    hue:          255 + Math.random() * 70,
  };
}

/* ─────────────────────────────────────────────────────── */
export function OceanLanding() {
  const navigate = useNavigate();
  const [showIntro, setShowIntro]   = useState(true);
  const [ripple, setRipple]         = useState<RippleParams | null>(null);
  const [activeSpot, setActiveSpot] = useState<ActiveSpot | null>(null);
  const [clickCount, setClickCount] = useState(0);
  const [spots, setSpots]           = useState<Spot[]>([]);

  const [videoFailed, setVideoFailed] = useState(false);
  const spotsQueue  = useRef<Spot[]>([]);
  const lastSpotId  = useRef<string | null>(null);
  const rippleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch spots from API — never bundled in the client
  useEffect(() => {
    fetch('/api/spots')
      .then(r => r.json())
      .then((data: Spot[]) => setSpots(data))
      .catch(console.error);
    return () => { if (rippleTimer.current) clearTimeout(rippleTimer.current); };
  }, []);

  const getNextSpot = useCallback(() => {
    if (spotsQueue.current.length === 0) {
      let s = [...spots].sort(() => Math.random() - 0.5);
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
    if (spots.length === 0) return;
    const t = e.target as HTMLElement;
    if (
      t.closest('.spot-card')      ||
      t.closest('.ocean-back-btn') ||
      t.closest('.modal-overlay')
    ) return;

    const { clientX: x, clientY: y } = e;

    // New unique ripple every click
    if (rippleTimer.current) clearTimeout(rippleTimer.current);
    const rp = makeRipple(x, y);
    setRipple(rp);
    rippleTimer.current = setTimeout(() => setRipple(null), 3200);

    setActiveSpot({ id: rp.id, spot: getNextSpot(), x, y });
    setClickCount(n => n + 1);
  }, [spots, getNextSpot]);

  return (
    <div className="ocean-container" onClick={handleOceanClick}>

      {/* Background */}
      <div className="ocean-bg">
        {videoFailed ? (
          <OceanCanvas />
        ) : (
          <video
            className="ocean-video"
            src="/ocean.mp4"
            autoPlay loop muted playsInline
            onError={() => setVideoFailed(true)}
          />
        )}
        <div className="ocean-overlay" />
      </div>

      {/* ── Intro overlay ── */}
      <AnimatePresence>
        {showIntro && (
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
              <span className="ocean-intro__tag">/ Lista curada</span>

              <h1 className="ocean-intro__title">
                Lugares para salir.<br />Sin pensar tanto.
              </h1>

              <p className="ocean-intro__body">
                Una selección de cafés, bares y rincones de la ciudad donde vale la pena aparecer. Toca el mar y descubre tu próximo spot.
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
        {clickCount === 0 && (
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

      {/* Handmade ripple */}
      <AnimatePresence>
        {ripple && <HandmadeRipple key={ripple.id} r={ripple} />}
      </AnimatePresence>

      {/* Spot card */}
      <AnimatePresence>
        {activeSpot && (
          <SpotCard
            key={activeSpot.id}
            spot={activeSpot.spot}
            clickX={activeSpot.x}
            clickY={activeSpot.y}
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

      {/* Logo */}
      <div className="ocean-logo-container">
        <BruukLogo />
      </div>

    </div>
  );
}
