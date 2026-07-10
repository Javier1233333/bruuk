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
  ArrowLeft,
  MessageSquare
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

// Generates dynamic customized user reviews and curators explanations based on spot profile
const getSpotReviewsAndDetails = (spot: Spot) => {
  const isCafe = spot.type.toLowerCase().includes('caf');
  const isRestaurante = spot.type.toLowerCase().includes('rest') || spot.type.toLowerCase().includes('comid');
  const isExperiencia = spot.category === 'experiencia' || spot.type === 'Experiencia';

  let explanation = `Este es uno de los rincones más especiales de la ciudad. Seleccionado por el equipo de Bruuk debido a su propuesta honesta, atmósfera acogedora y atención al detalle. Ideal para desconectarse o tener una plática profunda.`;
  let reviews = [
    { author: "Sofía M.", text: "Me encanta venir aquí por las tardes. La vibra es súper relajada y la música siempre está al volumen perfecto.", rating: 5 },
    { author: "Carlos R.", text: "Excelente servicio. Se nota el cariño que le ponen a todo lo que hacen. Totalmente recomendado.", rating: 4 }
  ];

  if (isCafe) {
    explanation = `Un refugio perfecto para los amantes del buen café. Destaca por su tostado artesanal, métodos de extracción impecables y un ambiente diseñado para sentarse a leer, escribir o trabajar con tranquilidad.`;
    reviews = [
      { author: "Mariana G.", text: "El café filtrado de aquí es de otro nivel. Los baristas saben muchísimo y te explican el origen del grano.", rating: 5 },
      { author: "Daniel H.", text: "Muy buena conexión de internet y el pan dulce siempre fresco. Mi spot favorito para hacer home office.", rating: 5 },
      { author: "Elena P.", text: "Un poco lleno los fines de semana, pero vale la pena hacer fila por ese latte.", rating: 4 }
    ];
  } else if (isExperiencia) {
    explanation = `Una experiencia grupal diseñada para conectar con gente local mientras aprendes algo nuevo. Todas nuestras experiencias son guiadas por expertos apasionados y se realizan en grupos pequeños para mantener la intimidad.`;
    reviews = [
      { author: "Rodrigo T.", text: "Increíble dinámica. Fui solo y salí con tres nuevos amigos. Las risas no faltaron.", rating: 5 },
      { author: "Lucía F.", text: "Muy bien organizada y las explicaciones súper claras. Ideal para hacer un plan diferente el fin de semana.", rating: 5 }
    ];
  } else if (isRestaurante) {
    explanation = `Una parada obligatoria para los foodies. Su menú ofrece una mezcla de sabores locales frescos con técnicas culinarias creativas. Cada platillo cuenta una historia y está diseñado para ser compartido.`;
    reviews = [
      { author: "Mateo S.", text: "La comida es deliciosa y las porciones son perfectas. No se vayan sin probar el postre de la casa.", rating: 5 },
      { author: "Valeria C.", text: "Ambiente muy íntimo y el maridaje de bebidas es excelente. Ideal para una cena especial.", rating: 4 }
    ];
  }

  return { explanation, reviews };
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
  const [selectedMapSpotId, setSelectedMapSpotId] = useState<string | null>(null);
  
  // Sliding Reviews sheet active spot state
  const [activeReviewsSpotId, setActiveReviewsSpotId] = useState<string | null>(null);

  // Filters within the map modal itself
  const [mapFilterCategory, setMapFilterCategory] = useState<'todo' | 'lugar' | 'experiencia'>('todo');

  // Custom drag state to disable snap scroll on active drag
  const [isGrabbing, setIsGrabbing] = useState(false);

  const feedRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Drag-to-scroll references
  const isDragging = useRef(false);
  const startY = useRef(0);
  const scrollTopStart = useRef(0);
  const dragDistance = useRef(0);

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

  // Dynamic feed order
  const [reorderedSpots, setReorderedSpots] = useState<Spot[]>([]);

  // Keep reordered list synced with filters
  useEffect(() => {
    setReorderedSpots(filteredSpots);
    setActiveIndex(0);
    setActiveReviewsSpotId(null);
    if (feedRef.current) {
      feedRef.current.scrollTop = 0;
    }
  }, [activeCategory, city]);

  // Close dropdown on click outside
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClose = () => setIsDropdownOpen(false);
    document.addEventListener('click', handleClose);
    return () => document.removeEventListener('click', handleClose);
  }, [isDropdownOpen]);

  // Handle vertical snapping scroll to find the active slide
  const handleScroll = useCallback(() => {
    if (!feedRef.current || isDragging.current) return;
    const scrollTop = feedRef.current.scrollTop;
    const clientHeight = feedRef.current.clientHeight;
    // Calculate which index is in view
    const index = Math.round(scrollTop / clientHeight);
    if (index !== activeIndex && index >= 0 && index < reorderedSpots.length) {
      setActiveIndex(index);
      setActiveReviewsSpotId(null); // Close reviews when switching slides
    }
  }, [activeIndex, reorderedSpots.length]);

  // Scroll directly to a specific slide index
  const scrollToSlide = useCallback((index: number, smooth = true) => {
    if (!feedRef.current) return;
    const clientHeight = feedRef.current.clientHeight;
    feedRef.current.scrollTo({
      top: index * clientHeight,
      behavior: smooth ? 'smooth' : 'auto'
    });
    setActiveIndex(index);
    setActiveReviewsSpotId(null); // Close reviews
  }, []);

  // Redirect desktop mouse wheel scrolls anywhere on the screen to the snap feed container
  useEffect(() => {
    const handleGlobalWheel = (e: WheelEvent) => {
      if (!feedRef.current || isMapOpen) return;

      const target = e.target as HTMLElement;
      // If cursor is already inside the feed, browser handles wheel scroll natively
      if (target.closest('.tiktok-feed') || target.closest('.tiktok-reviews-sheet')) return;

      // Scroll the feed manually
      feedRef.current.scrollTop += e.deltaY;
    };

    window.addEventListener('wheel', handleGlobalWheel, { passive: true });
    return () => window.removeEventListener('wheel', handleGlobalWheel);
  }, [isMapOpen]);

  // Drag-to-scroll mouse click-drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Left click only
    const target = e.target as HTMLElement;
    // Prevent dragging when clicking buttons, links, maps, or reviews panel
    if (
      target.closest('.tiktok-actions') || 
      target.closest('.tiktok-cta-link') || 
      target.closest('a') || 
      target.closest('button') ||
      target.closest('.map-view-container') ||
      target.closest('.leaflet-container') ||
      target.closest('.tiktok-reviews-sheet')
    ) return;

    isDragging.current = true;
    setIsGrabbing(true); // Disable snapping on drag
    startY.current = e.pageY;
    scrollTopStart.current = feedRef.current ? feedRef.current.scrollTop : 0;
    dragDistance.current = 0;
    document.body.style.userSelect = 'none';
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !feedRef.current) return;
    const y = e.pageY;
    const walk = y - startY.current;
    dragDistance.current = walk;
    feedRef.current.scrollTop = scrollTopStart.current - walk;
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    setIsGrabbing(false); // Enable snap scroll back
    document.body.style.userSelect = '';

    if (!feedRef.current) return;
    
    // Snap threshold: if dragged more than 60px, jump to next/previous slide
    const threshold = 60;
    if (Math.abs(dragDistance.current) > threshold) {
      if (dragDistance.current < 0) {
        // Dragged up -> Go to next
        const nextIdx = Math.min(activeIndex + 1, reorderedSpots.length - 1);
        scrollToSlide(nextIdx);
      } else {
        // Dragged down -> Go to previous
        const prevIdx = Math.max(activeIndex - 1, 0);
        scrollToSlide(prevIdx);
      }
    } else {
      // Revert back to active slide
      scrollToSlide(activeIndex);
    }
  };

  // Select a spot from map popup: places it at index 0 and jumps instantly
  const handleSelectSpotFromMap = useCallback((spotId: string) => {
    const selectedSpot = filteredSpots.find(s => s.id === spotId);
    if (!selectedSpot) return;

    const rest = filteredSpots.filter(s => s.id !== spotId);
    const newOrder = [selectedSpot, ...rest];
    
    setReorderedSpots(newOrder);
    scrollToSlide(0, false); // Instant jump
    setIsMapOpen(false);
    setSelectedMapSpotId(null);
  }, [filteredSpots, scrollToSlide]);

  // Open map focused on a specific spot
  const handleOpenMapForSpot = (spotId: string) => {
    setSelectedMapSpotId(spotId);
    setIsMapOpen(true);
  };

  // Close map modal
  const handleCloseMap = () => {
    setIsMapOpen(false);
    setSelectedMapSpotId(null);
  };

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

  // Redirect to hermosillo by default on mount if no city parameter
  useEffect(() => {
    if (!city) {
      navigate('/descubrir/hermosillo', { replace: true });
    }
  }, [city, navigate]);

  // Leaflet Map instance initializer
  useEffect(() => {
    if (!isMapOpen || !mapContainerRef.current || !currentCityConfig) return;

    // Filter spots shown on the map based on mapFilterCategory
    const mapFilteredSpots = filteredSpots.filter(spot => {
      if (mapFilterCategory === 'todo') return true;
      const cat = getCategory(spot);
      return cat === mapFilterCategory;
    });

    // Center coordinates: if selected a spot from the feed, center on it, otherwise city default
    const focusedSpot = mapFilteredSpots.find(s => s.id === selectedMapSpotId);
    const lat = focusedSpot?.coordinates?.lat || activeCityConfig.defaultCoordinates.lat;
    const lng = focusedSpot?.coordinates?.lng || activeCityConfig.defaultCoordinates.lng;

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: focusedSpot ? 15 : 13,
      zoomControl: true,
      attributionControl: false
    });

    // Dark theme map tiles (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19
    }).addTo(map);

    // Add pins for mapFilteredSpots
    mapFilteredSpots.forEach((spot) => {
      if (!spot.coordinates) return;

      const accentColor = spot.colorAccent || activeCityConfig.accentColor;
      const marker = L.marker([spot.coordinates.lat, spot.coordinates.lng], {
        icon: createCustomMarkerIcon(accentColor)
      }).addTo(map);

      const isExperience = getCategory(spot) === 'experiencia';

      marker.bindPopup(`
        <div class="map-popup-inner" style="font-family: 'DM Sans', sans-serif; color: #fff;">
          <div style="width: 100%; height: 90px; overflow: hidden; margin-bottom: 8px;">
            <img src="${spot.imageUrl}" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
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
          <div style="display: flex; gap: 8px; margin-top: 8px;">
            <button class="map-go-to-feed-btn" data-spot-id="${spot.id}" style="
              flex: 1;
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
            <a href="${spot.mapsLink}" target="_blank" rel="noopener noreferrer" style="
              flex: 1;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              background: #0e0d1a;
              color: #fff;
              font-family: 'Outfit', sans-serif;
              font-weight: 800;
              border: 2px solid #fff;
              padding: 6px;
              font-size: 0.7rem;
              cursor: pointer;
              text-transform: uppercase;
              letter-spacing: 1px;
              text-decoration: none;
              box-shadow: 2px 2px 0px ${accentColor};
              transition: all 0.1s;
            ">Cómo llegar</a>
          </div>
        </div>
      `);

      // Auto open popup if this marker was selected
      if (spot.id === selectedMapSpotId) {
        marker.openPopup();
      }
    });

    // Delegate click on Ver en Feed inside Leaflet popup HTML
    const handlePopupOpen = (e: L.PopupEvent) => {
      const container = e.popup.getElement();
      if (!container) return;
      const btn = container.querySelector('.map-go-to-feed-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          const spotId = btn.getAttribute('data-spot-id');
          if (spotId) {
            handleSelectSpotFromMap(spotId);
          }
        });
      }
    };

    map.on('popupopen', handlePopupOpen);

    return () => {
      map.off('popupopen', handlePopupOpen);
      map.remove();
    };
  }, [isMapOpen, filteredSpots, activeCityConfig, currentCityConfig, selectedMapSpotId, handleSelectSpotFromMap, mapFilterCategory]);

  return (
    <div 
      className="ocean-container"
      style={{
        '--city-accent': activeCityConfig.accentColor
      } as React.CSSProperties}
    >
      {/* Dynamic Desktop Blurred Background */}
      {reorderedSpots.length > 0 && (
        <div 
          className="desktop-bg-blur"
          style={{
            backgroundImage: `url(${reorderedSpots[activeIndex]?.imageUrl})`
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

        {/* Custom Translucent Centered Header */}
        {currentCityConfig && (
          <header className="tiktok-header">
            <div className="tiktok-header-row" style={{ flexDirection: 'column', gap: '0.6rem', alignItems: 'center' }}>
              
              {/* Row 1: Back, Logo, and Map buttons */}
              <div style={{ 
                position: 'relative', 
                display: 'flex', 
                width: '100%', 
                justifyContent: 'center', 
                alignItems: 'center',
                minHeight: '36px' 
              }}>
                <button 
                  className="tiktok-back-btn" 
                  onClick={() => navigate('/')} 
                  aria-label="Inicio"
                  style={{ position: 'absolute', left: 0 }}
                >
                  <ArrowLeft size={16} />
                </button>

                {/* Centered Bruuk Logo */}
                <div className="tiktok-logo" onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center' }}>
                  <BruukLogo />
                </div>

                <button 
                  className="tiktok-map-btn" 
                  onClick={() => setIsMapOpen(true)}
                  style={{ position: 'absolute', right: 0 }}
                >
                  <Map size={14} /> Mapa
                </button>
              </div>

              {/* Row 2: Centered City selector */}
              <div className="tiktok-city-container">
                <button 
                  className="tiktok-city-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDropdownOpen(!isDropdownOpen);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '0.82rem',
                    letterSpacing: '1.5px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 0'
                  }}
                >
                  EXPLORANDO EN <span style={{ color: 'var(--city-accent)', textDecoration: 'underline', fontWeight: 900 }}>{activeCityConfig.name}</span> <ChevronDown size={12} />
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
                      {/* GPS auto locator */}
                      <button
                        className="tiktok-city-item"
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
                        <MapPin size={12} /> Detectar GPS
                      </button>

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
            className={`tiktok-feed ${isGrabbing ? 'grabbing' : ''}`}
            onScroll={handleScroll}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {reorderedSpots.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
                <Compass size={40} style={{ color: 'var(--city-accent)' }} />
                <p style={{ fontFamily: 'Outfit', fontWeight: 'bold', fontSize: '1rem' }}>No hay planes disponibles en esta categoría.</p>
              </div>
            ) : (
              reorderedSpots.map((spot, index) => {
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
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(spot.id);
                          }}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSave(spot.id);
                          }}
                          aria-label="Guardar"
                        >
                          <Bookmark size={20} fill={isSaved ? 'currentColor' : 'none'} />
                        </button>
                        <span className="tiktok-action-label">Guardar</span>
                      </div>

                      {/* Opinions Drawer Toggle */}
                      <div className="tiktok-action-item">
                        <button 
                          className={`tiktok-action-btn ${activeReviewsSpotId === spot.id ? 'active' : ''}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveReviewsSpotId(activeReviewsSpotId === spot.id ? null : spot.id);
                          }}
                          aria-label="Opiniones"
                          style={{
                            color: activeReviewsSpotId === spot.id ? 'var(--city-accent)' : '#fff',
                            borderColor: activeReviewsSpotId === spot.id ? 'var(--city-accent)' : 'rgba(255,255,255,0.15)'
                          }}
                        >
                          <MessageSquare size={20} />
                        </button>
                        <span className="tiktok-action-label">Opiniones</span>
                      </div>

                      {/* Share Action */}
                      <div className="tiktok-action-item">
                        <button 
                          className="tiktok-action-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(spot.name);
                          }}
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

                      {/* Context-aware Dynamic CTA (Opens map focused or booking external site) */}
                      {isExperience && spot.bookingLink ? (
                        <a 
                          href={spot.bookingLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="tiktok-cta-link"
                          style={{ '--city-accent': spot.colorAccent || activeCityConfig.accentColor } as React.CSSProperties}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink size={14} /> Reservar / Unirse
                        </a>
                      ) : (
                        <button 
                          className="tiktok-cta-link"
                          style={{ '--city-accent': spot.colorAccent || activeCityConfig.accentColor } as React.CSSProperties}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenMapForSpot(spot.id);
                          }}
                        >
                          <MapPin size={14} /> Ver Ubicación
                        </button>
                      )}
                    </div>

                    {/* Bottom Sheet Drawer for Reviews & Explanations */}
                    <AnimatePresence>
                      {activeReviewsSpotId === spot.id && (
                        <motion.div 
                          className="tiktok-reviews-sheet"
                          initial={{ y: '100%' }}
                          animate={{ y: 0 }}
                          exit={{ y: '100%' }}
                          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="reviews-sheet-header">
                            <div className="reviews-sheet-handle" onClick={() => setActiveReviewsSpotId(null)} />
                            <h3 className="reviews-sheet-title">Detalles y Opiniones</h3>
                            <button className="reviews-sheet-close" onClick={() => setActiveReviewsSpotId(null)}>
                              <X size={18} />
                            </button>
                          </div>
                          <div className="reviews-sheet-body">
                            <div className="reviews-section-title" style={{ color: spot.colorAccent || activeCityConfig.accentColor }}>El veredicto de Bruuk</div>
                            <p className="reviews-explanation">{getSpotReviewsAndDetails(spot).explanation}</p>
                            
                            <div className="reviews-section-title" style={{ marginTop: '1.2rem', color: spot.colorAccent || activeCityConfig.accentColor }}>Opiniones de la Comunidad</div>
                            <div className="reviews-list">
                              {getSpotReviewsAndDetails(spot).reviews.map((r, i) => (
                                <div key={i} className="review-item">
                                  <div className="review-author-row">
                                    <span className="review-author">{r.author}</span>
                                    <span className="review-stars">{"★".repeat(r.rating)}</span>
                                  </div>
                                  <p className="review-text">"{r.text}"</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
              onClick={handleCloseMap}
            >
              <motion.div 
                className="map-modal-content"
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header of Map Modal featuring dynamic category filters */}
                <div className="map-modal-header" style={{ flexDirection: 'column', gap: '0.8rem', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 className="map-modal-title">Mapa interactivo — {activeCityConfig.name}</h3>
                    <button className="map-modal-close" onClick={handleCloseMap} aria-label="Cerrar mapa">
                      <X size={24} />
                    </button>
                  </div>
                  
                  {/* Category filters within Leaflet Map */}
                  <div className="map-modal-filters">
                    {(['todo', 'lugar', 'experiencia'] as const).map((cat) => (
                      <button
                        key={cat}
                        className={`map-filter-pill ${mapFilterCategory === cat ? 'active' : ''}`}
                        onClick={() => setMapFilterCategory(cat)}
                        style={{ '--btn-accent': activeCityConfig.accentColor } as React.CSSProperties}
                      >
                        {cat === 'todo' ? 'Todo' : cat === 'lugar' ? 'Lugares' : 'Experiencias'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Leaflet map hook mount */}
                <div ref={mapContainerRef} className="map-view-container" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Desktop floating navigation arrows (positioned OUTSIDE phone container) */}
      {currentCityConfig && reorderedSpots.length > 0 && (
        <div className="tiktok-desktop-arrows">
          <button 
            className="tiktok-desktop-arrow"
            onClick={() => {
              const prevIdx = Math.max(activeIndex - 1, 0);
              scrollToSlide(prevIdx);
            }}
            disabled={activeIndex === 0}
            aria-label="Anterior"
          >
            ▲
          </button>
          <button 
            className="tiktok-desktop-arrow"
            onClick={() => {
              const nextIdx = Math.min(activeIndex + 1, reorderedSpots.length - 1);
              scrollToSlide(nextIdx);
            }}
            disabled={activeIndex === reorderedSpots.length - 1}
            aria-label="Siguiente"
          >
            ▼
          </button>
        </div>
      )}
    </div>
  );
}
