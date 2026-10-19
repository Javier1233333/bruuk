import { useEffect, useRef, useState } from 'react';
import { Dices, Lock, LockOpen, Shuffle, Sparkles } from 'lucide-react';
import {
  INTEREST_OPTIONS,
  MOMENT_INTERESTS,
  PLAN_PLACES,
  PLAN_PLACES_BY_ID,
  ROULETTE_MOMENTS,
  STOP_OPTIONS,
  labelFor,
  type PlanInterest,
  type PlanPlace,
  type RouletteMoment,
} from '../data/planBuilder';

export type RouletteSlot = { placeId: string; locked: boolean };
export type RouletteState = { moment: RouletteMoment; interests: PlanInterest[]; count: number; slots: RouletteSlot[] };

const SPIN_TICK_MS = 70;
const SPIN_FIRST_STOP_MS = 650;
const SPIN_STAGGER_MS = 380;

const randomItem = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];

const shuffle = <T,>(items: T[]) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
};

// Categorías que entran al giro: las elegidas que tengan sentido a esa hora; si no hay, todas las de esa hora.
const allowedInterests = ({ moment, interests }: Pick<RouletteState, 'moment' | 'interests'>) => {
  const forMoment = MOMENT_INTERESTS[moment];
  const chosen = interests.filter((interest) => forMoment.includes(interest));
  return chosen.length > 0 ? chosen : forMoment;
};

const roulettePool = (state: Pick<RouletteState, 'moment' | 'interests'>) => {
  const interests = allowedInterests(state);
  return PLAN_PLACES.filter((place) => interests.includes(place.interest));
};

// Llena las casillas sin fijar repartiendo categorías, para que no salgan tres cafés seguidos.
const pickSlots = (state: RouletteState): RouletteSlot[] => {
  const pool = roulettePool(state);
  const kept = state.slots.slice(0, state.count);
  const used = new Set(kept.filter((slot) => slot.locked).map((slot) => slot.placeId));
  const interests = shuffle([...new Set(pool.map((place) => place.interest))]);
  let turn = 0;
  return Array.from({ length: state.count }, (_, index) => {
    const current = kept[index];
    if (current?.locked) return current;
    const interest = interests[turn++ % interests.length];
    const options = pool.filter((place) => !used.has(place.id));
    const preferred = options.filter((place) => place.interest === interest);
    const place = randomItem(preferred.length > 0 ? preferred : options);
    if (!place) return null;
    used.add(place.id);
    return { placeId: place.id, locked: false };
  }).filter((slot): slot is RouletteSlot => slot !== null);
};

const interestLabel = (place: PlanPlace) => labelFor(INTEREST_OPTIONS, place.interest);

type Props = {
  state: RouletteState;
  onChange: (next: RouletteState) => void;
  onGenerate: () => void;
  disabled: boolean;
};

