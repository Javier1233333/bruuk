import { useMemo, useState } from 'react';
import { Eye, EyeOff, ImagePlus, ListPlus, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { spotZone } from '../lib/zones';
import { CategoryGroup, RowImage } from './adminShared';
import { RACK_CATEGORY_NAMES, groupByCategory, rackCategory } from './adminCategories';
import { MapsListImport } from './MapsListImport';
import { MAX_IMAGE_BYTES, rackStore, removeImage } from './spotsStore';
import type { RackDoc, RackInput } from './spotsStore';

/* ============================================================
   Lugares de Rack en /admin/spots → pestaña Rack.
   Mismo patrón que el gestor de spots, con los campos de Rack.
   ============================================================ */

type Filter = 'all' | 'active' | 'hidden';

export function RackView({ places, loaded, loadError, zoneNames }: { places: RackDoc[]; loaded: boolean; loadError: string | null; zoneNames: string[] }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [editing, setEditing] = useState<RackDoc | 'new' | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return places.filter((place) => {
      if (filter === 'active' && !place.active) return false;
      if (filter === 'hidden' && place.active) return false;
      return !q || place.name.toLowerCase().includes(q) || place.category.toLowerCase().includes(q);
    });
  }, [places, query, filter]);

  const activeCount = places.filter((place) => place.active).length;

  const run = async (action: () => Promise<void>) => {
    setRowError(null);
    try {
      await action();
    } catch (err) {
      setRowError((err as Error).message);
    }
  };

  return (
    <main className="sa-main">
      <div className="sa-toolbar">
        <div className="sa-search">
          <Search size={16} />
          <input type="search" placeholder="Buscar por nombre o categoría" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="sa-filters" role="tablist">
          {(['all', 'active', 'hidden'] as const).map((f) => (
            <button key={f} role="tab" aria-selected={filter === f} className={`sa-filter${filter === f ? ' is-active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? `Todos ${places.length}` : f === 'active' ? `Activos ${activeCount}` : `Ocultos ${places.length - activeCount}`}
            </button>
          ))}
        </div>
        <button className="btn btn-secondary sa-new" onClick={() => setImporting(true)}>
          <ListPlus size={18} /> Importar de Maps
        </button>
        <button className="btn btn-primary sa-new" onClick={() => setEditing('new')}>
          <Plus size={18} strokeWidth={3} /> Nuevo lugar
        </button>
      </div>

      {loadError && <p className="login-error">No se pudo cargar Rack: {loadError}</p>}
      {rowError && <p className="login-error">{rowError}</p>}

      {!loaded ? (
        <p className="sa-empty">Cargando Rack...</p>
      ) : visible.length === 0 ? (
        <p className="sa-empty">
          {places.length === 0 ? 'Aún no hay lugares. Corre scripts/seed-rack.mjs o crea uno.' : 'Ningún lugar coincide.'}
        </p>
      ) : (
        groupByCategory(visible, rackCategory, (place) => Boolean(spotZone(place))).map((group) => (
          <CategoryGroup key={group.label} label={group.label} Icon={group.Icon} count={group.items.length} missingZone={group.missingZone}>
            {group.items.map((place) => (
              <li key={place.id} className={`sa-row${place.active ? '' : ' is-hidden'}${spotZone(place) ? '' : ' is-no-zone'}`}>
                <RowImage src={place.imageUrl} name={place.name} />
                <div className="sa-row__info">
                  <span className="sa-row__name">{place.name}</span>
                  <span className="sa-row__meta">
                    {spotZone(place)?.name ?? <span className="sa-warn">sin zona</span>}
                    {!place.coordinates && <span className="sa-warn"> · sin coordenadas</span>}
                  </span>
                </div>
                <div className="sa-row__actions">
                  {confirmDelete === place.id ? (
                    <>
                      <span className="sa-confirm">¿Borrar?</span>
                      <button className="sa-icon-btn sa-danger" onClick={() => void run(async () => { await rackStore.remove(place); setConfirmDelete(null); })}>Sí</button>
                      <button className="sa-icon-btn" onClick={() => setConfirmDelete(null)}>No</button>
                    </>
                  ) : (
                    <>
                      <button
                        className="sa-icon-btn"
                        onClick={() => void run(() => rackStore.setActive(place.id, !place.active))}
                        aria-label={place.active ? 'Ocultar' : 'Mostrar'}
                        title={place.active ? 'Visible: clic para ocultar' : 'Oculto: clic para mostrar'}
                      >
                        {place.active ? <Eye size={18} /> : <EyeOff size={18} />}
                      </button>
                      <button className="sa-icon-btn" onClick={() => setEditing(place)} aria-label="Editar" title="Editar"><Pencil size={18} /></button>
                      <button className="sa-icon-btn" onClick={() => setConfirmDelete(place.id)} aria-label="Borrar" title="Borrar"><Trash2 size={18} /></button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </CategoryGroup>
        ))
      )}

      {importing && <MapsListImport kind="rack" existing={places} onClose={() => setImporting(false)} />}
      {editing && <RackForm place={editing === 'new' ? null : editing} zoneNames={zoneNames} onClose={() => setEditing(null)} />}
    </main>
  );
}

/* ── Formulario ────────────────────────────────────────────── */

interface FormState {
  name: string;
  category: RackDoc['category'];
  description: string;
  imageUrl: string;
  imagePath: string | null;
  mapsLink: string;
  lat: string;
  lng: string;
  zone: string;
  active: boolean;
}

const toForm = (place: RackDoc | null): FormState => ({
  name: place?.name ?? '',
  category: place?.category ?? 'Rack recomienda',
  description: place?.description ?? '',
  imageUrl: place?.imageUrl ?? '',
  imagePath: place?.imagePath ?? null,
  mapsLink: place?.mapsLink ?? '',
  lat: place?.coordinates ? String(place.coordinates.lat) : '',
  lng: place?.coordinates ? String(place.coordinates.lng) : '',
  zone: place?.zone ?? '',
  active: place?.active ?? true,
});

function RackForm({ place, zoneNames, onClose }: { place: RackDoc | null; zoneNames: string[]; onClose: () => void }) {
  const [placeId] = useState(() => place?.id ?? rackStore.newId());
  const [form, setForm] = useState<FormState>(() => toForm(place));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Fotos subidas en esta edición que no terminaron guardadas: se borran al cerrar
  const [pendingUploads, setPendingUploads] = useState<string[]>([]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const close = () => {
    pendingUploads.forEach(removeImage);
    onClose();
  };

  // Acepta pegar "20.6694, -103.3661" en el campo de latitud
  const handleLat = (value: string) => {
    const m = value.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/);
    if (m) setForm((f) => ({ ...f, lat: m[1], lng: m[2] }));
    else set('lat', value);
  };

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError('El archivo debe ser una imagen.');
    if (file.size > MAX_IMAGE_BYTES) return setError('La imagen pesa más de 5 MB.');
    setError(null);
    setUploading(true);
    try {
      const { url, path } = await rackStore.uploadImage(placeId, file);
      setPendingUploads((p) => [...p, path]);
      setForm((f) => ({ ...f, imageUrl: url, imagePath: path }));
    } catch (err) {
      setError(`No se pudo subir la imagen: ${(err as Error).message}`);
    }
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const hasCoords = form.lat.trim() !== '' || form.lng.trim() !== '';
    const lat = Number(form.lat);
    const lng = Number(form.lng);
    if (hasCoords && (Number.isNaN(lat) || Number.isNaN(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180)) {
      return setError('Coordenadas inválidas.');
    }
    if (!/^https?:\/\//.test(form.mapsLink.trim())) return setError('El link de Maps debe empezar con http.');

    // La foto es opcional: los tianguis no llevan
    const data: RackInput = {
      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      imageUrl: form.imageUrl,
      imagePath: form.imagePath,
      mapsLink: form.mapsLink.trim(),
      coordinates: hasCoords ? { lat, lng } : null,
      zone: form.zone || null,
      active: form.active,
    };

    setSaving(true);
    try {
      await rackStore.save(placeId, data);
      const stale = [...pendingUploads, place?.imagePath ?? null].filter((p): p is string => !!p && p !== data.imagePath);
      stale.forEach(removeImage);
      onClose();
    } catch (err) {
      setError(`No se pudo guardar: ${(err as Error).message}`);
      setSaving(false);
    }
  };

  const currentZone = spotZone({ zone: form.zone, coordinates: form.lat && form.lng ? { lat: Number(form.lat), lng: Number(form.lng) } : null });

  return (
    <div className="sa-overlay" onClick={close}>
      <form className="sa-panel" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <div className="sa-panel__head">
          <h2>{place ? 'Editar lugar de Rack' : 'Nuevo lugar de Rack'}</h2>
          <button type="button" className="sa-icon-btn" onClick={close} aria-label="Cerrar"><X size={20} /></button>
        </div>

        <div className="sa-panel__body">
          <label className="sa-photo">
            {form.imageUrl ? <img src={form.imageUrl} alt="" /> : <span><ImagePlus size={28} /> Subir foto (opcional)</span>}
            {uploading && <span className="sa-photo__busy">Subiendo...</span>}
            <input type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0])} disabled={uploading} />
          </label>
          <div className="login-field">
            <label htmlFor="ra-imageUrl">…o pega la URL de la foto</label>
            <input
              id="ra-imageUrl"
              type="url"
              value={form.imagePath ? '' : form.imageUrl}
              placeholder={form.imagePath ? 'Foto subida' : 'https://...'}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value, imagePath: null }))}
            />
          </div>

          <div className="login-field">
            <label htmlFor="ra-name">Nombre</label>
            <input id="ra-name" value={form.name} onChange={(e) => set('name', e.target.value)} required maxLength={80} />
          </div>

          <div className="login-field">
            <label htmlFor="ra-category">Categoría</label>
            <select id="ra-category" value={form.category} onChange={(e) => set('category', e.target.value as RackDoc['category'])}>
              {RACK_CATEGORY_NAMES.map((name) => <option key={name} value={name}>{rackCategory({ category: name }).label}</option>)}
            </select>
          </div>

          <div className="login-field">
            <label htmlFor="ra-description">Descripción</label>
            <textarea id="ra-description" rows={3} value={form.description} onChange={(e) => set('description', e.target.value)} required maxLength={240} />
          </div>

          <div className="login-field">
            <label htmlFor="ra-maps">Link de Google Maps</label>
            <input id="ra-maps" type="url" value={form.mapsLink} onChange={(e) => set('mapsLink', e.target.value)} required />
          </div>

          <div className="sa-grid">
            <div className="login-field">
              <label htmlFor="ra-lat">Latitud</label>
              <input id="ra-lat" inputMode="decimal" value={form.lat} placeholder="20.6694" onChange={(e) => handleLat(e.target.value)} />
            </div>
            <div className="login-field">
              <label htmlFor="ra-lng">Longitud</label>
              <input id="ra-lng" inputMode="decimal" value={form.lng} placeholder="-103.3661" onChange={(e) => set('lng', e.target.value)} />
            </div>
          </div>
          <p className="sa-hint">Puedes pegar “lat, lng” directo desde Google Maps en el campo de latitud.</p>

          <div className="login-field">
            <label htmlFor="ra-zone">Colonia</label>
            <select id="ra-zone" className={currentZone ? '' : 'is-no-zone'} value={form.zone} onChange={(e) => set('zone', e.target.value)}>
              <option value="">Automática por coordenadas</option>
              {zoneNames.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>

          <label className="sa-check">
            <input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} />
            Visible en el sitio
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
