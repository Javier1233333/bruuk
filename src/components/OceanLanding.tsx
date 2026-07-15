import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
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
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import experiencesData from '../data/experiences.json';
import { INTERESTS } from '../pages/ProfileSetupPage';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './OceanLanding.css';

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

export type OceanLandingProps =
  | { mode?: 'standalone' }
  | { mode: 'embedded' };

const getCategory = (spot: Spot): 'lugar' | 'experiencia' => {
  return spot.category || (spot.type === 'Experiencia' ? 'experiencia' : 'lugar');
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

export function OceanLanding({ mode = 'standalone' }: OceanLandingProps = {}) {
  const { city } = useParams();
  const instanceKey = mode === 'standalone' ? city || 'selector' : 'embedded';

  return <OceanLandingInner key={instanceKey} mode={mode} />;
}

function OceanLandingInner({ mode }: { mode: 'standalone' | 'embedded' }) {
  const navigate = useNavigate();
  const { city: routeCity } = useParams();
  const [embeddedCity, setEmbeddedCity] = useState<string | null>(null);
  const city = mode === 'embedded' ? embeddedCity : routeCity;
  const { user } = useAuth();

  // App States
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Onboarding States
  const [onboardingStep, setOnboardingStep] = useState<number>(0);
  const [onboardingInterests, setOnboardingInterests] = useState<Set<string>>(new Set());
  
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
  const mapDialogRef = useRef<HTMLDivElement>(null);
  const mapCloseButtonRef = useRef<HTMLButtonElement>(null);
  const cityDialogRef = useRef<HTMLDivElement>(null);
  const firstCityButtonRef = useRef<HTMLButtonElement>(null);
  const reviewsDialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Drag-to-scroll references
  const isDragging = useRef(false);
  const startY = useRef(0);
  const scrollTopStart = useRef(0);
  const dragDistance = useRef(0);

  // Find active city config. The fallback only provides an accent while the selector is visible.
  const currentCityConfig = citiesData.find(c => c.id === city);
  const activeCityConfig = currentCityConfig || citiesData.find(c => c.id === 'hermosillo') || citiesData[0];

  const [spots, setSpots] = useState<Spot[]>([]);
  const [loadingSpots, setLoadingSpots] = useState(true);

  // Fetch spots from Supabase or fallback to local JSON
  useEffect(() => {
    const fetchSpots = async () => {
      setLoadingSpots(true);
      try {
        // Fetch spots
        const { data: dbSpots, error: spotsErr } = await supabase
          .from('spots')
          .select('*')
          .eq('city', activeCityConfig.id);

        if (spotsErr) throw spotsErr;

        // Fetch experiences
        const { data: dbExps, error: expsErr } = await supabase
          .from('experiences')
          .select('*')
          .eq('city', activeCityConfig.id)
          .eq('status', 'approved');

        if (expsErr) console.warn('[BRUUK] Error loading experiences for feed:', expsErr);

        const mappedSpots: Spot[] = (dbSpots || []).map(s => ({
          id: s.id,
          city: s.city,
          category: 'lugar',
          name: s.name,
          type: s.type || '',
          description: s.description || '',
          imageUrl: s.image_url || '',
          colorAccent: s.color_accent || '',
          mapsLink: s.maps_link || '',
          rating: s.rating ? Number(s.rating) : undefined,
          price: s.price || undefined,
          coordinates: s.lat && s.lng ? { lat: Number(s.lat), lng: Number(s.lng) } : undefined,
        }));

        const mappedExps: Spot[] = (dbExps || []).map(e => ({
          id: e.id,
          city: e.city,
          category: 'experiencia',
          name: e.name,
          type: 'Experiencia',
          description: e.description || '',
          imageUrl: e.image_url || '',
          colorAccent: '#8b7cf6',
          mapsLink: `https://maps.google.com/?q=${encodeURIComponent(e.location)}`,
          rating: e.rating ? Number(e.rating) : undefined,
          price: e.price || undefined,
          coordinates: e.lat && e.lng ? { lat: Number(e.lat), lng: Number(e.lng) } : undefined,
          bookingLink: 'true',
          schedule: 'Próximamente'
        }));

        if (mappedSpots.length === 0 && mappedExps.length === 0) {
          throw new Error('No spots in DB, falling back to local');
        }

        setSpots([...mappedSpots, ...mappedExps]);
      } catch (err) {
        console.warn('[BRUUK] Fallback to local JSON for spots & experiences due to error:', err);
        
        const localSpots = spotsData
          .filter(s => s.city === activeCityConfig.id)
          .map((s: any) => ({
            id: s.id,
            city: s.city,
            category: 'lugar',
            name: s.name,
            type: s.type || '',
            description: s.description || '',
            imageUrl: s.imageUrl || '',
            colorAccent: s.colorAccent || '',
            mapsLink: s.mapsLink || '',
            rating: s.rating ? Number(s.rating) : undefined,
            price: s.price || undefined,
            coordinates: s.coordinates ? { lat: Number(s.coordinates.lat), lng: Number(s.coordinates.lng) } : undefined,
          }));

        const localExps = (experiencesData || [])
          .filter(e => e.city.toLowerCase() === activeCityConfig.id.toLowerCase() && e.status === 'approved')
          .map((e: any) => ({
            id: e.id,
            city: e.city,
            category: 'experiencia',
            name: e.name,
            type: 'Experiencia',
            description: e.description || '',
            imageUrl: e.image_url || '',
            colorAccent: '#8b7cf6',
            mapsLink: `https://maps.google.com/?q=${encodeURIComponent(e.location)}`,
            rating: e.rating ? Number(e.rating) : undefined,
            price: e.price || undefined,
            bookingLink: 'true',
            schedule: 'Próximamente'
          }));

        setSpots([...localSpots, ...localExps]);
      } finally {
        setLoadingSpots(false);
      }
    };

    fetchSpots();
  }, [activeCityConfig.id]);

  // Load saved spots from Supabase
  useEffect(() => {
    const fetchSavedSpots = async () => {
      if (!user) {
        setSavedSpots(new Set());
        return;
      }
      try {
        const { data, error } = await supabase
          .from('spot_saves')
          .select('spot_id')
          .eq('user_id', user.id);

        if (error) throw error;

        if (data) {
          setSavedSpots(new Set(data.map(item => item.spot_id)));
        }
      } catch (err) {
        console.warn('[BRUUK] Error loading saved spots:', err);
      }
    };

    fetchSavedSpots();
  }, [user]);

  // Filtered and sorted spots list based on preferences
  const filteredSpots = useMemo(() => {
    let base = spots.filter(s => {
      const category = getCategory(s);
      if (activeCategory === 'todo') return true;
      return category === activeCategory;
    });

    // Score and sort if we have interests
    let userInterests: string[] = [];
    try {
      const stored = localStorage.getItem('bruuk_interests') || localStorage.getItem('bruuk_guest_preferences');
      if (stored) {
        userInterests = JSON.parse(stored);
      }
    } catch (e) {}

    if (userInterests.length > 0) {
      base = base.sort((a, b) => {
        const getScore = (spot: Spot) => {
           let score = 0;
           const searchStr = (spot.type + ' ' + spot.description + ' ' + spot.name).toLowerCase();
           
           userInterests.forEach(interest => {
             const interestObj = INTERESTS.find(i => i.id === interest);
             if (interestObj) {
               const labelWords = interestObj.label.toLowerCase().split(/[ &\/]+/);
               labelWords.forEach(w => {
                 if (w.length > 3 && searchStr.includes(w)) score += 1;
               });
             }
             if (searchStr.includes(interest.toLowerCase())) score += 1;
             
             // Mappings for better accuracy
             if (interest === 'gastronomy' && (searchStr.includes('comida') || searchStr.includes('restaurante') || searchStr.includes('cena'))) score += 2;
             if (interest === 'live_music' && (searchStr.includes('concierto') || searchStr.includes('banda') || searchStr.includes('música'))) score += 2;
             if (interest === 'art' && (searchStr.includes('galería') || searchStr.includes('museo') || searchStr.includes('pintura'))) score += 2;
             if (interest === 'brunch' && (searchStr.includes('café') || searchStr.includes('desayuno'))) score += 2;
             if (interest === 'nightlife' && (searchStr.includes('bar') || searchStr.includes('antro') || searchStr.includes('cerveza') || searchStr.includes('noche'))) score += 2;
           });
           return score;
        };
        return getScore(b) - getScore(a);
      });
    }

    return base;
  }, [activeCategory, spots]);

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
  }, [activeCategory, city, filteredSpots]);

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

  const selectCity = useCallback((cityId: string) => {
    saveCity(cityId);
    try {
      setCookie('bruuk_city_selected', 'true');
      localStorage.setItem('bruuk_city_selected', 'true');
    } catch (e) {}

    // Check if onboarding needs to continue
    const hasOnboarding = getCookie('bruuk_onboarding_completed') === 'true' || localStorage.getItem('bruuk_onboarding_completed') === 'true';
    if (!hasOnboarding && !user) {
      setOnboardingStep(1); // Move to interests step
    } else {
      if (mode === 'embedded') {
        setEmbeddedCity(cityId);
      } else {
        navigate(`/descubrir/${cityId}`);
      }
      setIsDropdownOpen(false);
    }

    setActiveCategory('todo');
    setSpots([]); // Limpia spots para gatillar el esqueleto de carga
    setActiveIndex(0);
    setActiveReviewsSpotId(null);
    if (feedRef.current) feedRef.current.scrollTop = 0;
  }, [mode, navigate, user]);

  // Keep active city synced in storage
  useEffect(() => {
    if (city && currentCityConfig) {
      saveCity(city);
    }
  }, [city, currentCityConfig]);

  // Redirect to saved city on mount if no city parameter in standalone mode and they explicitly chose a city before
  useEffect(() => {
    if (mode === 'standalone' && !routeCity) {
      const isSelected = getCookie('bruuk_city_selected') === 'true' || localStorage.getItem('bruuk_city_selected') === 'true';
      const savedCity = getSavedCity();
      if (isSelected && savedCity && citiesData.some(c => c.id === savedCity)) {
        navigate(`/descubrir/${savedCity}`, { replace: true });
      }
    }
  }, [mode, routeCity, navigate]);

  // Invalid public slugs normalize to the city selector instead of silently using a fallback feed.
  useEffect(() => {
    if (mode === 'standalone' && routeCity && !currentCityConfig) {
      navigate('/descubrir', { replace: true });
    }
  }, [currentCityConfig, mode, navigate, routeCity]);

  useEffect(() => {
    if (mode !== 'standalone' || currentCityConfig) return;
    const focusTimer = window.setTimeout(() => firstCityButtonRef.current?.focus(), 0);
    return () => window.clearTimeout(focusTimer);
  }, [currentCityConfig, mode]);

  // Redirect desktop mouse wheel scrolls anywhere on the screen to the snap feed container
  useEffect(() => {
    if (mode !== 'standalone') return;

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
  }, [isMapOpen, mode]);

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

  useEffect(() => {
    if (!isMapOpen) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    const focusTimer = window.setTimeout(() => mapCloseButtonRef.current?.focus(), 0);

    return () => {
      window.clearTimeout(focusTimer);
      previouslyFocusedRef.current?.focus();
      previouslyFocusedRef.current = null;
    };
  }, [isMapOpen]);

  useEffect(() => {
    if (!activeReviewsSpotId) return;
    const focusTimer = window.setTimeout(() => reviewsDialogRef.current?.focus(), 0);
    return () => window.clearTimeout(focusTimer);
  }, [activeReviewsSpotId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (isMapOpen) {
          setIsMapOpen(false);
          setSelectedMapSpotId(null);
        } else if (activeReviewsSpotId) {
          setActiveReviewsSpotId(null);
        } else if (isDropdownOpen) {
          setIsDropdownOpen(false);
        }
        return;
      }

      if (event.key !== 'Tab') return;

      const dialog = isMapOpen
        ? mapDialogRef.current
        : activeReviewsSpotId
          ? reviewsDialogRef.current
          : !currentCityConfig && mode === 'standalone'
            ? cityDialogRef.current
            : null;
      if (!dialog) return;

      const focusableElements = Array.from(dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
      ));
      if (focusableElements.length === 0) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeReviewsSpotId, currentCityConfig, isDropdownOpen, isMapOpen, mode]);

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
  const toggleSave = async (id: string) => {
    if (!user) {
      triggerToast('Inicia sesión para guardar spots');
      return;
    }
    
    const isSaved = savedSpots.has(id);
    
    // UI Optimista
    setSavedSpots(prev => {
      const next = new Set(prev);
      if (isSaved) next.delete(id);
      else next.add(id);
      return next;
    });

    try {
      if (isSaved) {
        const { error } = await supabase
          .from('spot_saves')
          .delete()
          .eq('user_id', user.id)
          .eq('spot_id', id);
        if (error) throw error;
        triggerToast('Quitado de tus guardados');
      } else {
        const { error } = await supabase
          .from('spot_saves')
          .insert({ user_id: user.id, spot_id: id });
        if (error) throw error;
        triggerToast('Guardado en tus favoritos');
      }
    } catch (err) {
      console.error('Error al guardar/eliminar en Supabase:', err);
      // Revertir cambio optimista
      setSavedSpots(prev => {
        const next = new Set(prev);
        if (isSaved) next.add(id);
        else next.delete(id);
        return next;
      });
      triggerToast('Error de conexión. Inténtalo de nuevo.');
    }
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
          selectCity(closestCity.id);
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

    // Prevent duplicate map initialization
    const container = mapContainerRef.current;
    if ((container as any)._leaflet_id) {
      try {
        delete (container as any)._leaflet_id;
      } catch (e) {}
    }

    // Delegate click on Ver en Feed inside Leaflet popup HTML
    const handlePopupOpen = (e: L.PopupEvent) => {
      const popupContainer = e.popup.getElement();
      if (!popupContainer) return;
      const btn = popupContainer.querySelector('.map-go-to-feed-btn');
      if (btn) {
        btn.addEventListener('click', () => {
          const spotId = btn.getAttribute('data-spot-id');
          if (spotId) {
            handleSelectSpotFromMap(spotId);
          }
        });
      }
    };

    let map: L.Map | null = null;
    let sizeTimer: any;

    try {
      map = L.map(container, {
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
        }).addTo(map!);

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

      map.on('popupopen', handlePopupOpen);

      // Invalidate size after animation completes to fix grey map/hidden map bug in modal
      sizeTimer = setTimeout(() => {
        if (map) {
          map.invalidateSize();
        }
      }, 300);

    } catch (error) {
      console.error("Error initializing Leaflet map:", error);
    }

    return () => {
      if (sizeTimer) clearTimeout(sizeTimer);
      if (map) {
        try {
          map.off('popupopen', handlePopupOpen);
          map.remove();
        } catch (e) {
          console.warn("Error cleaning up Leaflet map:", e);
        }
      }
    };
  }, [isMapOpen, filteredSpots, activeCityConfig, currentCityConfig, selectedMapSpotId, handleSelectSpotFromMap, mapFilterCategory]);

  const isExplicitlySelected = getCookie('bruuk_city_selected') === 'true' || localStorage.getItem('bruuk_city_selected') === 'true';
  const hasOnboardingCompleted = getCookie('bruuk_onboarding_completed') === 'true' || localStorage.getItem('bruuk_onboarding_completed') === 'true';
  
  // Show onboarding modal if neither city is selected nor onboarding is completed, or if onboarding is in progress
  const showOnboardingModal = (!currentCityConfig && (!isExplicitlySelected || !getSavedCity())) || (!hasOnboardingCompleted && !user);

  // If no city parameter is provided but we have a saved city, show a loader while redirecting
  if (mode === 'standalone' && !routeCity && isExplicitlySelected && getSavedCity()) {
    return (
      <div 
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh', 
          background: '#0e0d1a', 
          fontFamily: "'Outfit', sans-serif",
          color: '#fff',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent-light, #8b7cf6)' }} />
        <span style={{ fontSize: '0.9rem', letterSpacing: '1px', opacity: 0.8 }}>Cargando tu ciudad...</span>
      </div>
    );
  }

  return (
    <div 
      className={`ocean-container ocean-container--${mode}`}
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
              role="status"
              aria-live="polite"
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
                {mode === 'standalone' && (
                  <button
                    className="tiktok-back-btn"
                    onClick={() => navigate('/')}
                    aria-label="Volver al inicio"
                    style={{ position: 'absolute', left: 0 }}
                  >
                    <ArrowLeft size={16} />
                  </button>
                )}

                {/* Centered Bruuk Logo */}
                {mode === 'standalone' ? (
                  <button
                    className="tiktok-logo tiktok-logo-button"
                    onClick={() => navigate('/')}
                    aria-label="Ir al inicio"
                  >
                    <BruukLogo />
                  </button>
                ) : (
                  <div className="tiktok-logo tiktok-logo--static">
                    <BruukLogo />
                  </div>
                )}

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
                  type="button"
                  aria-label={`Cambiar ciudad. Ciudad actual: ${activeCityConfig.name}`}
                  aria-expanded={isDropdownOpen}
                  aria-controls="discover-city-menu"
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
                      id="discover-city-menu"
                      className="tiktok-city-dropdown"
                      role="menu"
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.12 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* GPS auto locator */}
                      <button
                        className="tiktok-city-item"
                        role="menuitem"
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
                          role="menuitem"
                          onClick={() => {
                            selectCity(c.id);
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
                    setReorderedSpots(spots.filter(spot => cat === 'todo' || getCategory(spot) === cat));
                    setActiveIndex(0);
                    setActiveReviewsSpotId(null);
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
            {loadingSpots ? (
              [1, 2, 3].map((n) => (
                <div key={n} className="tiktok-slide" style={{ background: 'var(--bg-primary)', overflow: 'hidden', position: 'relative' }}>
                  <div className="skeleton-shimmer" />
                  <div style={{
                    position: 'absolute',
                    bottom: '120px',
                    left: '1.5rem',
                    width: '70%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    zIndex: 10
                  }}>
                    <div style={{ height: '20px', width: '30%', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }} />
                    <div style={{ height: '36px', width: '85%', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }} />
                    <div style={{ height: '16px', width: '100%', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }} />
                    <div style={{ height: '16px', width: '60%', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }} />
                  </div>
                </div>
              ))
            ) : reorderedSpots.length === 0 ? (
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
                const isNear = Math.abs(index - activeIndex) <= 1;

                return (
                  <div key={spot.id} className="tiktok-slide">
                    
                    {/* Media Background container */}
                    <div className="tiktok-media-container">
                      {isNear ? (
                        <img 
                          src={spot.imageUrl} 
                          alt={spot.name} 
                          className={`tiktok-media ${inView ? 'tiktok-media-active' : ''}`}
                          loading="lazy"
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: '#0e0d1a' }} />
                      )}
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
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/experiencias/${activeCityConfig.id}`, { state: { selectedExpId: spot.id } });
                          }}
                          className="tiktok-cta-link"
                          style={{ '--city-accent': spot.colorAccent || activeCityConfig.accentColor } as React.CSSProperties}
                        >
                          <ExternalLink size={14} /> Reservar / Unirse
                        </button>
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
                          ref={reviewsDialogRef}
                          className="tiktok-reviews-sheet"
                          role="dialog"
                          aria-modal="true"
                          aria-labelledby={`reviews-title-${spot.id}`}
                          tabIndex={-1}
                          initial={{ y: '100%' }}
                          animate={{ y: 0 }}
                          exit={{ y: '100%' }}
                          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="reviews-sheet-header">
                            <button
                              type="button"
                              className="reviews-sheet-handle"
                              onClick={() => setActiveReviewsSpotId(null)}
                              aria-label="Cerrar opiniones"
                            />
                            <h3 id={`reviews-title-${spot.id}`} className="reviews-sheet-title">Detalles y Opiniones</h3>
                            <button className="reviews-sheet-close" onClick={() => setActiveReviewsSpotId(null)} aria-label="Cerrar opiniones">
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

        {/* Multi-step Onboarding Modal Overlay */}
        <AnimatePresence>
          {showOnboardingModal && (
            <motion.div
              className="city-selector-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                ref={cityDialogRef}
                className="city-selector-modal"
                role="dialog"
                aria-modal={mode === 'standalone' ? true : undefined}
                aria-labelledby="onboarding-title"
                tabIndex={-1}
                initial={{ opacity: 0, y: 60, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 60, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              >
                <div className="city-selector-handle" />
                <div className="city-selector-logo">
                  <BruukLogo />
                </div>
                
                {onboardingStep === 0 && (
                  <>
                    <h1 id="onboarding-title" className="city-selector-title">Elige tu ciudad</h1>
                    <p className="city-selector-subtitle">Selecciona una ciudad para descubrir planes y experiencias únicas sin algoritmos.</p>

                    <div className="city-options-grid">
                      {citiesData.map((c, index) => (
                        <button
                          ref={index === 0 ? firstCityButtonRef : undefined}
                          key={c.id}
                          className="city-option-btn"
                          onClick={() => selectCity(c.id)}
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
                      <div role="alert" style={{ color: '#ff7a45', fontSize: '0.8rem', marginTop: '1rem', fontFamily: 'DM Sans, sans-serif', letterSpacing: '0.5px' }}>
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
                  </>
                )}

                {onboardingStep === 1 && (
                  <>
                    <h1 id="onboarding-title" className="city-selector-title">¿Qué quieres ver?</h1>
                    <p className="city-selector-subtitle">Selecciona algunos intereses para personalizar tu feed.</p>
                    
                    <div className="interests-grid" style={{ marginTop: '1rem', marginBottom: '1.5rem', maxHeight: '40vh', overflowY: 'auto' }}>
                      {INTERESTS.map(item => (
                        <button
                          key={item.id}
                          className={`interest-btn ${onboardingInterests.has(item.id) ? 'selected' : ''}`}
                          onClick={() => {
                            setOnboardingInterests(prev => {
                              const next = new Set(prev);
                              if (next.has(item.id)) next.delete(item.id);
                              else next.add(item.id);
                              return next;
                            });
                          }}
                        >
                          <span className="interest-emoji">{item.emoji}</span>
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                    
                    <button
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '1rem', borderRadius: '12px' }}
                      onClick={() => {
                        localStorage.setItem('bruuk_guest_preferences', JSON.stringify(Array.from(onboardingInterests)));
                        setOnboardingStep(2);
                      }}
                    >
                      Continuar
                    </button>
                  </>
                )}

                {onboardingStep === 2 && (
                  <>
                    <h1 id="onboarding-title" className="city-selector-title">Únete a la comunidad</h1>
                    <p className="city-selector-subtitle">Guarda tus gustos y asegura tus lugares en las mejores experiencias.</p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1.5rem' }}>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '1rem', borderRadius: '12px', fontSize: '1rem' }}
                        onClick={() => navigate('/?modal=login')}
                      >
                        Iniciar Sesión / Crear Cuenta
                      </button>
                      
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '1rem', borderRadius: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}
                        onClick={() => {
                          setCookie('bruuk_onboarding_completed', 'true');
                          localStorage.setItem('bruuk_onboarding_completed', 'true');
                          if (mode === 'embedded' && getSavedCity()) {
                            setEmbeddedCity(getSavedCity());
                          } else if (getSavedCity()) {
                            navigate(`/descubrir/${getSavedCity()}`);
                          }
                        }}
                      >
                        Explorar como invitado
                      </button>
                    </div>
                  </>
                )}
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
                ref={mapDialogRef}
                className="map-modal-content"
                role="dialog"
                aria-modal="true"
                aria-labelledby="map-modal-title"
                tabIndex={-1}
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header of Map Modal featuring dynamic category filters */}
                <div className="map-modal-header" style={{ flexDirection: 'column', gap: '0.8rem', alignItems: 'stretch' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 id="map-modal-title" className="map-modal-title">Mapa interactivo — {activeCityConfig.name}</h3>
                    <button ref={mapCloseButtonRef} className="map-modal-close" onClick={handleCloseMap} aria-label="Cerrar mapa">
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
