import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Clock, MapPin, Calendar, X, Compass, ArrowRight, MessageCircle, ChevronDown } from 'lucide-react';
import citiesData from '../data/cities.json';
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

type Experience = {
  id: string;
  name: string;
  host: string;
  hostAvatar: string;
  category: 'Aventura' | 'Gastronomía' | 'Arte' | 'Música';
  imageUrl: string;
  rating: number;
  reviewsCount: number;
  price: string;
  duration: string;
  description: string;
  nextDate: string;
  location: string;
  city: 'Guadalajara' | 'Hermosillo';
  whatsAppLink: string;
  longDescription: string;
  images: string[];
  reservationInfo: string;
};

const EXPERIENCES: Experience[] = [
  {
    id: 'exp_001',
    name: 'Cata de Mezcales Ancestrales',
    host: 'Mateo Silva',
    hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
    category: 'Gastronomía',
    imageUrl: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=500&q=80',
    rating: 4.9,
    reviewsCount: 24,
    price: '$450 MXN',
    duration: '2.5 horas',
    location: 'Colonia Americana',
    city: 'Guadalajara',
    nextDate: 'Sábado 18 de Julio',
    description: 'Aprende a degustar mezcal artesanal y ancestral maridado con chocolate y frutas en un patio secreto.',
    longDescription: 'Te abriremos las puertas de un patio colonial escondido en la Colonia Americana. Probaremos 4 variedades de mezcales de pequeños productores de Oaxaca y Jalisco, y aprenderemos sobre los procesos de destilación en ollas de barro y cobre. Cada mezcal irá acompañado de un bocado diseñado para resaltar sus notas de humo, tierra y agave.',
    whatsAppLink: 'https://wa.me/523300000000?text=Hola!%20Quiero%20reservar%20un%20lugar%20para%20la%20Cata%20de%20Mezcales%20Ancestrales.',
    images: [
      'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=500&q=80',
      'https://images.unsplash.com/photo-1629168925203-8d26bb87d00f?w=500&q=80',
      'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&q=80'
    ],
    reservationInfo: 'Reserva pagando el 50% por transferencia. El lugar exacto se compartirá 24h antes del evento.'
  },
  {
    id: 'exp_002',
    name: 'Taller de Barro Negro Oaxaqueño',
    host: 'Carmen Mendoza',
    hostAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80',
    category: 'Arte',
    imageUrl: 'https://images.unsplash.com/photo-1565192647048-f997ded87920?w=500&q=80',
    rating: 5.0,
    reviewsCount: 18,
    price: '$380 MXN',
    duration: '3 horas',
    location: 'Tlaquepaque Centro',
    city: 'Guadalajara',
    nextDate: 'Domingo 19 de Julio',
    description: 'Moldea tu propia pieza en torno tradicional de pedal guiado por una artesana oaxaqueña.',
    longDescription: 'Una experiencia práctica e íntima. Carmen, artesana de cuarta generación de barro negro, te enseñará las técnicas básicas de amasado, centrado en el torno tradicional de pedal y el posterior bruñido con cuarzo para darle ese brillo negro metálico tan característico. Te llevarás la pieza que moldees en el taller.',
    whatsAppLink: 'https://wa.me/523300000000?text=Hola!%20Quiero%20reservar%20un%20lugar%20para%20el%20Taller%20de%20Barro%20Negro.',
    images: [
      'https://images.unsplash.com/photo-1565192647048-f997ded87920?w=500&q=80',
      'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=500&q=80'
    ],
    reservationInfo: 'Reserva directa por WhatsApp. Se aparta con $150 MXN. Incluye materiales y tu pieza horneada.'
  },
  {
    id: 'exp_003',
    name: 'Fotos en Azoteas y Techos Urbanos',
    host: 'Diego Morales',
    hostAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    category: 'Aventura',
    imageUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=500&q=80',
    rating: 4.8,
    reviewsCount: 32,
    price: '$300 MXN',
    duration: '2 horas',
    location: 'Colonia Centenario',
    city: 'Hermosillo',
    nextDate: 'Viernes 24 de Julio',
    description: 'Consigue perspectivas fotográficas espectaculares explorando azoteas escondidas del centro.',
    longDescription: 'Subiremos a tres techos con acceso controlado que ofrecen las mejores vistas panorámicas y atardeceres de Hermosillo. Ideal tanto para fotógrafos con cámara profesional como para quienes quieran tomar fotos increíbles con su celular. Te daré tips de composición, iluminación urbana y retrato al atardecer.',
    whatsAppLink: 'https://wa.me/526620000000?text=Hola!%20Quiero%20reservar%20un%20lugar%20para%20la%20Sesión%20de%20Fotos%20en%20Azoteas.',
    images: [
      'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=500&q=80',
      'https://images.unsplash.com/photo-1517409240409-df6322987a02?w=500&q=80',
      'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=500&q=80'
    ],
    reservationInfo: 'Máximo 6 personas. Cupo se reserva pagando el total por transferencia.'
  },
  {
    id: 'exp_004',
    name: 'Senderismo Nocturno en la Barranca',
    host: 'Sofía Ruiz',
    hostAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
    category: 'Aventura',
    imageUrl: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=500&q=80',
    rating: 4.9,
    reviewsCount: 15,
    price: '$350 MXN',
    duration: '4 horas',
    location: 'Barranca de Huentitán',
    city: 'Guadalajara',
    nextDate: 'Sábado 25 de Julio',
    description: 'Camina por senderos iluminados por la luna llena hasta un mirador natural de la barranca.',
    longDescription: 'Una desconexión total de la ciudad. Haremos un descenso controlado por senderos no turísticos de la Barranca de Huentitán durante las horas frescas de la noche. Usaremos lámparas frontales y disfrutaremos del silencio natural y la vista del río Santiago iluminado por la luna llena. Incluye snacks energéticos e hidratación.',
    whatsAppLink: 'https://wa.me/523300000000?text=Hola!%20Quiero%20reservar%20un%20lugar%20para%20el%20Senderismo%20Nocturno.',
    images: [
      'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=500&q=80',
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=500&q=80'
    ],
    reservationInfo: 'Se requiere calzado de montaña. Se aparta lugar pagando el costo total.'
  },
  {
    id: 'exp_005',
    name: 'Acústico Secreto en Sótano de Jazz',
    host: 'Rodrigo Peña',
    hostAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
    category: 'Música',
    imageUrl: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=500&q=80',
    rating: 4.9,
    reviewsCount: 20,
    price: '$250 MXN',
    duration: '2 horas',
    location: 'Centro Histórico',
    city: 'Hermosillo',
    nextDate: 'Jueves 30 de Julio',
    description: 'Un concierto acústico exclusivo de jazz y folk para solo 15 personas en un sótano secreto.',
    longDescription: 'Baja cuatro escalones y entra a un sótano de ladrillo expuesto donde el sonido rebota de forma perfecta. Disfrutarás de un set íntimo de 2 horas con tres músicos independientes locales. Una experiencia pensada para escuchar música con atención plena, tomar una copa de vino y charlar en un ambiente cercano y relajado.',
    whatsAppLink: 'https://wa.me/526620000000?text=Hola!%20Quiero%20reservar%20un%20lugar%20para%20el%20Acústico%20Secreto.',
    images: [
      'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=500&q=80',
      'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=500&q=80',
      'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&q=80'
    ],
    reservationInfo: 'Boletos físicos disponibles. Transferencia para asegurar tu lugar. BYOB permitido.'
  }
];

