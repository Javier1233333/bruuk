import { useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronLeft, Pencil, RefreshCw, Shuffle, SlidersHorizontal, Sparkles } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { BruukLogo } from '../components/BruukLogo';
import {
  BUDGET_OPTIONS,
  COMPANY_OPTIONS,
  INTEREST_OPTIONS,
  MAX_INTERESTS,
  MAX_NOTE_LENGTH,
  MOMENT_OPTIONS,
  PLAN_PLACES_BY_ID,
  STOP_OPTIONS,
  VIBE_OPTIONS,
  labelFor,
  type CustomPlan,
  type PlanChoices,
  type PlanInterest,
  type PlanStop,
} from '../data/planBuilder';
import './PlanBuilderPage.css';

type StepId = 'moment' | 'company' | 'interests' | 'vibe' | 'budget';
type Status = 'choosing' | 'loading' | 'result' | 'error';

const STEPS: StepId[] = ['moment', 'company', 'interests', 'vibe', 'budget'];

const STEP_COPY: Record<StepId, { question: string; helper: string }> = {
  moment: { question: '¿Cuándo quieres salir?', helper: 'El plan se ordena según la hora del día.' },
  company: { question: '¿Con quién vas?', helper: 'No es lo mismo una cita que un grupo de amigos.' },
  interests: { question: '¿Qué se te antoja?', helper: `Elige hasta ${MAX_INTERESTS}. Las paradas salen de estas categorías.` },
  vibe: { question: '¿Qué ritmo buscas?', helper: 'Para decidir entre un rincón tranquilo o un lugar con ambiente.' },
  budget: { question: '¿Cuánto quieres gastar?', helper: 'Por persona, cuántas paradas y cualquier detalle extra.' },
};

const OPTIONS_FOR_STEP = {
  moment: MOMENT_OPTIONS,
  company: COMPANY_OPTIONS,
  vibe: VIBE_OPTIONS,
} as const;

type SingleStep = keyof typeof OPTIONS_FOR_STEP;
type Draft = Partial<Omit<PlanChoices, 'interests' | 'note'>> & { interests: PlanInterest[]; note: string };

const hostname = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

