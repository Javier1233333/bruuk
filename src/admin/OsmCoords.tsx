import { useMemo, useRef, useState } from 'react';
import { Crosshair, MapPinned } from 'lucide-react';
import { distanceKm } from '../lib/zones';
import { setRowLocation, type PlaceRow } from './zoneRows';

/* ============================================================
   Coordenadas desde OpenStreetMap, sin llave: busca cada lugar
   por nombre en Photon (y si no sale, en Nominatim), sólo dentro
   del área de Guadalajara, y muestra lo que encontró antes de
   guardar. Nada se guarda sin que lo palomees. El link de Maps
   de cada lugar no se toca.
   ============================================================ */

type Found = { name: string; address: string; lat: number; lng: number };
type Lookup = { key: string; found: Found | null };

// Zona metropolitana de Guadalajara (Zapopan, Tlaquepaque, Tonalá, Tlajomulco cerca).
const BBOX = { minLng: -103.56, minLat: 20.52, maxLng: -103.2, maxLat: 20.82 };
const CENTER = { lat: 20.6736, lng: -103.344 };
// Las dos APIs públicas piden no pasar de una consulta por segundo.
const PAUSE_MS = 1100;
// Menos de esto se considera el mismo punto.
const SAME_METERS = 60;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

// ¿Lo encontrado se llama como el lugar? Si no, se deja sin palomear para revisarlo.
const sameName = (a: string, b: string) => {
  const x = normalize(a);
  const y = normalize(b);
  return Boolean(x && y) && (x.includes(y) || y.includes(x));
};

const inBox = (lat: number, lng: number) => lat >= BBOX.minLat && lat <= BBOX.maxLat && lng >= BBOX.minLng && lng <= BBOX.maxLng;

type PhotonFeature = { geometry?: { coordinates?: [number, number] }; properties?: Record<string, string | undefined> };

async function photon(name: string): Promise<Found | null> {
  const params = new URLSearchParams({
    q: name,
    lat: String(CENTER.lat),
    lon: String(CENTER.lng),
    bbox: `${BBOX.minLng},${BBOX.minLat},${BBOX.maxLng},${BBOX.maxLat}`,
    limit: '5',
  });
  const res = await fetch(`https://photon.komoot.io/api/?${params}`);
  if (!res.ok) throw new Error(`OpenStreetMap (Photon) respondió ${res.status}.`);
  const data = await res.json() as { features?: PhotonFeature[] };
  const features = (data.features ?? []).filter((feature) => feature.properties?.name && feature.geometry?.coordinates);
  // Mejor uno que se llame igual; si no, el primero (más cercano al centro).
  const best = features.find((feature) => sameName(feature.properties!.name!, name)) ?? features[0];
  if (!best) return null;
  const [lng, lat] = best.geometry!.coordinates!;
  if (!inBox(lat, lng)) return null;
  const p = best.properties!;
  const street = [p.street, p.housenumber].filter(Boolean).join(' ');
  return { name: p.name!, address: [street, p.district, p.city].filter(Boolean).join(', '), lat, lng };
}

