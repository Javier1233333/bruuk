import { ChevronRight } from 'lucide-react';
import { getSpotVisual } from '../lib/spotVisual';
import { spotZone } from '../lib/zones';
import './HotspotsCard.css';

/* ============================================================
   Sección "Hotspots de la semana" del feed de Comer y tomar.
   Los tres spots se eligen en /admin/spots → Hotspots; tocar uno
   baja a su tarjeta, que va justo después de esta sección.
   ============================================================ */

interface Hotspot {
  id: string;
  name: string;
  type: string;
  imageUrl: string;
  colorAccent: string;
  highlight?: string;
  hotspot?: number;
  hotspotDate?: string;
  zone?: string;
  coordinates?: { lat: number; lng: number };
}

// "2026-10-28" → "26 oct" (el lunes de esa semana)
function weekOf(date?: string): string | null {
  if (!date) return null;
  const day = new Date(`${date}T12:00:00`);
  if (Number.isNaN(day.getTime())) return null;
  day.setDate(day.getDate() - ((day.getDay() + 6) % 7));
  return day.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).replace('.', '');
}

export function HotspotsCard({ hotspots, onPick }: { hotspots: Hotspot[]; onPick: (id: string) => void }) {
  const week = weekOf(hotspots[0]?.hotspotDate);

  return (
    <div className="hotspots-card">
      <span className="hotspots-card__kicker">/ HOTSPOTS DE LA SEMANA</span>
      <h2 className="hotspots-card__title">{hotspots.length === 1 ? 'UN SPOT.' : `${hotspots.length === 2 ? 'DOS' : 'TRES'} SPOTS.`} ESTA SEMANA.</h2>
      <p className="hotspots-card__sub">Elegidos a mano por Bruuk{week && <> · <span className="hotspots-card__week">semana del {week}</span></>}.</p>

      <ol className="hotspots-card__list">
        {hotspots.map((spot) => {
          const visual = getSpotVisual(spot.type);
          const Icon = visual.Icon;
          const hasOwnPhoto = /\.(?:jpe?g|png|webp|avif)(?:\?|$)/i.test(spot.imageUrl);
          return (
            <li key={spot.id}>
              <button type="button" className="hotspots-card__item" onClick={() => onPick(spot.id)}>
                <span className="hotspots-card__num">{spot.hotspot}</span>
                <span className="hotspots-card__thumb" style={{ background: spot.colorAccent }}>
                  {hasOwnPhoto ? <img src={spot.imageUrl} alt="" loading="lazy" /> : <Icon size={20} strokeWidth={2.2} aria-hidden="true" />}
                </span>
                <span className="hotspots-card__text">
                  <span className="hotspots-card__name">{spot.name}</span>
                  <span className="hotspots-card__why">
                    {spot.highlight ? <><b>VE POR</b> {spot.highlight}</> : [spot.type, spotZone(spot)?.name].filter(Boolean).join(' · ')}
                  </span>
                </span>
                <ChevronRight size={18} strokeWidth={2.6} aria-hidden="true" className="hotspots-card__go" />
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
