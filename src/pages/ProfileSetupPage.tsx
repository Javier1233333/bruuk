import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Camera, Check } from 'lucide-react';
import { BruukLogo } from '../components/BruukLogo';
import './ProfileSetupPage.css';

const INTERESTS = [
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
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [instagram, setInstagram] = useState('');
  const [interests, setInterests] = useState<Set<string>>(new Set());
  const [favorite, setFavorite] = useState('');
  const [customFavorite, setCustomFavorite] = useState('');

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatar(url);
  };

  const toggleInterest = (id: string) => {
    setInterests(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleFinish = () => {
    // Guardar en localStorage hasta que Supabase esté activo
    localStorage.setItem('bruuk_profile_done', 'true');
    localStorage.setItem('bruuk_instagram', instagram);
    localStorage.setItem('bruuk_interests', JSON.stringify([...interests]));
    localStorage.setItem('bruuk_favorite', customFavorite || favorite);
    navigate('/app');
  };

  const canNext0 = instagram.trim().length > 0;
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
            <p className="setup-step-label">Paso 1 de 3</p>
            <h1 className="setup-title brand-gradient-text">Tu perfil.</h1>
            <p className="setup-subtitle">Así te verán los demás en BRUUK.</p>

            <div className="avatar-upload" onClick={() => fileRef.current?.click()}>
              {avatar
                ? <img src={avatar} alt="avatar" className="avatar-preview" />
                : <div className="avatar-placeholder"><Camera size={32} /><span>Subir foto</span></div>
              }
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} hidden />
            </div>

            <div className="setup-field">
              <label>Usuario de Instagram</label>
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

            <button
              className="btn btn-primary setup-btn"
              disabled={!canFinish}
              onClick={handleFinish}
            >
              Entrar a BRUUK <ArrowRight size={18} strokeWidth={3} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
