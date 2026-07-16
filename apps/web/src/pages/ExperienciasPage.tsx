import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Compass, ChevronDown } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import citiesData from '../data/cities.json';
import experiencesData from '../data/experiences.json';
import { useExperiences, useAttendees, useBooking } from '@bruuk/shared-logic/hooks';
import type { Experience } from '@bruuk/shared-logic/hooks';
import { useAuth } from '../contexts/AuthContext';
import AuthPromptModal from '../components/AuthPromptModal';
import { ExperienceCard } from '../features/experiences/components/ExperienceCard';
import { ExperienceDetailModal } from '../features/experiences/components/ExperienceDetailModal';
import { CategorySelector } from '../features/experiences/components/CategorySelector';
import './ExperienciasPage.css';

const CATEGORIES = ['Todo', 'Aventura', 'Gastronomía', 'Arte', 'Música'] as const;

function getSavedCity() {
  try { const v = document.cookie.split(`; bruuk_active_city=`)[1]; if (v) return v.split(';')[0]; } catch {}
  try { return localStorage.getItem('bruuk_active_city'); } catch {}
  return null;
}
function saveCity(id: string) {
  try { document.cookie = `bruuk_active_city=${id}; path=/; SameSite=Lax`; } catch {}
  try { localStorage.setItem('bruuk_active_city', id); } catch {}
}

