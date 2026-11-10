import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Dices, Lock, LockOpen, MapPin, Moon, Pencil, Plus, Shuffle, Sparkles, Sun, Sunrise, X, type LucideIcon } from 'lucide-react';
import {
  MOMENT_INTERESTS,
  ROULETTE_DEFAULT_STOPS,
  ROULETTE_MAX_STOPS,
  ROULETTE_MIN_STOPS,
  ROULETTE_MOMENTS,
  ROULETTE_ZONES,
  type PlanInterest,
  type PlanPlace,
  type RouletteMoment,
  type RouletteZone,
} from '../data/planBuilder';
import { placeIcon } from '../lib/placeIcons';
import { usePlanCatalog } from '../lib/planCatalog';
import { routeZone } from '../lib/routeGenerator';
import { ZONE_BY_ID } from '../lib/zones';
import { PlanAddStop } from './PlanAddStop';

/* ============================================================
   Ruleta en dos pasos, pensada para el pulgar:
   1. Cuándo y dónde → GIRAR.
   2. Tu plan: cada parada se fija, se cambia o se quita con un
      botón con nombre, y "+ Agregar parada" deja meter el lugar
      que se quiera (un museo, un bar, lo que sea), hasta 5.
   La IA sólo entra al final, para encontrar el hilo y ordenar.
   ============================================================ */

export type RouletteSlot = { placeId: string; locked: boolean };
// `interests` y `count` se conservan por compatibilidad con la página; mandan las casillas.
export type RouletteState = { moment: RouletteMoment; zone: RouletteZone; interests: PlanInterest[]; count: number; slots: RouletteSlot[] };

const SPIN_TICK_MS = 70;
const SPIN_FIRST_STOP_MS = 600;
const SPIN_STAGGER_MS = 320;

const randomItem = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
};

// Lo que puede salir: categorías con sentido a esa hora, dentro de la zona elegida.
const roulettePool = (places: PlanPlace[], state: Pick<RouletteState, 'moment' | 'zone'>) => {
  const interests = MOMENT_INTERESTS[state.moment];
  return places.filter((place) => interests.includes(place.interest) && (state.zone === 'toda' || routeZone(place) === state.zone));
};

// Llena las casillas sin fijar repartiendo categorías, para que no salgan tres cafés seguidos.
// Con "Toda la ciudad", después de la primera parada busca lugares de la misma zona: así la ruta se puede caminar.
// `sameKind` (al cambiar una sola parada) busca otro lugar del mismo tipo que el que estaba.
const pickSlots = (places: PlanPlace[], getPlace: (id: string) => PlanPlace | undefined, state: RouletteState, count: number, sameKind?: PlanInterest): RouletteSlot[] => {
  const pool = roulettePool(places, state);
  const kept = state.slots.slice(0, count);
  const used = new Set(kept.filter((slot) => slot.locked).map((slot) => slot.placeId));
  const lockedPlaces = kept.filter((slot) => slot.locked).map((slot) => getPlace(slot.placeId));
  let anchorZone = lockedPlaces.map((place) => (place ? routeZone(place) : undefined)).find(Boolean);
  const interests = shuffle([...new Set(pool.map((place) => place.interest))]);
  let turn = 0;
  return Array.from({ length: count }, (_, index) => {
    const current = kept[index];
    if (current?.locked) return current;
    const interest = sameKind ?? interests[turn++ % interests.length];
    // Una parada agregada a mano puede ser de una categoría fuera de hora: al cambiarla se respeta.
    const source = sameKind && !pool.some((place) => place.interest === sameKind) ? places.filter((place) => place.interest === sameKind) : pool;
    const options = source.filter((place) => !used.has(place.id) && place.id !== current?.placeId);
    const nearby = anchorZone ? options.filter((place) => routeZone(place) === anchorZone) : options;
    const candidates = nearby.length > 0 ? nearby : options;
    const preferred = candidates.filter((place) => place.interest === interest);
    const place = randomItem(preferred.length > 0 ? preferred : candidates);
    if (!place) return current ?? null;
    used.add(place.id);
    anchorZone ??= routeZone(place);
    return { placeId: place.id, locked: false };
  }).filter((slot): slot is RouletteSlot => slot !== null);
};