export function PlanRoulette({ state, onChange, onGenerate, disabled }: Props) {
  // Mientras gira, cada casilla muestra lugares al azar hasta detenerse en el resultado.
  const [rolling, setRolling] = useState<(PlanPlace | null)[] | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const pool = roulettePool(state);
  const isSpinning = rolling !== null;
  const hasSpun = state.slots.length > 0;

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const spin = (only?: number) => {
    if (isSpinning) return;
    const base = only === undefined ? state : { ...state, slots: state.slots.map((slot, index) => (index === only ? slot : { ...slot, locked: true })) };
    const picked = pickSlots(base).map((slot, index) => ({ ...slot, locked: state.slots[index]?.locked ?? false }));
    const next = { ...state, slots: picked };
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onChange(next);
      return;
    }
    const spinning = picked.map((_, index) => !state.slots[index]?.locked && (only === undefined || index === only));
    const stopAt = picked.map((_, index) => SPIN_FIRST_STOP_MS + spinning.slice(0, index).filter(Boolean).length * SPIN_STAGGER_MS);
    const lastStop = Math.max(...stopAt.filter((_, index) => spinning[index]));
    const stopped = new Set<number>();
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
        return randomItem(pool);
      }));
      if (elapsed < lastStop) {
        elapsed += SPIN_TICK_MS;
        timer.current = window.setTimeout(tick, SPIN_TICK_MS);
      } else {
        setRolling(null);
      }
    };
    onChange(next);
    tick();
  };

  const toggleLock = (index: number) =>
    onChange({ ...state, slots: state.slots.map((slot, position) => (position === index ? { ...slot, locked: !slot.locked } : slot)) });

  const setCount = (count: number) => {
    const next = { ...state, count };
    // Al quitar casillas se van primero las que no están fijas.
    if (count < state.slots.length) {
      const locked = state.slots.filter((slot) => slot.locked).slice(0, count);
      const loose = state.slots.filter((slot) => !slot.locked).slice(0, count - locked.length);
      next.slots = state.slots.filter((slot) => locked.includes(slot) || loose.includes(slot));
    } else if (hasSpun) {
      next.slots = pickSlots({ ...next, slots: state.slots.map((slot) => ({ ...slot, locked: true })) }).map((slot, index) => ({ ...slot, locked: state.slots[index]?.locked ?? false }));
    }
    onChange(next);
  };

  const toggleInterest = (interest: PlanInterest) =>
    onChange({ ...state, interests: state.interests.includes(interest) ? state.interests.filter((value) => value !== interest) : [...state.interests, interest] });

  const lockedCount = state.slots.filter((slot) => slot.locked).length;

  return (
    <div className="plan-step plan-roulette">
      <div className="plan-roulette-filters">
        <div className="plan-roulette-row" role="radiogroup" aria-label="¿Cuándo sales?">
          {ROULETTE_MOMENTS.map((option) => (
            <button key={option.value} type="button" role="radio" aria-checked={state.moment === option.value} className={state.moment === option.value ? 'is-active' : ''} onClick={() => onChange({ ...state, moment: option.value })} disabled={isSpinning}>
              {option.label}
            </button>
          ))}
        </div>
        <div className="plan-roulette-row is-scroll" role="group" aria-label="Qué entra en la ruleta">
          {INTEREST_OPTIONS.filter((option) => MOMENT_INTERESTS[state.moment].includes(option.value)).map((option) => (
            <button key={option.value} type="button" aria-pressed={state.interests.includes(option.value)} className={state.interests.includes(option.value) ? 'is-active' : ''} onClick={() => toggleInterest(option.value)} disabled={isSpinning}>
              {option.label}
            </button>
          ))}
        </div>
        <div className="plan-roulette-meta">
          <span>{pool.length} LUGARES EN LA RULETA</span>
          <div className="plan-roulette-count" role="radiogroup" aria-label="Número de paradas">
            {STOP_OPTIONS.map((value) => (
              <button key={value} type="button" role="radio" aria-checked={state.count === value} className={state.count === value ? 'is-active' : ''} onClick={() => setCount(value)} disabled={isSpinning || value < lockedCount}>
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>

      <ol className="plan-roulette-slots" aria-live="polite" aria-busy={isSpinning}>
        {Array.from({ length: state.count }, (_, index) => {
          const slot = state.slots[index];
          const place = rolling?.[index] ?? (slot ? PLAN_PLACES_BY_ID.get(slot.placeId) : undefined);
          const isRolling = Boolean(rolling?.[index]);
          return (
            <li key={index} className={`plan-slot ${slot?.locked ? 'is-locked' : ''} ${isRolling ? 'is-rolling' : ''} ${!place ? 'is-empty' : ''}`}>
              <div className="plan-slot-media" aria-hidden="true">
                {place?.imageUrl ? <img src={place.imageUrl} alt="" loading="lazy" decoding="async" /> : <span>{place ? place.name.charAt(0) : '?'}</span>}
              </div>
              <div className="plan-slot-copy">
                <span>{place ? `${interestLabel(place)} · ${place.type}` : `PARADA ${index + 1}`}</span>
                <strong>{place ? place.name : 'Gira la ruleta'}</strong>
              </div>
              {slot && !isSpinning && (
                <div className="plan-slot-actions">
                  {!slot.locked && (
                    <button type="button" onClick={() => spin(index)} aria-label={`Volver a girar ${place?.name ?? 'esta parada'}`}><Shuffle size={17} aria-hidden="true" /></button>
                  )}
                  <button type="button" aria-pressed={slot.locked} onClick={() => toggleLock(index)} aria-label={slot.locked ? `Soltar ${place?.name}` : `Fijar ${place?.name}`}>
                    {slot.locked ? <Lock size={17} aria-hidden="true" /> : <LockOpen size={17} aria-hidden="true" />}
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <p className="plan-roulette-hint">
        {hasSpun ? 'Fija con el candado lo que te late y vuelve a girar el resto. Luego la IA encuentra qué los une.' : 'La ruleta saca lugares reales de la guía. Tú decides cuáles se quedan.'}
      </p>

      <div className="plan-step-actions">
        {hasSpun ? (
          <>
            <button type="button" className="plan-builder-secondary plan-roulette-respin" onClick={() => spin()} disabled={isSpinning || disabled || lockedCount === state.count} aria-label="Girar otra vez">
              <Dices size={20} aria-hidden="true" />
            </button>
            <button type="button" className="plan-builder-button" onClick={onGenerate} disabled={isSpinning || disabled}>
              DARLE SENTIDO <Sparkles size={18} aria-hidden="true" />
            </button>
          </>
        ) : (
          <button type="button" className="plan-builder-button" onClick={() => spin()} disabled={isSpinning || pool.length < state.count}>
            <Dices size={20} aria-hidden="true" /> GIRAR LA RULETA
          </button>
        )}
      </div>
    </div>
  );
}
