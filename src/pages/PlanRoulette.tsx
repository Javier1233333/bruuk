import { useEffect, useRef, useState } from 'react';
import { Dices, Lock, LockOpen, MapPin, Moon, Shuffle, Sparkles, Sun, Sunrise, type LucideIcon } from 'lucide-react';
import {
  INTEREST_OPTIONS,
  MOMENT_INTERESTS,
  PLAN_PLACES,
  PLAN_PLACES_BY_ID,
  ROULETTE_MOMENTS,
  ROULETTE_ZONES,
  STOP_OPTIONS,
  type PlanInterest,
  type PlanPlace,
  type RouletteMoment,
  type RouletteZone,
} from '../data/planBuilder';
import { INTEREST_ICONS, placeIcon } from '../lib/placeIcons';

export type RouletteSlot = { placeId: string; locked: boolean };
export type RouletteState = { moment: RouletteMoment; zone: RouletteZone; interests: PlanInterest[]; count: number; slots: RouletteSlot[] };

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

const roulettePool = (state: Pick<RouletteState, 'moment' | 'interests' | 'zone'>) => {
  const interests = allowedInterests(state);
  return PLAN_PLACES.filter((place) => interests.includes(place.interest) && (state.zone === 'toda' || place.zone === state.zone));
};

// Llena las casillas sin fijar repartiendo categorías, para que no salgan tres cafés seguidos.
// Con "Toda la ciudad", después de la primera parada busca lugares de la misma zona: así la ruta se puede caminar.
const pickSlots = (state: RouletteState): RouletteSlot[] => {
  const pool = roulettePool(state);
  const kept = state.slots.slice(0, state.count);
  const used = new Set(kept.filter((slot) => slot.locked).map((slot) => slot.placeId));
  let anchorZone = kept.map((slot) => (slot.locked ? PLAN_PLACES_BY_ID.get(slot.placeId)?.zone : undefined)).find(Boolean);
  const interests = shuffle([...new Set(pool.map((place) => place.interest))]);
  let turn = 0;
  return Array.from({ length: state.count }, (_, index) => {
    const current = kept[index];
    if (current?.locked) return current;
    const interest = interests[turn++ % interests.length];
    const options = pool.filter((place) => !used.has(place.id));
    const nearby = anchorZone ? options.filter((place) => place.zone === anchorZone) : options;
    const candidates = nearby.length > 0 ? nearby : options;
    const preferred = candidates.filter((place) => place.interest === interest);
    const place = randomItem(preferred.length > 0 ? preferred : candidates);
    if (!place) return null;
    used.add(place.id);
    anchorZone ??= place.zone;
    return { placeId: place.id, locked: false };
  }).filter((slot): slot is RouletteSlot => slot !== null);
};