const requestPlan = async (body: object) => {
  const response = await fetch('/api/custom-plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'No pudimos armar tu plan.');
  return result;
};

export function PlanBuilderPage() {
  const { city = 'guadalajara' } = useParams();
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<Draft>({ interests: [], stops: 3, note: '' });
  const [status, setStatus] = useState<Status>('choosing');
  const [error, setError] = useState('');
  const [plan, setPlan] = useState<CustomPlan | null>(null);
  // Cuando se ajusta una opción desde el resultado, cada paso puede rehacer el plan directo.
  const [isEditing, setIsEditing] = useState(false);
  const [swappingIndex, setSwappingIndex] = useState<number | null>(null);
  const [swapError, setSwapError] = useState('');

  if (city !== 'guadalajara') return <Navigate to="/guadalajara/arma-tu-plan" replace />;

  const step = STEPS[stepIndex];
  const isLastStep = stepIndex === STEPS.length - 1;
  const isLoading = status === 'loading';

  const isStepComplete = (id: StepId) => {
    if (id === 'interests') return draft.interests.length > 0;
    if (id === 'budget') return Boolean(draft.budget && draft.stops);
    return Boolean(draft[id]);
  };

  const goTo = (index: number) => {
    setError('');
    setStepIndex(index);
  };

  const chooseSingle = (id: SingleStep, value: string) => {
    setDraft((current) => ({ ...current, [id]: value }));
    setError('');
    if (isEditing) return;
    // Una sola opción: avanzamos solos para que armar el plan sea tocar y seguir.
    const from = stepIndex;
    window.setTimeout(() => setStepIndex((current) => (current === from ? from + 1 : current)), 160);
  };

  const toggleInterest = (value: PlanInterest) => {
    setError('');
    setDraft((current) => {
      if (current.interests.includes(value)) return { ...current, interests: current.interests.filter((interest) => interest !== value) };
      if (current.interests.length >= MAX_INTERESTS) return current;
      return { ...current, interests: [...current.interests, value] };
    });
  };

  const generate = async () => {
    setStatus('loading');
    setError('');
    setSwapError('');
    try {
      const result = await requestPlan(draft);
      if (!result.plan) throw new Error('No pudimos armar tu plan.');
      setPlan(result.plan as CustomPlan);
      setIsEditing(false);
      setStatus('result');
      window.scrollTo({ top: 0, behavior: 'auto' });
    } catch (generateError) {
      setStatus('error');
      setError(generateError instanceof Error ? generateError.message : 'No pudimos armar tu plan. Inténtalo otra vez.');
    }
  };

  const swap = async (index: number) => {
    if (!plan) return;
    setSwappingIndex(index);
    setSwapError('');
    try {
      const result = await requestPlan({ ...draft, mode: 'swap', planPlaceIds: plan.stops.map((stop) => stop.placeId), swapIndex: index });
      const stop = result.stop as PlanStop;
      setPlan((current) => current && { ...current, stops: current.stops.map((item, position) => (position === index ? stop : item)) });
    } catch (swapFailure) {
      setSwapError(swapFailure instanceof Error ? swapFailure.message : 'No pudimos cambiar esa parada.');
    } finally {
      setSwappingIndex(null);
    }
  };

  const handleNext = () => {
    const incomplete = STEPS.find((id) => !isStepComplete(id));
    if (!isStepComplete(step) || ((isLastStep || isEditing) && incomplete)) {
      setError(step === 'interests' ? 'Elige al menos una opción.' : 'Elige una opción para seguir.');
      return;
    }
    if (isLastStep || isEditing) {
      void generate();
      return;
    }
    goTo(stepIndex + 1);
  };

  const editStep = (index: number) => {
    setIsEditing(true);
    setStatus('choosing');
    goTo(index);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const summary: { label: string; step: number }[] = [
    draft.moment && { label: labelFor(MOMENT_OPTIONS, draft.moment), step: 0 },
    draft.company && { label: labelFor(COMPANY_OPTIONS, draft.company), step: 1 },
    ...draft.interests.map((interest) => ({ label: labelFor(INTEREST_OPTIONS, interest), step: 2 })),
    draft.vibe && { label: labelFor(VIBE_OPTIONS, draft.vibe), step: 3 },
    draft.budget && { label: `${labelFor(BUDGET_OPTIONS, draft.budget)} · ${draft.stops} paradas`, step: 4 },
  ].filter((item): item is { label: string; step: number } => Boolean(item));

  return (
    <div className={`plan-builder-page ${stepIndex > 0 || status !== 'choosing' || isEditing ? 'is-in-progress' : ''}`}>
      <header className="plan-builder-nav">
        <Link to="/" aria-label="Ir al inicio"><BruukLogo width={96} /></Link>
        <span>/ ARMA TU PLAN · GDL</span>
        <Link to="/guadalajara"><ArrowLeft size={17} aria-hidden="true" /> REGRESAR</Link>
      </header>

      <main className="plan-builder-main">
        <section className="plan-builder-copy" aria-labelledby="plan-builder-title">
          <span className="plan-builder-kicker">/ PLANES A TU MEDIDA</span>
          <h1 id="plan-builder-title">ELIGE. <em>SAL.</em></h1>
          <p>Cinco preguntas y armamos una ruta con lugares reales de la guía. Los tips salen de fuentes en internet y siempre te decimos cuál.</p>
          {summary.length > 0 && (
            <ul className="plan-builder-summary" aria-label="Tus elecciones">
              {summary.map((item) => <li key={item.label}>{item.label}</li>)}
            </ul>
          )}
        </section>

        <section className="plan-builder-card" aria-live="polite">
          {status === 'loading' && (
            <div className="plan-builder-loading" role="status">
              <Sparkles size={34} aria-hidden="true" />
              <span>/ ARMANDO TU PLAN</span>
              <h2>BUSCANDO EN<br />LA GUÍA…</h2>
              <p>Elegimos los lugares de Bruuk que encajan con lo que pediste y buscamos en internet datos reales de cada uno. Puede tardar unos segundos.</p>
              <div className="plan-builder-loading-bar" aria-hidden="true"><i /></div>
            </div>
          )}

          {status === 'result' && plan && (
            <article className="plan-result">
              <span className="plan-result-kicker"><Check size={16} aria-hidden="true" /> TU PLAN</span>
              <h2>{plan.title}</h2>
              {plan.intro && <p className="plan-result-intro">{plan.intro}</p>}

              <div className="plan-result-adjust">
                <span><SlidersHorizontal size={14} aria-hidden="true" /> AJUSTA UNA OPCIÓN</span>
                <div>
                  {summary.map((item) => (
                    <button key={item.label} type="button" onClick={() => editStep(item.step)}>{item.label} <Pencil size={12} aria-hidden="true" /></button>
                  ))}
                </div>
              </div>

              <ol className="plan-result-stops">
                {plan.stops.map((stop, index) => {
                  const place = PLAN_PLACES_BY_ID.get(stop.placeId);
                  if (!place) return null;
                  const isSwapping = swappingIndex === index;
                  return (
                    <li key={stop.placeId} className={`plan-stop ${isSwapping ? 'is-swapping' : ''}`}>
                      <div className="plan-stop-marker"><b>{String(index + 1).padStart(2, '0')}</b>{stop.time && <span>{stop.time}</span>}</div>
                      <div className="plan-stop-body">
                        {place.imageUrl && <img src={place.imageUrl} alt={place.name} loading="lazy" decoding="async" />}
                        <span className="plan-stop-type">{place.type}{place.price ? ` · ${place.price}` : ''}</span>
                        <h3>{place.name}</h3>
                        {stop.why && <p>{stop.why}</p>}
                        {stop.tip && stop.source && (
                          <div className="plan-stop-tip">
                            <p><b>TIP</b>{stop.tip}</p>
                            <a href={stop.source.url} target="_blank" rel="noreferrer">Fuente: {hostname(stop.source.url)} <ArrowUpRight size={12} aria-hidden="true" /></a>
                          </div>
                        )}
                        <div className="plan-stop-links">
                          <a href={place.mapsUrl} target="_blank" rel="noreferrer">CÓMO LLEGAR <ArrowUpRight size={16} aria-hidden="true" /></a>
                          <button type="button" onClick={() => void swap(index)} disabled={swappingIndex !== null}>
                            <Shuffle size={15} aria-hidden="true" /> {isSwapping ? 'BUSCANDO…' : 'CAMBIAR PARADA'}
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
              {swapError && <p className="plan-builder-error" role="alert">{swapError}</p>}
              {plan.closing && <p className="plan-result-closing">{plan.closing}</p>}
              <div className="plan-result-actions">
                <button type="button" className="plan-builder-button" onClick={() => void generate()} disabled={swappingIndex !== null}><RefreshCw size={18} aria-hidden="true" /> OTRO PLAN</button>
                <button type="button" className="plan-builder-secondary" onClick={() => editStep(0)}><SlidersHorizontal size={18} aria-hidden="true" /> CAMBIAR OPCIONES</button>
              </div>
              <p className="plan-builder-note">Las paradas salen de la selección de Bruuk. Los tips se escriben con IA sólo a partir de la fuente enlazada; revisa horarios antes de salir.</p>
            </article>
          )}

          {(status === 'choosing' || status === 'error') && (
            <div className="plan-step">
              <div className="plan-step-top">
                <span>{isEditing ? 'AJUSTANDO TU PLAN' : `PASO ${stepIndex + 1} DE ${STEPS.length}`}</span>
                <div className="plan-step-bar" aria-hidden="true"><i style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }} /></div>
              </div>

              <div className="plan-step-body" key={step}>
                <h2 className="plan-step-question">{STEP_COPY[step].question}</h2>
                <p className="plan-step-helper">{STEP_COPY[step].helper}</p>

                {(step === 'moment' || step === 'company' || step === 'vibe') && (
                  <div className="plan-options" role="radiogroup" aria-label={STEP_COPY[step].question}>
                    {OPTIONS_FOR_STEP[step].map((option) => {
                      const selected = draft[step] === option.value;
                      return (
                        <button key={option.value} type="button" role="radio" aria-checked={selected} className={selected ? 'is-active' : ''} onClick={() => chooseSingle(step, option.value)}>
                          <strong>{option.label}</strong><span>{option.hint}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {step === 'interests' && (
                  <div className="plan-options" role="group" aria-label={STEP_COPY.interests.question}>
                    {INTEREST_OPTIONS.map((option) => {
                      const selected = draft.interests.includes(option.value);
                      const disabled = !selected && draft.interests.length >= MAX_INTERESTS;
                      return (
                        <button key={option.value} type="button" aria-pressed={selected} disabled={disabled} className={selected ? 'is-active' : ''} onClick={() => toggleInterest(option.value)}>
                          <strong>{option.label}</strong><span>{option.hint}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {step === 'budget' && (
                  <>
                    <div className="plan-options is-compact" role="radiogroup" aria-label="Presupuesto por persona">
                      {BUDGET_OPTIONS.map((option) => {
                        const selected = draft.budget === option.value;
                        return (
                          <button key={option.value} type="button" role="radio" aria-checked={selected} className={selected ? 'is-active' : ''} onClick={() => { setDraft((current) => ({ ...current, budget: option.value })); setError(''); }}>
                            <strong>{option.label}</strong><span>{option.hint}</span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="plan-step-label">PARADAS</p>
                    <div className="plan-step-chips" role="radiogroup" aria-label="Número de paradas">
                      {STOP_OPTIONS.map((value) => (
                        <button key={value} type="button" role="radio" aria-checked={draft.stops === value} className={draft.stops === value ? 'is-active' : ''} onClick={() => setDraft((current) => ({ ...current, stops: value }))}>
                          {value}
                        </button>
                      ))}
                    </div>
                    <label className="plan-step-label" htmlFor="plan-note">¿ALGO MÁS? <span>OPCIONAL</span></label>
                    <textarea
                      id="plan-note"
                      className="plan-step-note"
                      value={draft.note}
                      onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))}
                      placeholder="Ej. sin alcohol, que acepte mascotas, cerca del Centro…"
                      maxLength={MAX_NOTE_LENGTH}
                      rows={2}
                    />
                  </>
                )}
              </div>

              {error && <p className="plan-builder-error" role="alert">{error}</p>}

              <div className="plan-step-actions">
                {stepIndex > 0 && !isEditing && (
                  <button type="button" className="plan-step-back" onClick={() => goTo(stepIndex - 1)} disabled={isLoading} aria-label="Paso anterior">
                    <ChevronLeft size={22} aria-hidden="true" />
                  </button>
                )}
                {isEditing && plan && (
                  <button type="button" className="plan-builder-secondary" onClick={() => { setIsEditing(false); setError(''); setStatus('result'); }}>VOLVER AL PLAN</button>
                )}
                <button type="button" className="plan-builder-button" onClick={handleNext} disabled={isLoading}>
                  {isEditing ? <>ACTUALIZAR PLAN <RefreshCw size={18} aria-hidden="true" /></>
                    : isLastStep ? <>ARMAR MI PLAN <Sparkles size={18} aria-hidden="true" /></>
                      : <>SIGUIENTE <ArrowRight size={18} aria-hidden="true" /></>}
                </button>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default PlanBuilderPage;
