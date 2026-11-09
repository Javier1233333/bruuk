import { useMemo, useState } from 'react';
import { Crosshair, MapPinned } from 'lucide-react';
import { getIdToken } from '../lib/firebase';
import { distanceKm } from '../lib/zones';
import { setRowLocation, type PlaceRow } from './zoneRows';

/* ============================================================
   Coordenadas desde Google: busca cada lugar en Google Places
   (vía /api/maps-list { lookup }) y muestra lo que encontró antes
   de guardar. Nada se guarda sin que lo palomees.
   ============================================================ */

// Lo que devuelve /api/maps-list { lookup } (api/maps-list.ts)
type Lookup = { key: string; found: boolean; name?: string; address?: string; lat?: number; lng?: number; mapsLink?: string };

const CHUNK = 25;
// Menos de esto se considera el mismo punto.
const SAME_METERS = 60;

// Lo que buscamos: el ?q= del link de Maps si lo tiene (suele traer más contexto), si no el nombre + ciudad.
function lookupQuery(row: PlaceRow) {
  try {
    const url = new URL(row.item.mapsLink);
    const q = url.searchParams.get('q') ?? url.searchParams.get('query');
    if (q && !/^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(q.trim())) return /guadalajara|zapopan|tlaquepaque|jalisco/i.test(q) ? q : `${q}, Guadalajara, Jalisco`;
  } catch { /* link vacío o raro: va por nombre */ }
  return `${row.item.name}, Guadalajara, Jalisco`;
}

// Un link de búsqueda genérico se cambia por el del lugar exacto que encontró Google.
const isGenericLink = (link: string) => !link || /[?&](q|query)=/.test(link) || /\/maps\/search\//.test(link);

const metersMoved = (row: PlaceRow, result: Lookup) =>
  row.item.coordinates && result.lat != null && result.lng != null
    ? Math.round(distanceKm(row.item.coordinates.lat, row.item.coordinates.lng, result.lat, result.lng) * 1000)
    : null;