const MOMENTS: Record<RouletteMoment, { icon: LucideIcon; label: string; hint: string }> = {
  sorpresa: { icon: Sparkles, label: 'Lo que sea', hint: 'Cualquier hora' },
  manana: { icon: Sunrise, label: 'Mañana', hint: 'Café y luz de día' },
  tarde: { icon: Sun, label: 'Tarde', hint: 'Caminar y buscar' },
  noche: { icon: Moon, label: 'Noche', hint: 'Cena y tragos' },
};

const zoneLabel = (zone: RouletteZone) => (zone === 'toda' ? 'Toda la ciudad' : ROULETTE_ZONES.find((option) => option.value === zone)?.label ?? zone);

type Props = {
  state: RouletteState;
  onChange: (next: RouletteState) => void;
  onGenerate: () => void;
  disabled: boolean;
};

export function PlanRoulette({ state, onChange, onGenerate, disabled }: Props) {
  const { places, getPlace } = usePlanCatalog();
  // Al volver de un plan ya armado se entra directo a las paradas.
  const [step, setStep] = useState<1 | 2>(state.slots.length > 0 ? 2 : 1);
  // Mientras gira, cada casilla muestra lugares al azar hasta detenerse en el resultado.
  const [rolling, setRolling] = useState<(PlanPlace | null)[] | null>(null);
  const [adding, setAdding] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const pool = roulettePool(places, state);
  const isSpinning = rolling !== null;
  const lockedCount = state.slots.filter((slot) => slot.locked).length;
  const looseCount = state.slots.length - lockedCount;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const commit = (slots: RouletteSlot[], extra?: Partial<RouletteState>) => onChange({ ...state, ...extra, slots, count: slots.length });

  // only = cambia sólo esa parada; sin él giran todas las que no están fijas.
  const spin = (only?: number) => {
    if (isSpinning) return;
    const count = state.slots.length || ROULETTE_DEFAULT_STOPS;
    const base = only === undefined ? state : { ...state, slots: state.slots.map((slot, index) => (index === only ? slot : { ...slot, locked: true })) };
    const sameKind = only === undefined ? undefined : getPlace(state.slots[only].placeId)?.interest;
    const picked = pickSlots(places, getPlace, base, count, sameKind).map((slot, index) => ({ ...slot, locked: state.slots[index]?.locked ?? false }));
    setStep(2);
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      commit(picked);
      return;
    }
    const spinning = picked.map((_, index) => !state.slots[index]?.locked && (only === undefined || index === only));
    const stopAt = picked.map((_, index) => SPIN_FIRST_STOP_MS + spinning.slice(0, index).filter(Boolean).length * SPIN_STAGGER_MS);
    const lastStop = Math.max(0, ...stopAt.filter((_, index) => spinning[index]));
    const stopped = new Set<number>();
    const faces = pool.length > 0 ? pool : places;
    let elapsed = 0;
    const tick = () => {
      setRolling(picked.map((_, index) => {
        if (!spinning[index] || elapsed >= stopAt[index]) {
          if (spinning[index] && !stopped.has(index)) {
            stopped.add(index);
            navigator.vibrate?.(12);
          }
          return null;
        }
        return randomItem(faces);
      }));
      if (elapsed < lastStop) {
        elapsed += SPIN_TICK_MS;
        timer.current = window.setTimeout(tick, SPIN_TICK_MS);
      } else {
        setRolling(null);
      }
    };
    commit(picked);
    tick();
  };

  const toggleLock = (index: number) => commit(state.slots.map((slot, position) => (position === index ? { ...slot, locked: !slot.locked } : slot)));
  const remove = (index: number) => commit(state.slots.filter((_, position) => position !== index));
  const add = (place: PlanPlace, picked: boolean) => {
    // Lo que se elige a mano queda fijo: ni la ruleta ni la IA lo cambian.
    commit([...state.slots, { placeId: place.id, locked: picked }]);
    setAdding(false);
  };

  const slotPlaces = state.slots.map((slot) => getPlace(slot.placeId));
  const anchor = [...slotPlaces].reverse().find((place) => place?.coordinates);
  const canAdd = state.slots.length < ROULETTE_MAX_STOPS;
  const canBuild = state.slots.length >= ROULETTE_MIN_STOPS;
  const spinNeeds = Math.max(1, (state.slots.length || ROULETTE_DEFAULT_STOPS) - lockedCount);
  const tooFew = pool.length < spinNeeds;

  if (step === 1) {
    return (
      <div className="plan-step plan-roulette">
        <div className="plan-step-top">
          <span>PASO 1 DE 2 · CUÁNDO Y DÓNDE</span>
          <div className="plan-step-bar" aria-hidden="true"><i style={{ width: '50%' }} /></div>
        </div>

        <h2 className="plan-roulette-question">¿Cuándo sales?</h2>
        <div className="plan-roulette-moments" role="radiogroup" aria-label="¿Cuándo sales?">
          {ROULETTE_MOMENTS.map((option) => {
            const { icon: Icon, label, hint } = MOMENTS[option.value];
            const selected = state.moment === option.value;
            return (
              <button key={option.value} type="button" role="radio" aria-checked={selected} className={selected ? 'is-active' : ''} onClick={() => onChange({ ...state, moment: option.value })}>
                <Icon size={24} strokeWidth={2.1} aria-hidden="true" />
                <strong>{label}</strong>
                <span>{hint}</span>
              </button>
            );
          })}
        </div>

        <h2 className="plan-roulette-question"><MapPin size={20} strokeWidth={2.4} aria-hidden="true" /> ¿Por dónde?</h2>
        <div className="plan-roulette-zones" role="radiogroup" aria-label="¿Por dónde?">
          {ROULETTE_ZONES.map((option) => {
            const selected = state.zone === option.value;
            const available = roulettePool(places, { ...state, zone: option.value }).length;
            // Una zona sin lugares suficientes a esa hora no se puede elegir.
            const few = available < ROULETTE_DEFAULT_STOPS;
            return (
              <button key={option.value} type="button" role="radio" aria-checked={selected} className={selected ? 'is-active' : ''} onClick={() => onChange({ ...state, zone: option.value })} disabled={few && !selected} title={few ? 'Pocos lugares a esa hora' : option.hint}>
                {zoneLabel(option.value)} <small>{available}</small>
              </button>
            );
          })}
        </div>

        <div className="plan-step-actions plan-roulette-actions is-column">
          <button type="button" className="plan-builder-button plan-roulette-spin" onClick={() => spin()} disabled={tooFew}>
            <Dices size={22} aria-hidden="true" /> {tooFew ? 'POCOS LUGARES AQUÍ' : 'GIRAR'}
          </button>
          <button type="button" className="plan-roulette-link" onClick={() => setStep(2)}>
            {state.slots.length > 0 ? 'VOLVER A MIS PARADAS' : 'PREFIERO ELEGIR YO LAS PARADAS'} <ArrowRight size={15} aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="plan-step plan-roulette">
      <div className="plan-step-top">
        <span>PASO 2 DE 2 · TU PLAN</span>
        <div className="plan-step-bar" aria-hidden="true"><i style={{ width: '100%' }} /></div>
      </div>

      <button type="button" className="plan-roulette-summary" onClick={() => setStep(1)} disabled={isSpinning} aria-label={`Cambiar cuándo y dónde: ${MOMENTS[state.moment].label}, ${zoneLabel(state.zone)}`}>
        <span>{MOMENTS[state.moment].label} · {zoneLabel(state.zone)}</span>
        <b><Pencil size={13} aria-hidden="true" /> CAMBIAR</b>
      </button>

      <p className="plan-roulette-help">
        {state.slots.length === 0
          ? 'Agrega tu primera parada o deja que la ruleta empiece.'
          : 'Fija lo que te late, cambia lo demás y agrega las paradas que quieras.'}
      </p>

      <ol className="plan-roulette-slots" aria-live="polite" aria-busy={isSpinning}>
        {state.slots.map((slot, index) => {
          const place = rolling?.[index] ?? slotPlaces[index];
          if (!place) return null;
          const isRolling = Boolean(rolling?.[index]);
          const Icon = placeIcon(place);
          const placeZone = routeZone(place);
          const meta = [place.type, placeZone ? ZONE_BY_ID.get(placeZone)?.short : undefined].filter(Boolean).join(' · ');
          return (
            <li key={index} className={`plan-slot${slot.locked ? ' is-locked' : ''}${isRolling ? ' is-rolling' : ''}`}>
              <div className="plan-slot-card">
                <span className="plan-slot-thumb">
                  {place.imageUrl ? <img src={place.imageUrl} alt="" loading="lazy" decoding="async" /> : <Icon size={30} strokeWidth={1.7} aria-hidden="true" />}
                </span>
                <div className="plan-slot-info">
                  <span className="plan-slot-number">PARADA {String(index + 1).padStart(2, '0')}{slot.locked ? ' · FIJA' : ''}</span>
                  <strong>{place.name}</strong>
                  <span className="plan-slot-meta">{meta}</span>
                </div>
              </div>
              <div className="plan-slot-actions">
                <button type="button" onClick={() => toggleLock(index)} disabled={isSpinning} aria-pressed={slot.locked} className={slot.locked ? 'is-on' : ''} aria-label={slot.locked ? `Soltar ${place.name}` : `Fijar ${place.name}`}>
                  {slot.locked ? <Lock size={15} aria-hidden="true" /> : <LockOpen size={15} aria-hidden="true" />} {slot.locked ? 'FIJA' : 'FIJAR'}
                </button>
                <button type="button" onClick={() => spin(index)} disabled={isSpinning || slot.locked} aria-label={`Cambiar ${place.name} por otro lugar parecido`}>
                  <Shuffle size={15} aria-hidden="true" /> CAMBIAR
                </button>
                <button type="button" onClick={() => remove(index)} disabled={isSpinning} aria-label={`Quitar ${place.name}`}>
                  <X size={15} aria-hidden="true" /> QUITAR
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      {canAdd ? (
        <button type="button" className="plan-roulette-add" onClick={() => setAdding(true)} disabled={isSpinning}>
          <Plus size={20} aria-hidden="true" /> AGREGAR PARADA <small>{state.slots.length}/{ROULETTE_MAX_STOPS}</small>
        </button>
      ) : (
        <p className="plan-roulette-full">Llegaste a {ROULETTE_MAX_STOPS} paradas. Quita una para agregar otra.</p>
      )}

      <div className="plan-step-actions plan-roulette-actions">
        <button type="button" className="plan-builder-secondary plan-roulette-respin" onClick={() => spin()} disabled={isSpinning || disabled || tooFew || (state.slots.length > 0 && looseCount === 0)} aria-label={state.slots.length === 0 ? 'Girar la ruleta' : 'Girar las paradas que no están fijas'}>
          <Dices size={20} aria-hidden="true" /> GIRAR
        </button>
        <button type="button" className="plan-builder-button" onClick={onGenerate} disabled={isSpinning || disabled || !canBuild}>
          {canBuild ? <>ARMAR PLAN <Sparkles size={18} aria-hidden="true" /></> : `FALTAN ${ROULETTE_MIN_STOPS - state.slots.length}`}
        </button>
      </div>

      {adding && (
        <PlanAddStop
          places={places}
          taken={state.slots.map((slot) => slot.placeId)}
          anchor={anchor}
          zone={state.zone === 'toda' ? undefined : state.zone}
          onAdd={add}
          onClose={() => setAdding(false)}
        />
      )}
    </div>
  );
}
