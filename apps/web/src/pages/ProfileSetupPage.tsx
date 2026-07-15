import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Check, X } from 'lucide-react';
import { BruukLogo } from '../components/BruukLogo';
import { PRESET_AVATARS } from '../components/AppShell';
import { userService } from '@bruuk/shared-logic/services';
import { useAuth } from '../contexts/AuthContext';
import citiesData from '../data/cities.json';
import './ProfileSetupPage.css';

export const INTERESTS = [
  { id: 'live_music',    label: 'Música en vivo',     emoji: '🎵' },
  { id: 'festivals',     label: 'Festivales',          emoji: '🎪' },
  { id: 'electronic',    label: 'DJ / Electrónica',    emoji: '🎧' },
  { id: 'jazz',          label: 'Jazz & Blues',         emoji: '🎷' },
  { id: 'rock',          label: 'Rock & Indie',         emoji: '🎸' },
  { id: 'cocktails',     label: 'Coctelerías',          emoji: '🍸' },
  { id: 'gastronomy',    label: 'Gastronomía',          emoji: '🍜' },
  { id: 'brunch',        label: 'Brunch & Cafés',       emoji: '☕' },
  { id: 'streetfood',    label: 'Street Food',          emoji: '🌮' },
  { id: 'art',           label: 'Arte & Galerías',      emoji: '🎨' },
  { id: 'photography',   label: 'Fotografía',           emoji: '📸' },
  { id: 'theater',       label: 'Teatro & Cine',        emoji: '🎭' },
  { id: 'running',       label: 'Running',              emoji: '🏃' },
  { id: 'yoga',          label: 'Yoga & Wellness',      emoji: '🧘' },
  { id: 'skate',         label: 'Skate & Urban',        emoji: '🛹' },
  { id: 'nature',        label: 'Naturaleza',           emoji: '⛰️' },
  { id: 'travel',        label: 'Viajes & Cultura',     emoji: '✈️' },
  { id: 'tech',          label: 'Tech & Startups',      emoji: '💻' },
  { id: 'fashion',       label: 'Moda & Vintage',       emoji: '👗' },
  { id: 'nightlife',     label: 'Vida nocturna',        emoji: '🌃' },
  { id: 'sports',        label: 'Deportes en vivo',     emoji: '⚽' },
  { id: 'reading',       label: 'Libros & Podcasts',    emoji: '📚' },
  { id: 'gaming',        label: 'Gaming',               emoji: '🎮' },
  { id: 'volunteering',  label: 'Voluntariado',         emoji: '🤝' },
];

const FAVORITE_OPTIONS = [
  'Un concierto de último minuto',
  'Una cena larga con desconocidos',
  'Explorar un barrio nuevo',
  'Un after en casa de alguien',
  'Perderse en una exposición',
  'Un road trip sin plan',
  'Bailar hasta que cierren',
  'Una conversación de 4 horas',
];

