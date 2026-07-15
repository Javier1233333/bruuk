import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Compass, ChevronDown } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import citiesData from '../data/cities.json';
import { experienceService } from '@bruuk/shared-logic/services';
import { useAuth } from '../contexts/AuthContext';
import AuthPromptModal from '../components/AuthPromptModal';
import experiencesData from '../data/experiences.json';
import './ExperienciasPage.css';

function getCookie(name: string): string | null {
  try {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  } catch (e) {
    console.warn("Cookies error:", e);
  }
  return null;
}

function setCookie(name: string, value: string, days = 365) {
  try {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `; expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value || ""}${expires}; path=/; SameSite=Lax`;
  } catch (e) {
    console.warn("Cookies save error:", e);
  }
}

function getSavedCity(): string | null {
  try {
    const cookieVal = getCookie('bruuk_active_city');
    if (cookieVal) return cookieVal;
  } catch (e) {}
  try {
    const localVal = localStorage.getItem('bruuk_active_city');
    if (localVal) return localVal;
  } catch (e) {}
  return null;
}

function saveCity(cityId: string) {
  try {
    setCookie('bruuk_active_city', cityId);
  } catch (e) {}
  try {
    localStorage.setItem('bruuk_active_city', cityId);
  } catch (e) {}
}

import { ExperienceCard } from '../features/experiences/components/ExperienceCard';
import type { Experience } from '../features/experiences/components/ExperienceCard';
import { ExperienceDetailModal } from '../features/experiences/components/ExperienceDetailModal';
import { CategorySelector } from '../features/experiences/components/CategorySelector';

// Datos extraídos para seed.
const CATEGORIES = ['Todo', 'Aventura', 'Gastronomía', 'Arte', 'Música'];

