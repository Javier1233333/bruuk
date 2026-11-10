import { useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, Check, Dices, RefreshCw, Share2, SlidersHorizontal, Sparkles } from 'lucide-react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { BruukLogo } from '../components/BruukLogo';
import type { CustomPlan } from '../data/planBuilder';
import { IS_APP_MODE } from '../lib/appMode';
import { sharePlanImage } from '../lib/sharePlanImage';
import { usePlanCatalog } from '../lib/planCatalog';
import { PlanQuestions } from './PlanQuestions';
import { PlanRoulette, type RouletteState } from './PlanRoulette';
import './PlanBuilderPage.css';

type Status = 'choosing' | 'loading' | 'result' | 'error';
type Mode = 'ruleta' | 'preguntas';
type QuestionsStage = 'inicio' | 'pasos' | 'ruta';

const INITIAL_ROULETTE: RouletteState = { moment: 'sorpresa', zone: 'toda', interests: [], count: 3, slots: [] };

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
  const catalog = usePlanCatalog();
  const { city = 'guadalajara' } = useParams();
  const [status, setStatus] = useState<Status>('choosing');
  const [error, setError] = useState('');
  const [plan, setPlan] = useState<CustomPlan | null>(null);
  // Las 5 preguntas arman la ruta en el navegador; aquí sólo se sabe en qué van.
  const [questionsStage, setQuestionsStage] = useState<QuestionsStage>('inicio');
  const [mode, setMode] = useState<Mode>('ruleta');
  const [roulette, setRoulette] = useState<RouletteState>(INITIAL_ROULETTE);
  // Lo que salió en la ruleta al pedir el plan, para marcar qué paradas cambió la IA.
  const [spunIds, setSpunIds] = useState<string[]>([]);
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState('');

  if (city !== 'guadalajara') return <Navigate to="/guadalajara/arma-tu-plan" replace />;

  const isLoading = status === 'loading';

  const generateFromRoulette = async () => {
    const placeIds = roulette.slots.map((slot) => slot.placeId);
    setStatus('loading');
    setError('');
    setSpunIds(placeIds);
    try {
      const result = await requestPlan({
        mode: 'roulette',
        moment: roulette.moment,
        zone: roulette.zone,
        placeIds,
        locked: roulette.slots.filter((slot) => slot.locked).map((slot) => slot.placeId),
      });
      if (!result.plan) throw new Error('No pudimos armar tu plan.');
      setPlan(result.plan as CustomPlan);
      setStatus('result');
      window.scrollTo({ top: 0, behavior: 'auto' });
    } catch (generateError) {
      setStatus('error');
      setError(generateError instanceof Error ? generateError.message : 'No pudimos armar tu plan. Inténtalo otra vez.');
    }
  };

  // Regresa a la ruleta con las paradas finales del plan, conservando lo que estaba fijo.
  const backToRoulette = () => {
    if (plan) {
      const locked = new Set(roulette.slots.filter((slot) => slot.locked).map((slot) => slot.placeId));
      setRoulette((current) => ({ ...current, count: plan.stops.length, slots: plan.stops.map((stop) => ({ placeId: stop.placeId, locked: locked.has(stop.placeId) })) }));
    }
    setError('');
    setStatus('choosing');
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    setStatus('choosing');
  };

  const share = async () => {
    if (!plan) return;
    setIsSharing(true);
    setShareError('');
    try {
      await sharePlanImage(plan);
    } catch {
      setShareError('No pudimos crear la imagen. Inténtalo otra vez.');
    } finally {
      setIsSharing(false);
    }
  };

  const inProgress = mode === 'ruleta' ? roulette.slots.length > 0 || status !== 'choosing' : questionsStage !== 'inicio';
  const showSwitch = mode === 'ruleta' ? status === 'choosing' || status === 'error' : questionsStage !== 'ruta';

  return (
    <div className={`plan-builder-page ${inProgress ? 'is-in-progress' : ''}`}>
      <header className="plan-builder-nav">
        <Link to="/" aria-label="Ir al inicio"><BruukLogo width={96} /></Link>
        <span>/ ARMA TU PLAN · GDL</span>
        {/* En el modo app se regresa con el menú inferior. */}
        {IS_APP_MODE ? <span className="plan-builder-nav-app">{mode === 'ruleta' ? '/ RULETA' : '/ 5 PREGUNTAS'}</span> : <Link to="/guadalajara"><ArrowLeft size={17} aria-hidden="true" /> REGRESAR</Link>}
      </header>

      <main className="plan-builder-main">
        <section className="plan-builder-copy" aria-labelledby="plan-builder-title">
          <span className="plan-builder-kicker">{mode === 'ruleta' ? '/ RULETA DE SPOTS' : '/ PLANES A TU MEDIDA'}</span>
          {mode === 'ruleta' ? (
            <>
              <h1 id="plan-builder-title">GIRA. <em>SAL.</em></h1>
              <p>{catalog.places.length} lugares. Gira, fija los que te laten y sal.</p>
            </>
          ) : (
            <>
              <h1 id="plan-builder-title">ELIGE. <em>SAL.</em></h1>
              <p>Cinco preguntas y armamos una ruta de tres paradas con lugares reales de la guía. Nada de rankings pagados ni lugares inventados.</p>
            </>
          )}
          <Link className="plan-builder-routes" to="/guadalajara/rutas">O ELIGE UNA RUTA YA ARMADA <ArrowRight size={15} aria-hidden="true" /></Link>
        </section>

        <section className={`plan-builder-card${mode === 'preguntas' && questionsStage === 'ruta' ? ' is-route' : ''}`} aria-live="polite">
          {showSwitch && (
            <div className="plan-mode-switch" role="tablist" aria-label="Cómo armar tu plan">
              <button type="button" role="tab" aria-selected={mode === 'ruleta'} className={mode === 'ruleta' ? 'is-active' : ''} onClick={() => switchMode('ruleta')}><Dices size={16} aria-hidden="true" /> RULETA</button>
              <button type="button" role="tab" aria-selected={mode === 'preguntas'} className={mode === 'preguntas' ? 'is-active' : ''} onClick={() => switchMode('preguntas')}><SlidersHorizontal size={16} aria-hidden="true" /> 5 PREGUNTAS</button>
            </div>
          )}

          {mode === 'preguntas' && <PlanQuestions places={catalog.places} getPlace={catalog.getPlace} onStage={setQuestionsStage} />}

          {mode === 'ruleta' && status === 'loading' && (
            <div className="plan-builder-loading" role="status">
              <Sparkles size={34} aria-hidden="true" />
              <span>/ ARMANDO TU PLAN</span>
              <h2>BUSCANDO EN<br />LA GUÍA…</h2>
              <p>Buscamos qué une a los lugares que salieron en la ruleta. Puede tardar unos segundos.</p>
              <div className="plan-builder-loading-bar" aria-hidden="true"><i /></div>
            </div>
          )}

          {mode === 'ruleta' && status === 'result' && plan && (
            <article className="plan-result">
              <span className="plan-result-kicker"><Check size={16} aria-hidden="true" /> TU PLAN</span>
              <h2>{plan.title}</h2>
              {plan.thread && (
                <p className="plan-result-thread"><b>EL HILO</b>{plan.thread}</p>
              )}
              {plan.intro && <p className="plan-result-intro">{plan.intro}</p>}

              <ol className="plan-result-stops">
                {plan.stops.map((stop, index) => {
                  const place = catalog.getPlace(stop.placeId);
                  if (!place) return null;
                  return (
                    <li key={stop.placeId} className="plan-stop">
                      <div className="plan-stop-marker"><b>{String(index + 1).padStart(2, '0')}</b>{stop.time && <span>{stop.time}</span>}</div>
                      <div className="plan-stop-body">
                        {place.imageUrl && <img src={place.imageUrl} alt={place.name} loading="lazy" decoding="async" />}
                        <span className="plan-stop-type">{place.type}{place.price ? ` · ${place.price}` : ''}</span>
                        {spunIds.length > 0 && !spunIds.includes(stop.placeId) && <span className="plan-stop-swapped">LA IA LA CAMBIÓ PARA QUE ENCAJE</span>}
                        <h3>{place.name}</h3>
                        {stop.why && <p>{stop.why}</p>}
                        {place.tip && (
                          <div className="plan-stop-tip">
                            <p><b>VE POR</b>{place.tip}</p>
                            <span>Recomendación de la guía Bruuk</span>
                          </div>
                        )}
                        <div className="plan-stop-links">
                          <a href={place.mapsUrl} target="_blank" rel="noreferrer">CÓMO LLEGAR <ArrowUpRight size={16} aria-hidden="true" /></a>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
              {plan.closing && <p className="plan-result-closing">{plan.closing}</p>}
              <button type="button" className="plan-builder-button plan-result-share" onClick={() => void share()} disabled={isSharing}>
                <Share2 size={18} aria-hidden="true" /> {isSharing ? 'CREANDO IMAGEN…' : 'COMPARTIR PLAN'}
              </button>
              {shareError && <p className="plan-builder-error" role="alert">{shareError}</p>}
              <div className="plan-result-actions">
                <button type="button" className="plan-builder-button" onClick={backToRoulette}><Dices size={18} aria-hidden="true" /> VOLVER A GIRAR</button>
                <button type="button" className="plan-builder-secondary" onClick={() => void generateFromRoulette()}><RefreshCw size={18} aria-hidden="true" /> OTRO HILO, MISMOS LUGARES</button>
              </div>
              <p className="plan-builder-note">La IA ordena el plan; los lugares y las recomendaciones salen de la guía Bruuk. Revisa horarios antes de salir.</p>
            </article>
          )}

          {mode === 'ruleta' && (status === 'choosing' || status === 'error') && (
            <>
              {error && <p className="plan-builder-error plan-roulette-error" role="alert">{error}</p>}
              <PlanRoulette state={roulette} onChange={setRoulette} onGenerate={() => void generateFromRoulette()} disabled={isLoading} />
            </>
          )}
        </section>
      </main>
    </div>
  );
}

export default PlanBuilderPage;
