import { GripVertical, X, Footprints, Car } from 'lucide-react';
import { haversineKm } from '../utils/haversine';
import './PlanTimeline.css';

export interface BuilderStop {
  spot_id: string;
  spot_name: string;
  spot_color: string;
  spot_price?: string;
  duration_min: number;
  travel_min: number;
  travel_mode: 'walk' | 'drive';
  maps_link: string;
  coordinates?: { lat: number; lng: number };
}

// Add HH:MM + N minutes → HH:MM
function addMinutes(time: string, mins: number): string {
  const [hStr, mStr] = time.split(':');
  const totalMins = parseInt(hStr, 10) * 60 + parseInt(mStr, 10) + mins;
  const h = Math.floor(totalMins / 60) % 24;
  const m = totalMins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

interface PlanTimelineProps {
  stops: BuilderStop[];
  startTime: string;
  onRemove: (index: number) => void;
  onDurationChange: (index: number, min: number) => void;
  onTravelChange: (index: number, min: number) => void;
  onTravelModeToggle: (index: number) => void;
}

export function PlanTimeline({
  stops,
  startTime,
  onRemove,
  onDurationChange,
  onTravelChange,
  onTravelModeToggle,
}: PlanTimelineProps) {
  // Calcular horas de llegada y salida por parada
  const schedule: Array<{ arrival: string; departure: string }> = [];
  let cursor = startTime;

  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i];
    if (i > 0) cursor = addMinutes(cursor, stop.travel_min);
    const arrival = cursor;
    const departure = addMinutes(arrival, stop.duration_min);
    schedule.push({ arrival, departure });
    cursor = departure;
  }

  return (
    <div className="plan-timeline">
      {stops.map((stop, i) => (
        <div key={`${stop.spot_id}-${i}`}>
          {/* Bloque de traslado (antes de cada stop excepto el primero) */}
          {i > 0 && (
            <div className="plan-timeline__transfer">
              <span className="plan-timeline__transfer-icon">
                {stop.travel_mode === 'walk' ? <Footprints size={14} /> : <Car size={14} />}
              </span>
              <div className="plan-timeline__transfer-body">
                <span className="plan-timeline__transfer-label">
                  TRASLADO:&nbsp;
                  <input
                    className="plan-timeline__transfer-input"
                    type="number"
                    min={0}
                    max={120}
                    value={stop.travel_min}
                    onChange={(e) => onTravelChange(i, Math.max(0, Math.min(120, parseInt(e.target.value, 10) || 0)))}
                    aria-label={`Minutos de traslado hasta ${stop.spot_name}`}
                  />
                  &nbsp;MIN&nbsp;
                  {stop.travel_mode === 'walk' ? 'A PIE' : 'EN AUTO'}
                  {stops[i - 1]?.coordinates && stop.coordinates && (
                    <span className="plan-timeline__transfer-distance">
                      ({haversineKm(stops[i - 1].coordinates!, stop.coordinates).toFixed(1)} km)
                    </span>
                  )}
                  {(!stops[i - 1]?.coordinates || !stop.coordinates) && (
                    <span className="plan-timeline__transfer-distance">MANUAL</span>
                  )}
                </span>
              </div>
              <button
                className="plan-timeline__transfer-toggle"
                onClick={() => onTravelModeToggle(i)}
                title={`Cambiar a ${stop.travel_mode === 'walk' ? 'auto' : 'pie'}`}
              >
                {stop.travel_mode === 'walk' ? <Car size={12} /> : <Footprints size={12} />}
              </button>
            </div>
          )}

          {/* Stop */}
          <div className="plan-timeline__stop">
            <span className="plan-timeline__drag-handle" aria-hidden="true">
              <GripVertical size={16} />
            </span>

            <div className="plan-timeline__stop-body">
              <div className="plan-timeline__stop-header">
                <span
                  className="plan-timeline__dot"
                  style={{ backgroundColor: stop.spot_color }}
                />
                <span className="plan-timeline__stop-name">{stop.spot_name}</span>
              </div>

              {schedule[i] && (
                <div className="plan-timeline__time-range">
                  {schedule[i].arrival} → {schedule[i].departure}
                </div>
              )}

              <div className="plan-timeline__stop-meta">
                <span className="plan-timeline__duration-label">Duración:</span>
                <input
                  className="plan-timeline__duration-input"
                  type="number"
                  min={5}
                  max={480}
                  value={stop.duration_min}
                  onChange={(e) => onDurationChange(i, Math.max(5, Math.min(480, parseInt(e.target.value, 10) || 5)))}
                  aria-label={`Duración en ${stop.spot_name}`}
                />
                <span className="plan-timeline__duration-label">min</span>
                {stop.spot_price && (
                  <span className="plan-timeline__price">{stop.spot_price}</span>
                )}
              </div>
            </div>

            <button
              className="plan-timeline__remove-btn"
              onClick={() => onRemove(i)}
              aria-label={`Eliminar ${stop.spot_name}`}
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
