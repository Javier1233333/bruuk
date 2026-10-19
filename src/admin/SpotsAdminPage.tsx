import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { Eye, EyeOff, ImagePlus, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { auth, googleProvider } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { BruukLogo } from '../components/BruukLogo';
import {
  MAX_IMAGE_BYTES,
  deleteSpot,
  newSpotId,
  removeImage,
  saveSpot,
  setSpotActive,
  uploadSpotImage,
  watchSpots,
} from './spotsStore';
import type { SpotDoc, SpotInput } from './spotsStore';
import '../pages/LoginPage.css';
import './SpotsAdminPage.css';

type Filter = 'all' | 'active' | 'hidden';

export function SpotsAdminPage() {
  const { user, loading, isAdmin, signOut } = useAuth();

  if (loading) return <div className="sa-center">BRUUK...</div>;
  if (!user) return <AdminLogin />;
  if (!isAdmin) {
    return (
      <div className="sa-center">
        <p>La cuenta {user.email} no tiene permisos de admin.</p>
        <button className="btn btn-secondary" onClick={signOut}>Cerrar sesión</button>
      </div>
    );
  }
  return <SpotsManager email={user.email ?? ''} onSignOut={signOut} />;
}

/* ── Login ─────────────────────────────────────────────────── */

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch {
      setError('Correo o contraseña incorrectos.');
    }
    setBusy(false);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <Link to="/" className="login-logo"><BruukLogo /></Link>
        <div className="login-card">
          <h1 className="login-title brand-gradient-text">Gestor de spots</h1>
          <p className="login-subtitle">Entra con tu cuenta de admin.</p>
          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="sa-email">Correo electrónico</label>
              <input id="sa-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
            </div>
            <div className="login-field">
              <label htmlFor="sa-password">Contraseña</label>
              <input id="sa-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" />
            </div>
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="btn btn-primary w-full" disabled={busy}>
              {busy ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          <div className="login-divider"><span>o</span></div>
          <button className="btn-google" type="button" onClick={() => signInWithPopup(auth, googleProvider).catch(() => {})}>
            Continuar con Google
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Lista ─────────────────────────────────────────────────── */

function SpotsManager({ email, onSignOut }: { email: string; onSignOut: () => Promise<void> }) {
  const [spots, setSpots] = useState<SpotDoc[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [editing, setEditing] = useState<SpotDoc | 'new' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  useEffect(() => watchSpots(
    (data) => { setSpots(data); setLoaded(true); },
    (err) => { setLoadError(err.message); setLoaded(true); },
  ), []);

  const types = useMemo(() => [...new Set(spots.map(s => s.type).filter(Boolean))].sort(), [spots]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return spots.filter((s) => {
      if (filter === 'active' && !s.active) return false;
      if (filter === 'hidden' && s.active) return false;
      return !q || s.name.toLowerCase().includes(q) || s.type.toLowerCase().includes(q);
    });
  }, [spots, query, filter]);

  const activeCount = spots.filter(s => s.active).length;

  const toggleActive = async (spot: SpotDoc) => {
    setRowError(null);
    try {
      await setSpotActive(spot.id, !spot.active);
    } catch (err) {
      setRowError((err as Error).message);
    }
  };

  const handleDelete = async (spot: SpotDoc) => {
    setRowError(null);
    try {
      await deleteSpot(spot);
      setConfirmDelete(null);
    } catch (err) {
      setRowError((err as Error).message);
    }
  };

  return (
    <div className="sa-page">
      <header className="sa-header">
        <div className="sa-header__left">
          <Link to="/" className="sa-logo"><BruukLogo /></Link>
          <span className="sa-header__title">Spots</span>
        </div>
        <div className="sa-header__right">
          <span className="sa-header__email">{email}</span>
          <button className="sa-link-btn" onClick={onSignOut}>Salir</button>
        </div>
      </header>

      <main className="sa-main">
        <div className="sa-toolbar">
          <div className="sa-search">
            <Search size={16} />
            <input
              type="search"
              placeholder="Buscar por nombre o tipo"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <div className="sa-filters" role="tablist">
            {(['all', 'active', 'hidden'] as const).map((f) => (
              <button
                key={f}
                role="tab"
                aria-selected={filter === f}
                className={`sa-filter${filter === f ? ' is-active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' ? `Todos ${spots.length}` : f === 'active' ? `Activos ${activeCount}` : `Ocultos ${spots.length - activeCount}`}
              </button>
            ))}
          </div>
          <button className="btn btn-primary sa-new" onClick={() => setEditing('new')}>
            <Plus size={18} strokeWidth={3} /> Nuevo spot
          </button>
        </div>

        {loadError && <p className="login-error">No se pudieron cargar los spots: {loadError}</p>}
        {rowError && <p className="login-error">{rowError}</p>}

        {!loaded ? (
          <p className="sa-empty">Cargando spots...</p>
        ) : visible.length === 0 ? (
          <p className="sa-empty">
            {spots.length === 0 ? 'Aún no hay spots. Corre scripts/seed-spots.mjs o crea uno.' : 'Ningún spot coincide.'}
          </p>
        ) : (
          <ul className="sa-list">
            {visible.map((spot) => (
              <li key={spot.id} className={`sa-row${spot.active ? '' : ' is-hidden'}`}>
                <img className="sa-row__img" src={spot.imageUrl} alt="" loading="lazy" />
                <div className="sa-row__info">
                  <span className="sa-row__name">{spot.name}</span>
                  <span className="sa-row__meta">
                    <span className="sa-dot" style={{ background: spot.colorAccent }} />
                    {spot.type}{spot.price ? ` · ${spot.price}` : ''}{spot.rating ? ` · ★ ${spot.rating}` : ''}
                    {!spot.coordinates && <span className="sa-warn"> · sin coordenadas</span>}
                  </span>
                </div>
                <div className="sa-row__actions">
                  {confirmDelete === spot.id ? (
                    <>
                      <span className="sa-confirm">¿Borrar?</span>
                      <button className="sa-icon-btn sa-danger" onClick={() => handleDelete(spot)}>Sí</button>
                      <button className="sa-icon-btn" onClick={() => setConfirmDelete(null)}>No</button>
                    </>
                  ) : (
                    <>
                      <button
                        className="sa-icon-btn"
                        onClick={() => toggleActive(spot)}
                        aria-label={spot.active ? 'Ocultar' : 'Mostrar'}
                        title={spot.active ? 'Visible: clic para ocultar' : 'Oculto: clic para mostrar'}
                      >
                        {spot.active ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                      <button className="sa-icon-btn" onClick={() => setEditing(spot)} aria-label="Editar" title="Editar">
                        <Pencil size={18} />
                      </button>
                      <button className="sa-icon-btn" onClick={() => setConfirmDelete(spot.id)} aria-label="Borrar" title="Borrar">
                        <Trash2 size={18} />
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {editing && (
        <SpotForm
          spot={editing === 'new' ? null : editing}
          types={types}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

/* ── Formulario ────────────────────────────────────────────── */

interface FormState {
  name: string;
  type: string;
  description: string;
  imageUrl: string;
  imagePath: string | null;
  colorAccent: string;
  rating: string;
  price: string;
  mapsLink: string;
  lat: string;
  lng: string;
  active: boolean;
}

function toForm(spot: SpotDoc | null): FormState {
  return {
    name: spot?.name ?? '',
    type: spot?.type ?? '',
    description: spot?.description ?? '',
    imageUrl: spot?.imageUrl ?? '',
    imagePath: spot?.imagePath ?? null,
    colorAccent: spot?.colorAccent ?? '#7a5230',
    rating: spot?.rating != null ? String(spot.rating) : '',
    price: spot?.price ?? '',
    mapsLink: spot?.mapsLink ?? '',
    lat: spot?.coordinates ? String(spot.coordinates.lat) : '',
    lng: spot?.coordinates ? String(spot.coordinates.lng) : '',
    active: spot?.active ?? true,
  };
}

function SpotForm({ spot, types, onClose }: { spot: SpotDoc | null; types: string[]; onClose: () => void }) {
  const [spotId] = useState(() => spot?.id ?? newSpotId());
  const [form, setForm] = useState<FormState>(() => toForm(spot));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Fotos subidas en esta edición que no terminaron guardadas: se borran al cerrar
  const [pendingUploads, setPendingUploads] = useState<string[]>([]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(f => ({ ...f, [key]: value }));

  const close = () => {
    pendingUploads.forEach(removeImage);
    onClose();
  };

  // Acepta pegar "20.6694, -103.3661" en el campo de latitud
  const handleLat = (value: string) => {
    const m = value.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (m) setForm(f => ({ ...f, lat: m[1], lng: m[2] }));
    else set('lat', value);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('El archivo debe ser una imagen.');
    if (file.size > MAX_IMAGE_BYTES) return setError('La imagen pesa más de 5 MB.');
    setError(null);
    setUploading(true);
    try {
      const { url, path } = await uploadSpotImage(spotId, file);
      setPendingUploads(p => [...p, path]);
      setForm(f => ({ ...f, imageUrl: url, imagePath: path }));
    } catch (err) {
      setError(`No se pudo subir la imagen: ${(err as Error).message}`);
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const rating = form.rating.trim() ? Number(form.rating) : null;
    if (rating !== null && (Number.isNaN(rating) || rating < 0 || rating > 5)) {
      return setError('El rating va de 0 a 5.');
    }
    const hasCoords = form.lat.trim() !== '' || form.lng.trim() !== '';
    const lat = Number(form.lat);
    const lng = Number(form.lng);
    if (hasCoords && (Number.isNaN(lat) || Number.isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180)) {
      return setError('Coordenadas inválidas.');
    }
    if (!form.imageUrl) return setError('Agrega una foto.');
    if (!/^https?:\/\//.test(form.mapsLink.trim())) return setError('El link de Maps debe empezar con http.');

    const data: SpotInput = {
      name: form.name.trim(),
      type: form.type.trim(),
      description: form.description.trim(),
      imageUrl: form.imageUrl,
      imagePath: form.imagePath,
      colorAccent: form.colorAccent,
      rating,
      price: form.price.trim() || null,
      mapsLink: form.mapsLink.trim(),
      coordinates: hasCoords ? { lat, lng } : null,
      active: form.active,
    };

    setSaving(true);
    try {
      await saveSpot(spotId, data);
      // Limpiar fotos reemplazadas: la anterior del spot y las subidas que no quedaron
      const stale = [...pendingUploads, spot?.imagePath ?? null].filter(
        (p): p is string => !!p && p !== data.imagePath,
      );
      stale.forEach(removeImage);
      onClose();
    } catch (err) {
      setError(`No se pudo guardar: ${(err as Error).message}`);
      setSaving(false);
    }
  };

  return (
    <div className="sa-overlay" onClick={close}>
      <form className="sa-panel" onClick={e => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="sa-panel__head">
          <h2>{spot ? 'Editar spot' : 'Nuevo spot'}</h2>
          <button type="button" className="sa-icon-btn" onClick={close} aria-label="Cerrar"><X size={20} /></button>
        </div>

        <div className="sa-panel__body">
          <label className="sa-photo">
            {form.imageUrl ? <img src={form.imageUrl} alt="" /> : <span><ImagePlus size={28} /> Subir foto</span>}
            {uploading && <span className="sa-photo__busy">Subiendo...</span>}
            <input type="file" accept="image/*" onChange={e => handleFile(e.target.files?.[0])} disabled={uploading} />
          </label>
          <div className="login-field">
            <label htmlFor="sa-imageUrl">…o pega la URL de la foto</label>
            <input
              id="sa-imageUrl"
              type="url"
              value={form.imagePath ? '' : form.imageUrl}
              placeholder={form.imagePath ? 'Foto subida' : 'https://...'}
              onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value, imagePath: null }))}
            />
          </div>

          <div className="login-field">
            <label htmlFor="sa-name">Nombre</label>
            <input id="sa-name" value={form.name} onChange={e => set('name', e.target.value)} required maxLength={80} />
          </div>

          <div className="sa-grid">
            <div className="login-field">
              <label htmlFor="sa-type">Tipo</label>
              <input id="sa-type" list="sa-types" value={form.type} onChange={e => set('type', e.target.value)} required maxLength={40} />
              <datalist id="sa-types">{types.map(t => <option key={t} value={t} />)}</datalist>
            </div>
            <div className="login-field">
              <label htmlFor="sa-color">Color</label>
              <input id="sa-color" type="color" className="sa-color" value={form.colorAccent} onChange={e => set('colorAccent', e.target.value)} />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="sa-description">Descripción</label>
            <textarea id="sa-description" rows={2} value={form.description} onChange={e => set('description', e.target.value)} required maxLength={200} />
          </div>

          <div className="sa-grid">
            <div className="login-field">
              <label htmlFor="sa-price">Precio</label>
              <input id="sa-price" value={form.price} placeholder="$200-300" onChange={e => set('price', e.target.value)} maxLength={30} />
            </div>
            <div className="login-field">
              <label htmlFor="sa-rating">Rating</label>
              <input id="sa-rating" type="number" min={0} max={5} step={0.1} value={form.rating} onChange={e => set('rating', e.target.value)} />
            </div>
          </div>

          <div className="login-field">
            <label htmlFor="sa-maps">Link de Google Maps</label>
            <input id="sa-maps" type="url" value={form.mapsLink} onChange={e => set('mapsLink', e.target.value)} required />
          </div>

          <div className="sa-grid">
            <div className="login-field">
              <label htmlFor="sa-lat">Latitud</label>
              <input id="sa-lat" inputMode="decimal" value={form.lat} placeholder="20.6694" onChange={e => handleLat(e.target.value)} />
            </div>
            <div className="login-field">
              <label htmlFor="sa-lng">Longitud</label>
              <input id="sa-lng" inputMode="decimal" value={form.lng} placeholder="-103.3661" onChange={e => set('lng', e.target.value)} />
            </div>
          </div>
          <p className="sa-hint">Puedes pegar “lat, lng” directo desde Google Maps en el campo de latitud.</p>

          <label className="sa-check">
            <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} />
            Visible en la app
          </label>

          {error && <p className="login-error">{error}</p>}
        </div>

        <div className="sa-panel__foot">
          <button type="button" className="btn btn-secondary" onClick={close}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </form>
    </div>
  );
}
