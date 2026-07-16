import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, MapPin, Calendar, Lock, Tag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService, oceanService, supabase } from '@bruuk/shared-logic';
import { BruukLogo } from '../components/BruukLogo';
import { PRESET_AVATARS } from '../components/AppShell';
import './DashboardPage.css';

interface Attendee {
  id: string;
  name: string;
  instagram: string;
  avatar: string;
  favorite: string;
}

interface Event {
  id: string;
  name: string;
  date: Date;
  location: string;
  cover: string;
  attendees: Attendee[];
  description: string;
  price: string;
  capacity: number;
  type: string;
}

function daysUntil(date: Date) {
  return Math.ceil((date.getTime() - Date.now()) / 86400000);
}

function formatDate(date: Date) {
  return date.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
}

function AttendeesSection({ attendees, locked }: { attendees: Attendee[]; locked: boolean }) {
  if (locked) {
    return (
      <div className="attendees-locked">
        <Lock size={16} />
        <div>
          <p className="locked-title">Perfiles ocultos</p>
          <p className="locked-sub">Se revelan 7 días antes — {attendees.length} personas van</p>
        </div>
      </div>
    );
  }

  return (
    <div className="attendees-section">
      <p className="attendees-label">{attendees.length} personas van</p>
      <div className="attendees-strip">
        {attendees.map(a => (
          <Link to={`/profile/${a.instagram}`} key={a.id} className="attendee-tile">
            <div className="attendee-tile-img-wrap">
              {a.avatar.startsWith('http') ? (
                <img src={a.avatar} alt={a.name} className="attendee-tile-img" />
              ) : (
                <div 
                  className="attendee-tile-img"
                  style={{ 
                    background: a.avatar, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: '#fff', 
                    fontWeight: 900,
                    fontSize: '1rem',
                    height: '100%',
                    width: '100%'
                  }}
                >
                  {a.instagram ? a.instagram.slice(0, 1).toUpperCase() : '?'}
                </div>
              )}
            </div>
            <span className="attendee-tile-handle">@{a.instagram}</span>
            <span className="attendee-tile-fav">"{a.favorite}"</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Bloque para eventos confirmados (sin botón)
function ConfirmedEventBlock({ event }: { event: Event }) {
  const days = daysUntil(event.date);
  return (
    <div className="event-block">
      <div className="event-cover">
        <img src={event.cover} alt={event.name} />
        <div className="event-cover-overlay" />
        <div className="event-cover-content">
          {days <= 3 && <span className="event-badge urgent">En {days}d</span>}
          <span className="event-type-badge">{event.type}</span>
          <h2 className="event-title">{event.name}</h2>
          <div className="event-meta">
            <span><Calendar size={13} />{formatDate(event.date)}</span>
            <span><MapPin size={13} />{event.location}</span>
          </div>
        </div>
      </div>
      <AttendeesSection attendees={event.attendees} locked={false} />
    </div>
  );
}

// Bloque para spots o experiencias guardadas
function SavedSpotBlock({ spot }: { spot: any }) {
  const isExperience = spot.category === 'experiencia';
  const accent = spot.colorAccent || '#8b7cf6';
  
  return (
    <div className="event-block saved-spot-block" style={{ borderLeft: `6px solid ${accent}` }}>
      <div className="event-cover">
        <img src={spot.imageUrl || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80'} alt={spot.name} />
        <div className="event-cover-overlay" />
        <div className="event-cover-content">
          <span className="event-type-badge" style={{ borderColor: accent, background: accent, color: '#000', fontWeight: 900 }}>
            {spot.type}
          </span>
          <span className="event-city-badge-tag" style={{ marginLeft: '8px', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.7)' }}>{spot.city}</span>
          <h2 className="event-title" style={{ textShadow: `3px 3px 0px ${accent}` }}>{spot.name}</h2>
          <div className="event-meta">
            {spot.rating && <span className="event-type-badge" style={{ borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)' }}>★ {spot.rating}</span>}
            {spot.price && <span className="event-type-badge" style={{ borderColor: 'rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)' }}><Tag size={10} style={{ marginRight: '4px' }} />{spot.price}</span>}
          </div>
        </div>
      </div>
      <div className="event-description">
        <p style={{ fontStyle: 'italic', borderLeft: `3px solid ${accent}` }}>"{spot.description}"</p>
      </div>
      <div className="event-confirm-bar" style={{ display: 'flex', gap: '1rem' }}>
        <a 
          href={spot.mapsLink} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="btn-confirm" 
          style={{ 
            textAlign: 'center', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: 'transparent', 
            borderColor: '#fff', 
            color: '#fff', 
            textDecoration: 'none', 
            flex: 1 
          }}
        >
          {isExperience ? 'Ver Detalles' : 'Ver Ubicación en Mapa'}
        </a>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'confirmed' | 'saved'>('confirmed');
  const [confirmedEvents, setConfirmedEvents] = useState<Event[]>([]);
  const [savedSpots, setSavedSpots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const instagram = localStorage.getItem('bruuk_instagram') || user?.email?.split('@')[0] || 'tú';

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setLoading(true);
      try {
        // 1. Fetch user bookings and events
        const { data: bookings } = await dashboardService.getUserBookings(user.id);
        const bookedEventIds = new Set(bookings?.map(b => b.event_id) || []);

        const { data: evts } = await dashboardService.getDashboardEvents();
        const formatted = (evts || []).map((e: any) => {
          const attendees = (e.bookings || []).map((b: any) => ({
            id: b.id,
            name: b.profiles?.username || 'Usuario',
            instagram: b.profiles?.instagram || '',
            avatar: PRESET_AVATARS.find(a => a.id === b.profiles?.avatar_id)?.colors || PRESET_AVATARS[0].colors,
            avatarId: b.profiles?.avatar_id || 'avatar1',
            favorite: b.profiles?.favorite_plan || '',
          }));
          return {
            id: e.id,
            name: e.experiences?.name || 'Evento',
            date: new Date(e.date),
            location: e.location,
            cover: e.experiences?.image_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
            attendees,
            description: e.experiences?.description || '',
            price: e.experiences?.price || '',
            capacity: e.capacity,
            type: e.experiences?.category || 'Evento'
          };
        });

        setConfirmedEvents(formatted.filter(e => bookedEventIds.has(e.id)));

        // 2. Fetch saved spots and experiences
        const { data: savedData } = await oceanService.getSavedSpots(user.id);
        const savedIds = savedData?.map(s => s.spot_id) || [];
        
        if (savedIds.length > 0) {
          const [spotsRes, expsRes] = await Promise.all([
            supabase.from('spots').select('*').in('id', savedIds),
            supabase.from('experiences').select('*').in('id', savedIds).eq('status', 'approved')
          ]);
          
          const mappedSpots = (spotsRes.data || []).map(s => ({
            id: s.id,
            city: s.city,
            category: 'lugar',
            name: s.name,
            type: s.type || 'Lugar',
            description: s.description || '',
            imageUrl: s.image_url || '',
            colorAccent: s.color_accent || '',
            mapsLink: s.maps_link || '',
            rating: s.rating ? Number(s.rating) : undefined,
            price: s.price || undefined,
          }));

          const mappedExps = (expsRes.data || []).map(e => ({
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
          }));
          
          setSavedSpots([...mappedSpots, ...mappedExps]);
        } else {
          setSavedSpots([]);
        }

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <div className="header-logo"><BruukLogo /></div>
          <div className="header-tabs">
            <button className={`header-tab ${tab === 'confirmed' ? 'active' : ''}`} onClick={() => setTab('confirmed')}>Registrado</button>
            <button className={`header-tab ${tab === 'saved' ? 'active' : ''}`} onClick={() => setTab('saved')}>Mis Guardados</button>
          </div>
          <div className="header-user">
            <span className="header-handle">@{instagram}</span>
            <button className="btn-icon" onClick={async () => { await signOut(); navigate('/'); }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main" style={{ WebkitOverflowScrolling: 'touch' }}>
        <div className="events-list">
          {loading ? (
            <p style={{ textAlign: 'center', opacity: 0.5, marginTop: '2rem' }}>Cargando...</p>
          ) : (
            <>
              {tab === 'confirmed' && (
                <>
                  {confirmedEvents.map(e => (
                    <ConfirmedEventBlock key={e.id} event={e} />
                  ))}
                  {confirmedEvents.length === 0 && (
                    <p style={{ textAlign: 'center', opacity: 0.5, marginTop: '2rem', fontSize: '0.85rem' }}>No tienes eventos registrados aún.</p>
                  )}
                </>
              )}
              {tab === 'saved' && (
                <>
                  {savedSpots.map(s => (
                    <SavedSpotBlock key={s.id} spot={s} />
                  ))}
                  {savedSpots.length === 0 && (
                    <p style={{ textAlign: 'center', opacity: 0.5, marginTop: '2rem', fontSize: '0.85rem' }}>No tienes spots ni experiencias guardadas aún.</p>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
