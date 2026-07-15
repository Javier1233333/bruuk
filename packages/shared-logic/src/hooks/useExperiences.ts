import { useState, useEffect, useCallback } from 'react';
import { experienceService } from '../services/experienceService';

export type ExperienceCategory = 'Aventura' | 'Gastronomía' | 'Arte' | 'Música';

export interface Experience {
  id: string;
  name: string;
  host: string;
  hostAvatar: string;
  category: ExperienceCategory;
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
  nextEventId?: string;
  lat?: number;
  lng?: number;
}

function mapRaw(exp: any, evtData: any[]): Experience {
  const nextEvent = evtData.find((e: any) => e.experience_id === exp.id);
  return {
    id: exp.id,
    name: exp.name,
    host: exp.host_name,
    hostAvatar: exp.host_avatar || 'https://via.placeholder.com/100',
    category: exp.category as ExperienceCategory,
    imageUrl: exp.image_url || 'https://via.placeholder.com/500',
    rating: exp.rating ? Number(exp.rating) : 5.0,
    reviewsCount: exp.reviews_count || 0,
    price: exp.price,
    duration: exp.duration,
    location: exp.location,
    city: exp.city?.toLowerCase() === 'hermosillo' ? 'Hermosillo' : 'Guadalajara',
    nextDate: nextEvent
      ? new Date(nextEvent.date).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
      : 'Próximamente',
    description: exp.description || '',
    longDescription: exp.long_description || '',
    whatsAppLink: exp.whatsapp_link || '',
    images: exp.images || [],
    reservationInfo: exp.reservation_info || '',
    nextEventId: nextEvent?.id,
    lat: exp.lat ? Number(exp.lat) : undefined,
    lng: exp.lng ? Number(exp.lng) : undefined,
  };
}

function mapFallback(exp: any): Experience {
  return {
    id: exp.id,
    name: exp.name,
    host: exp.host_name,
    hostAvatar: exp.host_avatar || 'https://via.placeholder.com/100',
    category: exp.category as ExperienceCategory,
    imageUrl: exp.image_url || 'https://via.placeholder.com/500',
    rating: exp.rating ? Number(exp.rating) : 5.0,
    reviewsCount: exp.reviews_count || 0,
    price: exp.price,
    duration: exp.duration,
    location: exp.location,
    city: exp.city?.toLowerCase() === 'hermosillo' ? 'Hermosillo' : 'Guadalajara',
    nextDate: 'Próximamente',
    description: exp.description || '',
    longDescription: exp.long_description || '',
    whatsAppLink: exp.whatsapp_link || '',
    images: exp.images || [],
    reservationInfo: exp.reservation_info || '',
  };
}

interface UseExperiencesOptions {
  /** Fallback data (local JSON) to use when Supabase fetch fails */
  fallbackData?: any[];
}

export function useExperiences(options: UseExperiencesOptions = {}) {
  const { fallbackData } = options;
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const expRes = await experienceService.getApprovedExperiences();
      const evtRes = await experienceService.getUpcomingEvents();

      if (expRes.error) throw expRes.error;
      if (evtRes.error) throw evtRes.error;

      setExperiences((expRes.data || []).map((exp: any) => mapRaw(exp, evtRes.data || [])));
    } catch (err: any) {
      console.warn('[BRUUK] Supabase fetch failed, using fallback data:', err);
      setError(err);
      if (fallbackData) {
        setExperiences(fallbackData.map(mapFallback));
      }
    } finally {
      setLoading(false);
    }
  }, [fallbackData]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { experiences, loading, error, refetch: fetch };
}
