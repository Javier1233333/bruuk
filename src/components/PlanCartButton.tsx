import { Check, Plus } from 'lucide-react';
import { ROULETTE_MAX_STOPS } from '../data/planBuilder';
import { addToPlan, removeFromPlan, usePlanCart } from '../lib/planCart';
import './PlanCartBar.css';

// Botón de las tarjetas de Spots: suma el lugar a "Mi plan" o lo quita.
export function PlanCartButton({ id, name, className = '' }: { id: string; name: string; className?: string }) {
  const cart = usePlanCart();
  const inPlan = cart.includes(id);
  const full = !inPlan && cart.length >= ROULETTE_MAX_STOPS;
  return (
    <button
      type="button"
      className={`plan-cart-button${inPlan ? ' is-in' : ''} ${className}`}
      onClick={(event) => {
        event.stopPropagation();
        if (inPlan) removeFromPlan(id);
        else addToPlan(id);
      }}
      disabled={full}
      aria-pressed={inPlan}
      aria-label={inPlan ? `Quitar ${name} de mi plan` : `Agregar ${name} a mi plan`}
      title={full ? `Tu plan ya tiene ${ROULETTE_MAX_STOPS} lugares` : undefined}
    >
      {inPlan ? <Check size={15} strokeWidth={3} aria-hidden="true" /> : <Plus size={15} strokeWidth={3} aria-hidden="true" />}
      {inPlan ? 'EN TU PLAN' : 'AL PLAN'}
    </button>
  );
}
