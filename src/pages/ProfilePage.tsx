import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Check, LogOut, Sparkles, User } from 'lucide-react';
import { BruukLogo } from '../components/BruukLogo';
import { useAuth } from '../contexts/AuthContext';
import { PRESET_AVATARS } from '../components/AppShell';
import { supabase } from '../lib/supabase';
import citiesData from '../data/cities.json';
import './ProfilePage.css';

interface Profile {
  id: string;
  name: string;
  instagram: string;
  avatarId: string;
  city: string;
  favorite: string;
  bio: string;
  interests: { emoji: string; label: string }[];
  events: { name: string; date: string; role: 'Va' | 'Fue' }[];
}

const PUBLIC_PROFILES: Record<string, Profile> = {
  'sofiar__': {
    id: 'sofiar__',
    name: 'Sofía Reyes',
    instagram: 'sofiar__',
    avatarId: 'avatar1',
    city: 'CDMX',
    favorite: 'Un concierto de último minuto',
    bio: 'Diseñadora de día, noctámbula de corazón. Busco lugares que no salgan en Google Maps.',
    interests: [
      { emoji: '', label: 'Música en vivo' },
      { emoji: '', label: 'Arte & Galerías' },
      { emoji: '', label: 'Fotografía' },
      { emoji: '', label: 'Coctelerías' }
    ],
    events: [
      { name: 'Noche Indie en El Plástico', date: 'En 3 días', role: 'Va' },
      { name: 'Feria de Arte Urbano',        date: 'En 5 días', role: 'Va' }
    ],
  },
  'diegomx': {
    id: 'diegomx',
    name: 'Diego Mora',
    instagram: 'diegomx',
    avatarId: 'avatar4',
    city: 'Monterrey',
    favorite: 'Explorar un barrio nuevo',
    bio: 'Arquitecto urbano. Colecciono esquinas interesantes y bares sin nombre en la puerta.',
    interests: [
      { emoji: '', label: 'Brunch & Cafés' },
      { emoji: '', label: 'DJ / Electrónica' },
      { emoji: '', label: 'Street Food' }
    ],
    events: [
      { name: 'Brunch Rooftop Colectivo', date: 'En 5 días', role: 'Va' }
    ],
  },
};