export default function ExperienciasPage() {
  const navigate = useNavigate();
  const { city } = useParams();
  const location = useLocation();
  const { user } = useAuth();

  const activeCityConfig = citiesData.find(c => c.id === city)
    ?? citiesData.find(c => c.id === 'hermosillo')
    ?? citiesData[0];

  const [activeCategory, setActiveCategory] = useState('Todo');
  const [selectedExp, setSelectedExp] = useState<Experience | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);

  // ── Hooks from shared-logic ──────────────────────────────────────────────
  const { experiences, loading } = useExperiences({ fallbackData: experiencesData as any[] });
  const { attendees, attendeesCount } = useAttendees(selectedExp?.nextEventId);
  const { createBooking, loading: isReserving } = useBooking();

  // ── Derived data ─────────────────────────────────────────────────────────
  const cityExperiences = experiences.filter(e =>
    e.city.toLowerCase() === activeCityConfig.id.toLowerCase()
  );
  const filteredExperiences = activeCategory === 'Todo'
    ? cityExperiences
    : cityExperiences.filter(e => e.category === activeCategory);

  // ── Side effects ─────────────────────────────────────────────────────────
  useEffect(() => { if (!city) navigate(`/experiencias/${getSavedCity() || 'hermosillo'}`, { replace: true }); }, [city, navigate]);
  useEffect(() => { saveCity(activeCityConfig.id); window.dispatchEvent(new Event('bruuk_city_changed')); }, [activeCityConfig.id]);
  useEffect(() => {
    document.body.style.overflow = selectedExp ? 'hidden' : '';
    document.body.classList.toggle('modal-open', !!selectedExp);
    return () => { document.body.style.overflow = ''; document.body.classList.remove('modal-open'); };
  }, [selectedExp]);
  useEffect(() => {
    if (loading || !location.state?.selectedExpId) return;
    const exp = experiences.find(e => e.id === location.state.selectedExpId);
    if (exp) { setSelectedExp(exp); navigate(location.pathname, { replace: true, state: {} }); }
  }, [loading, location.state, location.pathname, navigate, experiences]);
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref'), expId = params.get('exp'), src = params.get('src') || 'unknown';
    if (ref && expId) import('@bruuk/shared-logic/services').then(m =>
      m.experienceService.logShareClick({ experience_id: expId, referrer_id: ref, source: src }).catch(() => {})
    );
  }, [location.search]);
  useEffect(() => {
    if (!isDropdownOpen) return;
    const close = () => setIsDropdownOpen(false);
    const t = setTimeout(() => document.addEventListener('click', close), 0);
    return () => { clearTimeout(t); document.removeEventListener('click', close); };
  }, [isDropdownOpen]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleAutoLocation = () => {
    if (!navigator.geolocation) { alert('Tu navegador no soporta geolocalización.'); return; }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude: lat, longitude: lng } }) => {
        setIsLocating(false);
        const closest = citiesData.reduce((best, c) => {
          const d = (c.defaultCoordinates.lat - lat) ** 2 + (c.defaultCoordinates.lng - lng) ** 2;
          return d < (best.d ?? Infinity) ? { c, d } : best;
        }, {} as any);
        navigate(`/experiencias/${closest.c?.id ?? citiesData[0].id}`);
      },
      () => { setIsLocating(false); alert('No pudimos detectar tu ubicación automáticamente.'); },
      { enableHighAccuracy: false, timeout: 6000, maximumAge: 600000 }
    );
  };

  const handleReserve = async () => {
    if (!user) { setAuthPromptOpen(true); return; }
    if (!selectedExp?.nextEventId) { alert('Esta experiencia no tiene eventos programados próximos.'); return; }
    const params = new URLSearchParams(location.search);
    const { success } = await createBooking({
      event_id: selectedExp.nextEventId,
      user_id: user.id,
      status: 'confirmed',
      referrer_id: params.get('ref') || null,
    });
    if (success) {
      alert('¡Reserva confirmada con éxito!');
      if (selectedExp.whatsAppLink) window.open(selectedExp.whatsAppLink, '_blank');
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="experiences-page" style={{ '--city-accent': activeCityConfig.accentColor } as React.CSSProperties}>
      <header className="experiences-header">
        <div className="header-text">
          <span className="exp-tag">/ experiencias</span>
          <h1 className="exp-title brand-gradient-text" style={{ textShadow: '4px 4px 0px var(--city-accent, #8b7cf6)' }}>Rutas Locales</h1>
          <div className="tiktok-city-container" style={{ margin: '12px auto 4px', width: 'fit-content' }}>
            <button 
              className="tiktok-city-btn" 
              onClick={e => { e.stopPropagation(); setIsDropdownOpen(v => !v); }}
            >
              EXPLORANDO EN <span style={{ color: 'var(--city-accent)', textDecoration: 'underline', fontWeight: 900 }}>{activeCityConfig.name.toUpperCase()}</span> <ChevronDown size={12} />
            </button>
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div 
                  className="tiktok-city-dropdown" 
                  initial={{ opacity: 0, y: -8 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -8 }} 
                  transition={{ duration: 0.12 }} 
                  onClick={e => e.stopPropagation()}
                >
                  <button 
                    className="tiktok-city-item" 
                    style={{ borderBottom: '1px dashed rgba(255,255,255,0.15)', color: 'var(--city-accent)', display: 'flex', alignItems: 'center', gap: '6px' }} 
                    onClick={e => { e.stopPropagation(); setIsDropdownOpen(false); handleAutoLocation(); }}
                  >
                    <MapPin size={12} /> {isLocating ? 'Detectando...' : 'Detectar GPS'}
                  </button>
                  {citiesData.map(c => (
                    <button 
                      key={c.id} 
                      className="tiktok-city-item" 
                      onClick={() => { navigate(`/experiencias/${c.id}`); setIsDropdownOpen(false); }}
                    >
                      {c.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <p className="exp-sub">Aprende habilidades y vive rutas diseñadas por apasionados locales.</p>
        </div>
      </header>

      <CategorySelector categories={CATEGORIES} activeCategory={activeCategory} onSelect={setActiveCategory} />

      <main className="experiences-list-area">
        {loading ? (
          <div className="experiences-skeleton-grid">
            {[1, 2, 3].map(n => (
              <div key={n} className="experience-card skeleton-card">
                <div className="card-image skeleton-image"><div className="skeleton-shimmer" /></div>
                <div className="card-body">
                  <div className="skeleton-line short"><div className="skeleton-shimmer" /></div>
                  <div className="skeleton-line title"><div className="skeleton-shimmer" /></div>
                  <div className="skeleton-line"><div className="skeleton-shimmer" /></div>
                  <div className="skeleton-line"><div className="skeleton-shimmer" /></div>
                </div>
              </div>
            ))}
          </div>
        ) : activeCategory === 'Todo' ? (
          <div className="carousels-container">
            <div className="exp-carousel-row">
              <h2 className="row-title">Las más reservadas 🔥</h2>
              <div className="horizontal-carousel">{cityExperiences.slice(0, 3).map(exp => <ExperienceCard key={exp.id} exp={exp} onClick={setSelectedExp} size="large" />)}</div>
            </div>
            <div className="exp-carousel-row">
              <h2 className="row-title">Sabores Locales 🌮</h2>
              <div className="horizontal-carousel">{cityExperiences.filter(e => e.category === 'Gastronomía').map(exp => <ExperienceCard key={exp.id} exp={exp} onClick={setSelectedExp} />)}</div>
            </div>
            <div className="exp-carousel-row">
              <h2 className="row-title">Talleres Creativos y Música 🎨</h2>
              <div className="horizontal-carousel">{cityExperiences.filter(e => e.category === 'Arte' || e.category === 'Música').map(exp => <ExperienceCard key={exp.id} exp={exp} onClick={setSelectedExp} />)}</div>
            </div>
          </div>
        ) : (
          <div className="experiences-grid animate-fade-in">
            {filteredExperiences.length > 0
              ? filteredExperiences.map(exp => <ExperienceCard key={exp.id} exp={exp} onClick={setSelectedExp} />)
              : <div className="no-experiences-state"><Compass size={40} className="pulse-icon" /><p>Próximamente más experiencias en esta categoría.</p></div>
            }
          </div>
        )}
      </main>

      <ExperienceDetailModal exp={selectedExp} attendees={attendees} attendeesCount={attendeesCount} isReserving={isReserving} onClose={() => setSelectedExp(null)} onReserve={handleReserve} />
      <AuthPromptModal isOpen={authPromptOpen} onClose={() => setAuthPromptOpen(false)} message="Regístrate para reservar un lugar en esta experiencia." action="Iniciar Sesión" />
    </div>
  );
}
