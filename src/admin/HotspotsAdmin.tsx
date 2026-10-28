import { useEffect, useMemo, useState } from 'react';
import { Flame } from 'lucide-react';
import { spotZone } from '../lib/zones';
import { RowImage } from './adminShared';
import { publishHotspots, watchHotspots } from './spotsStore';
import type { Hotspots, SpotDoc } from './spotsStore';

/* ============================================================
   /admin/spots → pestaña Hotspots. Los tres spots de la semana
   que abren el feed de Comer y tomar. Se eligen aquí y salen al
   publicar (el sitio tarda ~1 minuto por el cache de /api/spots).
   ============================================================ */

const SLOTS = 3;

const formatDate = (date: Date) => date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export function HotspotsView({ spots, loaded }: { spots: SpotDoc[]; loaded: boolean }) {
  const [published, setPublished] = useState<Hotspots | null>(null);
  const [draft, setDraft] = useState<string[]>(Array(SLOTS).fill(''));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => watchHotspots(
    (data) => {
      setPublished(data);
      setDraft(Array.from({ length: SLOTS }, (_, i) => data.ids[i] ?? ''));
    },
    (err) => setError(`No se pudieron cargar los hotspots: ${err.message}`),
  ), []);

  // Solo spots visibles: uno oculto no saldría en el feed
  const options = useMemo(() => spots.filter((spot) => spot.active), [spots]);
  const byId = useMemo(() => new Map(spots.map((spot) => [spot.id, spot])), [spots]);

  const chosen = draft.filter(Boolean);
  const changed = published !== null && chosen.join() !== published.ids.join();

  const pick = (slot: number, id: string) => setDraft((prev) => prev.map((value, i) => (i === slot ? id : value)));

  const publish = async () => {
    setError(null);
    setSaving(true);
    try {
      await publishHotspots(chosen);
    } catch (err) {
      setError(`No se pudieron publicar: ${(err as Error).message}`);
    }
    setSaving(false);
  };

  return (
    <main className="sa-main">
      <div className="sa-hot-head">
        <h2><Flame size={18} aria-hidden="true" /> Hotspots de la semana</h2>
        <p className="sa-hint">
          Abren el feed de Comer y tomar, en este orden.
          {published?.publishedAt ? ` Publicados el ${formatDate(published.publishedAt)}.` : ' Aún no hay publicados.'}
        </p>
      </div>

      {error && <p className="login-error">{error}</p>}

      {!loaded || published === null ? (
        <p className="sa-empty">Cargando spots...</p>
      ) : (
        <ol className="sa-hot-list">
          {draft.map((id, slot) => {
            const spot = id ? byId.get(id) : undefined;
            return (
              <li key={slot} className="sa-hot-slot">
                <span className="sa-hot-slot__num">{slot + 1}</span>
                {spot ? <RowImage src={spot.imageUrl} name={spot.name} /> : <span className="sa-row__img sa-row__img--empty" aria-hidden="true" />}
                <div className="sa-hot-slot__body">
                  <select
                    aria-label={`Hotspot ${slot + 1}`}
                    value={id}
                    onChange={(e) => pick(slot, e.target.value)}
                  >
                    <option value="">Sin elegir</option>
                    {options.map((option) => (
                      <option key={option.id} value={option.id} disabled={option.id !== id && draft.includes(option.id)}>
                        {option.name} · {option.type}
                      </option>
                    ))}
                  </select>
                  {spot && (
                    <span className="sa-row__meta">
                      {spotZone(spot)?.name ?? 'sin zona'}
                      {!spot.active && <span className="sa-warn"> · oculto, no saldrá</span>}
                      {!spot.highlight && <span className="sa-warn"> · sin “la razón para ir”</span>}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <div className="sa-hot-foot">
        {changed && <span className="sa-warn">Cambios sin publicar</span>}
        <button className="btn btn-primary" onClick={() => void publish()} disabled={saving || !changed}>
          {saving ? 'Publicando...' : 'Publicar'}
        </button>
      </div>
    </main>
  );
}
