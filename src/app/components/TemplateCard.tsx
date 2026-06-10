import { ArrowRight } from 'lucide-react';
import './TemplateCard.css';

export interface PlanTemplate {
  id: string;
  categoria: string;
  color: string;
  titulo: string;
  descripcion: string;
  duracion: string;
  nivel: string;
  suggestedName: string;
  suggestedDurationMin: number;
}

interface TemplateCardProps {
  template: PlanTemplate;
  onUse: (template: PlanTemplate) => void;
}

export function TemplateCard({ template, onUse }: TemplateCardProps) {
  return (
    <div
      className="template-card"
      style={{ borderTop: `3px solid ${template.color}` }}
    >
      <div className="template-card__header">
        <div className="template-card__chip">
          <span
            className="template-card__chip-dot"
            style={{ backgroundColor: template.color }}
          />
          {template.categoria}
        </div>
      </div>
      <h3 className="template-card__title">{template.titulo}</h3>
      <p className="template-card__description">{template.descripcion}</p>
      <p className="template-card__meta">{template.duracion} · {template.nivel}</p>
      <button className="template-card__use-btn" onClick={() => onUse(template)}>
        USAR COMO PLANTILLA <ArrowRight size={12} />
      </button>
    </div>
  );
}