const CATEGORIES = ['Todo', 'Aventura', 'Gastronomía', 'Arte', 'Música'];

export default function ExperienciasPage() {
  const navigate = useNavigate();
  const { city } = useParams();
  const location = useLocation();
  
  const [activeCategory, setActiveCategory] = useState<string>('Todo');
  const [selectedExp, setSelectedExp] = useState<Experience | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Auto-open experience if passed in location state
  useEffect(() => {
    if (location.state?.selectedExpId) {
      const exp = EXPERIENCES.find(e => e.id === location.state.selectedExpId);
      if (exp) {
        setSelectedExp(exp);
        navigate(location.pathname, { replace: true, state: {} });
      }
    }
  }, [location.state, location.pathname, navigate]);

  // Find active city config
  const currentCityConfig = citiesData.find(c => c.id === city);
  const activeCityConfig = currentCityConfig || citiesData.find(c => c.id === 'hermosillo') || citiesData[0];

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
  const cityExperiences = EXPERIENCES.filter(e => e.city.toLowerCase() === activeCityConfig.id.toLowerCase());

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

      {/* Horizontal Category Filters */}
      <div className="exp-filters-container">
        <div className="exp-filters-scroll">
          {CATEGORIES.map(category => (
            <button
              key={category}
              className={`filter-badge-btn ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Main Experiences Area */}
      <main className="experiences-list-area">
        {activeCategory === 'Todo' ? (
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

      {/* Bottom Sheet Modal Detail */}
      <AnimatePresence>
        {selectedExp && (
          <div className="bottom-sheet-backdrop" onClick={() => setSelectedExp(null)}>
            <motion.div
              className="bottom-sheet-content"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Close Button */}
              <button className="sheet-close-btn" onClick={() => setSelectedExp(null)}>
                <X size={18} />
              </button>

              {/* Carousel Cover Images */}
              <div className="sheet-carousel-wrapper">
                <div className="sheet-category-badge">{selectedExp.category}</div>
                <div 
                  className="sheet-carousel"
                  onScroll={(e) => {
                    const el = e.currentTarget;
                    const index = Math.round(el.scrollLeft / el.clientWidth);
                    const dots = el.parentElement?.querySelectorAll('.carousel-dot');
                    dots?.forEach((dot, i) => {
                      if (i === index) dot.classList.add('active');
                      else dot.classList.remove('active');
                    });
                  }}
                >
                  {selectedExp.images.map((img, idx) => (
                    <div 
                      key={idx} 
                      className="sheet-carousel-item"
                      style={{ backgroundImage: `url(${img})` }}
                    />
                  ))}
                </div>
                {selectedExp.images.length > 1 && (
                  <div className="carousel-dots-container">
                    {selectedExp.images.map((_, idx) => (
                      <div key={idx} className={`carousel-dot ${idx === 0 ? 'active' : ''}`} />
                    ))}
                  </div>
                )}
              </div>

              {/* Sheet Body Scrollable Area */}
              <div className="sheet-body">
                <h2 className="sheet-title">{selectedExp.name}</h2>
                
                {/* Meta details strip */}
                <div className="sheet-meta-strip">
                  <div className="sheet-meta-item">
                    <Star size={13} fill="currentColor" className="star-icon" />
                    <span>{selectedExp.rating} ({selectedExp.reviewsCount} reseñas)</span>
                  </div>
                  <div className="sheet-meta-item">
                    <Clock size={13} />
                    <span>{selectedExp.duration}</span>
                  </div>
                </div>

                {/* Host Card Section */}
                <div className="host-section-card">
                  <img src={selectedExp.hostAvatar} alt={selectedExp.host} className="host-avatar" />
                  <div>
                    <span className="host-label">Anfitrión local</span>
                    <h3 className="host-name">{selectedExp.host}</h3>
                  </div>
                </div>

                {/* Description */}
                <div className="sheet-description-section">
                  <h4 className="section-heading">¿De qué se trata?</h4>
                  <p>{selectedExp.longDescription}</p>
                </div>



                {/* Logistics */}
                <div className="sheet-logistics-list">
                  <div className="logistics-item">
                    <MapPin size={16} />
                    <div>
                      <h5>Punto de encuentro</h5>
                      <p>{selectedExp.location} · {selectedExp.city}</p>
                    </div>
                  </div>
                  <div className="logistics-item">
                    <Calendar size={16} />
                    <div>
                      <h5>Próxima fecha disponible</h5>
                      <p>{selectedExp.nextDate}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky bottom checkout row */}
              <div className="sheet-checkout-row">
                <div className="price-box">
                  <span className="price-label">PRECIO</span>
                  <span className="price-value">{selectedExp.price} <span className="price-unit">/ pers</span></span>
                </div>
                <a 
                  href={selectedExp.whatsAppLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="whatsapp-reserve-btn"
                >
                  Reservar lugar <MessageCircle size={15} fill="currentColor" />
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* Helper Card Component */
function ExperienceCard({ 
  exp, 
  onClick, 
  size = 'standard' 
}: { 
  exp: Experience; 
  onClick: (exp: Experience) => void;
  size?: 'standard' | 'large';
}) {
  return (
    <div 
      className={`experience-card ${size === 'large' ? 'card-large' : ''}`}
      onClick={() => onClick(exp)}
    >
      <div 
        className="card-image"
        style={{ backgroundImage: `url(${exp.imageUrl})` }}
      >
        <div className="card-image-gradient"></div>
        <span className="card-badge">{exp.category}</span>
        
        {/* Hover action preview */}
        <div className="card-hover-action">
          <span>Ver Detalles</span>
          <ArrowRight size={13} strokeWidth={2.5} />
        </div>
      </div>
      <div className="card-body">
        <div className="card-rating">
          <Star size={11} fill="currentColor" />
          <span>{exp.rating} ({exp.reviewsCount})</span>
          <span style={{ margin: '0 4px', opacity: 0.3 }}>•</span>
          <span className="card-city-tag" style={{ color: exp.city === 'Hermosillo' ? '#ff7a45' : '#8b7cf6', fontWeight: 800, textTransform: 'uppercase', fontSize: '0.62rem', letterSpacing: '0.5px' }}>{exp.city}</span>
        </div>
        <h3 className="card-title">{exp.name}</h3>
        <p className="card-desc">{exp.description}</p>
        <div className="card-footer">
          <span className="card-price">{exp.price}</span>
          <span className="card-duration"><Clock size={11} /> {exp.duration}</span>
        </div>
      </div>
    </div>
  );
}
