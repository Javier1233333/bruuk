import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Instagram, MapPin } from 'lucide-react';
import { BruukLogo } from '../components/BruukLogo';
import './ProfilePage.css';

interface Profile {
  id: string;
  name: string;
  instagram: string;
  avatar: string;
  city: string;
  favorite: string;
  bio: string;
  interests: { emoji: string; label: string }[];
  events: { name: string; date: string; role: 'Va' | 'Fue' }[];
}

const PROFILES: Record<string, Profile> = {
  'sofiar__': {
    id: 'sofiar__',
    name: 'Sofía Reyes',
    instagram: 'sofiar__',
    avatar: 'https://i.pravatar.cc/300?img=1',
    city: 'CDMX',
    favorite: 'Un concierto de último minuto',
    bio: 'Diseñadora de día, noctámbula de corazón. Busco lugares que no salgan en Google Maps.',
    interests: [
      { emoji: '🎵', label: 'Música en vivo' },
      { emoji: '🎨', label: 'Arte & Galerías' },
      { emoji: '📸', label: 'Fotografía' },
      { emoji: '🍸', label: 'Coctelerías' },
      { emoji: '🌃', label: 'Vida nocturna' },
      { emoji: '🎪', label: 'Festivales' },
    ],
    events: [
      { name: 'Noche Indie en El Plástico', date: 'En 3 días', role: 'Va' },
      { name: 'Feria de Arte Urbano',        date: 'En 5 días', role: 'Va' },
      { name: 'Festival Nómada',             date: 'Feb 2025',  role: 'Fue' },
    ],
  },
  'diegomx': {
    id: 'diegomx',
    name: 'Diego Mora',
    instagram: 'diegomx',
    avatar: 'https://i.pravatar.cc/300?img=3',
    city: 'Monterrey',
    favorite: 'Explorar un barrio nuevo',
    bio: 'Arquitecto urbano. Colecciono esquinas interesantes y bares sin nombre en la puerta.',
    interests: [
      { emoji: '🛹', label: 'Skate & Urban' },
      { emoji: '☕', label: 'Brunch & Cafés' },
      { emoji: '🎧', label: 'DJ / Electrónica' },
      { emoji: '✈️', label: 'Viajes & Cultura' },
      { emoji: '💻', label: 'Tech & Startups' },
      { emoji: '🌮', label: 'Street Food' },
      { emoji: '📚', label: 'Libros & Podcasts' },
    ],
    events: [
      { name: 'Brunch Rooftop Colectivo', date: 'En 5 días', role: 'Va' },
      { name: 'Festival Nómada',          date: 'En 10 días', role: 'Va' },
      { name: 'Noche de Jazz & Mezcal',   date: 'Ene 2025',   role: 'Fue' },
    ],
  },
};

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const profile = PROFILES[username ?? ''];

  if (!profile) {
    return (
      <div className="profile-not-found">
        <BruukLogo />
        <h1>Perfil no encontrado.</h1>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Volver</button>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Header */}
      <header className="profile-header">
        <div className="profile-header-inner">
          <button className="profile-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={18} /> Volver
          </button>
          <BruukLogo />
        </div>
      </header>

      <main className="profile-main">

        {/* Hero block */}
        <div className="profile-hero">
          <div className="profile-hero-bg" />

          <div className="profile-avatar-wrap">
            <img src={profile.avatar} alt={profile.name} className="profile-avatar" />
            <div className="profile-avatar-accent" />
          </div>

          <div className="profile-identity">
            <h1 className="profile-name brand-gradient-text">{profile.name}</h1>
            <a
              className="profile-ig"
              href={`https://instagram.com/${profile.instagram}`}
              target="_blank"
              rel="noreferrer"
            >
              <Instagram size={14} /> @{profile.instagram}
            </a>
            <span className="profile-city"><MapPin size={12} />{profile.city}</span>
          </div>
        </div>

        {/* Bio */}
        <div className="profile-section">
          <p className="profile-bio">"{profile.bio}"</p>
        </div>

        {/* Plan favorito */}
        <div className="profile-section">
          <h2 className="profile-section-title">Plan favorito</h2>
          <div className="profile-favorite">
            {profile.favorite}
          </div>
        </div>

        {/* Gustos */}
        <div className="profile-section">
          <h2 className="profile-section-title">En lo que va</h2>
          <div className="profile-interests">
            {profile.interests.map(i => (
              <span key={i.label} className="profile-interest-tag">
                {i.emoji} {i.label}
              </span>
            ))}
          </div>
        </div>

        {/* Eventos */}
        <div className="profile-section">
          <h2 className="profile-section-title">Eventos</h2>
          <div className="profile-events">
            {profile.events.map(e => (
              <div key={e.name} className="profile-event-row">
                <div className="profile-event-info">
                  <span className="profile-event-name">{e.name}</span>
                  <span className="profile-event-date">{e.date}</span>
                </div>
                <span className={`profile-event-role ${e.role === 'Va' ? 'going' : 'went'}`}>
                  {e.role}
                </span>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