async function nominatim(name: string): Promise<Found | null> {
  const params = new URLSearchParams({
    q: name,
    format: 'jsonv2',
    limit: '1',
    countrycodes: 'mx',
    'accept-language': 'es',
    viewbox: `${BBOX.minLng},${BBOX.maxLat},${BBOX.maxLng},${BBOX.minLat}`,
    bounded: '1',
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
  if (!res.ok) throw new Error(`OpenStreetMap (Nominatim) respondió ${res.status}.`);
  const [hit] = await res.json() as { name?: string; display_name?: string; lat?: string; lon?: string }[];
  const lat = Number(hit?.lat);
  const lng = Number(hit?.lon);
  if (!hit || !Number.isFinite(lat) || !Number.isFinite(lng) || !inBox(lat, lng)) return null;
  const address = (hit.display_name ?? '').split(', ').slice(1, 4).join(', ');
  return { name: hit.name || (hit.display_name ?? '').split(',')[0], address, lat, lng };
}

const metersMoved = (row: PlaceRow, found: Found) =>
  row.item.coordinates ? Math.round(distanceKm(row.item.coordinates.lat, row.item.coordinates.lng, found.lat, found.lng) * 1000) : null;

export function OsmCoords({ rows, onFocus }: { rows: PlaceRow[]; onFocus: (lat: number, lng: number) => void }) {
  const [scope, setScope] = useState<'missing' | 'all'>('missing');
  const [results, setResults] = useState<Lookup[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const cancelRef = useRef(false);

  const missing = useMemo(() => rows.filter((row) => !row.item.coordinates), [rows]);
  const targets = scope === 'missing' ? missing : rows;
  const byKey = useMemo(() => new Map(rows.map((row) => [row.key, row])), [rows]);

  // Sólo lo que vale la pena revisar: nuevos, los que se mueven y los no encontrados.
  const reviewed = useMemo(() => results
    .map((result) => ({ result, row: byKey.get(result.key) }))
    .filter((entry): entry is { result: Lookup; row: PlaceRow } => Boolean(entry.row))
    .filter(({ result, row }) => !result.found || (metersMoved(row, result.found) ?? Infinity) >= SAME_METERS), [results, byKey]);
  const unchanged = results.length - reviewed.length;
  const notFound = results.filter((result) => !result.found).length;

  const search = async () => {
    cancelRef.current = false;
    setError(null);
    setNotice(null);
    setResults([]);
    setSelected(new Set());
    const list = [...targets];
    const found: Lookup[] = [];
    const preselect = new Set<string>();
    setProgress({ done: 0, total: list.length });
    try {
      for (const [index, row] of list.entries()) {
        if (cancelRef.current) break;
        let hit = await photon(row.item.name);
        if (!hit) {
          await wait(PAUSE_MS);
          hit = await nominatim(row.item.name);
        }
        found.push({ key: row.key, found: hit });
        // Se palomean solos los que no tenían coordenadas y se llaman igual; lo demás lo decides tú.
        if (hit && !row.item.coordinates && sameName(hit.name, row.item.name)) preselect.add(row.key);
        setResults([...found]);
        setSelected(new Set(preselect));
        setProgress({ done: index + 1, total: list.length });
        if (index < list.length - 1) await wait(PAUSE_MS);
      }
    } catch (err) {
      setError(`${(err as Error).message} Intenta de nuevo en un rato.`);
    }
    setProgress(null);
  };

  const toggle = (key: string) => setSelected((current) => {
    const next = new Set(current);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const save = async () => {
    setSaving(true);
    setError(null);
    const failed: string[] = [];
    let saved = 0;
    for (const { key, found } of results) {
      const row = byKey.get(key);
      if (!selected.has(key) || !found || !row) continue;
      try {
        await setRowLocation(row, { lat: found.lat, lng: found.lng });
        saved += 1;
      } catch {
        failed.push(row.item.name);
      }
    }
    setSaving(false);
    setResults([]);
    setSelected(new Set());
    setNotice(`${saved} ${saved === 1 ? 'lugar actualizado' : 'lugares actualizados'} con coordenadas de OpenStreetMap.`);
    if (failed.length) setError(`No se pudo guardar: ${failed.join(', ')}`);
  };

  const busy = progress !== null || saving;
  const minutes = Math.max(1, Math.round((targets.length * PAUSE_MS * 1.3) / 60000));

  return (
    <section className="sa-gcoords" aria-labelledby="sa-gcoords-title">
      <h3 id="sa-gcoords-title" className="sa-map-side__title"><MapPinned size={15} aria-hidden="true" /> Coordenadas de OpenStreetMap</h3>
      <div className="sa-gcoords__scope" role="radiogroup" aria-label="Qué lugares buscar">
        <label><input type="radio" checked={scope === 'missing'} onChange={() => setScope('missing')} disabled={busy} /> Sin coordenadas ({missing.length})</label>
        <label><input type="radio" checked={scope === 'all'} onChange={() => setScope('all')} disabled={busy} /> Revisar todos ({rows.length})</label>
      </div>
      {progress ? (
        <div className="sa-gcoords__running">
          <span role="status">Buscando… {progress.done}/{progress.total}</span>
          <button type="button" className="btn" onClick={() => { cancelRef.current = true; }}>Detener</button>
        </div>
      ) : (
        <button type="button" className="btn btn-primary sa-gcoords__go" onClick={() => void search()} disabled={busy || targets.length === 0}>
          Buscar en OpenStreetMap ({targets.length})
        </button>
      )}
      <p className="sa-hint">
        Gratis y sin llave: va de uno en uno (unos {minutes} min para {targets.length}). Muchos cafés y bares chicos no están en OpenStreetMap; esos se ponen a mano.
      </p>
      {error && <p className="login-error">{error}</p>}
      {notice && <p className="sa-map-notice" role="status">{notice}</p>}

      {results.length > 0 && (
        <>
          <p className="sa-hint">
            Revisa que sea el lugar correcto antes de guardar: los que no se llaman igual van sin palomear.
            {unchanged > 0 ? ` ${unchanged} ya estaban bien.` : ''}
            {notFound > 0 ? ` ${notFound} no aparecieron.` : ''}
          </p>
          <ul className="sa-gcoords__list">
            {reviewed.map(({ result, row }) => {
              const found = result.found;
              const moved = found ? metersMoved(row, found) : null;
              const similar = found ? sameName(found.name, row.item.name) : false;
              return (
                <li key={result.key} className={found ? '' : 'is-missing'}>
                  <label>
                    <input type="checkbox" checked={selected.has(result.key)} onChange={() => toggle(result.key)} disabled={!found || progress !== null} />
                    <span className="sa-gcoords__info">
                      <span className="sa-row__name">{row.item.name}</span>
                      {found ? (
                        <>
                          <span className="sa-gcoords__match">→ {found.name}</span>
                          {found.address && <span className="sa-row__meta">{found.address}</span>}
                          <span className="sa-gcoords__tags">
                            <span className={`sa-gcoords__tag${moved == null ? ' is-new' : ' is-moved'}`}>
                              {moved == null ? 'Nuevo' : `Se mueve ${moved >= 1000 ? `${(moved / 1000).toFixed(1)} km` : `${moved} m`}`}
                            </span>
                            {!similar && <span className="sa-gcoords__tag is-check">Otro nombre: revisa</span>}
                          </span>
                        </>
                      ) : (
                        <span className="sa-row__meta">No está en OpenStreetMap: ponlo a mano.</span>
                      )}
                    </span>
                  </label>
                  {found && (
                    <button type="button" className="sa-gcoords__see" onClick={() => onFocus(found.lat, found.lng)} aria-label={`Ver en el mapa lo encontrado para ${row.item.name}`}>
                      <Crosshair size={15} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          {!progress && (
            <button type="button" className="btn btn-primary sa-gcoords__go" onClick={() => void save()} disabled={saving || selected.size === 0}>
              {saving ? 'Guardando…' : `Guardar seleccionados (${selected.size})`}
            </button>
          )}
          <p className="sa-hint">Datos © colaboradores de OpenStreetMap.</p>
        </>
      )}
    </section>
  );
}
