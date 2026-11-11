import { createElement, useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, Dices, Globe, Lock, MapPin, Plus, Sparkles, X, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { INTEREST_OPTIONS, ROULETTE_MAX_STOPS, ROULETTE_MIN_STOPS, type PlanInterest } from '../data/planBuilder';
import { addToPlan, removeFromPlan, usePlanCart } from '../lib/planCart';
import { INTEREST_ICONS, placeIcon } from '../lib/placeIcons';
import { usePlanCatalog } from '../lib/planCatalog';
import { routeZone } from '../lib/routeGenerator';
import { ZONES, ZONE_BY_ID, type ZoneId } from '../lib/zones';

/* ============================================================
   Ruleta a lo Urbanspoon, lo más simple posible:
   dos carretes (ZONA y QUÉ) y un botón. Tocar un carrete lo deja
   fijo. Sale un lugar; si late, "Agregar a mi plan". "Mi plan" es
   el mismo que se llena desde Spots (src/lib/planCart.ts).
   ============================================================ */

// "toda" = donde sea: la única cara con los lugares que no tienen zona (atardeceres, varios bares).
type ZoneFace = ZoneId | 'toda';
type Reel = 'zone' | 'what';

const ZONE_FACES: { value: ZoneFace; label: string }[] = [
  { value: 'toda', label: 'Donde sea' },
  ...ZONES.map((zone) => ({ value: zone.id as ZoneFace, label: zone.short })),
];
const WHAT_LABEL: Record<PlanInterest, string> = { cafe: 'Café', comida: 'Comida', noche: 'Bares', vintage: 'Vintage', cultura: 'Museos', atardecer: 'Atardecer' };
const WHAT_FACES = INTEREST_OPTIONS.map((option) => option.value);

const TICK_MS = 70;
const ZONE_STOP_MS = 520;
const WHAT_STOP_MS = 900;

const randomItem = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];
const zoneFaceLabel = (zone: ZoneFace) => ZONE_FACES.find((face) => face.value === zone)!.label;

