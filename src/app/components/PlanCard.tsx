import { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import type { Plan } from '../hooks/usePlans';
import './PlanCard.css';

interface PlanCardProps {
  plan: Plan;
  onDelete: (id: string) => void;
}

interface StopPreview {
  spot_id: string;
  spot_name: string;
}

export function PlanCard({ plan, onDelete }: PlanCardProps) {
  const [expanded, setExpanded] = useState(false);
  const stops = plan.stops as StopPreview[];

  return (
    <div className="plan-card-app">
      <div className="plan-card-app__header">
        <h3 className="plan-card-app__name">{plan.name}</h3>
        <button
          className="plan-card-app__delete-btn"
          onClick={() => onDelete(plan.id)}
          aria-label={`Eliminar plan ${plan.name}`}
        >
          <X size={14} />
        </button>
      </div>

      <p className="plan-card-app__meta">
        {plan.start_time} · {stops.length} {stops.length === 1 ? 'parada' : 'paradas'}
      </p>

      <div className="plan-card-app__stops-preview">
        {stops.map((stop, i) => (
          <span key={stop.spot_id + i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {i > 0 && <span className="plan-card-app__stop-arrow">→</span>}
            <span className="plan-card-app__stop-name">{stop.spot_name}</span>
          </span>
        ))}
      </div>

      {expanded && (
        <div style={{ marginBottom: 12 }}>
          {stops.map((stop, i) => (
            <div key={stop.spot_id + i} style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: 'var(--rack-font-label)',
              color: 'var(--rack-text-muted)',
              padding: '4px 0',
            }}>
              {i + 1}. {stop.spot_name}
            </div>
          ))}
        </div>
      )}

      <div className="plan-card-app__footer">
        <button
          className="plan-card-app__view-btn"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? 'OCULTAR' : 'VER ITINERARIO'}
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}