export function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  
  // States for own profile edit mode
  const [isOwnProfile, setIsOwnProfile] = useState(!username);
  const [name, setName] = useState('');
  const [instagram, setInstagram] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [avatarId, setAvatarId] = useState('avatar1');
  const [isEditing, setIsEditing] = useState(false);
  const [authMsg, setAuthMsg] = useState<string | null>(null);

  // Sync own profile data from localStorage
  const loadOwnProfile = () => {
    setName(localStorage.getItem('bruuk_name') || user?.email?.split('@')[0] || 'Mi Nombre');
    setInstagram(localStorage.getItem('bruuk_instagram') || 'tusuario');
    setCity(localStorage.getItem('bruuk_city') || 'Guadalajara');
    setBio(localStorage.getItem('bruuk_bio') || 'Explorando la ciudad con Bruuk.');
    setAvatarId(localStorage.getItem('bruuk_avatar_id') || 'avatar1');
  };

  useEffect(() => {
    setIsOwnProfile(!username);
    if (!username) {
      loadOwnProfile();
    }
  }, [username, user]);

  const saveOwnProfile = () => {
    localStorage.setItem('bruuk_name', name);
    localStorage.setItem('bruuk_instagram', instagram);
    localStorage.setItem('bruuk_city', city);
    localStorage.setItem('bruuk_bio', bio);
    localStorage.setItem('bruuk_avatar_id', avatarId);
    setIsEditing(false);
    
    // Dispatch a custom event to notify AppShell to update the avatar reactively
    window.dispatchEvent(new Event('bruuk_profile_updated'));
  };

  const handleAvatarSelect = (id: string) => {
    setAvatarId(id);
    localStorage.setItem('bruuk_avatar_id', id);
    window.dispatchEvent(new Event('bruuk_profile_updated'));
  };

  // OAuth triggering function (Google & Apple)
  const triggerOAuth = async (provider: 'google' | 'apple') => {
    try {
      setAuthMsg(null);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin + '/perfil',
        }
      });

      if (error) {
        throw error;
      }
    } catch (err: any) {
      console.warn("Supabase Auth not fully configured in local dev, falling back to mock authentication.");
      // Interactive Fallback simulation: simulate success
      setAuthMsg(`Simulación: Inicio de sesión con ${provider.toUpperCase()} exitoso.`);
      setTimeout(() => {
        setAuthMsg(null);
      }, 4000);
    }
  };

  const handleLogoutClick = async () => {
    await signOut();
    localStorage.removeItem('bruuk_profile_done');
    navigate('/');
  };

  // Rendering Public Profile Mode
  if (!isOwnProfile) {
    const profile = PUBLIC_PROFILES[username ?? ''];

    if (!profile) {
      return (
        <div className="profile-not-found">
          <BruukLogo />
          <h1>Perfil no encontrado.</h1>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Volver</button>
        </div>
      );
    }

    const avatarGradient = PRESET_AVATARS.find(a => a.id === profile.avatarId) || PRESET_AVATARS[0];

    return (
      <div className="profile-page-container">
        <header className="profile-header-bar">
          <button className="profile-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Volver
          </button>
        </header>

        <main className="profile-scroll-area">
          <div className="profile-hero-section">
            <div 
              className="profile-avatar-circle"
              style={{ background: avatarGradient.colors }}
            >
              {profile.instagram.slice(0, 1).toUpperCase()}
            </div>
            <h1 className="profile-display-name brand-gradient-text">{profile.name}</h1>
            <span className="profile-username-tag">@{profile.instagram}</span>
            <span className="profile-city-tag"><MapPin size={12} /> {profile.city}</span>
          </div>

          <div className="profile-details-card">
            <div className="details-section">
              <h3 className="section-title-tag">Bio</h3>
              <p className="details-bio">"{profile.bio}"</p>
            </div>

            <div className="details-section">
              <h3 className="section-title-tag">Plan Favorito</h3>
              <div className="details-favorite-bubble">{profile.favorite}</div>
            </div>

            <div className="details-section">
              <h3 className="section-title-tag">Intereses</h3>
              <div className="details-interests-list">
                {profile.interests.map(i => (
                  <span key={i.label} className="interest-tag-pill">
                    {i.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Rendering Own Profile Mode (Editable + Settings + OAuth)
  const currentAvatar = PRESET_AVATARS.find(a => a.id === avatarId) || PRESET_AVATARS[0];

  return (
    <div className="profile-page-container own-profile">
      <header className="profile-header-bar">
        <div className="profile-header-top">
          <div className="profile-header-titles">
            <span className="profile-tag">/ perfil</span>
            <h1 className="profile-title brand-gradient-text">Mi Espacio</h1>
          </div>
          {isEditing ? (
            <button className="profile-edit-action-btn save" onClick={saveOwnProfile}>
              Guardar
            </button>
          ) : (
            <button className="profile-edit-action-btn" onClick={() => setIsEditing(true)}>
              Editar
            </button>
          )}
        </div>
        <p className="profile-sub">Gestiona tus intereses, credenciales y vinculaciones.</p>
      </header>

      <main className="profile-scroll-area">
        {/* Dynamic feedback notification toast */}
        {authMsg && (
          <div className="auth-success-toast animate-fade-in">
            <Sparkles size={14} />
            <span>{authMsg}</span>
          </div>
        )}

        <div className="profile-hero-section">
          {/* Preset Avatar Selection Grid */}
          <div className="avatar-selection-area">
            <div 
              className="profile-avatar-circle"
              style={{ background: currentAvatar.colors }}
            >
              {instagram ? instagram.slice(0, 1).toUpperCase() : <User size={20} />}
            </div>
            
            <p className="avatar-hint-text">Elige tu degradado de neón:</p>
            <div className="preset-avatars-grid">
              {PRESET_AVATARS.map(avatar => (
                <button
                  key={avatar.id}
                  className={`preset-avatar-btn ${avatarId === avatar.id ? 'active' : ''}`}
                  style={{ background: avatar.colors }}
                  onClick={() => handleAvatarSelect(avatar.id)}
                  title="Cambiar avatar"
                >
                  {instagram ? instagram.slice(0, 1).toUpperCase() : <User size={12} />}
                  {avatarId === avatar.id && <Check size={12} className="avatar-check-icon" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Editable Fields Card */}
        <div className="profile-details-card">
          {isEditing ? (
            <div className="edit-fields-list">
              <div className="input-group">
                <label>Nombre Completo</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="Tu Nombre" 
                />
              </div>

              <div className="input-group">
                <label>Usuario (@)</label>
                <input 
                  type="text" 
                  value={instagram} 
                  readOnly 
                  placeholder="usuario" 
                  disabled
                  className="input-disabled"
                />
                <span className="input-hint">El nombre de usuario es inmodificable.</span>
              </div>

              <div className="input-group">
                <label>Ciudad</label>
                <select 
                  value={city} 
                  onChange={e => setCity(e.target.value)}
                  className="select-input"
                >
                  <option value="" disabled>Selecciona una ciudad</option>
                  {citiesData.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Bio</label>
                <textarea 
                  value={bio} 
                  onChange={e => setBio(e.target.value)} 
                  placeholder="Cuéntale a la comunidad sobre ti..."
                  rows={3}
                />
              </div>
            </div>
          ) : (
            <div className="view-fields-list">
              <div className="profile-identity-display">
                <h1 className="profile-display-name brand-gradient-text">{name}</h1>
                <span className="profile-username-tag">@{instagram}</span>
                <span className="profile-city-tag"><MapPin size={12} /> {city}</span>
              </div>
              <p className="details-bio">"{bio}"</p>
            </div>
          )}
        </div>

        {/* Social Accounts Linked Section */}
        <div className="profile-social-accounts-section">
          <h3 className="section-title-tag">Seguridad y Cuentas</h3>
          <p className="section-sub-tag">Vincula tus credenciales para acceder a tus reservas.</p>
          
          <div className="oauth-buttons-strip">
            <button className="oauth-btn google-oauth" onClick={() => triggerOAuth('google')}>
              <svg className="oauth-logo" viewBox="0 0 24 24" width="16" height="16">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Vincular Google</span>
            </button>

            <button className="oauth-btn apple-oauth" onClick={() => triggerOAuth('apple')}>
              <svg className="oauth-logo" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.57 2.95-1.39z"/>
              </svg>
              <span>Vincular Apple</span>
            </button>
          </div>
        </div>

        {/* Sign Out Button */}
        <div className="profile-signout-area">
          <button className="profile-signout-btn" onClick={handleLogoutClick}>
            <LogOut size={14} /> Cerrar Sesión
          </button>
        </div>
      </main>
    </div>
  );
}
