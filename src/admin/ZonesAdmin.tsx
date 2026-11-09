import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Check, Sparkles, X } from 'lucide-react';
import { ZONES, spotZone, suggestZoneFor, type Zone } from '../lib/zones';
import { CategoryGroup, RowImage } from './adminShared';
import { groupByCategory } from './adminCategories';
import { MAX_ZONE_PICKS, saveZoneGuide, type ZoneGuide } from './spotsStore';
import { useZoneGuides } from './useZoneGuides';
import type { RackDoc, SpotDoc } from './spotsStore';
import { placeRows, rowCategory, rowKind, setRowZone, type PlaceRow } from './zoneRows';
import { ZoneSelectRow } from './ZoneSelect';

/* ============================================================
   Zonas: cada lugar se asigna a mano a una de las 7 zonas y cada
   zona tiene su selección curada (texto corto + top ordenado),
   guardada en meta/zoneGuides. Lo pendiente (sin zona) va arriba.
   ============================================================ */

export function ZonesView({ spots, rack, loaded }: { spots: SpotDoc[]; rack: RackDoc[]; loaded: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);
  const { guides, shapes, error: guidesError } = useZoneGuides();

  const rows = useMemo(() => placeRows(spots, rack), [spots, rack]);
  const pending = useMemo(
    () => rows.filter((row) => !spotZone(row.item)).sort((a, b) => a.item.name.localeCompare(b.item.name, 'es')),
    [rows],
  );
  const withSuggestion = pending.filter((row) => suggestZoneFor(row.item, shapes));

  const change = async (row: PlaceRow, zoneId: string | null) => {
    setError(null);
    setSaving(row.key);
    try {
      await setRowZone(row, zoneId);
    } catch (err) {
      setError(`No se pudo guardar la zona de ${row.item.name}: ${(err as Error).message}`);
    }
    setSaving(null);
  };

  // Asigna la zona sugerida a todos los pendientes que tienen una; los demás se quedan para revisar.
  const applySuggestions = async () => {
    setError(null);
    setApplying(true);
    const failed: string[] = [];
    for (const row of withSuggestion) {
      try {
        await setRowZone(row, suggestZoneFor(row.item, shapes)!.id);
      } catch {
        failed.push(row.item.name);
      }
    }
    if (failed.length) setError(`No se pudo asignar: ${failed.join(', ')}`);
    setApplying(false);
  };

  if (!loaded) return <main className="sa-main"><p className="sa-empty">Cargando lugares...</p></main>;

  return (
    <main className="sa-main">
      <section className="sa-zones-section" aria-labelledby="sa-pending-title">
        <header className="sa-zones-head">
          <div>
            <h2 id="sa-pending-title">Pendientes <span className="sa-zones-count">{pending.length}</span></h2>
            <p className="sa-hint">
              Lugares sin zona: no muestran etiqueta y no salen al explorar por zona. La sugerencia sale de las coordenadas; asígnalos aquí o desde la pestaña Mapa.
            </p>
          </div>
          {withSuggestion.length > 0 && (
            <button className="btn btn-primary" onClick={() => void applySuggestions()} disabled={applying}>
              <Sparkles size={16} /> {applying ? 'Asignando...' : `Aplicar sugerencias (${withSuggestion.length})`}
            </button>
          )}
        </header>
        {(error ?? guidesError) && <p className="login-error">{error ?? guidesError}</p>}
        {pending.length === 0 ? (
          <p className="sa-empty"><Check size={16} /> Todos los lugares tienen zona.</p>
        ) : (
          groupByCategory(pending, rowCategory, () => false).map((group) => (
            <CategoryGroup key={group.label} label={group.label} Icon={group.Icon} count={group.items.length} missingZone={0}>
              {group.items.map((row) => (
                <li key={row.key} className={`sa-row is-no-zone${row.item.active ? '' : ' is-hidden'}`}>
                  <RowImage src={row.item.imageUrl} name={row.item.name} />
                  <div className="sa-row__info">
                    <span className="sa-row__name">{row.item.name}</span>
                    <span className="sa-row__meta">
                      {rowKind(row)}
                      {!row.item.coordinates && <span className="sa-warn"> · sin coordenadas</span>}
                    </span>
                  </div>
                  <ZoneSelectRow
                    ariaLabel={`Zona de ${row.item.name}`}
                    value={row.item.zone}
                    coordinates={row.item.coordinates}
                    onChange={(zoneId) => void change(row, zoneId)}
                    disabled={saving === row.key || applying}
                  />
                </li>
              ))}
            </CategoryGroup>
          ))
        )}
      </section>

      <section className="sa-zones-section" aria-labelledby="sa-guides-title">
        <header className="sa-zones-head">
          <div>
            <h2 id="sa-guides-title">Las 7 zonas</h2>
            <p className="sa-hint">El texto y el top de cada zona salen en la web y en la app cuando alguien explora esa zona. Máximo {MAX_ZONE_PICKS} lugares por top, en el orden que elijas.</p>
          </div>
        </header>
        <div className="sa-zone-cards">
          {ZONES.map((zone) => (
            <ZoneCard
              key={`${zone.id}:${JSON.stringify(guides[zone.id] ?? null)}`}
              zone={zone}
              guide={guides[zone.id]}
              rows={rows.filter((row) => spotZone(row.item)?.id === zone.id)}
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function ZoneCard({ zone, guide, rows }: { zone: Zone; guide?: ZoneGuide; rows: PlaceRow[] }) {
  const [intro, setIntro] = useState(guide?.intro ?? '');
  const [picks, setPicks] = useState<string[]>(guide?.picks ?? []);
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const byId = useMemo(() => new Map(rows.map((row) => [row.item.id, row])), [rows]);
  // Un lugar que ya no está en la zona (lo cambiaron de zona) se marca en el top.
  const available = rows.filter((row) => !picks.includes(row.item.id)).sort((a, b) => a.item.name.localeCompare(b.item.name, 'es'));
  const dirty = intro.trim() !== (guide?.intro ?? '') || JSON.stringify(picks) !== JSON.stringify(guide?.picks ?? []);
  const spotsCount = rows.filter((row) => row.source === 'spots').length;

  const move = (index: number, delta: number) =>
    setPicks((current) => {
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(index + delta, 0, item);
      return next;
    });

  const save = async () => {
    setStatus('saving');
    try {
      await saveZoneGuide(zone.id, { intro, picks });
      setStatus('saved');
    } catch {
      setStatus('error');
    }
  };

  return (
    <article className="sa-zone-card" style={{ '--zone-color': zone.color } as React.CSSProperties}>
      <header>
        <span className="sa-zone-card__dot" aria-hidden="true" />
        <h3>{zone.name}</h3>
        <span className="sa-zone-card__count">{spotsCount} spots · {rows.length - spotsCount} Rack</span>
      </header>

      <label className="sa-zone-card__label" htmlFor={`sa-intro-${zone.id}`}>Texto corto</label>
      <textarea
        id={`sa-intro-${zone.id}`}
        value={intro}
        maxLength={400}
        rows={3}
        placeholder={`Qué hace distinta a ${zone.short}: el ambiente, a qué hora ir, qué no te puedes perder.`}
        onChange={(event) => { setIntro(event.target.value); setStatus('idle'); }}
      />

      <span className="sa-zone-card__label">Top de la zona ({picks.length}/{MAX_ZONE_PICKS})</span>
      {picks.length === 0 ? (
        <p className="sa-hint">Sin top: se muestran todos los lugares de la zona.</p>
      ) : (
        <ol className="sa-zone-picks">
          {picks.map((id, index) => {
            const row = byId.get(id);
            return (
              <li key={id} className={row ? '' : 'is-missing'}>
                <span className="sa-zone-picks__n">{index + 1}</span>
                <span className="sa-zone-picks__name">{row ? row.item.name : 'Ya no está en esta zona'}</span>
                <button type="button" className="sa-icon-btn" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Subir"><ArrowUp size={15} /></button>
                <button type="button" className="sa-icon-btn" onClick={() => move(index, 1)} disabled={index === picks.length - 1} aria-label="Bajar"><ArrowDown size={15} /></button>
                <button type="button" className="sa-icon-btn" onClick={() => { setPicks((current) => current.filter((pick) => pick !== id)); setStatus('idle'); }} aria-label="Quitar del top"><X size={15} /></button>
              </li>
            );
          })}
        </ol>
      )}
      {picks.length < MAX_ZONE_PICKS && (
        <select
          aria-label={`Agregar al top de ${zone.short}`}
          value=""
          onChange={(event) => { if (event.target.value) { setPicks((current) => [...current, event.target.value]); setStatus('idle'); } }}
          disabled={available.length === 0}
        >
          <option value="">{available.length ? '+ Agregar al top' : rows.length ? 'Ya están todos en el top' : 'Asigna lugares a esta zona primero'}</option>
          {available.map((row) => <option key={row.item.id} value={row.item.id}>{row.item.name} — {rowKind(row)}</option>)}
        </select>
      )}

      <footer>
        <button type="button" className="btn btn-primary" onClick={() => void save()} disabled={!dirty || status === 'saving'}>
          {status === 'saving' ? 'Guardando...' : 'Guardar zona'}
        </button>
        {status === 'saved' && <span className="sa-zone-card__ok"><Check size={15} /> Guardado</span>}
        {status === 'error' && <span className="sa-warn">No se pudo guardar</span>}
      </footer>
    </article>
  );
}
