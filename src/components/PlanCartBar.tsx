import { ArrowRight, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROULETTE_MIN_STOPS } from '../data/planBuilder';
import { clearPlan, usePlanCart } from '../lib/planCart';
import './PlanCartBar.css';

// Barra flotante en Spots: cuántos lugares llevas y el paso a armar el plan.
export function PlanCartBar() {
  const cart = usePlanCart();
  if (cart.length === 0) return null;
  const ready = cart.length >= ROULETTE_MIN_STOPS;
  return (
    <div className="plan-cart-bar" role="region" aria-label="Mi plan">
      <button type="button" className="plan-cart-bar-clear" onClick={clearPlan} aria-label="Vaciar mi plan"><X size={18} aria-hidden="true" /></button>
      <span className="plan-cart-bar-count">
        <b>TU PLAN · {cart.length} {cart.length === 1 ? 'LUGAR' : 'LUGARES'}</b>
        {ready ? 'Ya puedes armarlo' : 'Agrega uno más para armarlo'}
      </span>
      <Link className="plan-cart-bar-go" to="/guadalajara/arma-tu-plan">ARMAR <ArrowRight size={17} aria-hidden="true" /></Link>
    </div>
  );
}
