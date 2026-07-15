import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Check, LogOut, Sparkles, User } from 'lucide-react';
import { BruukLogo } from '../components/BruukLogo';
import { useAuth } from '../contexts/AuthContext';
import { PRESET_AVATARS } from '../components/AppShell';
import { userService } from '../features/users/services/userService';
import { authService } from '../features/auth/services/authService';
import citiesData from '../data/cities.json';
import { INTERESTS } from './ProfileSetupPage';
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
  const [interests, setInterests] = useState<Set<string>>(new Set());
  const [isEditing, setIsEditing] = useState(false);
  const [authMsg, setAuthMsg] = useState<string | null>(null);

  const [role, setRole] = useState<'explorer' | 'host' | 'admin'>('explorer');
  const [profileLoading, setProfileLoading] = useState(true);

  // For Explorer
  const [savedSpots, setSavedSpots] = useState<any[]>([]);
  const [myEvents, setMyEvents] = useState<any[]>([]);

  // For Host
  const [myExperiences, setMyExperiences] = useState<any[]>([]);
  const [hostMetrics, setHostMetrics] = useState({ clicks: 0, bookings: 0 });

  // For Admin
  const [pendingExperiences, setPendingExperiences] = useState<any[]>([]);

  // Sync own profile data from Supabase
  const loadOwnProfile = async () => {
    if (!user) return;
    setProfileLoading(true);
    try {
      const { data, error } = await userService.getProfile(user.id);
      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setName(data.username || user?.email?.split('@')[0] || 'Mi Nombre');
        setInstagram(data.instagram || 'tusuario');
        setCity(data.city || 'Guadalajara');
        setBio(data.favorite_plan || 'Explorando la ciudad con Bruuk.');
        setAvatarId(data.avatar_id || 'avatar1');
        setRole(data.role || 'explorer');
        setInterests(new Set(data.interests || []));
      }

      // Fetch role-specific data
      if (data?.role === 'explorer' || !data?.role) {
        // Fetch saved spots
        const { data: spots } = await userService.getUserSpotSaves(user.id);
        if (spots) setSavedSpots(spots.map(s => s.spots));

        // Fetch bookings
        const { data: bks } = await userService.getUserBookings(user.id);
        if (bks) setMyEvents(bks.map(b => b.events));
      } else if (data?.role === 'host') {
        // Fetch experiences created by host and its events + bookings
        const { data: exps } = await userService.getUserExperiences(user.id);
        if (exps) setMyExperiences(exps);

        // Fetch metrics
        const expIds = exps?.map(e => e.id) || [];
        if (expIds.length > 0) {
          const { count: clicksCount } = await userService.getShareClicksCount(expIds);
          const { count: bookingsCount } = await userService.getBookingsCount(expIds);
          setHostMetrics({ clicks: clicksCount || 0, bookings: bookingsCount || 0 });
        }
      } else if (data?.role === 'admin') {
        const { data: pendings } = await userService.getPendingExperiences();
        if (pendings) setPendingExperiences(pendings);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    setIsOwnProfile(!username);
    if (!username && user) {
      loadOwnProfile();
    }
  }, [username, user]);

  const saveOwnProfile = async () => {
    if (!user) return;
    try {
      await userService.updateProfile(user.id, {
        username: name,
        instagram,
        city,
        favorite_plan: bio,
        avatar_id: avatarId,
        interests: Array.from(interests)
      }).eq('id', user.id);
      
      localStorage.setItem('bruuk_interests', JSON.stringify(Array.from(interests)));

      setIsEditing(false);
      window.dispatchEvent(new Event('bruuk_profile_updated'));
    } catch (err) {
      console.error('Error saving profile:', err);
    }
  };

  const handleAvatarSelect = async (id: string) => {
    setAvatarId(id);
    if (user) {
      await userService.updateProfile(user.id, { avatar_id: id });
      window.dispatchEvent(new Event('bruuk_profile_updated'));
    }
  };

  const handleApproveExperience = async (expId: string) => {
    try {
      await userService.approveExperience(expId);
      setPendingExperiences(prev => prev.filter(e => e.id !== expId));
      alert('Experiencia aprobada exitosamente.');
    } catch (err) {
      console.error(err);
      alert('Error aprobando la experiencia.');
    }
  };

  // OAuth triggering function (Google & Apple)
  const triggerOAuth = async (provider: 'google' | 'apple') => {
    try {
      setAuthMsg(null);
      
      const { error } = await authService.signInWithOAuth({
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
              <div className="input-group" style={{ marginTop: '1rem' }}>
                <label>Mis Gustos</label>
                <div className="interests-grid" style={{ marginTop: '0.5rem', maxHeight: 'none' }}>
                  {INTERESTS.map(item => (
                    <button
                      key={item.id}
                      className={`interest-btn ${interests.has(item.id) ? 'selected' : ''}`}
                      onClick={() => {
                        setInterests(prev => {
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
              </div>
            </div>
          ) : (
            <div className="view-fields-list">
              <div className="profile-identity-display">
                <h1 className="profile-display-name brand-gradient-text">{name}</h1>
                <span className="profile-username-tag">@{instagram}</span>
                <span className="profile-city-tag"><MapPin size={12} /> {city}</span>
                <span className="profile-city-tag" style={{ marginLeft: 8, color: '#ff7a45' }}>• Rol: {role.toUpperCase()}</span>
              </div>
              <p className="details-bio">"{bio}"</p>
              
              <div style={{ marginTop: '1rem' }}>
                <h3 className="section-title-tag" style={{ marginBottom: '0.5rem' }}>Mis Gustos</h3>
                <div className="details-interests-list">
                  {Array.from(interests).map(id => {
                    const item = INTERESTS.find(i => i.id === id);
                    if (!item) return null;
                    return (
                      <span key={id} className="interest-tag-pill">
                        {item.emoji} {item.label}
                      </span>
                    );
                  })}
                  {interests.size === 0 && <span style={{ opacity: 0.5, fontSize: '0.8rem' }}>No hay gustos seleccionados.</span>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Role Panels */}
        {!isEditing && !profileLoading && (
          <div className="role-panels-section" style={{ marginTop: '2rem' }}>
            {role === 'explorer' && (
              <div className="explorer-panel">
                <h3 className="section-title-tag">Mi Exploración</h3>
                <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px' }}>
                    <h4>Spots Guardados ({savedSpots.length})</h4>
                    <ul style={{ paddingLeft: '1rem', marginTop: '0.5rem', opacity: 0.8 }}>
                      {savedSpots.map(s => <li key={s.id}>{s.name} - {s.city}</li>)}
                      {savedSpots.length === 0 && <li>No tienes spots guardados aún.</li>}
                    </ul>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px' }}>
                    <h4>Próximos Eventos ({myEvents.length})</h4>
                    <ul style={{ paddingLeft: '1rem', marginTop: '0.5rem', opacity: 0.8 }}>
                      {myEvents.map(e => <li key={e.id}>{e.experiences?.name} ({new Date(e.date).toLocaleDateString()})</li>)}
                      {myEvents.length === 0 && <li>No tienes eventos programados aún.</li>}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {role === 'host' && (
              <div className="host-panel">
                <h3 className="section-title-tag">Panel de Host</h3>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', marginBottom: '1rem' }}>
                  <div style={{ background: 'rgba(139, 124, 246, 0.1)', padding: '1rem', borderRadius: '12px', flex: 1, border: '1px solid rgba(139, 124, 246, 0.3)' }}>
                    <h4>Vistas (Clicks)</h4>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#8b7cf6' }}>{hostMetrics.clicks}</p>
                  </div>
                  <div style={{ background: 'rgba(255, 122, 69, 0.1)', padding: '1rem', borderRadius: '12px', flex: 1, border: '1px solid rgba(255, 122, 69, 0.3)' }}>
                    <h4>Reservas</h4>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#ff7a45' }}>{hostMetrics.bookings}</p>
                  </div>
                </div>
                
                <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Mis Experiencias</h4>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {myExperiences.map(exp => (
                    <div key={exp.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                      <h5 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{exp.name} <span style={{ fontSize: '0.8rem', opacity: 0.5, fontWeight: 'normal' }}>({exp.status})</span></h5>
                      
                      {exp.events?.map((ev: any) => (
                        <div key={ev.id} style={{ marginTop: '0.8rem', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                          <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                            <Check size={12} style={{ marginRight: 4 }}/>
                            {new Date(ev.date).toLocaleDateString()} - Asistentes: {ev.bookings?.length || 0}/{ev.capacity}
                          </p>
                          {ev.bookings?.length > 0 && (
                            <ul style={{ paddingLeft: '1rem', fontSize: '0.8rem', opacity: 0.8 }}>
                              {ev.bookings.map((b: any) => (
                                <li key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                  <span>{b.profiles?.username || 'Usuario anónimo'}</span>
                                  {b.profiles?.instagram && (
                                    <a href={`https://instagram.com/${b.profiles.instagram}`} target="_blank" rel="noopener noreferrer" style={{ color: '#8b7cf6' }}>
                                      Contactar
                                    </a>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}
                  {myExperiences.length === 0 && <p style={{ opacity: 0.6 }}>Aún no has creado experiencias.</p>}
                </div>
              </div>
            )}

            {role === 'admin' && (
              <div className="admin-panel">
                <h3 className="section-title-tag" style={{ color: '#ff4d4f' }}>Panel de Administración</h3>
                <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
                  <h4 style={{ marginBottom: '0.5rem' }}>Experiencias Pendientes de Aprobación</h4>
                  {pendingExperiences.map(exp => (
                    <div key={exp.id} style={{ background: 'rgba(255,77,79,0.1)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,77,79,0.3)' }}>
                      <h5 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{exp.name}</h5>
                      <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '0.5rem' }}>Host: {exp.host_name} | Categoría: {exp.category}</p>
                      <button 
                        className="btn-confirm" 
                        style={{ padding: '4px 12px', fontSize: '0.8rem', marginTop: '0.5rem', background: '#ff4d4f', border: 'none' }}
                        onClick={() => handleApproveExperience(exp.id)}
                      >
                        Aprobar Experiencia
                      </button>
                    </div>
                  ))}
                  {pendingExperiences.length === 0 && <p style={{ opacity: 0.6 }}>No hay experiencias pendientes de aprobación.</p>}
                </div>
              </div>
            )}
          </div>
        )}

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
