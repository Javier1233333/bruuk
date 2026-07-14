import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogOut, MapPin, Calendar, Lock, Check, Users, Tag, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { BruukLogo } from '../components/BruukLogo';
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
              <img src={a.avatar} alt={a.name} className="attendee-tile-img" />
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

// Bloque para próximos eventos (con info expandible + confirmar)
function UpcomingEventBlock({ event, confirmed, onConfirm }: {
  event: Event;
  confirmed: boolean;
  onConfirm: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const days = daysUntil(event.date);
  const spotsLeft = event.capacity - event.attendees.length;

  return (
    <div className={`event-block upcoming-block ${confirmed ? 'is-confirmed' : ''}`}>
      {/* Cover */}
      <div className="event-cover">
        <img src={event.cover} alt={event.name} />
        <div className="event-cover-overlay" />
        <div className="event-cover-content">
          <div className="event-badges-row">
            <span className="event-type-badge">{event.type}</span>
            {days <= 7 && <span className="event-badge urgent">En {days}d</span>}
          </div>
          <h2 className="event-title">{event.name}</h2>
          <div className="event-meta">
            <span><Calendar size={13} />{formatDate(event.date)}</span>
            <span><MapPin size={13} />{event.location}</span>
          </div>
        </div>
      </div>

      {/* Info rápida */}
      <div className="event-info-bar">
        <div className="event-info-item">
          <Tag size={13} />
          <span>{event.price}</span>
        </div>
        <div className="event-info-item">
          <Users size={13} />
          <span>{spotsLeft} lugares</span>
        </div>
        <button className="event-info-toggle" onClick={() => setExpanded(v => !v)}>
          <Info size={13} />
          <span>{expanded ? 'Menos' : 'Más info'}</span>
        </button>
      </div>

      {/* Descripción expandible */}
      {expanded && (
        <div className="event-description animate-fade-in">
          <p>{event.description}</p>
        </div>
      )}

      {/* Attendees o locked */}
      <AttendeesSection attendees={event.attendees} locked={days > 7} />

      {/* CTA Confirmar */}
      <div className="event-confirm-bar">
        {confirmed ? (
          <div className="confirm-done">
            <Check size={16} strokeWidth={3} />
            <span>Confirmado — te vemos ahí</span>
          </div>
        ) : (
          <button className="btn-confirm" onClick={() => onConfirm(event.id)}>
            Confirmar asistencia
          </button>
        )}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'confirmed' | 'upcoming'>('confirmed');
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(new Set());
  
  const [confirmedEvents, setConfirmedEvents] = useState<Event[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const instagram = localStorage.getItem('bruuk_instagram') || user?.email?.split('@')[0] || 'tú';

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setLoading(true);
      try {
        const { data: bookings } = await supabase.from('bookings').select('event_id').eq('user_id', user.id);
        const bookedEventIds = new Set(bookings?.map(b => b.event_id) || []);
        setConfirmedIds(bookedEventIds);

        const { data: evts } = await supabase.from('events').select(`
          *,
          experiences (*)
        `).gte('date', new Date().toISOString());

        const formatted = (evts || []).map((e: any) => ({
          id: e.id,
          name: e.experiences?.name || 'Evento',
          date: new Date(e.date),
          location: e.location,
          cover: e.experiences?.image_url || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
          attendees: [], 
          description: e.experiences?.description || '',
          price: e.experiences?.price || '',
          capacity: e.capacity,
          type: e.experiences?.category || 'Evento'
        }));

        setConfirmedEvents(formatted.filter(e => bookedEventIds.has(e.id)));
        setUpcomingEvents(formatted.filter(e => !bookedEventIds.has(e.id)));

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [user]);

  const handleConfirm = async (id: string) => {
    if (!user) return;
    try {
      await supabase.from('bookings').insert({
        event_id: id,
        user_id: user.id,
        status: 'confirmed'
      });
      setConfirmedIds(prev => new Set(prev).add(id));
      
      const ev = upcomingEvents.find(e => e.id === id);
      if (ev) {
        setUpcomingEvents(prev => prev.filter(e => e.id !== id));
        setConfirmedEvents(prev => [...prev, ev]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <div className="header-logo"><BruukLogo /></div>
          <div className="header-tabs">
            <button className={`header-tab ${tab === 'confirmed' ? 'active' : ''}`} onClick={() => setTab('confirmed')}>Mis Eventos</button>
            <button className={`header-tab ${tab === 'upcoming' ? 'active' : ''}`} onClick={() => setTab('upcoming')}>Próximos</button>
          </div>
          <div className="header-user">
            <span className="header-handle">@{instagram}</span>
            <button className="btn-icon" onClick={async () => { await signOut(); navigate('/'); }}>
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="events-list">
          {loading ? (
            <p style={{ textAlign: 'center', opacity: 0.5, marginTop: '2rem' }}>Cargando eventos...</p>
          ) : (
            <>
              {tab === 'confirmed' && confirmedEvents.map(e => (
                <ConfirmedEventBlock key={e.id} event={e} />
              ))}
              {tab === 'upcoming' && upcomingEvents.map(e => (
                <UpcomingEventBlock
                  key={e.id}
                  event={e}
                  confirmed={confirmedIds.has(e.id)}
                  onConfirm={handleConfirm}
                />
              ))}
              {tab === 'confirmed' && confirmedEvents.length === 0 && (
                <p style={{ textAlign: 'center', opacity: 0.5, marginTop: '2rem' }}>Aún no tienes eventos confirmados.</p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