export function GoogleCoords({ rows, onFocus }: { rows: PlaceRow[]; onFocus: (lat: number, lng: number) => void }) {
  const [scope, setScope] = useState<'missing' | 'all'>('missing');
  const [results, setResults] = useState<Map<string, Lookup>>(new Map());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const targets = useMemo(() => (scope === 'missing' ? rows.filter((row) => !row.item.coordinates) : rows), [rows, scope]);
  const byKey = useMemo(() => new Map(rows.map((row) => [row.key, row])), [rows]);

  // Sólo lo que vale la pena revisar: nuevos, los que se mueven y los no encontrados.
  const reviewed = useMemo(() => [...results.values()]
    .map((result) => ({ result, row: byKey.get(result.key) }))
    .filter((entry): entry is { result: Lookup; row: PlaceRow } => Boolean(entry.row))
    .filter(({ result, row }) => !result.found || (metersMoved(row, result) ?? Infinity) >= SAME_METERS), [results, byKey]);
  const unchanged = results.size - reviewed.length;

  const search = async () => {
    setError(null);
    setNotice(null);
    setResults(new Map());
    setSelected(new Set());
    const found = new Map<string, Lookup>();
    const preselect = new Set<string>();
    setProgress({ done: 0, total: targets.length });
    try {
      for (let index = 0; index < targets.length; index += CHUNK) {
        const chunk = targets.slice(index, index + CHUNK);
        const response = await fetch('/api/maps-list', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await getIdToken()}` },
          body: JSON.stringify({ lookup: chunk.map((row) => ({ key: row.key, query: lookupQuery(row) })) }),
        });
        const data = await response.json().catch(() => null) as { results?: Lookup[]; error?: string } | null;
        if (!response.ok || !data?.results) throw new Error(data?.error ?? `Error ${response.status}`);
        for (const result of data.results) {
          found.set(result.key, result);
          // Se palomean solos los que no tenían coordenadas; mover uno existente lo decides tú.
          if (result.found && !byKey.get(result.key)?.item.coordinates) preselect.add(result.key);
        }
        setResults(new Map(found));
        setSelected(new Set(preselect));
        setProgress({ done: Math.min(index + CHUNK, targets.length), total: targets.length });
      }
    } catch (err) {
      setError((err as Error).message);
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
    for (const key of selected) {
      const result = results.get(key);
      const row = byKey.get(key);
      if (!result?.found || !row || result.lat == null || result.lng == null) continue;
      try {
        await setRowLocation(row, { lat: result.lat, lng: result.lng }, result.mapsLink && isGenericLink(row.item.mapsLink) ? result.mapsLink : undefined);
        saved += 1;
      } catch {
        failed.push(row.item.name);
      }
    }
    setSaving(false);
    setResults(new Map());
    setSelected(new Set());
    setNotice(`${saved} ${saved === 1 ? 'lugar actualizado' : 'lugares actualizados'} con coordenadas de Google.`);
    if (failed.length) setError(`No se pudo guardar: ${failed.join(', ')}`);
  };

  const busy = progress !== null || saving;

  return (
    <section className="sa-gcoords" aria-labelledby="sa-gcoords-title">
      <h3 id="sa-gcoords-title" className="sa-map-side__title"><MapPinned size={15} aria-hidden="true" /> Coordenadas de Google</h3>
      <div className="sa-gcoords__scope" role="radiogroup" aria-label="Qué lugares buscar">
        <label><input type="radio" checked={scope === 'missing'} onChange={() => setScope('missing')} disabled={busy} /> Sin coordenadas ({rows.filter((row) => !row.item.coordinates).length})</label>
        <label><input type="radio" checked={scope === 'all'} onChange={() => setScope('all')} disabled={busy} /> Revisar todos ({rows.length})</label>
      </div>
      <button type="button" className="btn btn-primary sa-gcoords__go" onClick={() => void search()} disabled={busy || targets.length === 0}>
        {progress ? `Buscando… ${progress.done}/${progress.total}` : `Buscar en Google (${targets.length})`}
      </button>
      {error && <p className="login-error">{error}</p>}
      {notice && <p className="sa-map-notice" role="status">{notice}</p>}

      {results.size > 0 && !progress && (
        <>
          <p className="sa-hint">
            Revisa que sea el lugar correcto antes de guardar.{unchanged > 0 ? ` ${unchanged} ya estaban bien.` : ''}
          </p>
          <ul className="sa-gcoords__list">
            {reviewed.map(({ result, row }) => {
              const moved = metersMoved(row, result);
              return (
                <li key={result.key} className={result.found ? '' : 'is-missing'}>
                  <label>
                    <input type="checkbox" checked={selected.has(result.key)} onChange={() => toggle(result.key)} disabled={!result.found} />
                    <span className="sa-gcoords__info">
                      <span className="sa-row__name">{row.item.name}</span>
                      {result.found ? (
                        <>
                          <span className="sa-gcoords__match">→ {result.name}</span>
                          {result.address && <span className="sa-row__meta">{result.address}</span>}
                          <span className={`sa-gcoords__tag${moved == null ? ' is-new' : ' is-moved'}`}>
                            {moved == null ? 'Nuevo' : `Se mueve ${moved >= 1000 ? `${(moved / 1000).toFixed(1)} km` : `${moved} m`}`}
                          </span>
                        </>
                      ) : (
                        <span className="sa-row__meta">Google no lo encontró: revisa el nombre o ponlo a mano.</span>
                      )}
                    </span>
                  </label>
                  {result.found && result.lat != null && result.lng != null && (
                    <button type="button" className="sa-gcoords__see" onClick={() => onFocus(result.lat!, result.lng!)} aria-label={`Ver en el mapa lo encontrado para ${row.item.name}`}>
                      <Crosshair size={15} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          <button type="button" className="btn btn-primary sa-gcoords__go" onClick={() => void save()} disabled={saving || selected.size === 0}>
            {saving ? 'Guardando…' : `Guardar seleccionados (${selected.size})`}
          </button>
        </>
      )}
    </section>
  );
}
