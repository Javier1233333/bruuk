import { useState } from 'react';
import { Plus } from 'lucide-react';
import type { Spot } from '../hooks/useSpots';
import type { PlanStop } from '../hooks/usePlans';
import { SpotPicker } from './SpotPicker';
import { PlanTimeline } from './PlanTimeline';
import type { BuilderStop } from './PlanTimeline';
import { estimateTravelMin } from '../utils/haversine';
import './PlanBuilder.css';

interface PlanBuilderProps {
  spots: Spot[];
  initialName?: string;
  initialStops?: BuilderStop[];
  onSave: (plan: { name: string; start_time: string; stops: PlanStop[] }) => Promise<{ ok: boolean; error?: string }>;
}

const MAX_STOPS = 6;
const DEFAULT_TIME = '18:00';
const DEFAULT_DURATION = 60;

function builderStopToPlanStop(stop: BuilderStop): PlanStop {
  return {
    spot_id: stop.spot_id,
    spot_name: stop.spot_name,
    duration_min: stop.duration_min,
    travel_min: stop.travel_min,
    travel_mode: stop.travel_mode,
    maps_link: stop.maps_link,
  };
}

export function PlanBuilder({ spots, initialName = '', initialStops = [], onSave }: PlanBuilderProps) {
  const [name, setName] = useState(initialName);
  const [startTime, setStartTime] = useState(DEFAULT_TIME);
  const [stops, setStops] = useState<BuilderStop[]>(initialStops);
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleAddSpots = (selected: Spot[]) => {
    setStops((prev) => {
      const combined = [...prev];
      for (const spot of selected) {
        if (combined.length >= MAX_STOPS) break;
        const prevSpot = combined[combined.length - 1];
        const travelMin = prevSpot?.coordinates && spot.coordinates
          ? estimateTravelMin(prevSpot.coordinates, spot.coordinates, 'walk') ?? 15
          : 15;

        combined.push({
          spot_id: spot.id,
          spot_name: spot.name,
          spot_color: spot.colorAccent,
          spot_price: spot.price,
          duration_min: DEFAULT_DURATION,
          travel_min: combined.length === 0 ? 0 : travelMin,
          travel_mode: 'walk',
          maps_link: spot.mapsLink,
          coordinates: spot.coordinates,
        });
      }
      return combined;
    });
    setShowPicker(false);
  };

  const handleRemoveStop = (index: number) => {
    setStops((prev) => {
      const next = prev.filter((_, i) => i !== index);
      // Recalcular travel_min del siguiente stop si hay cambio
      if (index > 0 && index < next.length) {
        const prevS = next[index - 1];
        const currS = next[index];
        if (prevS.coordinates && currS.coordinates) {
          next[index] = {
            ...currS,
            travel_min: estimateTravelMin(prevS.coordinates, currS.coordinates, currS.travel_mode) ?? currS.travel_min,
          };
        }
      } else if (index === 0 && next.length > 0) {
        // Si se elimina el primero, el nuevo primero tiene travel_min = 0
        next[0] = { ...next[0], travel_min: 0 };
      }
      return next;
    });
  };

  const handleDurationChange = (index: number, min: number) => {
    setStops((prev) => prev.map((s, i) => i === index ? { ...s, duration_min: min } : s));
  };

  const handleTravelChange = (index: number, min: number) => {
    setStops((prev) => prev.map((s, i) => i === index ? { ...s, travel_min: min } : s));
  };

  const handleTravelModeToggle = (index: number) => {
    setStops((prev) => prev.map((s, i) => {
      if (i !== index) return s;
      const newMode: 'walk' | 'drive' = s.travel_mode === 'walk' ? 'drive' : 'walk';
      const prevSpot = prev[i - 1];
      const newTravelMin = (prevSpot?.coordinates && s.coordinates)
        ? (estimateTravelMin(prevSpot.coordinates, s.coordinates, newMode) ?? s.travel_min)
        : s.travel_min;
      return { ...s, travel_mode: newMode, travel_min: newTravelMin };
    }));
  };

  const handleSave = async () => {
    if (!name.trim() || stops.length === 0 || saving) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    const result = await onSave({
      name: name.trim(),
      start_time: startTime,
      stops: stops.map(builderStopToPlanStop),
    });

    if (result.ok) {
      setSaveSuccess(true);
      setName('');
      setStops([]);
      setStartTime(DEFAULT_TIME);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setSaveError(result.error ?? 'Error al guardar');
    }
    setSaving(false);
  };

  const existingSpotIds = stops.map((s) => s.spot_id);

  return (
    <>
      <div className="plan-builder">
        <span className="plan-builder__section-tag">/ Construir Plan</span>

        {/* Nombre del plan */}
        <input
          className="plan-builder__name-input"
          type="text"
          placeholder="Nombre de tu plan"
          value={name}
          onChange={(e) => setName(e.target.value.slice(0, 60))}
          maxLength={60}
          aria-label="Nombre del plan"
        />

        {/* Hora de inicio */}
        <div className="plan-builder__time-field">
          <label className="plan-builder__time-label" htmlFor="plan-start-time">
            Hora de inicio
          </label>
          <input
            id="plan-start-time"
            className="plan-builder__time-input"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>

        {/* Itinerario */}
        <div className="plan-builder__stops-header">
          <span className="plan-builder__stops-title">
            SPOTS DEL PLAN ({stops.length}/{MAX_STOPS})
          </span>
        </div>

        <div className="plan-builder__separator" />

        {stops.length > 0 && (
          <PlanTimeline
            stops={stops}
            startTime={startTime}
            onRemove={handleRemoveStop}
            onDurationChange={handleDurationChange}
            onTravelChange={handleTravelChange}
            onTravelModeToggle={handleTravelModeToggle}
          />
        )}

        {/* Botón agregar spot */}
        <button
          className="plan-builder__add-spot-btn"
          onClick={() => setShowPicker(true)}
          disabled={stops.length >= MAX_STOPS}
        >
          <Plus size={14} />
          {stops.length >= MAX_STOPS ? 'MÁXIMO 6 PARADAS' : '+ AGREGAR SPOT'}
        </button>

        {/* Mensajes */}
        {saveError && <p className="plan-builder__error">{saveError}</p>}
        {saveSuccess && <p className="plan-builder__success">PLAN GUARDADO</p>}

        {/* Guardar */}
        <button
          className="plan-builder__save-btn"
          onClick={handleSave}
          disabled={!name.trim() || stops.length === 0 || saving}
        >
          {saving ? 'GUARDANDO...' : 'GUARDAR PLAN'}
        </button>
      </div>

      {showPicker && (
        <SpotPicker
          spots={spots}
          excludeIds={existingSpotIds}
          onAdd={handleAddSpots}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}
