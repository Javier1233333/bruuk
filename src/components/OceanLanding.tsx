import { useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { BruukLogo } from './BruukLogo';
import { 
  ChevronDown, 
  MapPin, 
  Loader2, 
  Compass, 
  Heart, 
  Bookmark, 
  Share2, 
  Map, 
  X, 
  ExternalLink, 
  Calendar, 
  ArrowLeft 
} from 'lucide-react';
import spotsData from '../data/spots.json';
import citiesData from '../data/cities.json';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './OceanLanding.css';

type Spot = {
  id: string;
  city: string;
  category?: 'lugar' | 'experiencia';
  name: string;
  type: string;
  description: string;
  imageUrl: string;
  colorAccent: string;
  mapsLink: string;
  rating?: number;
  price?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  bookingLink?: string;
  schedule?: string;
};

/* ── Custom glowing neon pin creator for Leaflet ── */
const createCustomMarkerIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-neon-pin',
    html: `<div style="
      background-color: ${color}; 
      box-shadow: 0 0 10px ${color}, 0 0 20px ${color}; 
      width: 14px; 
      height: 14px; 
      border-radius: 50%; 
      border: 2px solid #fff;
      --color: ${color};
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7]
  });
};

export function OceanLanding() {
  const { city } = useParams();
  return <OceanLandingInner key={city || 'default'} />;
}

function OceanLandingInner() {
  const navigate = useNavigate();
  const { city } = useParams();

  // App States
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // Custom Interaction States
  const [likedSpots, setLikedSpots] = useState<Set<string>>(() => new Set());
  const [savedSpots, setSavedSpots] = useState<Set<string>>(() => new Set());
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'todo' | 'lugar' | 'experiencia'>('todo');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const feedRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Find active city config (or Hermosillo as fallback)
  const currentCityConfig = citiesData.find(c => c.id === city);
  const activeCityConfig = currentCityConfig || citiesData.find(c => c.id === 'hermosillo') || citiesData[0];

  // Base spots list for this city
  const spots = spotsData.filter(s => s.city === activeCityConfig.id) as Spot[];

  // Helper to categorize spots if category is not explicitly set
  const getCategory = (spot: Spot): 'lugar' | 'experiencia' => {
    return spot.category || (spot.type === 'Experiencia' ? 'experiencia' : 'lugar');
  };

  // Filtered spots list
  const filteredSpots = spots.filter(s => {
    const cat = getCategory(s);
    if (activeCategory === 'todo') return true;
    return cat === activeCategory;
  });

  // Close dropdown on click outside
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClose = () => setIsDropdownOpen(false);
    document.addEventListener('click', handleClose);
    return () => document.removeEventListener('click', handleClose);
  }, [isDropdownOpen]);

  // Handle vertical snapping scroll to find the active slide
  const handleScroll = useCallback(() => {
    if (!feedRef.current) return;
    const scrollTop = feedRef.current.scrollTop;
    const clientHeight = feedRef.current.clientHeight;
    // Calculate which index is in view
    const index = Math.round(scrollTop / clientHeight);
    if (index !== activeIndex && index >= 0 && index < filteredSpots.length) {
      setActiveIndex(index);
    }
  }, [activeIndex, filteredSpots.length]);

  // Scroll directly to a specific slide index
  const scrollToSlide = useCallback((index: number) => {
    if (!feedRef.current) return;
    const clientHeight = feedRef.current.clientHeight;
    feedRef.current.scrollTo({
      top: index * clientHeight,
      behavior: 'smooth'
    });
    setActiveIndex(index);
  }, []);

  // Handle Likes
  const toggleLike = (id: string) => {
    setLikedSpots(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Handle Saves
  const toggleSave = (id: string) => {
    setSavedSpots(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        triggerToast('Quitado de tus guardados');
      } else {
        next.add(id);
        triggerToast('Guardado en tus favoritos');
      }
      return next;
    });
  };

  // Trigger Toast Messages
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Handle Share link copying
  const handleShare = (spotName: string) => {
    const url = window.location.origin + `/descubrir/${activeCityConfig.id}`;
    navigator.clipboard.writeText(`${url} - ¡Mira este plan en Bruuk: ${spotName}!`);
    triggerToast('¡Enlace de Bruuk copiado!');
  };

  // Geolocation auto detect closest city
  const handleAutoLocation = useCallback(() => {
    if (navigator.geolocation) {
      setIsLocating(true);
      setLocationError(null);
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
          navigate(`/descubrir/${closestCity.id}`);
        },
        (error) => {
          setIsLocating(false);
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

  // Trigger geolocation on mount if no city parameter
  useEffect(() => {
    if (!currentCityConfig) {
      handleAutoLocation();
    }
  }, [currentCityConfig, handleAutoLocation]);

  // Leaflet Map instance initializer
  useEffect(() => {
    if (!isMapOpen || !mapContainerRef.current || !currentCityConfig) return;

    const lat = activeCityConfig.defaultCoordinates.lat;
    const lng = activeCityConfig.defaultCoordinates.lng;

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 13,
      zoomControl: true,
      attributionControl: false
    });

    // Dark theme map tiles (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(map);

    // Add pins for current city's spots
    filteredSpots.forEach((spot) => {
      if (!spot.coordinates) return;

      const accentColor = spot.colorAccent || activeCityConfig.accentColor;
      const marker = L.marker([spot.coordinates.lat, spot.coordinates.lng], {
        icon: createCustomMarkerIcon(accentColor)
      }).addTo(map);

      const isExperience = getCategory(spot) === 'experiencia';

      marker.bindPopup(`
        <div class="map-popup-inner" style="font-family: 'DM Sans', sans-serif; color: #fff;">
          <h4 style="margin: 0 0 4px 0; font-family: 'Outfit', sans-serif; text-transform: uppercase; font-size: 0.95rem; color: #fff;">${spot.name}</h4>
          <p style="margin: 0 0 6px 0; font-size: 0.72rem; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 0.5px;">
            ${spot.type} · ${activeCityConfig.name}
          </p>
          <p style="margin: 0 0 8px 0; font-size: 0.8rem; color: rgba(255,255,255,0.85); font-style: italic;">
            "${spot.description}"
          </p>
          ${isExperience && spot.schedule ? `
            <p style="margin: 0 0 8px 0; font-size: 0.75rem; color: ${accentColor}; font-weight: bold;">
              📅 ${spot.schedule}
            </p>
          ` : ''}
          <button class="map-go-to-feed-btn" data-spot-id="${spot.id}" style="
            width: 100%;
            background: #fff;
            color: #000;
            font-family: 'Outfit', sans-serif;
            font-weight: 800;
            border: 2px solid #000;
            padding: 6px;
            font-size: 0.7rem;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 2px 2px 0px ${accentColor};
            transition: all 0.1s;
          ">Ver en Feed</button>
        </div>
      `);
    });

    // Attach listener for map popup clicks
    const handlePopupOpen = (e: L.PopupEvent) => {
      const container = e.popup.getElement();
      if (!container) return;
      const btn = container.querySelector('.map-go-to-feed-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          const spotId = btn.getAttribute('data-spot-id');
          if (spotId) {
            const index = filteredSpots.findIndex(s => s.id === spotId);
            if (index !== -1) {
              scrollToSlide(index);
              setIsMapOpen(false);
            }
          }
        });
      }
    };

    map.on('popupopen', handlePopupOpen);

    return () => {
      map.off('popupopen', handlePopupOpen);
      map.remove();
    };
  }, [isMapOpen, filteredSpots, activeCityConfig, currentCityConfig, scrollToSlide]);

  return (
    <div 
      className="ocean-container"
      style={{
        '--city-accent': activeCityConfig.accentColor
      } as React.CSSProperties}
    >
      {/* Dynamic Desktop Blurred Background */}
      {filteredSpots.length > 0 && (
        <div 
          className="desktop-bg-blur"
          style={{
            backgroundImage: `url(${filteredSpots[activeIndex]?.imageUrl})`
          }}
        />
      )}

      {/* Main TikTok Device Container */}
      <div className="tiktok-container-desktop">
        
        {/* Toast Alert popup */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div 
              className="toast-alert"
              initial={{ opacity: 0, y: -20, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: -20, x: '-50%' }}
              transition={{ duration: 0.2 }}
            >
              {toastMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Custom Translucent Header */}
        {currentCityConfig && (
          <header className="tiktok-header">
            <div className="tiktok-header-row">
              {/* Back to Home page */}
              <button className="tiktok-back-btn" onClick={() => navigate('/')} aria-label="Inicio">
                <ArrowLeft size={16} />
              </button>

              {/* City Switcher dropdown trigger */}
              <div className="tiktok-city-container">
                <button 
                  className="tiktok-city-btn"
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
                      className="tiktok-city-dropdown"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.12 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {citiesData.map(c => (
                        <button
                          key={c.id}
                          className="tiktok-city-item"
                          onClick={() => {
                            navigate(`/descubrir/${c.id}`);
                            setIsDropdownOpen(false);
                            setActiveIndex(0);
                            if (feedRef.current) feedRef.current.scrollTop = 0;
                          }}
                        >
                          {c.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Map view modal toggle */}
              <button className="tiktok-map-btn" onClick={() => setIsMapOpen(true)}>
                <Map size={14} /> Mapa
              </button>
            </div>

            {/* Subheader Filters: Todo / Lugares / Experiencias */}
            <div className="tiktok-tabs">
              {(['todo', 'lugar', 'experiencia'] as const).map((cat) => (
                <button
                  key={cat}
                  className={`tiktok-tab ${activeCategory === cat ? 'tiktok-tab-active' : ''}`}
                  onClick={() => {
                    setActiveCategory(cat);
                    setActiveIndex(0);
                    if (feedRef.current) feedRef.current.scrollTop = 0;
                  }}
                >
                  {cat === 'todo' ? 'Todo' : cat === 'lugar' ? 'Lugares' : 'Experiencias'}
                </button>
              ))}
            </div>
          </header>
        )}

        {/* Snap scrolling vertical feed container */}
        {currentCityConfig && (
          <div 
            ref={feedRef}
            className="tiktok-feed"
            onScroll={handleScroll}
          >
            {filteredSpots.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
                <Compass size={40} style={{ color: 'var(--city-accent)' }} />
                <p style={{ fontFamily: 'Outfit', fontWeight: 'bold', fontSize: '1rem' }}>No hay planes disponibles en esta categoría.</p>
              </div>
            ) : (
              filteredSpots.map((spot, index) => {
                const isLiked = likedSpots.has(spot.id);
                const isSaved = savedSpots.has(spot.id);
                const isExperience = getCategory(spot) === 'experiencia';
                const inView = index === activeIndex;

                return (
                  <div key={spot.id} className="tiktok-slide">
                    
                    {/* Media Background container */}
                    <div className="tiktok-media-container">
                      <img 
                        src={spot.imageUrl} 
                        alt={spot.name} 
                        className={`tiktok-media ${inView ? 'tiktok-media-active' : ''}`}
                        loading="lazy"
                      />
                      <div className="tiktok-overlay-gradient" />
                    </div>

                    {/* Right-side Interaction icons */}
                    <div className="tiktok-actions">
                      {/* Like Action */}
                      <div className="tiktok-action-item">
                        <button 
                          className={`tiktok-action-btn ${isLiked ? 'active' : ''}`}
                          onClick={() => toggleLike(spot.id)}
                          aria-label="Me gusta"
                        >
                          <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
                        </button>
                        <span className="tiktok-action-label">{isLiked ? '101' : '100'}</span>
                      </div>

                      {/* Save Action */}
                      <div className="tiktok-action-item">
                        <button 
                          className={`tiktok-action-btn ${isSaved ? 'active-save' : ''}`}
                          onClick={() => toggleSave(spot.id)}
                          aria-label="Guardar"
                        >
                          <Bookmark size={20} fill={isSaved ? 'currentColor' : 'none'} />
                        </button>
                        <span className="tiktok-action-label">Guardar</span>
                      </div>

                      {/* Share Action */}
                      <div className="tiktok-action-item">
                        <button 
                          className="tiktok-action-btn"
                          onClick={() => handleShare(spot.name)}
                          aria-label="Compartir"
                        >
                          <Share2 size={20} />
                        </button>
                        <span className="tiktok-action-label">Compartir</span>
                      </div>
                    </div>

                    {/* Bottom Info text panel */}
                    <div className="tiktok-content">
                      <div className="tiktok-tag-row">
                        <span 
                          className="tiktok-badge" 
                          style={{ background: spot.colorAccent || activeCityConfig.accentColor }}
                        >
                          {spot.type}
                        </span>
                        <span className="tiktok-city-tag">{activeCityConfig.name}</span>
                      </div>

                      <h2 className="tiktok-title">{spot.name}</h2>

                      <div className="tiktok-meta-row">
                        {spot.rating && (
                          <span className="tiktok-rating">
                            ★ {spot.rating}
                          </span>
                        )}
                        {spot.price && <span className="tiktok-price">{spot.price}</span>}
                        {isExperience && spot.schedule && (
                          <span className="tiktok-schedule" style={{ '--city-accent': spot.colorAccent || activeCityConfig.accentColor } as React.CSSProperties}>
                            <Calendar size={12} style={{ marginRight: 2 }} />
                            {spot.schedule}
                          </span>
                        )}
                      </div>

                      <p className="tiktok-desc">"{spot.description}"</p>

                      {/* Context-aware Dynamic CTA */}
                      {isExperience && spot.bookingLink ? (
                        <a 
                          href={spot.bookingLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="tiktok-cta-link"
                          style={{ '--city-accent': spot.colorAccent || activeCityConfig.accentColor } as React.CSSProperties}
                        >
                          <ExternalLink size={14} /> Reservar / Unirse
                        </a>
                      ) : (
                        <a 
                          href={spot.mapsLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="tiktok-cta-link"
                          style={{ '--city-accent': spot.colorAccent || activeCityConfig.accentColor } as React.CSSProperties}
                        >
                          <MapPin size={14} /> Ver en Maps
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Fallback City Selector Overlay Modal */}
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
                <p className="city-selector-subtitle">Selecciona una ciudad para descubrir planes y experiencias únicas sin algoritmos.</p>
                
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
                        {c.id === 'hermosillo' ? 'Desierto y Café' : 'Rincones y Experiencias'}
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

        {/* Leaflet dark theme interactive map modal */}
        <AnimatePresence>
          {isMapOpen && currentCityConfig && (
            <motion.div 
              className="map-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMapOpen(false)}
            >
              <motion.div 
                className="map-modal-content"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="map-modal-header">
                  <h3 className="map-modal-title">Mapa interactivo — {activeCityConfig.name}</h3>
                  <button className="map-modal-close" onClick={() => setIsMapOpen(false)} aria-label="Cerrar mapa">
                    <X size={24} />
                  </button>
                </div>

                {/* Leaflet map hook mount */}
                <div ref={mapContainerRef} className="map-view-container" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
