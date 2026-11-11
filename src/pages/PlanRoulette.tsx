import { createElement, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, Dices, Globe, Lock, LockOpen, MapPin, Plus, Search, Shuffle, Sparkles, X, type LucideIcon } from 'lucide-react';
import {
  INTEREST_OPTIONS,
  ROULETTE_MAX_STOPS,
  ROULETTE_MIN_STOPS,
  type PlanInterest,
  type PlanPlace,
} from '../data/planBuilder';
import { INTEREST_ICONS, placeIcon } from '../lib/placeIcons';
import { usePlanCatalog } from '../lib/planCatalog';
import { routeZone } from '../lib/routeGenerator';
import { ZONES, ZONE_BY_ID, type ZoneId } from '../lib/zones';
import { PlanAddStop } from './PlanAddStop';

/* ============================================================
   Ruleta de dos carretes, a lo Urbanspoon: ZONA y QUÉ.
   Cada carrete se puede bloquear (o elegir a mano); GIRAR mueve
   los que estén libres y saca UN lugar de esa combinación. Si
   late, se agrega a "mi plan"; si no, "Otro" o se gira de nuevo.
   Con dos o más paradas, la IA arma el plan y encuentra el hilo.
   ============================================================ */

export type RouletteSlot = { placeId: string; locked: boolean };
// El plan que se va armando; los carretes son estado de la pantalla.
export type RouletteState = { slots: RouletteSlot[] };

// "toda" = donde sea: la única cara con los lugares que no tienen zona (atardeceres, varios bares).
type ZoneFace = ZoneId | 'toda';
type Reel = 'zone' | 'what';

const ZONE_FACES: { value: ZoneFace; label: string }[] = [
  { value: 'toda', label: 'Donde sea' },
  ...ZONES.map((zone) => ({ value: zone.id as ZoneFace, label: zone.short })),
];

const WHAT_LABEL: Record<PlanInterest, string> = {
  cafe: 'Café',
  comida: 'Comida',
  noche: 'Bares',
  vintage: 'Vintage',
  cultura: 'Museos',
  atardecer: 'Atardecer',
};
const WHAT_FACES = INTEREST_OPTIONS.map((option) => option.value);

const TICK_MS = 70;
const ZONE_STOP_MS = 520;
const WHAT_STOP_MS = 900;

const randomItem = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];
const zoneFaceLabel = (zone: ZoneFace) => ZONE_FACES.find((face) => face.value === zone)!.label;

type Props = {
  state: RouletteState;
  onChange: (next: RouletteState) => void;
  onGenerate: () => void;
  disabled: boolean;
};

