import { createElement, useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, Dices, Globe, Lock, MapPin, MessageCircle, Plus, Sparkles, X, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ItineraryCard } from '../components/ItineraryCard';
import { INTEREST_OPTIONS, MOMENT_INTERESTS, ROULETTE_MAX_STOPS, ROULETTE_MIN_STOPS, type PlanInterest, type PlanPlace } from '../data/planBuilder';
import { MOMENT_LABEL, type Itinerary, type ItineraryMoment } from '../lib/itinerary';
import { addToPlan, removeFromPlan, usePlanCart } from '../lib/planCart';
import { INTEREST_ICONS, placeIcon } from '../lib/placeIcons';
import { usePlanCatalog } from '../lib/planCatalog';
import { SPIN_STOPS, routeZone, spinRoute, spinZones } from '../lib/routeGenerator';
import { ZONES, ZONE_BY_ID, type ZoneId } from '../lib/zones';

/* ============================================================
   Ruleta, para decidir a dónde ir sin pensarle. Dos formas:
   - UN LUGAR: dos carretes (ZONA y QUÉ) y sale un lugar con lo
     necesario para irse: qué es, cuánto cuesta, por qué y cómo
     llegar. No hace falta armar nada.
   - PLAN DE 3: un giro saca tres paradas cercanas entre sí y en
     orden (arranque, algo que hacer, cierre). Cada parada tiene
     candado: la fija se queda y lo demás vuelve a girar.
   Las dos respetan la hora (MAÑANA / TARDE / NOCHE): no sale un
   bar para desayunar. "Mi plan" (src/lib/planCart.ts) sigue ahí
   para quien quiera juntar lugares a mano.
   ============================================================ */

// "toda" = donde sea: la única cara con los lugares que no tienen zona (atardeceres, varios bares).
type ZoneFace = ZoneId | 'toda';
type Reel = 'zone' | 'what';
type Kind = 'lugar' | 'plan';
type Rolling = { zone: ZoneFace; what?: PlanInterest; names?: string[] };

const ZONE_FACES: { value: ZoneFace; label: string }[] = [
  { value: 'toda', label: 'Donde sea' },
  ...ZONES.map((zone) => ({ value: zone.id as ZoneFace, label: zone.short })),
];
const WHAT_LABEL: Record<PlanInterest, string> = { cafe: 'Café', comida: 'Comida', noche: 'Bares', vintage: 'Vintage', cultura: 'Museos', atardecer: 'Atardecer' };
const WHAT_FACES = INTEREST_OPTIONS.map((option) => option.value);
const MOMENTS: ItineraryMoment[] = ['manana', 'tarde', 'noche'];

const TICK_MS = 70;
const ZONE_STOP_MS = 520;
const WHAT_STOP_MS = 900;
// En el plan, cada parada se detiene un poco después de la anterior.
const STOP_STAGGER_MS = 260;

const randomItem = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];
const zoneFaceLabel = (zone: ZoneFace) => ZONE_FACES.find((face) => face.value === zone)!.label;

// La hora del teléfono decide con qué arranca: de madrugada todavía es "noche".
const momentNow = (): ItineraryMoment => {
  const hour = new Date().getHours();
  return hour < 5 ? 'noche' : hour < 12 ? 'manana' : hour < 18 ? 'tarde' : 'noche';
};

const whatsappPlace = (place: PlanPlace) =>
  `https://wa.me/?text=${encodeURIComponent(`¿Vamos a ${place.name}? ${place.mapsUrl}`)}`;

