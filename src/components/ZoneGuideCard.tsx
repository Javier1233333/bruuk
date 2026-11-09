import { ChevronRight, MapPin } from 'lucide-react';
import { getSpotVisual } from '../lib/spotVisual';
import type { ZoneInfo } from '../lib/useZones';
import './HotspotsCard.css';

/* ============================================================
   Guía de una zona: el texto y el top que se curan en
   /admin/spots → Zonas. Abre el feed (Spots o Rack) cuando
   alguien elige una zona; tocar un lugar baja a su tarjeta.
   ============================================================ */

type GuidePlace = { id: string; name: string; type?: string; category?: string; imageUrl?: string; colorAccent?: string; highlight?: string; description?: string };

export function ZoneGuideCard({ zone, picks, total, onPick }: { zone: ZoneInfo; picks: GuidePlace[]; total: number; onPick: (id: string) => void }) {
  return (
    <div className="hotspots-card zone-guide-card" style={{ boxShadow: `8px 8px 0 ${zone.color}` }}>
      <span className="hotspots-card__kicker" style={{ color: zone.color }}><MapPin size={12} strokeWidth={3} aria-hidden="true" /> / ZONA</span>
      <h2 className="hotspots-card__title">{zone.name.toUpperCase()}</h2>
      <p className="hotspots-card__sub">
        {zone.intro || `${total} ${total === 1 ? 'lugar' : 'lugares'} de la guía en esta zona.`}
      </p>
      {picks.length > 0 && (
        <>
          <span className="hotspots-card__kicker zone-guide-card__top">EL TOP DE {zone.short.toUpperCase()}</span>
          <ol className="hotspots-card__list">
            {picks.map((place, index) => {
              const Icon = getSpotVisual(place.type ?? place.category ?? '').Icon;
              const hasOwnPhoto = /\.(?:jpe?g|png|webp|avif)(?:\?|$)/i.test(place.imageUrl ?? '');
              return (
                <li key={place.id}>
                  <button type="button" className="hotspots-card__item" onClick={() => onPick(place.id)}>
                    <span className="hotspots-card__num" style={{ color: zone.color }}>{index + 1}</span>
                    <span className="hotspots-card__thumb" style={{ background: place.colorAccent ?? zone.color }}>
                      {hasOwnPhoto ? <img src={place.imageUrl} alt="" loading="lazy" /> : <Icon size={20} strokeWidth={2.2} aria-hidden="true" />}
                    </span>
                    <span className="hotspots-card__text">
                      <span className="hotspots-card__name">{place.name}</span>
                      <span className="hotspots-card__why">
                        {place.highlight ? <><b>VE POR</b> {place.highlight}</> : place.type ?? place.description}
                      </span>
                    </span>
                    <ChevronRight size={18} strokeWidth={2.6} aria-hidden="true" className="hotspots-card__go" />
                  </button>
                </li>
              );
            })}
          </ol>
        </>
      )}
    </div>
  );
}
