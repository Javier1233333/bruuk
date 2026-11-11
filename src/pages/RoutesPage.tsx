import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Dices } from 'lucide-react';
import { Link, Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom';
import { BruukLogo } from '../components/BruukLogo';
import { ItineraryCard } from '../components/ItineraryCard';
import { CURATED_ROUTES } from '../data/curatedRoutes';
import { IS_APP_MODE } from '../lib/appMode';
import { MOMENT_LABEL, itineraryFromParams, useSavedItineraries, type ItineraryMoment } from '../lib/itinerary';
import { usePlanCatalog } from '../lib/planCatalog';
import './RoutesPage.css';

/* ============================================================
   Rutas: itinerarios curados por Bruuk, los planes guardados en
   este dispositivo y, si se llega por un link compartido
   (?p=id.id.id), ese plan hasta arriba. Es pública para que el
   link de WhatsApp abra sin pedir cuenta.
   ============================================================ */

type Filter = 'todas' | ItineraryMoment;
const FILTERS: Filter[] = ['todas', 'manana', 'tarde', 'noche'];

export default function RoutesPage() {
  const { city = 'guadalajara' } = useParams();
  const [params] = useSearchParams();
  const catalog = usePlanCatalog();
  const saved = useSavedItineraries();
  const [filter, setFilter] = useState<Filter>('todas');
  const { hash } = useLocation();

  // Se llega con #id desde "Arma tu plan" o un link compartido: baja hasta esa ruta.
  useEffect(() => {
    if (!hash) return;
    const frame = requestAnimationFrame(() => document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: 'start' }));
    return () => cancelAnimationFrame(frame);
  }, [hash]);

  // Se resuelve en cada render: cuando llega el catálogo en vivo puede aparecer un lugar nuevo.
  const shared = itineraryFromParams(params, catalog.getPlace);
  const curated = CURATED_ROUTES.filter((route) => filter === 'todas' || route.moment === filter);
  // Las curadas guardadas ya salen marcadas en su sección: aquí sólo los planes armados.
  const savedPlans = saved.filter((item) => item.source === 'generada' && item.id !== shared?.id);

  if (city !== 'guadalajara') return <Navigate to="/guadalajara/rutas" replace />;

  return (
    <div className="routes-page">
      <header className="routes-nav">
        <Link to="/" aria-label="Ir al inicio"><BruukLogo width={96} /></Link>
        <span>/ RUTAS · GDL</span>
        {IS_APP_MODE
          ? <Link to="/guadalajara/arma-tu-plan"><Dices size={16} aria-hidden="true" /> ARMAR</Link>
          : <Link to="/guadalajara"><ArrowLeft size={17} aria-hidden="true" /> REGRESAR</Link>}
      </header>

      <main className="routes-main">
        <section className="routes-hero" aria-labelledby="routes-title">
          <span className="routes-kicker">/ PLANES Y RUTAS</span>
          <h1 id="routes-title">MENOS CHAT.<br /><em>MÁS PLAN.</em></h1>
          <p>Paradas reales en un orden que se puede caminar. Elige una, mándala al grupo y salgan hoy.</p>
        </section>

        {shared && (
          <section className="routes-section" aria-labelledby="routes-shared-title">
            <h2 id="routes-shared-title" className="routes-heading">/ TE MANDARON ESTE PLAN</h2>
            <div className="routes-grid is-single">
              <ItineraryCard itinerary={shared} getPlace={catalog.getPlace} kicker="/ PLAN COMPARTIDO" />
            </div>
          </section>
        )}

        <Link className="routes-build" to="/guadalajara/arma-tu-plan">
          <span><b>ARMA TU PLAN</b>Cinco preguntas, tres paradas a tu medida.</span>
          <ArrowRight size={22} aria-hidden="true" />
        </Link>

        <section className="routes-section" aria-labelledby="routes-curated-title">
          <div className="routes-section-head">
            <h2 id="routes-curated-title" className="routes-heading">/ RUTAS CURADAS</h2>
            <div className="routes-filters" role="group" aria-label="Filtrar por momento del día">
              {FILTERS.map((value) => (
                <button key={value} type="button" aria-pressed={filter === value} className={filter === value ? 'is-active' : ''} onClick={() => setFilter(value)}>
                  {value === 'todas' ? 'Todas' : MOMENT_LABEL[value]}
                </button>
              ))}
            </div>
          </div>
          <div className="routes-grid">
            {curated.map((route) => <ItineraryCard key={route.id} itinerary={route} getPlace={catalog.getPlace} />)}
          </div>
        </section>

        <section className="routes-section" aria-labelledby="routes-saved-title">
          <h2 id="routes-saved-title" className="routes-heading">/ TUS PLANES GUARDADOS <span>{savedPlans.length}</span></h2>
          {savedPlans.length === 0 ? (
            <p className="routes-empty">Aquí se quedan los planes que armes y guardes, en este dispositivo y sin cuenta. Las rutas curadas que guardes quedan marcadas arriba.</p>
          ) : (
            <div className="routes-grid">
              {savedPlans.map((item) => <ItineraryCard key={item.id} itinerary={item} getPlace={catalog.getPlace} kicker="/ GUARDADO" />)}
            </div>
          )}
        </section>

        <p className="routes-note">Los tiempos entre paradas son estimados. Revisa horarios antes de salir.</p>
      </main>
    </div>
  );
}
