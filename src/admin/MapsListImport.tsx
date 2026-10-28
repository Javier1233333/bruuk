import { useMemo, useState } from 'react';
import { Check, X } from 'lucide-react';
import { getIdToken } from '../lib/firebase';
import { spotZone } from '../lib/zones';
import { RACK_CATEGORY_NAMES, rackCategory } from './adminCategories';
import { rackStore, spotsStore } from './spotsStore';
import type { RackDoc } from './spotsStore';

/* ============================================================
   Importar una lista de Google Maps a Spots o Rack.
   Pegas el link compartido, /api/maps-list trae los lugares y
   los que eliges se guardan ocultos: nombre, coordenadas, link
   y tu nota como descripción. Foto y detalles se ponen después.
   ============================================================ */

// Lo que devuelve /api/maps-list (api/maps-list.ts)
interface MapsListPlace {
  name: string;
  address: string | null;
  note: string | null;
  lat: number | null;
  lng: number | null;
  mapsLink: string;
}

type Existing = { name: string; coordinates?: { lat: number; lng: number } | null };

const normalize = (name: string) => name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Mismo nombre o el mismo punto (~10 m; las tiendas de una misma cuadra quedan a 50 m)
function isDuplicate(place: MapsListPlace, existing: Existing[]) {
  const name = normalize(place.name);
  return existing.some((item) => normalize(item.name) === name || (
    place.lat !== null && place.lng !== null && item.coordinates
    && Math.abs(item.coordinates.lat - place.lat) < 0.0001 && Math.abs(item.coordinates.lng - place.lng) < 0.0001
  ));
}

export function MapsListImport({ kind, existing, types = [], onClose }: { kind: 'spots' | 'rack'; existing: Existing[]; types?: string[]; onClose: () => void }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [list, setList] = useState<{ title: string | null; places: MapsListPlace[] } | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [type, setType] = useState('');
  const [category, setCategory] = useState<RackDoc['category']>('Rack recomienda');
  const [saving, setSaving] = useState(false);
  const [imported, setImported] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const duplicates = useMemo(
    () => new Set(list?.places.flatMap((place, i) => (isDuplicate(place, existing) ? [i] : [])) ?? []),
    [list, existing],
  );

  const search = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const response = await fetch('/api/maps-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await getIdToken()}` },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error ?? `Error ${response.status}`);
      const places = data.places as MapsListPlace[];
      setList({ title: data.title ?? null, places });
      // Se preseleccionan los que no están todavía
      setSelected(new Set(places.flatMap((place, i) => (isDuplicate(place, existing) ? [] : [i]))));
    } catch (err) {
      setError((err as Error).message);
    }
    setLoading(false);
  };

  const toggle = (i: number) => setSelected((prev) => {
    const next = new Set(prev);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    return next;
  });

  const save = async () => {
    if (!list) return;
    if (kind === 'spots' && !type.trim()) return setError('Elige el tipo de los spots (luego lo cambias uno por uno).');
    setError(null);
    setSaving(true);
    const chosen = list.places.filter((_, i) => selected.has(i));
    try {
      await Promise.all(chosen.map((place) => {
        const base = {
          name: place.name.slice(0, 80),
          description: (place.note ?? '').slice(0, 240),
          imageUrl: '',
          imagePath: null,
          mapsLink: place.mapsLink,
          coordinates: place.lat !== null && place.lng !== null ? { lat: place.lat, lng: place.lng } : null,
          zone: null,
          active: false,
        };
        return kind === 'spots'
          ? spotsStore.save(spotsStore.newId(), {
            ...base, type: type.trim(), highlight: null, city: 'guadalajara', colorAccent: '#7a5230', rating: null, price: null,
          })
          : rackStore.save(rackStore.newId(), { ...base, category });
      }));
      setImported(chosen.length);
    } catch (err) {
      setError(`No se pudo importar: ${(err as Error).message}`);
    }
    setSaving(false);
  };

  return (
    <div className="sa-overlay" onClick={onClose}>
      <div className="sa-panel" onClick={(e) => e.stopPropagation()}>
        <div className="sa-panel__head">
          <h2>Importar de Google Maps</h2>
          <button type="button" className="sa-icon-btn" onClick={onClose} aria-label="Cerrar"><X size={20} /></button>
        </div>

        <div className="sa-panel__body">
          {imported !== null ? (
            <p className="sa-import-done">
              <Check size={20} /> {imported} {imported === 1 ? 'lugar importado' : 'lugares importados'} como ocultos.
              Ponles foto{kind === 'spots' ? ' y tipo' : ''} y hazlos visibles.
            </p>
          ) : (
            <>
              <form className="sa-import-search" onSubmit={(event) => void search(event)}>
                <div className="login-field">
                  <label htmlFor="mi-url">Link de la lista</label>
                  <input id="mi-url" type="url" value={url} placeholder="https://maps.app.goo.gl/..." onChange={(e) => setUrl(e.target.value)} required />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading || !url.trim()}>{loading ? 'Buscando...' : 'Buscar'}</button>
              </form>
              <p className="sa-hint">En Maps: Guardado → tu lista → Compartir, con “Cualquier persona con el vínculo”.</p>

              {list && (
                <>
                  <p className="sa-import-summary">
                    <strong>{list.title ?? 'Lista'}</strong> · {list.places.length} lugares
                    {duplicates.size > 0 && ` · ${duplicates.size} ya están`}
                  </p>

                  {kind === 'spots' ? (
                    <div className="login-field">
                      <label htmlFor="mi-type">Tipo para todos</label>
                      <input id="mi-type" list="mi-types" value={type} placeholder="Café" onChange={(e) => setType(e.target.value)} maxLength={40} />
                      <datalist id="mi-types">{types.map((t) => <option key={t} value={t} />)}</datalist>
                    </div>
                  ) : (
                    <div className="login-field">
                      <label htmlFor="mi-category">Categoría para todos</label>
                      <select id="mi-category" value={category} onChange={(e) => setCategory(e.target.value as RackDoc['category'])}>
                        {RACK_CATEGORY_NAMES.map((name) => <option key={name} value={name}>{rackCategory({ category: name }).label}</option>)}
                      </select>
                    </div>
                  )}

                  <ul className="sa-import-list">
                    {list.places.map((place, i) => {
                      const zone = spotZone({ coordinates: place.lat !== null && place.lng !== null ? { lat: place.lat, lng: place.lng } : null });
                      return (
                        <li key={i}>
                          <label className={`sa-import-row${duplicates.has(i) ? ' is-duplicate' : ''}`}>
                            <input type="checkbox" checked={selected.has(i)} onChange={() => toggle(i)} />
                            <span className="sa-row__info">
                              <span className="sa-row__name">{place.name}</span>
                              <span className="sa-row__meta">
                                {duplicates.has(i) && <span className="sa-warn">ya está · </span>}
                                {zone?.name ?? (place.lat === null ? <span className="sa-warn">sin coordenadas</span> : 'sin zona')}
                                {place.note && ` · ${place.note}`}
                              </span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </>
          )}

          {error && <p className="login-error">{error}</p>}
        </div>

        <div className="sa-panel__foot">
          {imported !== null ? (
            <button type="button" className="btn btn-primary" onClick={onClose}>Listo</button>
          ) : (
            <>
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
              <button type="button" className="btn btn-primary" onClick={() => void save()} disabled={saving || selected.size === 0}>
                {saving ? 'Importando...' : `Importar ${selected.size}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