export function PlanRoulette({ onGenerate, disabled }: { onGenerate: () => void; disabled: boolean }) {
  const { places, getPlace } = usePlanCatalog();
  const cart = usePlanCart();
  const [kind, setKind] = useState<Kind>('lugar');
  const [moment, setMoment] = useState<ItineraryMoment>(momentNow);
  const [zone, setZone] = useState<ZoneFace | null>(null);
  const [what, setWhat] = useState<PlanInterest | null>(null);
  const [locks, setLocks] = useState<Record<Reel, boolean>>({ zone: false, what: false });
  const [hitId, setHitId] = useState<string | null>(null);
  // Plan de un giro: la ruta, sus paradas fijas y lo ya visto (para no repetir).
  const [route, setRoute] = useState<Itinerary | null>(null);
  const [fixedStops, setFixedStops] = useState<ReadonlySet<string>>(new Set());
  const [seen, setSeen] = useState<string[]>([]);
  const [planError, setPlanError] = useState('');
  const [rolling, setRolling] = useState<Rolling | null>(null);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const taken = new Set(cart);
  const isSpinning = rolling !== null;
  const isPlan = kind === 'plan';
  const isFull = cart.length >= ROULETTE_MAX_STOPS;
  const canBuild = !isPlan && cart.length >= ROULETTE_MIN_STOPS;

  /* ---------- Un lugar ---------- */

  const candidates = (zoneFace: ZoneFace, interest: PlanInterest) =>
    places.filter((place) => place.interest === interest && !taken.has(place.id) && place.id !== hitId && (zoneFace === 'toda' || routeZone(place) === zoneFace));

  // Sólo combinaciones con lugares, respetando lo que está fijo y la hora.
  const zoneOptions = locks.zone && zone ? [zone] : ZONE_FACES.map((face) => face.value);
  const whatOptions = locks.what && what ? [what] : WHAT_FACES.filter((interest) => MOMENT_INTERESTS[moment].includes(interest));
  const pairs = zoneOptions.flatMap((zoneFace) => whatOptions.filter((interest) => candidates(zoneFace, interest).length > 0).map((interest) => ({ zone: zoneFace, what: interest })));

  const hit = hitId ? getPlace(hitId) : undefined;

  /* ---------- Plan de 3 ---------- */

  const routeStops = route ? route.stops.map((stop) => getPlace(stop.placeId)) : [];
  const kept = routeStops.map((place) => (place && fixedStops.has(place.id) ? place : null));
  const hasKept = kept.some(Boolean);
  const allKept = route !== null && kept.filter(Boolean).length >= SPIN_STOPS;
  const planZoneLocked = locks.zone && zone !== null && zone !== 'toda';
  const planZones = planZoneLocked ? [zone as ZoneId] : spinZones(places, moment);

  const canSpin = isPlan ? planZones.length > 0 && !allKept : pairs.length > 0;

  // Mueve los carretes hasta `last` ms y luego aterriza el resultado.
  const roll = (last: number, frame: (elapsed: number) => Rolling, land: () => void) => {
    const finish = () => {
      land();
      setRolling(null);
    };
    if (last <= 0 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      finish();
      return;
    }
    let elapsed = 0;
    const tick = () => {
      if (elapsed >= last) {
        finish();
        return;
      }
      setRolling(frame(elapsed));
      elapsed += TICK_MS;
      timer.current = window.setTimeout(tick, TICK_MS);
    };
    tick();
  };

  const buzzAt = (elapsed: number, stopAt: number) => {
    if (elapsed + TICK_MS > stopAt && elapsed <= stopAt) navigator.vibrate?.(12);
  };

  const spinPlace = () => {
    const pair = randomItem(pairs);
    const place = randomItem(candidates(pair.zone, pair.what));
    const spinZone = !(locks.zone && zone);
    const spinWhat = !(locks.what && what);
    setHitId(null);
    roll(
      spinWhat ? WHAT_STOP_MS : spinZone ? ZONE_STOP_MS : 0,
      (elapsed) => {
        if (spinZone) buzzAt(elapsed, ZONE_STOP_MS);
        return {
          zone: !spinZone || elapsed >= ZONE_STOP_MS ? pair.zone : randomItem(ZONE_FACES).value,
          what: !spinWhat || elapsed >= WHAT_STOP_MS ? pair.what : randomItem(WHAT_FACES),
        };
      },
      () => {
        setZone(pair.zone);
        setWhat(pair.what);
        setHitId(place.id);
      },
    );
  };

  const spinPlan = () => {
    // Con paradas fijas la zona ya está decidida: sólo giran las demás.
    const currentZone = zone !== null && zone !== 'toda' ? zone : null;
    const spinZone = !planZoneLocked && !(hasKept && currentZone);
    const nextZone = spinZone ? randomItem(planZones) : (currentZone as ZoneId);
    const next = spinRoute({ zone: nextZone, moment, kept, avoid: seen }, places);
    if (!next) {
      setPlanError(`No salieron tres paradas en ${ZONE_BY_ID.get(nextZone)?.short ?? 'esa zona'} a esa hora. Gira otra vez o suelta la zona.`);
      return;
    }
    setPlanError('');
    const names = next.stops.map((stop) => getPlace(stop.placeId)?.name ?? '');
    const stopAt = names.map((_, index) => (kept[index] ? 0 : (spinZone ? ZONE_STOP_MS : 0) + (index + 1) * STOP_STAGGER_MS));
    roll(
      Math.max(...stopAt),
      (elapsed) => {
        if (spinZone) buzzAt(elapsed, ZONE_STOP_MS);
        stopAt.forEach((at) => at > 0 && buzzAt(elapsed, at));
        return {
          zone: !spinZone || elapsed >= ZONE_STOP_MS ? nextZone : randomItem(ZONES).id,
          names: names.map((name, index) => (elapsed >= stopAt[index] ? name : randomItem(places).name)),
        };
      },
      () => {
        setZone(nextZone);
        setRoute(next);
        setSeen((current) => [...new Set([...current, ...next.stops.map((stop) => stop.placeId)])]);
      },
    );
  };

  const spin = () => {
    if (isSpinning || !canSpin) return;
    if (isPlan) spinPlan();
    else spinPlace();
  };

  const add = () => {
    if (!hit) return;
    addToPlan(hit.id);
    setHitId(null);
  };

  // Tocar un carrete (ya con valor) lo deja fijo o lo suelta.
  const toggleLock = (reel: Reel) => setLocks((current) => ({ ...current, [reel]: !current[reel] }));

  const toggleStop = (placeId: string) =>
    setFixedStops((current) => {
      const next = new Set(current);
      if (!next.delete(placeId)) next.add(placeId);
      return next;
    });

  const changeMoment = (next: ItineraryMoment) => {
    if (next === moment) return;
    setMoment(next);
    // Otra hora es otro plan: lo que salió ya no aplica.
    setHitId(null);
    setRoute(null);
    setFixedStops(new Set());
    setPlanError('');
  };

  const changeKind = (next: Kind) => {
    setKind(next);
    setPlanError('');
  };

  const shownZone = rolling?.zone ?? zone;
  const shownWhat = rolling?.what ?? what;
  const cartPlaces = cart.map((id) => getPlace(id)).filter((place) => place !== undefined);
  // En el plan no hay "donde sea": el carrete espera hasta que salga una zona.
  const planZoneShown = shownZone && shownZone !== 'toda' ? shownZone : null;
  // Zona con pocos lugares a esa hora: la ruta se completó con lo más cercano y se avisa.
  const routeZoneInfo = zone && zone !== 'toda' ? ZONE_BY_ID.get(zone) : undefined;
  const completedNearby = route !== null && routeZoneInfo !== undefined && routeStops.some((place) => place && routeZone(place) !== routeZoneInfo.id);

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

  const hint = () => {
    if (isPlan) {
      if (planError) return planError;
      if (allKept) return 'Todo está fijo. Suelta una parada para volver a girar.';
      if (planZones.length === 0) return 'No hay zonas con tres lugares a esa hora. Prueba con otra.';
      if (route) return 'Fija las paradas que te laten y gira: las demás cambian.';
      return 'Un giro y salen tres paradas que se caminan.';
    }
    if (!canSpin) return locks.zone || locks.what ? 'Ya no hay más lugares con lo que está fijo. Toca el carrete fijo para soltarlo.' : 'Ya no hay más lugares a esa hora. Prueba con otra.';
    return zone || what ? 'Toca un carrete para dejarlo fijo.' : 'Gira y sale un lugar.';
  };
  const isWarning = isPlan ? Boolean(planError) || allKept || planZones.length === 0 : !canSpin;

  return (
    <div className="plan-step plan-roulette">
      <div className="plan-roulette-setup">
        <div className="plan-roulette-kind" role="group" aria-label="Qué quieres que salga">
          <button type="button" className={!isPlan ? 'is-active' : ''} aria-pressed={!isPlan} onClick={() => changeKind('lugar')} disabled={isSpinning}>UN LUGAR</button>
          <button type="button" className={isPlan ? 'is-active' : ''} aria-pressed={isPlan} onClick={() => changeKind('plan')} disabled={isSpinning}>PLAN DE 3</button>
        </div>
        <div className="plan-roulette-when" role="group" aria-label="Para cuándo">
          {MOMENTS.map((value) => (
            <button key={value} type="button" className={moment === value ? 'is-active' : ''} aria-pressed={moment === value} onClick={() => changeMoment(value)} disabled={isSpinning}>{MOMENT_LABEL[value]}</button>
          ))}
        </div>
      </div>

      <div className={`plan-reels${isPlan ? ' is-single' : ''}`}>
        {isPlan
          ? reel('zone', 'ZONA', planZoneShown ? zoneFaceLabel(planZoneShown) : null, MapPin)
          : (
            <>
              {reel('zone', 'ZONA', shownZone ? zoneFaceLabel(shownZone) : null, shownZone === 'toda' ? Globe : MapPin)}
              {reel('what', 'QUÉ', shownWhat ? WHAT_LABEL[shownWhat] : null, shownWhat ? INTEREST_ICONS[shownWhat] : Dices)}
            </>
          )}
      </div>
      <p className={`plan-reels-hint${isWarning ? ' is-warning' : ''}`} role={isWarning ? 'status' : undefined}>{hint()}</p>

      {!isPlan && hit && !isSpinning && (
        <article className="plan-hit">
          <div className="plan-hit-photo">
            {hit.imageUrl ? <img src={hit.imageUrl} alt="" decoding="async" /> : createElement(placeIcon(hit), { size: 40, strokeWidth: 1.6, 'aria-hidden': true })}
          </div>
          <div className="plan-hit-body">
            <span className="plan-hit-type">{[hit.type, ZONE_BY_ID.get(routeZone(hit) as ZoneId)?.short, hit.price].filter(Boolean).join(' · ')}</span>
            <h2>{hit.name}</h2>
            {hit.description && hit.description !== hit.tip && <p className="plan-hit-why">{hit.description}</p>}
            {hit.tip && <p className="plan-hit-tip"><b>VE POR</b>{hit.tip}</p>}
          </div>
          <div className="plan-hit-actions">
            <a className="plan-hit-go" href={hit.mapsUrl} target="_blank" rel="noreferrer">CÓMO LLEGAR <ArrowUpRight size={17} aria-hidden="true" /></a>
            <a className="plan-hit-side" href={whatsappPlace(hit)} target="_blank" rel="noreferrer" aria-label={`Mandar ${hit.name} por WhatsApp`}><MessageCircle size={17} aria-hidden="true" /> MANDAR</a>
            <button type="button" className="plan-hit-side" onClick={add} disabled={isFull} aria-label={`Agregar ${hit.name} a mi plan`}><Plus size={17} aria-hidden="true" /> MI PLAN</button>
          </div>
        </article>
      )}

      {isPlan && isSpinning && rolling?.names && (
        <ol className="plan-spin-stops" aria-hidden="true">
          {rolling.names.map((name, index) => (
            <li key={index} className={kept[index] ? 'is-locked' : ''}><b>{String(index + 1).padStart(2, '0')}</b><span>{name}</span></li>
          ))}
        </ol>
      )}

      {isPlan && route && !isSpinning && (
        <>
          {completedNearby && <p className="plan-route-notice">{routeZoneInfo.name} tiene pocos lugares así a esa hora: completamos la ruta con lo más cercano.</p>}
          <ItineraryCard itinerary={route} getPlace={getPlace} lockedIds={fixedStops} onToggleLock={toggleStop} heading="h2" kicker="/ SALIÓ EN LA RULETA" />
          <p className="plan-builder-note">Lugares y recomendaciones de la guía Bruuk. Los tiempos son estimados; revisa horarios antes de salir.</p>
        </>
      )}

      {!isPlan && cartPlaces.length > 0 && (
        <section className="plan-tray" aria-labelledby="plan-tray-title">
          <h2 id="plan-tray-title">MI PLAN <span>{cart.length}/{ROULETTE_MAX_STOPS}</span></h2>
          <ol>
            {cartPlaces.map((place, index) => (
              <li key={place.id}>
                <b>{index + 1}</b>
                <span>{place.name}</span>
                <button type="button" onClick={() => removeFromPlan(place.id)} disabled={isSpinning} aria-label={`Quitar ${place.name}`}><X size={16} aria-hidden="true" /></button>
              </li>
            ))}
          </ol>
          {isFull
            ? <p className="plan-tray-empty"><Check size={14} aria-hidden="true" /> Plan completo.</p>
            : <p className="plan-tray-empty">Suma lo que salga o <Link to="/guadalajara/spots">elige lugares en Spots <ArrowRight size={13} aria-hidden="true" /></Link></p>}
        </section>
      )}

      <div className="plan-step-actions plan-roulette-actions">
        <button type="button" className={canBuild ? 'plan-builder-secondary plan-roulette-respin' : 'plan-builder-button plan-roulette-spin'} onClick={spin} disabled={isSpinning || disabled || !canSpin}>
          <Dices size={21} aria-hidden="true" /> {!canBuild && (isPlan ? route : hit) ? 'GIRAR OTRA VEZ' : 'GIRAR'}
        </button>
        {canBuild && (
          <button type="button" className="plan-builder-button" onClick={onGenerate} disabled={isSpinning || disabled}>
            ARMAR MI PLAN <Sparkles size={18} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
