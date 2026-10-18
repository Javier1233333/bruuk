import { useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronLeft, RefreshCw, SlidersHorizontal, Sparkles } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { BruukLogo } from '../components/BruukLogo';
import {
  BUDGET_OPTIONS,
  COMPANY_OPTIONS,
  INTEREST_OPTIONS,
  MAX_INTERESTS,
  MOMENT_OPTIONS,
  PLAN_PLACES_BY_ID,
  STOP_OPTIONS,
  VIBE_OPTIONS,
  labelFor,
  type CustomPlan,
  type PlanChoices,
  type PlanInterest,
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
  budget: { question: '¿Cuánto quieres gastar?', helper: 'Por persona, y cuántas paradas quieres hacer.' },
};

const OPTIONS_FOR_STEP = {
  moment: MOMENT_OPTIONS,
  company: COMPANY_OPTIONS,
  vibe: VIBE_OPTIONS,
} as const;

type SingleStep = keyof typeof OPTIONS_FOR_STEP;
type Draft = Partial<Omit<PlanChoices, 'interests'>> & { interests: PlanInterest[] };

export function PlanBuilderPage() {
  const { city = 'guadalajara' } = useParams();
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<Draft>({ interests: [], stops: 3 });
  const [status, setStatus] = useState<Status>('choosing');
  const [error, setError] = useState('');
  const [plan, setPlan] = useState<CustomPlan | null>(null);

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
    try {
      const response = await fetch('/api/custom-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.plan) throw new Error(result.error || 'No pudimos armar tu plan.');
      setPlan(result.plan as CustomPlan);
      setStatus('result');
      window.scrollTo({ top: 0, behavior: 'auto' });
    } catch (generateError) {
      setStatus('error');
      setError(generateError instanceof Error ? generateError.message : 'No pudimos armar tu plan. Inténtalo otra vez.');
    }
  };

  const handleNext = () => {
    if (!isStepComplete(step)) {
      setError(step === 'interests' ? 'Elige al menos una opción.' : 'Elige una opción para seguir.');
      return;
    }
    if (isLastStep) {
      void generate();
      return;
    }
    goTo(stepIndex + 1);
  };

  const editChoices = () => {
    setStatus('choosing');
    setPlan(null);
    goTo(0);
  };

  const summary = [
    draft.moment && labelFor(MOMENT_OPTIONS, draft.moment),
    draft.company && labelFor(COMPANY_OPTIONS, draft.company),
    ...draft.interests.map((interest) => labelFor(INTEREST_OPTIONS, interest)),
    draft.vibe && labelFor(VIBE_OPTIONS, draft.vibe),
    draft.budget && labelFor(BUDGET_OPTIONS, draft.budget),
  ].filter(Boolean);

  return (
    <div className={`plan-builder-page ${stepIndex > 0 || status !== 'choosing' ? 'is-in-progress' : ''}`}>
      <header className="plan-builder-nav">
        <Link to="/" aria-label="Ir al inicio"><BruukLogo width={96} /></Link>
        <span>/ ARMA TU PLAN · GDL</span>
        <Link to="/guadalajara"><ArrowLeft size={17} aria-hidden="true" /> REGRESAR</Link>
      </header>

      <main className="plan-builder-main">
        <section className="plan-builder-copy" aria-labelledby="plan-builder-title">
          <span className="plan-builder-kicker">/ PLANES A TU MEDIDA</span>
          <h1 id="plan-builder-title">ELIGE. <em>SAL.</em></h1>
          <p>Cinco preguntas y armamos una ruta con lugares reales de la guía. Nada de rankings pagados ni lugares inventados.</p>
          {summary.length > 0 && (
            <ul className="plan-builder-summary" aria-label="Tus elecciones">
              {summary.map((item) => <li key={item}>{item}</li>)}
            </ul>
          )}
        </section>

        <section className="plan-builder-card" aria-live="polite">
          {status === 'loading' && (
            <div className="plan-builder-loading" role="status">
              <Sparkles size={34} aria-hidden="true" />
              <span>/ ARMANDO TU PLAN</span>
              <h2>BUSCANDO EN<br />LA GUÍA…</h2>
              <p>Elegimos entre los lugares de Bruuk los que mejor encajan con lo que pediste.</p>
              <div className="plan-builder-loading-bar" aria-hidden="true"><i /></div>
            </div>
          )}

          {status === 'result' && plan && (
            <article className="plan-result">
              <span className="plan-result-kicker"><Check size={16} aria-hidden="true" /> TU PLAN</span>
              <h2>{plan.title}</h2>
              {plan.intro && <p className="plan-result-intro">{plan.intro}</p>}
              <ol className="plan-result-stops">
                {plan.stops.map((stop, index) => {
                  const place = PLAN_PLACES_BY_ID.get(stop.placeId);
                  if (!place) return null;
                  return (
                    <li key={stop.placeId} className="plan-stop">
                      <div className="plan-stop-marker"><b>{String(index + 1).padStart(2, '0')}</b>{stop.time && <span>{stop.time}</span>}</div>
                      <div className="plan-stop-body">
                        {place.imageUrl && <img src={place.imageUrl} alt={place.name} loading="lazy" decoding="async" />}
                        <span className="plan-stop-type">{place.type}{place.price ? ` · ${place.price}` : ''}</span>
                        <h3>{place.name}</h3>
                        {stop.why && <p>{stop.why}</p>}
                        {stop.tip && <p className="plan-stop-tip"><b>TIP</b>{stop.tip}</p>}
                        <a href={place.mapsUrl} target="_blank" rel="noreferrer">CÓMO LLEGAR <ArrowUpRight size={16} aria-hidden="true" /></a>
                      </div>
                    </li>
                  );
                })}
              </ol>
              {plan.closing && <p className="plan-result-closing">{plan.closing}</p>}
              <div className="plan-result-actions">
                <button type="button" className="plan-builder-button" onClick={() => void generate()}><RefreshCw size={18} aria-hidden="true" /> OTRO PLAN</button>
                <button type="button" className="plan-builder-secondary" onClick={editChoices}><SlidersHorizontal size={18} aria-hidden="true" /> CAMBIAR OPCIONES</button>
              </div>
              <p className="plan-builder-note">Plan sugerido con IA a partir de la selección de Bruuk. Revisa horarios antes de salir.</p>
            </article>
          )}

          {(status === 'choosing' || status === 'error') && (
            <div className="plan-step">
              <div className="plan-step-top">
                <span>PASO {stepIndex + 1} DE {STEPS.length}</span>
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
                  </>
                )}
              </div>

              {error && <p className="plan-builder-error" role="alert">{error}</p>}

              <div className="plan-step-actions">
                {stepIndex > 0 && (
                  <button type="button" className="plan-step-back" onClick={() => goTo(stepIndex - 1)} disabled={isLoading} aria-label="Paso anterior">
                    <ChevronLeft size={22} aria-hidden="true" />
                  </button>
                )}
                <button type="button" className="plan-builder-button" onClick={handleNext} disabled={isLoading}>
                  {isLastStep ? <>ARMAR MI PLAN <Sparkles size={18} aria-hidden="true" /></> : <>SIGUIENTE <ArrowRight size={18} aria-hidden="true" /></>}
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