export default function ExperienciasPage() {
  const navigate = useNavigate();
  const { city } = useParams();
  const location = useLocation();

  // Find active city config
  const currentCityConfig = citiesData.find(c => c.id === city);
  const activeCityConfig = currentCityConfig || citiesData.find(c => c.id === 'hermosillo') || citiesData[0];
  
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>('Todo');
  const [selectedExp, setSelectedExp] = useState<Experience | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [isReserving, setIsReserving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [authPromptOpen, setAuthPromptOpen] = useState(false);

  const handleAutoLocation = () => {
    if (navigator.geolocation) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          const { latitude: lat, longitude: lng } = position.coords;
          
          let closestCity = citiesData[0];
          let minDistance = Infinity;
          citiesData.forEach(c => {
            const dist = Math.pow(c.defaultCoordinates.lat - lat, 2) + Math.pow(c.defaultCoordinates.lng - lng, 2);
            if (dist < minDistance) {
              minDistance = dist;
              closestCity = c;
            }
          });
          navigate(`/experiencias/${closestCity.id}`);
        },
        () => {
          setIsLocating(false);
          alert('No pudimos detectar tu ubicación automáticamente.');
        },
        { enableHighAccuracy: false, timeout: 6000, maximumAge: 600000 }
      );
    } else {
      alert("Tu navegador no soporta geolocalización.");
    }
  };

  const handleReserve = async () => {
    if (!user) {
      setAuthPromptOpen(true);
      return;
    }
    if (!selectedExp || !selectedExp.nextEventId) {
      alert('Esta experiencia no tiene eventos programados próximos.');
      return;
    }

    setIsReserving(true);
    try {
      const searchParams = new URLSearchParams(location.search);
      const referrerId = searchParams.get('ref') || null;

      const { error } = await experienceService.createBooking({
        event_id: selectedExp.nextEventId,
        user_id: user.id,
        status: 'confirmed',
        referrer_id: referrerId
      });

      if (error && error.code !== '23505') { 
        throw error;
      }

      alert('¡Reserva confirmada con éxito!');
      if (selectedExp.whatsAppLink) {
        window.open(selectedExp.whatsAppLink, '_blank');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error al reservar: ' + err.message);
    } finally {
      setIsReserving(false);
    }
  };

  // Fetch experiences and events
  useEffect(() => {
    const fetchExperiences = async () => {
      setLoading(true);
      try {
        const { data: expData, error: expError } = await experienceService.getApprovedExperiences();

        if (expError) throw expError;

        const { data: evtData, error: evtError } = await experienceService.getUpcomingEvents();
        
        if (evtError) throw evtError;

        const mapped: Experience[] = (expData || []).map((exp: any) => {
          // Find next event for this experience
          const nextEvent = (evtData || []).find((e: any) => e.experience_id === exp.id);
          
          return {
            id: exp.id,
            name: exp.name,
            host: exp.host_name,
            hostAvatar: exp.host_avatar || 'https://via.placeholder.com/100',
            category: exp.category as any,
            imageUrl: exp.image_url || 'https://via.placeholder.com/500',
            rating: exp.rating ? Number(exp.rating) : 5.0,
            reviewsCount: exp.reviews_count || 0,
            price: exp.price,
            duration: exp.duration,
            location: exp.location,
            city: exp.city.toLowerCase() === 'hermosillo' ? 'Hermosillo' : 'Guadalajara',
            nextDate: nextEvent ? new Date(nextEvent.date).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }) : 'Próximamente',
            description: exp.description || '',
            longDescription: exp.long_description || '',
            whatsAppLink: exp.whatsapp_link || '',
            images: exp.images || [],
            reservationInfo: exp.reservation_info || '',
            nextEventId: nextEvent?.id,
            lat: exp.lat ? Number(exp.lat) : undefined,
            lng: exp.lng ? Number(exp.lng) : undefined
          };
        });
        setExperiences(mapped);

      } catch (err) {
        console.warn('[BRUUK] Error fetching experiences from Supabase, falling back to local JSON:', err);
        const mappedFallback: Experience[] = (experiencesData || []).map((exp: any) => ({
          id: exp.id,
          name: exp.name,
          host: exp.host_name,
          hostAvatar: exp.host_avatar || 'https://via.placeholder.com/100',
          category: exp.category as any,
          imageUrl: exp.image_url || 'https://via.placeholder.com/500',
          rating: exp.rating ? Number(exp.rating) : 5.0,
          reviewsCount: exp.reviews_count || 0,
          price: exp.price,
          duration: exp.duration,
          location: exp.location,
          city: exp.city.toLowerCase() === 'hermosillo' ? 'Hermosillo' : 'Guadalajara',
          nextDate: 'Próximamente',
          description: exp.description || '',
          longDescription: exp.long_description || '',
          whatsAppLink: exp.whatsapp_link || '',
          images: exp.images || [],
          reservationInfo: exp.reservation_info || ''
        }));
        setExperiences(mappedFallback);
      } finally {
        setLoading(false);
      }
    };
    fetchExperiences();
  }, [activeCityConfig.id]);

  // Track share link clicks
  useEffect(() => {
    const logClick = async () => {
      const searchParams = new URLSearchParams(location.search);
      const ref = searchParams.get('ref');
      const src = searchParams.get('src') || 'unknown';
      const expId = searchParams.get('exp');
      
      if (ref && expId) {
        try {
          await experienceService.logShareClick({
            experience_id: expId,
            referrer_id: ref,
            source: src
          });
        } catch (e) {
          console.warn('Error logging click:', e);
        }
      }
    };
    logClick();
  }, [location.search]);

  // Auto-open experience if passed in location state
  useEffect(() => {
    if (!loading && location.state?.selectedExpId) {
      const exp = experiences.find(e => e.id === location.state.selectedExpId);
      if (exp) {
        setSelectedExp(exp);
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [loading, location.state, location.pathname, navigate, experiences]);

  useEffect(() => {
    if (selectedExp) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('modal-open');
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('modal-open');
    };
  }, [selectedExp]);

  const [attendees, setAttendees] = useState<any[]>([]);
  const [attendeesCount, setAttendeesCount] = useState(0);

  useEffect(() => {
    const eventId = selectedExp?.nextEventId;
    if (eventId) {
      const fetchAttendees = async () => {
        const { data, count, error } = await experienceService.getAttendees(eventId, 5);
        if (!error && data) {
          setAttendees(data.map((d: any) => d.profiles));
          setAttendeesCount(count || 0);
        }
      };
      fetchAttendees();
    } else {
      setAttendees([]);
      setAttendeesCount(0);
    }
  }, [selectedExp]);



  // Keep active city synced globally
  useEffect(() => {
    if (currentCityConfig) {
      saveCity(currentCityConfig.id);
      window.dispatchEvent(new Event('bruuk_city_changed'));
    }
  }, [currentCityConfig]);

  // Default redirect to saved city if no city parameter
  useEffect(() => {
    if (!city) {
      const savedCity = getSavedCity() || 'hermosillo';
      navigate(`/experiencias/${savedCity}`, { replace: true });
    }
  }, [city, navigate]);

  // Close dropdown on click outside
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClose = () => setIsDropdownOpen(false);
    
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClose);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClose);
    };
  }, [isDropdownOpen]);

  // Filter experiences by active city
  const cityExperiences = experiences.filter(e => e.city.toLowerCase() === activeCityConfig.id.toLowerCase());

  // Filter experiences based on selected category
  const filteredExperiences = activeCategory === 'Todo' 
    ? cityExperiences 
    : cityExperiences.filter(e => e.category === activeCategory);

  return (
    <div className="experiences-page" style={{ '--city-accent': activeCityConfig.accentColor } as React.CSSProperties}>
      <header className="experiences-header">
        <div className="header-text">
          <span className="exp-tag">/ experiencias</span>
          <h1 className="exp-title brand-gradient-text" style={{ textShadow: '4px 4px 0px var(--city-accent, #8b7cf6)' }}>Rutas Locales</h1>
          
          <div className="exp-city-selector-container">
            <div className="exp-city-selector-wrapper">
              <button 
                className="exp-city-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDropdownOpen(!isDropdownOpen);
                }}
                style={{
                  fontSize: '0.82rem',
                  letterSpacing: '1.5px',
                  padding: '4px 0'
                }}
              >
                EXPLORANDO EN <span className="city-highlight" style={{ fontWeight: 900 }}>{activeCityConfig.name.toUpperCase()}</span> <ChevronDown size={12} />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div 
                    className="exp-city-dropdown"
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.12 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="exp-city-dropdown-item"
                      style={{ 
                        borderBottom: '1px dashed rgba(255,255,255,0.15)',
                        color: 'var(--city-accent)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsDropdownOpen(false);
                        handleAutoLocation();
                      }}
                    >
                      <MapPin size={12} /> {isLocating ? 'Detectando...' : 'Detectar GPS'}
                    </button>

                    {citiesData.map(c => (
                      <button
                        key={c.id}
                        className="exp-city-dropdown-item"
                        onClick={() => {
                          navigate(`/experiencias/${c.id}`);
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
          </div>

          <p className="exp-sub">Aprende habilidades y vive rutas diseñadas por apasionados locales.</p>
        </div>
      </header>

      <CategorySelector
        categories={CATEGORIES}
        activeCategory={activeCategory}
        onSelect={setActiveCategory}
      />

      {/* Main Experiences Area */}
      <main className="experiences-list-area">
        {loading ? (
          <div className="experiences-skeleton-grid">
            {[1, 2, 3].map((n) => (
              <div key={n} className="experience-card skeleton-card">
                <div className="card-image skeleton-image">
                  <div className="skeleton-shimmer" />
                </div>
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
          /* Show organized carousels when 'Todo' is selected */
          <div className="carousels-container">
            {/* Row 1: Featured */}
            <div className="exp-carousel-row">
              <h2 className="row-title">Las más reservadas 🔥</h2>
              <div className="horizontal-carousel">
                {cityExperiences.slice(0, 3).map(exp => (
                  <ExperienceCard key={exp.id} exp={exp} onClick={setSelectedExp} size="large" />
                ))}
              </div>
            </div>

            {/* Row 2: Gastronomy */}
            <div className="exp-carousel-row">
              <h2 className="row-title">Sabores Locales 🌮</h2>
              <div className="horizontal-carousel">
                {cityExperiences.filter(e => e.category === 'Gastronomía').map(exp => (
                  <ExperienceCard key={exp.id} exp={exp} onClick={setSelectedExp} />
                ))}
              </div>
            </div>

            {/* Row 3: Art and Workshops */}
            <div className="exp-carousel-row">
              <h2 className="row-title">Talleres Creativos y Música 🎨</h2>
              <div className="horizontal-carousel">
                {cityExperiences.filter(e => e.category === 'Arte' || e.category === 'Música').map(exp => (
                  <ExperienceCard key={exp.id} exp={exp} onClick={setSelectedExp} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Show simple list/grid when filtering by category */
          <div className="experiences-grid animate-fade-in">
            {filteredExperiences.length > 0 ? (
              filteredExperiences.map(exp => (
                <ExperienceCard key={exp.id} exp={exp} onClick={setSelectedExp} />
              ))
            ) : (
              <div className="no-experiences-state">
                <Compass size={40} className="pulse-icon" />
                <p>Próximamente más experiencias en esta categoría.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <ExperienceDetailModal
        exp={selectedExp}
        attendees={attendees}
        attendeesCount={attendeesCount}
        isReserving={isReserving}
        onClose={() => setSelectedExp(null)}
        onReserve={handleReserve}
      />

      <AuthPromptModal 
        isOpen={authPromptOpen} 
        onClose={() => setAuthPromptOpen(false)} 
        message="Regístrate para reservar un lugar en esta experiencia."
        action="Iniciar Sesión"
      />
    </div>
  );
}

