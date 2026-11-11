import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CURATED_ROUTES } from '../data/curatedRoutes';
import type { PlanPlace } from '../data/planBuilder';
import { MOMENT_LABEL, durationLabel, resolveStops, zoneTrail } from '../lib/itinerary';
import { zoneShort } from '../lib/routeGenerator';

/* ============================================================
   Pestaña RUTAS de "Arma tu plan": las rutas curadas en chico
   (título, vibra, zona, duración y sus paradas). Cada una abre
   la ruta completa, con WhatsApp, Maps y guardar, en
   /guadalajara/rutas.
   ============================================================ */

export function PlanCuratedList({ getPlace }: { getPlace: (id: string) => PlanPlace | undefined }) {
  return (
    <div className="plan-curated">
      <ul>
        {CURATED_ROUTES.map((route) => {
          const stops = resolveStops(route, getPlace);
          if (stops.length < 2) return null;
          const trail = zoneTrail(stops, zoneShort);
          return (
            <li key={route.id}>
              <Link to={`/guadalajara/rutas#${route.id}`} className="plan-curated-card">
                <span className="plan-curated-meta">{[MOMENT_LABEL[route.moment], trail, durationLabel(stops), route.vibes.join(' / ')].filter(Boolean).join(' · ')}</span>
                <strong>{route.title}</strong>
                <ol>
                  {stops.map((stop, index) => <li key={stop.placeId}><b>{String(index + 1).padStart(2, '0')}</b>{stop.place.name}</li>)}
                </ol>
                <span className="plan-curated-go">VER RUTA <ArrowRight size={15} aria-hidden="true" /></span>
              </Link>
            </li>
          );
        })}
      </ul>
      <Link className="plan-curated-all" to="/guadalajara/rutas">VER TODAS Y MIS GUARDADOS <ArrowRight size={15} aria-hidden="true" /></Link>
    </div>
  );
}
