import { useEffect, useMemo, useRef, useState } from 'react';
import { Dices, LayoutGrid, Plus, Search, X, type LucideIcon } from 'lucide-react';
import type { PlanInterest, PlanPlace } from '../data/planBuilder';
import { legBetween } from '../lib/itinerary';
import { INTEREST_ICONS, placeIcon } from '../lib/placeIcons';
import { routeZone } from '../lib/routeGenerator';
import { ZONE_BY_ID, type ZoneId } from '../lib/zones';

/* ============================================================
   Agregar una parada a mano: hoja que sube desde abajo con las
   categorías de la guía (museos, cafés, bares…), buscador y la
   lista ordenada por cercanía a la última parada. Tocar un
   lugar lo agrega; "Al azar" deja que la ruleta elija dentro de
   esa categoría.
   ============================================================ */

type Category = 'todo' | PlanInterest;

const CATEGORIES: { value: Category; label: string; icon: LucideIcon }[] = [
  { value: 'todo', label: 'Todo', icon: LayoutGrid },
  { value: 'cultura', label: 'Museos y cultura', icon: INTEREST_ICONS.cultura },
  { value: 'cafe', label: 'Café', icon: INTEREST_ICONS.cafe },
  { value: 'comida', label: 'Comida', icon: INTEREST_ICONS.comida },
  { value: 'noche', label: 'Bares', icon: INTEREST_ICONS.noche },
  { value: 'vintage', label: 'Vintage y tianguis', icon: INTEREST_ICONS.vintage },
  { value: 'atardecer', label: 'Atardecer', icon: INTEREST_ICONS.atardecer },
];

const normalize = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

type Props = {
  places: PlanPlace[];
  // Lo que ya está en el plan: no se ofrece otra vez.
  taken: string[];
  // Última parada con ubicación: la lista se ordena por cercanía a ella.
  anchor?: PlanPlace;
  // Zona elegida en el paso 1 (si no es "toda"): sus lugares van primero.
  zone?: ZoneId;
  // picked = lo eligió la persona (queda fijo); si no, salió al azar.
  onAdd: (place: PlanPlace, picked: boolean) => void;
  onClose: () => void;
};

export function PlanAddStop({ places, taken, anchor, zone, onAdd, onClose }: Props) {
  const [category, setCategory] = useState<Category>('todo');
  const [query, setQuery] = useState('');
  const closeRef = useRef<HTMLButtonElement>(null);

  // onClose puede cambiar en cada render de la ruleta: la hoja no debe reiniciarse por eso.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Hoja modal: sin scroll del fondo, Escape la cierra y el foco regresa a donde estaba.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, []);

  const rows = useMemo(() => {
    const term = normalize(query.trim());
    const used = new Set(taken);
    return places
      .filter((place) => !used.has(place.id) && (category === 'todo' || place.interest === category))
      .filter((place) => !term || normalize(`${place.name} ${place.type} ${place.zoneName ?? ''}`).includes(term))
      .map((place) => {
        const placeZone = routeZone(place);
        const leg = anchor ? legBetween(anchor, place) : null;
        return { place, leg, zoneShort: placeZone ? ZONE_BY_ID.get(placeZone)?.short : undefined, inZone: Boolean(zone && placeZone === zone) };
      })
      .sort((a, b) => {
        // Con una parada de referencia manda la distancia; sin ella, la zona elegida y luego el nombre.
        if (a.leg && b.leg) return a.leg.meters - b.leg.meters;
        if (a.leg || b.leg) return a.leg ? -1 : 1;
        if (a.inZone !== b.inZone) return a.inZone ? -1 : 1;
        return a.place.name.localeCompare(b.place.name, 'es');
      });
  }, [places, taken, category, query, anchor, zone]);

  // Al azar entre lo más cercano de la lista, para no mandar a nadie a la otra punta.
  const surprise = () => {
    const pool = rows.slice(0, Math.max(6, Math.ceil(rows.length / 4)));
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick) onAdd(pick.place, false);
  };

  const categoryLabel = CATEGORIES.find((item) => item.value === category)!.label;

  return (
    <div className="plan-add" role="dialog" aria-modal="true" aria-labelledby="plan-add-title">
      <button type="button" className="plan-add-backdrop" onClick={onClose} aria-label="Cerrar" tabIndex={-1} />
      <div className="plan-add-sheet">
        <header className="plan-add-head">
          <h2 id="plan-add-title">AGREGAR PARADA</h2>
          <button ref={closeRef} type="button" className="plan-add-close" onClick={onClose} aria-label="Cerrar"><X size={22} aria-hidden="true" /></button>
        </header>

        <div className="plan-add-categories" role="radiogroup" aria-label="Categoría">
          {CATEGORIES.map(({ value, label, icon: Icon }) => (
            <button key={value} type="button" role="radio" aria-checked={category === value} className={category === value ? 'is-active' : ''} onClick={() => setCategory(value)}>
              <Icon size={16} strokeWidth={2.3} aria-hidden="true" /> {label}
            </button>
          ))}
        </div>

        <label className="plan-add-search">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre o colonia"
            aria-label="Buscar un lugar"
            autoComplete="off"
            enterKeyHint="search"
          />
        </label>

        <ul className="plan-add-list">
          {rows.length > 1 && !query.trim() && (
            <li>
              <button type="button" className="plan-add-row is-surprise" onClick={surprise}>
                <span className="plan-add-thumb"><Dices size={24} aria-hidden="true" /></span>
                <span className="plan-add-info">
                  <strong>Al azar</strong>
                  <span>{category === 'todo' ? 'Que la ruleta elija algo cerca' : `Que la ruleta elija: ${categoryLabel.toLowerCase()}`}</span>
                </span>
                <Plus size={20} aria-hidden="true" />
              </button>
            </li>
          )}
          {rows.map(({ place, leg, zoneShort }) => {
            const Icon = placeIcon(place);
            return (
              <li key={place.id}>
                <button type="button" className="plan-add-row" onClick={() => onAdd(place, true)}>
                  <span className="plan-add-thumb">
                    {place.imageUrl ? <img src={place.imageUrl} alt="" loading="lazy" decoding="async" /> : <Icon size={24} strokeWidth={1.8} aria-hidden="true" />}
                  </span>
                  <span className="plan-add-info">
                    <strong>{place.name}</strong>
                    <span>{[place.type, zoneShort, leg?.label].filter(Boolean).join(' · ')}</span>
                  </span>
                  <Plus size={20} aria-hidden="true" />
                </button>
              </li>
            );
          })}
          {rows.length === 0 && <li className="plan-add-empty">No hay lugares con esa búsqueda. Prueba con otra categoría.</li>}
        </ul>
      </div>
    </div>
  );
}
