import { useEffect, useState } from 'react';
import { ArrowRight, ChevronLeft, RefreshCw, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ItineraryCard } from '../components/ItineraryCard';
import type { PlanPlace } from '../data/planBuilder';
import type { Itinerary } from '../lib/itinerary';
import { ROUTE_QUESTIONS, answerLabel, buildRoute, rerollStop, type RouteAnswers } from '../lib/routeGenerator';

/* ============================================================
   Cinco preguntas, una ruta: tarjetas grandes que avanzan solas
   al tocar. Con la quinta respuesta se arma la ruta de 3 paradas
   al instante (sin esperar a nadie) y cada parada se puede
   cambiar por separado.
   ============================================================ */

type Props = {
  places: PlanPlace[];
  getPlace: (id: string) => PlanPlace | undefined;
  // Avisa a la página si ya hay ruta (oculta el selector Ruleta / Preguntas) o si va a medias.
  onStage: (stage: 'inicio' | 'pasos' | 'ruta') => void;
};

const TOTAL = ROUTE_QUESTIONS.length;
const isComplete = (answers: Partial<RouteAnswers>): answers is RouteAnswers => ROUTE_QUESTIONS.every((question) => answers[question.id]);

export function PlanQuestions({ places, getPlace, onStage }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<RouteAnswers>>({});
  const [route, setRoute] = useState<Itinerary | null>(null);
  const [error, setError] = useState('');
  // Lugares ya mostrados, para que "otro plan" y "cambiar parada" no repitan.
  const [seen, setSeen] = useState<string[]>([]);

  const stage = route ? 'ruta' : stepIndex > 0 ? 'pasos' : 'inicio';
  useEffect(() => onStage(stage), [stage, onStage]);

  const generate = (complete: RouteAnswers, avoid: string[]) => {
    const next = buildRoute(complete, places, avoid);
    if (!next) {
      setError('No encontramos tres paradas con esa combinación. Cambia la zona o el ritmo.');
      return;
    }
    setError('');
    setRoute(next);
    setSeen([...avoid, ...next.stops.map((stop) => stop.placeId)]);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const choose = (value: string) => {
    const question = ROUTE_QUESTIONS[stepIndex];
    const next = { ...answers, [question.id]: value } as Partial<RouteAnswers>;
    setAnswers(next);
    setError('');
    // Si ya estaba todo contestado (se regresó a cambiar una respuesta), se rearma de una vez.
    const wasComplete = isComplete(answers);
    // Una sola opción por pregunta: se avanza solo, y la última arma la ruta.
    window.setTimeout(() => {
      if (isComplete(next) && (wasComplete || stepIndex === TOTAL - 1)) generate(next, []);
      else if (stepIndex < TOTAL - 1) setStepIndex((current) => (current === stepIndex ? stepIndex + 1 : current));
    }, 140);
  };

  const reroll = (index: number) => {
    if (!route || !isComplete(answers)) return;
    const next = rerollStop(answers, places, route, index, seen);
    if (!next) {
      setError('No hay otra parada que encaje ahí. Prueba con otro plan.');
      return;
    }
    setError('');
    setRoute(next);
    setSeen((current) => [...current, next.stops[index].placeId]);
  };

  const editAnswers = (index = 0) => {
    setRoute(null);
    setError('');
    setStepIndex(index);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  if (route && isComplete(answers)) {
    return (
      <div className="plan-route">
        <ul className="plan-route-answers" aria-label="Tus respuestas (toca una para cambiarla)">
          {ROUTE_QUESTIONS.map((question, index) => (
            <li key={question.id}>
              <button type="button" onClick={() => editAnswers(index)}>{answerLabel(question.id, answers[question.id])}</button>
            </li>
          ))}
        </ul>
        <ItineraryCard itinerary={route} getPlace={getPlace} onReroll={reroll} heading="h2" />
        {error && <p className="plan-builder-error" role="alert">{error}</p>}
        <div className="plan-result-actions">
          <button type="button" className="plan-builder-button" onClick={() => generate(answers, seen)}><RefreshCw size={18} aria-hidden="true" /> OTRO PLAN</button>
          <button type="button" className="plan-builder-secondary" onClick={() => editAnswers(0)}><SlidersHorizontal size={18} aria-hidden="true" /> CAMBIAR RESPUESTAS</button>
        </div>
        <Link className="plan-route-more" to="/guadalajara/rutas">VER RUTAS CURADAS Y GUARDADOS <ArrowRight size={16} aria-hidden="true" /></Link>
        <p className="plan-builder-note">Lugares y recomendaciones de la guía Bruuk. Los tiempos son estimados; revisa horarios antes de salir.</p>
      </div>
    );
  }

  const question = ROUTE_QUESTIONS[stepIndex];
  return (
    <div className="plan-step">
      <div className="plan-step-top">
        <span>PREGUNTA {stepIndex + 1} DE {TOTAL}</span>
        <div className="plan-step-bar" aria-hidden="true"><i style={{ width: `${((stepIndex + 1) / TOTAL) * 100}%` }} /></div>
      </div>

      <div className="plan-step-body" key={question.id}>
        <h2 className="plan-step-question">{question.question}</h2>
        <div className={`plan-options${question.options.length === 3 ? ' is-stacked' : ''}`} role="radiogroup" aria-label={question.question}>
          {question.options.map((option) => {
            const selected = answers[question.id] === option.value;
            return (
              <button key={option.value} type="button" role="radio" aria-checked={selected} className={selected ? 'is-active' : ''} onClick={() => choose(option.value)}>
                <strong>{option.label}</strong><span>{option.hint}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && <p className="plan-builder-error" role="alert">{error}</p>}

      <div className="plan-step-actions">
        {stepIndex > 0 && (
          <button type="button" className="plan-step-back" onClick={() => { setError(''); setStepIndex(stepIndex - 1); }} aria-label="Pregunta anterior">
            <ChevronLeft size={22} aria-hidden="true" />
          </button>
        )}
        <p className="plan-step-hint">Toca una opción y seguimos. Menos de 20 segundos.</p>
      </div>
    </div>
  );
}
