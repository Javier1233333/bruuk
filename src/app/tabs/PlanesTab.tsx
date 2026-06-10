import { useState } from 'react';
import { useSpots } from '../hooks/useSpots';
import { usePlans } from '../hooks/usePlans';
import { PlanBuilder } from '../components/PlanBuilder';
import { PlanCard } from '../components/PlanCard';
import { TemplateCard } from '../components/TemplateCard';
import type { PlanTemplate } from '../components/TemplateCard';
import './PlanesTab.css';

const TEMPLATES: PlanTemplate[] = [
  {
    id: 'tpl_1',
    categoria: 'Gastronomía',
    color: '#f59e0b',
    titulo: 'Cena ciega',
    descripcion: 'Aparece en un restaurante sin saber el menú. Sin planear, sin expectativas.',
    duracion: '2–3 hrs',
    nivel: 'Espontáneo',
    suggestedName: 'Cena ciega',
    suggestedDurationMin: 120,
  },
  {
    id: 'tpl_2',
    categoria: 'Arte',
    color: '#ec4899',
    titulo: 'Ruta de galerías indie',
    descripcion: 'Elige una colonia, entra a cada galería pequeña que encuentres.',
    duracion: '3–4 hrs',
    nivel: 'Cultural',
    suggestedName: 'Ruta de galerías',
    suggestedDurationMin: 60,
  },
  {
    id: 'tpl_3',
    categoria: 'Social',
    color: '#10b981',
    titulo: 'Azotea de alguien',
    descripcion: 'Organiza una reunión en una azotea con gente que no conoces bien.',
    duracion: 'Toda la noche',
    nivel: 'Comunidad',
    suggestedName: 'Azotea social',
    suggestedDurationMin: 180,
  },
  {
    id: 'tpl_4',
    categoria: 'Adrenalina',
    color: '#8b7cf6',
    titulo: 'Plan de último minuto',
    descripcion: 'Abre el mapa, elige el punto más interesante a 20 minutos, ve ahora.',
    duracion: 'Lo que sea',
    nivel: 'Impulsivo',
    suggestedName: 'Último minuto',
    suggestedDurationMin: 60,
  },
];

export function PlanesTab() {
  const { spots, loading: spotsLoading } = useSpots();
  const { plans, loading: plansLoading, savePlan, deletePlan } = usePlans();

  // Estado para pre-cargar nombre desde plantilla y resetear el builder
  const [builderKey, setBuilderKey] = useState(0);
  const [templateName, setTemplateName] = useState('');

  const handleUseTemplate = (template: PlanTemplate) => {
    setTemplateName(template.suggestedName);
    setBuilderKey((k) => k + 1);
    // Scroll al builder
    document.querySelector('.plan-builder')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDeletePlan = async (id: string) => {
    await deletePlan(id);
  };

  return (
    <section className="planes-tab">
      <span className="planes-tab__tag">/ Planes</span>
      <h2 className="planes-tab__title">Ideas para salir hoy.</h2>
      <div className="planes-tab__separator" />

      {/* Constructor de plan */}
      <PlanBuilder
        key={builderKey}
        spots={spots}
        initialName={templateName}
        onSave={savePlan}
      />

      {/* Mis planes */}
      <div className="planes-tab__section-separator" />
      <span className="planes-tab__section-label">/ MIS PLANES</span>

      {plansLoading && <p className="planes-tab__loading">CARGANDO PLANES...</p>}
      {!plansLoading && plans.length === 0 && (
        <p className="planes-tab__empty">AÚN NO TIENES PLANES GUARDADOS</p>
      )}
      {!plansLoading && plans.map((plan) => (
        <PlanCard key={plan.id} plan={plan} onDelete={handleDeletePlan} />
      ))}

      {/* Plantillas curadas */}
      <div className="planes-tab__section-separator" />
      <span className="planes-tab__section-label">/ PARA RECONECTAR</span>

      {spotsLoading ? (
        <p className="planes-tab__loading">CARGANDO...</p>
      ) : (
        <div className="planes-tab__templates-grid">
          {TEMPLATES.map((tpl) => (
            <TemplateCard key={tpl.id} template={tpl} onUse={handleUseTemplate} />
          ))}
        </div>
      )}
    </section>
  );
}