export function PlanRoulette({ state, onChange, onGenerate, disabled }: Props) {
  const { places, getPlace } = usePlanCatalog();
  // null = todavía no gira: el carrete muestra "?".
  const [zone, setZone] = useState<ZoneFace | null>(null);
  const [what, setWhat] = useState<PlanInterest | null>(null);
  const [locks, setLocks] = useState<Record<Reel, boolean>>({ zone: false, what: false });
  const [hitId, setHitId] = useState<string | null>(null);
  // Mientras gira: las caras que se ven pasar en cada carrete.
  const [rolling, setRolling] = useState<{ zone?: ZoneFace; what?: PlanInterest } | null>(null);
  const [picking, setPicking] = useState<Reel | null>(null);
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const taken = new Set(state.slots.map((slot) => slot.placeId));
  const isSpinning = rolling !== null;
  const isFull = state.slots.length >= ROULETTE_MAX_STOPS;
  const canBuild = state.slots.length >= ROULETTE_MIN_STOPS;

  // Lugares de una combinación que todavía no están en el plan.
  const candidates = (zoneFace: ZoneFace, interest: PlanInterest) =>
    places.filter((place) => place.interest === interest && !taken.has(place.id) && (zoneFace === 'toda' || routeZone(place) === zoneFace));

  // Combinaciones posibles respetando los candados: los carretes nunca caen en una sin lugares.
  const zoneOptions = locks.zone && zone ? [zone] : ZONE_FACES.map((face) => face.value);
  const whatOptions = locks.what && what ? [what] : WHAT_FACES;
  const pairs = zoneOptions.flatMap((zoneFace) => whatOptions
    .filter((interest) => candidates(zoneFace, interest).some((place) => place.id !== hitId))
    .map((interest) => ({ zone: zoneFace, what: interest })));
  const canSpin = pairs.length > 0;

  const hit = hitId ? getPlace(hitId) : undefined;
  const others = zone && what ? candidates(zone, what).filter((place) => place.id !== hitId) : [];

  const spin = () => {
    if (isSpinning || !canSpin) return;
    const pair = randomItem(pairs);
    const place = randomItem(candidates(pair.zone, pair.what).filter((item) => item.id !== hitId));
    const land = () => {
      setZone(pair.zone);
      setWhat(pair.what);
      setHitId(place.id);
      setRolling(null);
    };
    setPicking(null);
    setJustAdded(null);
    setHitId(null);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      land();
      return;
    }
    const spinZone = !(locks.zone && zone);
    const spinWhat = !(locks.what && what);
    const last = spinWhat ? WHAT_STOP_MS : spinZone ? ZONE_STOP_MS : 0;
    let elapsed = 0;
    let zoneStopped = !spinZone;
    let whatStopped = !spinWhat;
    const tick = () => {
      if (!zoneStopped && elapsed >= ZONE_STOP_MS) { zoneStopped = true; navigator.vibrate?.(12); }
      if (!whatStopped && elapsed >= WHAT_STOP_MS) { whatStopped = true; navigator.vibrate?.(12); }
      if (elapsed >= last) {
        land();
        return;
      }
      setRolling({
        zone: zoneStopped ? pair.zone : randomItem(ZONE_FACES).value,
        what: whatStopped ? pair.what : randomItem(WHAT_FACES),
      });
      elapsed += TICK_MS;
      timer.current = window.setTimeout(tick, TICK_MS);
    };
    tick();
  };

  const another = () => {
    if (others.length > 0) setHitId(randomItem(others).id);
  };

  const addStop = (place: PlanPlace) => {
    if (isFull || taken.has(place.id)) return;
    // Cada parada la eligió la persona: va fija, la IA sólo ordena y busca el hilo.
    onChange({ slots: [...state.slots, { placeId: place.id, locked: true }] });
    setJustAdded(place.name);
    setHitId(null);
    setAdding(false);
  };

  const removeStop = (placeId: string) => onChange({ slots: state.slots.filter((slot) => slot.placeId !== placeId) });

  // Elegir a mano una cara la deja bloqueada: "quiero un museo", "sólo en Centro".
  const pick = (reel: Reel, value: ZoneFace | PlanInterest) => {
    if (reel === 'zone') setZone(value as ZoneFace);
    else setWhat(value as PlanInterest);
    setLocks((current) => ({ ...current, [reel]: true }));
    setPicking(null);
    setHitId(null);
    setJustAdded(null);
  };

  const shownZone = rolling?.zone ?? zone;
  const shownWhat = rolling?.what ?? what;
  const WhatIcon: LucideIcon = shownWhat ? INTEREST_ICONS[shownWhat] : Dices;
  const ZoneIcon: LucideIcon = shownZone === 'toda' ? Globe : MapPin;
  const hitZone = hit ? routeZone(hit) : undefined;
  const slotPlaces = state.slots.map((slot) => getPlace(slot.placeId)).filter((place): place is PlanPlace => Boolean(place));
  const anchor = [...slotPlaces].reverse().find((place) => place.coordinates);

  const reel = (id: Reel, label: string, text: string | null, Icon: LucideIcon) => (
    <div className={`plan-reel${locks[id] ? ' is-locked' : ''}${rolling && !(locks[id] && (id === 'zone' ? zone : what)) ? ' is-rolling' : ''}`}>
      <span className="plan-reel-label">{label}</span>
      <button type="button" className="plan-reel-face" onClick={() => setPicking(picking === id ? null : id)} disabled={isSpinning} aria-expanded={picking === id} aria-label={`${label}: ${text ?? 'sin elegir'}. Tocar para elegir`}>
        <Icon size={22} strokeWidth={2.1} aria-hidden="true" />
        <strong>{text ?? '?'}</strong>
      </button>
      <button
        type="button"
        className="plan-reel-lock"
        onClick={() => setLocks((current) => ({ ...current, [id]: !current[id] }))}
        disabled={isSpinning || text === null}
        aria-pressed={locks[id]}
      >
        {locks[id] ? <Lock size={14} aria-hidden="true" /> : <LockOpen size={14} aria-hidden="true" />} {locks[id] ? 'BLOQUEADO' : 'BLOQUEAR'}
      </button>
    </div>
  );

  return (
    <div className="plan-step plan-roulette">
      <div className="plan-reels">
        {reel('zone', 'ZONA', shownZone ? zoneFaceLabel(shownZone) : null, ZoneIcon)}
        {reel('what', 'QUÉ', shownWhat ? WHAT_LABEL[shownWhat] : null, WhatIcon)}
      </div>

      {picking && (
        <div className="plan-reel-options" role="radiogroup" aria-label={picking === 'zone' ? 'Elegir zona' : 'Elegir qué'}>
          {picking === 'zone'
            ? ZONE_FACES.map((face) => {
              // Con el otro carrete bloqueado, sólo las zonas que tienen de eso.
              const empty = locks.what && what ? candidates(face.value, what).length === 0 : WHAT_FACES.every((interest) => candidates(face.value, interest).length === 0);
              return <button key={face.value} type="button" role="radio" aria-checked={zone === face.value} className={zone === face.value ? 'is-active' : ''} disabled={empty} onClick={() => pick('zone', face.value)}>{face.label}</button>;
            })
            : WHAT_FACES.map((interest) => {
              const Icon = INTEREST_ICONS[interest];
              const empty = locks.zone && zone ? candidates(zone, interest).length === 0 : candidates('toda', interest).length === 0;
              return <button key={interest} type="button" role="radio" aria-checked={what === interest} className={what === interest ? 'is-active' : ''} disabled={empty} onClick={() => pick('what', interest)}><Icon size={15} aria-hidden="true" /> {WHAT_LABEL[interest]}</button>;
            })}
        </div>
      )}

      <div className="plan-hit-area" aria-live="polite" aria-busy={isSpinning}>
        {hit ? (
          <article className="plan-hit">
            <div className="plan-hit-photo">
              {hit.imageUrl ? <img src={hit.imageUrl} alt="" decoding="async" /> : createElement(placeIcon(hit), { size: 54, strokeWidth: 1.5, 'aria-hidden': true })}
            </div>
            <div className="plan-hit-body">
              <span className="plan-hit-type">{[hit.type, hitZone ? ZONE_BY_ID.get(hitZone)?.short : undefined, hit.price].filter(Boolean).join(' · ')}</span>
              <h2>{hit.name}</h2>
              {hit.tip && <p className="plan-hit-tip"><b>VE POR:</b> {hit.tip}</p>}
              <a href={hit.mapsUrl} target="_blank" rel="noreferrer">CÓMO LLEGAR <ArrowUpRight size={15} aria-hidden="true" /></a>
            </div>
            <div className="plan-hit-actions">
              <button type="button" onClick={another} disabled={others.length === 0}><Shuffle size={16} aria-hidden="true" /> OTRO</button>
              <button type="button" className="is-primary" onClick={() => addStop(hit)} disabled={isFull}>
                <Plus size={17} aria-hidden="true" /> {isFull ? 'PLAN LLENO' : 'AGREGAR A MI PLAN'}
              </button>
            </div>
          </article>
        ) : (
          <p className={`plan-hit-empty${isSpinning ? ' is-rolling' : ''}`}>
            {isSpinning ? 'Girando…'
              : justAdded ? <><Check size={18} aria-hidden="true" /> {justAdded} ya está en tu plan. {isFull ? 'Ya puedes armarlo.' : 'Gira para la siguiente parada.'}</>
                : !canSpin ? 'No hay más lugares con esa combinación. Desbloquea un carrete.'
                  : zone || what ? 'Listo. Gira para ver un lugar.'
                    : 'Gira y sale un lugar. Si te late, agrégalo a tu plan.'}
          </p>
        )}
      </div>

      <section className="plan-tray" aria-labelledby="plan-tray-title">
        <header>
          <h2 id="plan-tray-title">MI PLAN <span>{state.slots.length}/{ROULETTE_MAX_STOPS}</span></h2>
          {!isFull && <button type="button" className="plan-tray-search" onClick={() => setAdding(true)} disabled={isSpinning}><Search size={14} aria-hidden="true" /> BUSCAR UN LUGAR</button>}
        </header>
        {slotPlaces.length === 0 ? (
          <p className="plan-tray-empty">Aquí se van juntando tus paradas. Con dos ya puedes armar el plan.</p>
        ) : (
          <ol>
            {slotPlaces.map((place, index) => (
              <li key={place.id}>
                <b>{String(index + 1).padStart(2, '0')}</b>
                <span><strong>{place.name}</strong>{place.type}</span>
                <button type="button" onClick={() => removeStop(place.id)} disabled={isSpinning} aria-label={`Quitar ${place.name}`}><X size={18} aria-hidden="true" /></button>
              </li>
            ))}
          </ol>
        )}
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

      {adding && (
        <PlanAddStop
          places={places}
          taken={[...taken]}
          anchor={anchor}
          zone={zone && zone !== 'toda' ? zone : undefined}
          onAdd={(place) => addStop(place)}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  );
}