export function ProfileSetupPage() {
  const navigate = useNavigate();
  const { user, refreshProfile } = useAuth();

  const [step, setStep] = useState(0);
  const [avatarId, setAvatarId] = useState<string>('avatar1');
  const [instagram, setInstagram] = useState('');
  const [city, setCity] = useState('');
  const [interests, setInterests] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('bruuk_guest_preferences');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return new Set(parsed);
        }
      }
    } catch (e) {}
    return new Set();
  });
  const [favorite, setFavorite] = useState('');
  const [customFavorite, setCustomFavorite] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleInterest = (id: string) => {
    setInterests(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleFinish = async () => {
    if (!user) {
      setError('No estás autenticado.');
      return;
    }
    setLoading(true);
    setError(null);

    const finalFavorite = customFavorite || favorite;

    try {
      const { error: updateErr } = await userService.updateProfile(user.id, {
        username: instagram, // el hook instagram guarda el username del input "Usuario"
        instagram: instagram, // por compatibilidad legacy
        avatar_id: avatarId,
        city,
        interests: Array.from(interests),
        favorite_plan: finalFavorite,
        updated_at: new Date().toISOString(),
      });

      if (updateErr) {
        throw updateErr;
      }

      // Sincronizar el perfil local en el contexto
      await refreshProfile();

      // Guardar también en localStorage por compatibilidad legacy
      localStorage.setItem('bruuk_profile_done', 'true');
      localStorage.setItem('bruuk_avatar_id', avatarId);
      localStorage.setItem('bruuk_instagram', instagram);
      localStorage.setItem('bruuk_city', city);
      localStorage.setItem('bruuk_interests', JSON.stringify(Array.from(interests)));
      localStorage.setItem('bruuk_favorite', finalFavorite);

      // Despachar evento custom para actualizar el header reactivamente si es necesario
      window.dispatchEvent(new Event('bruuk_profile_updated'));

      navigate('/app');
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Error al actualizar tu perfil. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const canNext0 = instagram.trim().length > 0 && city !== '';
  const canNext1 = interests.size >= 3;
  const canFinish = favorite !== '' || customFavorite.trim().length > 0;

  return (
    <div className="setup-page">
      <div className="setup-bg-glow" />

      <div className="setup-container animate-fade-in">
        <div className="setup-logo"><BruukLogo /></div>

        <div className="setup-progress">
          {[0, 1, 2].map(i => (
            <div key={i} className={`setup-progress-dot ${i <= step ? 'active' : ''}`} />
          ))}
        </div>

        {/* STEP 0 — Foto + Instagram */}
        {step === 0 && (
          <div className="setup-card animate-fade-in">
            <button className="setup-close" onClick={() => navigate('/descubrir')} aria-label="Cerrar"><X size={20} /></button>
            <p className="setup-step-label">Paso 1 de 3</p>
            <h1 className="setup-title brand-gradient-text">Tu perfil.</h1>
            <p className="setup-subtitle">Así te verán los demás en BRUUK.</p>

            <div className="preset-avatars-grid" style={{ marginBottom: '1.5rem', justifyContent: 'center' }}>
              {PRESET_AVATARS.map(avatar => (
                <button
                  key={avatar.id}
                  className={`preset-avatar-btn ${avatarId === avatar.id ? 'active' : ''}`}
                  style={{ background: avatar.colors }}
                  onClick={() => setAvatarId(avatar.id)}
                >
                  {avatar.emoji}
                  {avatarId === avatar.id && <Check size={12} className="avatar-check-icon" />}
                </button>
              ))}
            </div>

            <div className="setup-field">
              <label>Usuario</label>
              <div className="instagram-input">
                <span className="at-sign">@</span>
                <input
                  type="text"
                  placeholder="tuusuario"
                  value={instagram}
                  onChange={e => setInstagram(e.target.value.replace(/[^a-zA-Z0-9._]/g, ''))}
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="setup-field">
              <label>Ciudad</label>
              <select 
                value={city} 
                onChange={e => setCity(e.target.value)}
                className="select-input"
                style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', outline: 'none' }}
              >
                <option value="" disabled>Selecciona una ciudad</option>
                {citiesData.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <button
              className="btn btn-primary setup-btn"
              disabled={!canNext0}
              onClick={() => setStep(1)}
            >
              Continuar <ArrowRight size={18} strokeWidth={3} />
            </button>
          </div>
        )}

        {/* STEP 1 — Intereses */}
        {step === 1 && (
          <div className="setup-card animate-fade-in">
            <button className="setup-back" onClick={() => setStep(0)}><ArrowLeft size={20} /></button>
            <button className="setup-close" onClick={() => navigate('/descubrir')} aria-label="Cerrar"><X size={20} /></button>
            <p className="setup-step-label">Paso 2 de 3</p>
            <h1 className="setup-title brand-gradient-text">Tus gustos.</h1>
            <p className="setup-subtitle">Elige mínimo 3. Así conectamos con quien va en serio.</p>

            <div className="interests-grid">
              {INTERESTS.map(item => (
                <button
                  key={item.id}
                  className={`interest-btn ${interests.has(item.id) ? 'selected' : ''}`}
                  onClick={() => toggleInterest(item.id)}
                >
                  <span className="interest-emoji">{item.emoji}</span>
                  <span>{item.label}</span>
                  {interests.has(item.id) && <Check size={14} className="interest-check" />}
                </button>
              ))}
            </div>

            <div className="setup-count">{interests.size} seleccionados</div>

            <button
              className="btn btn-primary setup-btn"
              disabled={!canNext1}
              onClick={() => setStep(2)}
            >
              Continuar <ArrowRight size={18} strokeWidth={3} />
            </button>
          </div>
        )}

        {/* STEP 2 — Cosa favorita */}
        {step === 2 && (
          <div className="setup-card animate-fade-in">
            <button className="setup-back" onClick={() => setStep(1)}><ArrowLeft size={20} /></button>
            <button className="setup-close" onClick={() => navigate('/descubrir')} aria-label="Cerrar"><X size={20} /></button>
            <p className="setup-step-label">Paso 3 de 3</p>
            <h1 className="setup-title brand-gradient-text">Tu plan perfecto.</h1>
            <p className="setup-subtitle">¿Qué es lo que más te emociona hacer?</p>

            <div className="favorite-grid">
              {FAVORITE_OPTIONS.map(opt => (
                <button
                  key={opt}
                  className={`favorite-btn ${favorite === opt && !customFavorite ? 'selected' : ''}`}
                  onClick={() => { setFavorite(opt); setCustomFavorite(''); }}
                >
                  {opt}
                </button>
              ))}
            </div>

            <div className="setup-field" style={{ marginTop: '1.25rem' }}>
              <label>O escribe el tuyo</label>
              <input
                type="text"
                placeholder="Mi plan favorito es..."
                value={customFavorite}
                onChange={e => { setCustomFavorite(e.target.value); setFavorite(''); }}
                maxLength={60}
              />
            </div>
 
            {error && (
              <p style={{
                color: '#ff4d4f',
                fontSize: '0.85rem',
                background: 'rgba(255, 77, 79, 0.1)',
                border: '1px solid #ff4d4f',
                padding: '0.6rem 0.9rem',
                margin: '1rem 0 0 0',
                borderRadius: '8px',
                width: '100%',
                boxSizing: 'border-box',
              }}>
                {error}
              </p>
            )}

            <button
              className="btn btn-primary setup-btn"
              disabled={!canFinish || loading}
              onClick={handleFinish}
            >
              {loading ? 'Guardando...' : <>Entrar a BRUUK <ArrowRight size={18} strokeWidth={3} /></>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