const MOMENT_ICONS: Record<RouletteMoment, LucideIcon> = { sorpresa: Sparkles, manana: Sunrise, tarde: Sun, noche: Moon };

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

  // Pocas palabras: íconos para filtrar, tarjetas con foto y tocar una tarjeta la fija.
  return (
    <div className="plan-step plan-roulette">
      <div className="plan-roulette-moments" role="radiogroup" aria-label="¿Cuándo sales?">
        {ROULETTE_MOMENTS.map((option) => {
          const Icon = MOMENT_ICONS[option.value];
          const selected = state.moment === option.value;
          return (
            <button key={option.value} type="button" role="radio" aria-checked={selected} className={selected ? 'is-active' : ''} onClick={() => onChange({ ...state, moment: option.value })} disabled={isSpinning}>
              <Icon size={20} strokeWidth={2.2} aria-hidden="true" />
              <span>{option.value === 'sorpresa' ? 'Lo que sea' : option.label}</span>
            </button>
          );
        })}
      </div>

      <div className="plan-roulette-zones" role="radiogroup" aria-label="¿En qué zona?">
        <MapPin size={15} strokeWidth={2.4} aria-hidden="true" />
        {ROULETTE_ZONES.map((option) => {
          const selected = state.zone === option.value;
          // Una zona sin lugares suficientes a esa hora no se puede elegir
          const tooFew = roulettePool({ ...state, zone: option.value }).length < state.count;
          return (
            <button key={option.value} type="button" role="radio" aria-checked={selected} title={tooFew ? `${option.hint}: pocos lugares a esa hora` : option.hint} className={selected ? 'is-active' : ''} onClick={() => onChange({ ...state, zone: option.value, slots: state.slots.filter((slot) => slot.locked) })} disabled={isSpinning || (tooFew && !selected)}>
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="plan-roulette-tools">
        <div className="plan-roulette-interests" role="group" aria-label="Qué entra en la ruleta">
          {INTEREST_OPTIONS.filter((option) => MOMENT_INTERESTS[state.moment].includes(option.value)).map((option) => {
            const Icon = INTEREST_ICONS[option.value];
            const selected = state.interests.includes(option.value);
            return (
              <button key={option.value} type="button" aria-pressed={selected} aria-label={option.label} title={option.label} className={selected ? 'is-active' : ''} onClick={() => toggleInterest(option.value)} disabled={isSpinning}>
                <Icon size={19} strokeWidth={2.2} aria-hidden="true" />
              </button>
            );
          })}
        </div>
        <div className="plan-roulette-count" role="radiogroup" aria-label="Número de paradas">
          {STOP_OPTIONS.map((value) => (
            <button key={value} type="button" role="radio" aria-checked={state.count === value} aria-label={`${value} paradas`} className={state.count === value ? 'is-active' : ''} onClick={() => setCount(value)} disabled={isSpinning || value < lockedCount}>
              {value}
            </button>
          ))}
        </div>
      </div>

      <ol className="plan-roulette-slots" aria-live="polite" aria-busy={isSpinning}>
        {Array.from({ length: state.count }, (_, index) => {
          const slot = state.slots[index];
          const place = rolling?.[index] ?? (slot ? PLAN_PLACES_BY_ID.get(slot.placeId) : undefined);
          const isRolling = Boolean(rolling?.[index]);
          const Icon = place ? placeIcon(place) : Dices;
          return (
            <li key={index} className={`plan-slot ${slot?.locked ? 'is-locked' : ''} ${isRolling ? 'is-rolling' : ''} ${!place ? 'is-empty' : ''}`}>
              <button
                type="button"
                className="plan-slot-face"
                onClick={() => (slot ? toggleLock(index) : spin())}
                disabled={isSpinning || (!slot && pool.length < state.count)}
                aria-pressed={slot ? slot.locked : undefined}
                aria-label={!slot ? 'Girar la ruleta' : slot.locked ? `Soltar ${place?.name}` : `Fijar ${place?.name}`}
              >
                {place?.imageUrl ? <img src={place.imageUrl} alt="" loading="lazy" decoding="async" /> : <span className="plan-slot-art"><Icon size={46} strokeWidth={1.6} aria-hidden="true" /></span>}
                {place && <span className="plan-slot-tag"><Icon size={14} strokeWidth={2.4} aria-hidden="true" />{place.type}</span>}
                <strong>{place ? place.name : '?'}</strong>
                {slot && !isSpinning && <span className="plan-slot-lock" aria-hidden="true">{slot.locked ? <Lock size={16} /> : <LockOpen size={16} />}</span>}
              </button>
              {slot && !slot.locked && !isSpinning && (
                <button type="button" className="plan-slot-respin" onClick={() => spin(index)} aria-label={`Volver a girar ${place?.name ?? 'esta parada'}`}><Shuffle size={16} aria-hidden="true" /></button>
              )}
            </li>
          );
        })}
      </ol>

      <div className="plan-step-actions">
        {hasSpun ? (
          <>
            <button type="button" className="plan-builder-secondary plan-roulette-respin" onClick={() => spin()} disabled={isSpinning || disabled || lockedCount === state.count} aria-label="Girar otra vez">
              <Dices size={22} aria-hidden="true" />
            </button>
            <button type="button" className="plan-builder-button" onClick={onGenerate} disabled={isSpinning || disabled}>
              ARMAR PLAN <Sparkles size={18} aria-hidden="true" />
            </button>
          </>
        ) : (
          <button type="button" className="plan-builder-button plan-roulette-spin" onClick={() => spin()} disabled={isSpinning || pool.length < state.count}>
            <Dices size={22} aria-hidden="true" /> {pool.length < state.count ? 'POCOS LUGARES AQUÍ' : 'GIRAR'}
          </button>
        )}
      </div>
    </div>
  );
}