export function PlanRoulette({ onGenerate, disabled }: { onGenerate: () => void; disabled: boolean }) {
  const { places, getPlace } = usePlanCatalog();
  const cart = usePlanCart();
  const [zone, setZone] = useState<ZoneFace | null>(null);
  const [what, setWhat] = useState<PlanInterest | null>(null);
  const [locks, setLocks] = useState<Record<Reel, boolean>>({ zone: false, what: false });
  const [hitId, setHitId] = useState<string | null>(null);
  const [rolling, setRolling] = useState<{ zone: ZoneFace; what: PlanInterest } | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const taken = new Set(cart);
  const isSpinning = rolling !== null;
  const isFull = cart.length >= ROULETTE_MAX_STOPS;
  const canBuild = cart.length >= ROULETTE_MIN_STOPS;

  const candidates = (zoneFace: ZoneFace, interest: PlanInterest) =>
    places.filter((place) => place.interest === interest && !taken.has(place.id) && place.id !== hitId && (zoneFace === 'toda' || routeZone(place) === zoneFace));

  // Sólo combinaciones con lugares, respetando lo que está fijo.
  const zoneOptions = locks.zone && zone ? [zone] : ZONE_FACES.map((face) => face.value);
  const whatOptions = locks.what && what ? [what] : WHAT_FACES;
  const pairs = zoneOptions.flatMap((zoneFace) => whatOptions.filter((interest) => candidates(zoneFace, interest).length > 0).map((interest) => ({ zone: zoneFace, what: interest })));
  const canSpin = pairs.length > 0 && !isFull;

  const hit = hitId ? getPlace(hitId) : undefined;

  const spin = () => {
    if (isSpinning || !canSpin) return;
    const pair = randomItem(pairs);
    const place = randomItem(candidates(pair.zone, pair.what));
    const land = () => {
      setZone(pair.zone);
      setWhat(pair.what);
      setHitId(place.id);
      setRolling(null);
    };
    setHitId(null);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      land();
      return;
    }
    const spinZone = !(locks.zone && zone);
    const spinWhat = !(locks.what && what);
    const last = spinWhat ? WHAT_STOP_MS : spinZone ? ZONE_STOP_MS : 0;
    let elapsed = 0;
    const tick = () => {
      if (elapsed >= last) {
        land();
        return;
      }
      if (spinZone && elapsed + TICK_MS > ZONE_STOP_MS && elapsed <= ZONE_STOP_MS) navigator.vibrate?.(12);
      setRolling({
        zone: !spinZone || elapsed >= ZONE_STOP_MS ? pair.zone : randomItem(ZONE_FACES).value,
        what: !spinWhat || elapsed >= WHAT_STOP_MS ? pair.what : randomItem(WHAT_FACES),
      });
      elapsed += TICK_MS;
      timer.current = window.setTimeout(tick, TICK_MS);
    };
    tick();
  };

  const add = () => {
    if (!hit) return;
    addToPlan(hit.id);
    setHitId(null);
  };

  // Tocar un carrete (ya con valor) lo deja fijo o lo suelta.
  const toggleLock = (reel: Reel) => setLocks((current) => ({ ...current, [reel]: !current[reel] }));

  const shownZone = rolling?.zone ?? zone;
  const shownWhat = rolling?.what ?? what;
  const cartPlaces = cart.map((id) => getPlace(id)).filter((place) => place !== undefined);

  const reel = (id: Reel, label: string, text: string | null, Icon: LucideIcon) => {
    const locked = locks[id] && text !== null;
    return (
      <button
        type="button"
        className={`plan-reel${locked ? ' is-locked' : ''}${rolling && !locked ? ' is-rolling' : ''}`}
        onClick={() => toggleLock(id)}
        disabled={isSpinning || text === null}
        aria-pressed={locked}
        aria-label={`${label}: ${text ?? 'sin girar'}. ${locked ? 'Fijo, toca para soltar' : 'Toca para dejarlo fijo'}`}
      >
        <span className="plan-reel-label">{label}{locked && <Lock size={12} aria-hidden="true" />}</span>
        <Icon size={22} strokeWidth={2.1} aria-hidden="true" />
        <strong>{text ?? '?'}</strong>
      </button>
    );
  };

  return (
    <div className="plan-step plan-roulette">
      <div className="plan-reels">
        {reel('zone', 'ZONA', shownZone ? zoneFaceLabel(shownZone) : null, shownZone === 'toda' ? Globe : MapPin)}
        {reel('what', 'QUÉ', shownWhat ? WHAT_LABEL[shownWhat] : null, shownWhat ? INTEREST_ICONS[shownWhat] : Dices)}
      </div>
      <p className={`plan-reels-hint${!canSpin && !isFull ? ' is-warning' : ''}`}>
        {!canSpin && !isFull ? 'Ya no hay más lugares con lo que está fijo. Toca el carrete fijo para soltarlo.'
          : zone || what ? 'Toca un carrete para dejarlo fijo.' : 'Gira y sale un lugar.'}
      </p>

      {hit && !isSpinning && (
        <article className="plan-hit">
          <div className="plan-hit-photo">
            {hit.imageUrl ? <img src={hit.imageUrl} alt="" decoding="async" /> : createElement(placeIcon(hit), { size: 40, strokeWidth: 1.6, 'aria-hidden': true })}
          </div>
          <div className="plan-hit-body">
            <span className="plan-hit-type">{[hit.type, ZONE_BY_ID.get(routeZone(hit) as ZoneId)?.short].filter(Boolean).join(' · ')}</span>
            <h2>{hit.name}</h2>
            {hit.tip && <p className="plan-hit-tip">{hit.tip}</p>}
            <a href={hit.mapsUrl} target="_blank" rel="noreferrer">CÓMO LLEGAR <ArrowUpRight size={14} aria-hidden="true" /></a>
          </div>
          <button type="button" className="plan-hit-add" onClick={add}><Plus size={18} aria-hidden="true" /> AGREGAR A MI PLAN</button>
        </article>
      )}

      <section className="plan-tray" aria-labelledby="plan-tray-title">
        <h2 id="plan-tray-title">MI PLAN <span>{cart.length}/{ROULETTE_MAX_STOPS}</span></h2>
        {cartPlaces.length === 0 ? (
          <p className="plan-tray-empty">Agrega lo que salga aquí o <Link to="/guadalajara/spots">elige lugares en Spots <ArrowRight size={13} aria-hidden="true" /></Link></p>
        ) : (
          <ol>
            {cartPlaces.map((place, index) => (
              <li key={place.id}>
                <b>{index + 1}</b>
                <span>{place.name}</span>
                <button type="button" onClick={() => removeFromPlan(place.id)} disabled={isSpinning} aria-label={`Quitar ${place.name}`}><X size={16} aria-hidden="true" /></button>
              </li>
            ))}
          </ol>
        )}
        {isFull && <p className="plan-tray-empty"><Check size={14} aria-hidden="true" /> Plan completo.</p>}
      </section>

      <div className="plan-step-actions plan-roulette-actions">
        <button type="button" className={canBuild ? 'plan-builder-secondary plan-roulette-respin' : 'plan-builder-button plan-roulette-spin'} onClick={spin} disabled={isSpinning || disabled || !canSpin}>
          <Dices size={21} aria-hidden="true" /> GIRAR
        </button>
        {canBuild && (
          <button type="button" className="plan-builder-button" onClick={onGenerate} disabled={isSpinning || disabled}>
            ARMAR PLAN <Sparkles size={18} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
