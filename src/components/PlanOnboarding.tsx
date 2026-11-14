import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Dices, Footprints, ListPlus, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { markPlanOnboardingSeen as markSeen } from '../lib/planOnboarding';

/* ============================================================
   Onboarding de "Arma tu plan": tres pantallas cortas la primera
   vez (gira, junta, sal). Se recuerda en el teléfono y se puede
   volver a abrir con "¿Cómo funciona?".
   ============================================================ */

type Step = { icon: LucideIcon; title: string; accent: string; body: React.ReactNode };

const STEPS: Step[] = [
  { icon: Dices, title: 'GIRA', accent: '.', body: 'Dos carretes: zona y qué se antoja. Toca uno para dejarlo fijo y vuelve a girar.' },
  { icon: ListPlus, title: 'JUNTA', accent: '.', body: <>Agrega lo que te late, busca un lugar o tócale <b>“+ Al plan”</b> en Spots y Rack. Todo cae en <b>Mi plan</b>.</> },
  { icon: Footprints, title: 'SAL', accent: '.', body: <>Con 2 a 5 paradas, <b>ARMAR PLAN</b> las ordena y les pone hilo. ¿Sin ganas de armar? Ve las <Link to="/guadalajara/rutas">rutas listas</Link>.</> },
];

export function PlanOnboarding({ onClose }: { onClose: () => void }) {
  const [index, setIndex] = useState(0);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);

  const close = () => {
    markSeen();
    closeRef.current();
  };

  // Modal: sin scroll del fondo y Escape lo cierra.
  useEffect(() => {
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        markSeen();
        closeRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => primaryRef.current?.focus(), [index]);

  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;
  const Icon = step.icon;

  return (
    <div className="plan-onboarding" role="dialog" aria-modal="true" aria-labelledby="plan-onboarding-title">
      <button type="button" className="plan-onboarding-backdrop" onClick={close} aria-label="Cerrar" tabIndex={-1} />
      <div className="plan-onboarding-card">
        <div className="plan-onboarding-top">
          <span>/ CÓMO FUNCIONA · {index + 1} DE {STEPS.length}</span>
          {!isLast && <button type="button" className="plan-onboarding-skip" onClick={close}>SALTAR</button>}
        </div>
        <div className="plan-onboarding-step" key={index}>
          <span className="plan-onboarding-icon"><Icon size={30} strokeWidth={2} aria-hidden="true" /></span>
          <h2 id="plan-onboarding-title">{step.title}<em>{step.accent}</em></h2>
          <p>{step.body}</p>
        </div>
        <div className="plan-onboarding-dots" aria-hidden="true">
          {STEPS.map((item, position) => <span key={item.title} className={position <= index ? 'is-on' : ''} />)}
        </div>
        <div className="plan-onboarding-actions">
          {index > 0 ? <button type="button" className="plan-builder-secondary" onClick={() => setIndex(index - 1)}>ATRÁS</button> : <span />}
          <button ref={primaryRef} type="button" className="plan-builder-button" onClick={() => (isLast ? close() : setIndex(index + 1))}>
            {isLast ? 'EMPEZAR' : 'SIGUIENTE'} <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
