import { ArrowUpRight, Bike, Bookmark, BookmarkCheck, Car, Clock3, Dices, Footprints, MapPin, MessageCircle, Route } from 'lucide-react';
import type { PlanPlace } from '../data/planBuilder';
import {
  MOMENT_LABEL,
  durationLabel,
  legBetween,
  legDetail,
  mapsRouteUrl,
  resolveStops,
  toggleSaved,
  useSavedItineraries,
  whatsappUrl,
  zoneTrail,
  type Itinerary,
  type Leg,
} from '../lib/itinerary';
import { zoneShort } from '../lib/routeGenerator';
import './ItineraryCard.css';

/* ============================================================
   Un itinerario listo para salir: encabezado (vibra, zona,
   duración, momento), línea de tiempo con el tramo entre cada
   parada y las acciones para que el plan no muera en el chat:
   WhatsApp, ruta en Maps y guardar.
   ============================================================ */

type Props = {
  itinerary: Itinerary;
  getPlace: (id: string) => PlanPlace | undefined;
  // Sólo en "Arma tu plan": cambia esa parada por otra.
  onReroll?: (index: number) => void;
  // Para titular con h2 o h3 según dónde viva la tarjeta.
  heading?: 'h2' | 'h3';
  kicker?: string;
};

const LEG_ICON: Record<Leg['mode'], typeof Footprints> = { pie: Footprints, bici: Bike, coche: Car };

export function ItineraryCard({ itinerary, getPlace, onReroll, heading: Heading = 'h3', kicker }: Props) {
  const saved = useSavedItineraries();
  const isSaved = saved.some((item) => item.id === itinerary.id);
  const stops = resolveStops(itinerary, getPlace);
  if (stops.length < 2) return null;

  const trail = zoneTrail(stops, zoneShort);
  const route = mapsRouteUrl(stops.map((stop) => stop.place));

  return (
    <article className="itinerary" id={itinerary.id}>
      <header className="itinerary-head">
        <span className="itinerary-kicker">{kicker ?? (itinerary.source === 'curada' ? '/ RUTA BRUUK' : '/ TU RUTA BRUUK')}</span>
        <Heading className="itinerary-title">{itinerary.title}</Heading>
        {itinerary.blurb && <p className="itinerary-blurb">{itinerary.blurb}</p>}
        <ul className="itinerary-meta" aria-label="Datos del plan">
          {itinerary.vibes.map((vibe) => <li key={vibe} className="is-vibe">{vibe}</li>)}
          {trail && <li><MapPin size={13} aria-hidden="true" /> {trail}</li>}
          <li><Clock3 size={13} aria-hidden="true" /> {durationLabel(stops)}</li>
          <li>{MOMENT_LABEL[itinerary.moment]}</li>
        </ul>
      </header>

      <ol className="itinerary-stops">
        {stops.map((stop, index) => {
          const { place } = stop;
          const leg = index > 0 ? legBetween(stops[index - 1].place, place) : null;
          const LegIcon = leg ? LEG_ICON[leg.mode] : Route;
          return (
            <li key={place.id} className="itinerary-stop">
              {index > 0 && (
                <p className="itinerary-leg">
                  <LegIcon size={14} aria-hidden="true" />
                  <span>{leg ? legDetail(leg) : 'Revisa el trayecto en Maps'}</span>
                </p>
              )}
              <div className="itinerary-stop-row">
                <div className="itinerary-marker">
                  <span>PARADA</span>
                  <b>{String(index + 1).padStart(2, '0')}</b>
                  {stop.time && <time>{stop.time}</time>}
                </div>
                <div className="itinerary-body">
                  <span className="itinerary-type">{place.type}{place.price ? ` · ${place.price}` : ''}</span>
                  <h4>{place.name}</h4>
                  {place.tip && <p className="itinerary-tip"><b>VE POR:</b> {place.tip}</p>}
                  <div className="itinerary-links">
                    <a href={place.mapsUrl} target="_blank" rel="noreferrer">CÓMO LLEGAR <ArrowUpRight size={15} aria-hidden="true" /></a>
                    {onReroll && (
                      <button type="button" onClick={() => onReroll(index)} aria-label={`Cambiar la parada ${index + 1}: ${place.name}`}>
                        <Dices size={15} aria-hidden="true" /> CAMBIAR PARADA
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <footer className="itinerary-actions">
        <a className="itinerary-action is-primary" href={whatsappUrl(itinerary, getPlace)} target="_blank" rel="noreferrer">
          <MessageCircle size={18} aria-hidden="true" /> MANDAR POR WHATSAPP
        </a>
        {route && (
          <a className="itinerary-action" href={route} target="_blank" rel="noreferrer">
            <Route size={18} aria-hidden="true" /> ABRIR RUTA EN MAPS
          </a>
        )}
        <button type="button" className={`itinerary-action${isSaved ? ' is-saved' : ''}`} onClick={() => toggleSaved(itinerary)} aria-pressed={isSaved}>
          {isSaved ? <BookmarkCheck size={18} aria-hidden="true" /> : <Bookmark size={18} aria-hidden="true" />}
          {isSaved ? 'GUARDADO' : 'GUARDAR PLAN'}
        </button>
      </footer>
    </article>
  );
}
