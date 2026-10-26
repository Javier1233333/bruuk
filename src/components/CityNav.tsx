import { CalendarDays, LogOut } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BruukLogo } from './BruukLogo';
import { BruukSelect } from './BruukSelect';
import { IS_APP_MODE } from '../lib/appMode';
import { useAppSession } from '../lib/appSession';
import { useRecommendationTransition } from './RecommendationTransition';
import './CityNav.css';

type CitySection = 'spots' | 'rack' | 'planes';

export function CityNav({ active, trailing }: { active?: CitySection; trailing?: ReactNode }) {
  const transitionTo = useRecommendationTransition();
  const session = useAppSession();
  // En el modo app las categorías están en el menú inferior; arriba sólo queda Eventos.
  if (IS_APP_MODE && active) {
    return (
      <header className="city-nav is-feed-nav is-app-nav">
        <Link className="city-nav-logo" to="/guadalajara/spots" aria-label="Inicio"><BruukLogo width={104} /></Link>
        <div className="city-nav-app-actions">
          <Link className="city-nav-change city-nav-events" to="/guadalajara/eventos"><CalendarDays size={16} strokeWidth={2.2} aria-hidden="true" /> EVENTOS</Link>
          {session && (
            <button type="button" className="city-nav-change city-nav-signout" onClick={() => void session.signOut()} aria-label={`Cerrar sesión (${session.email ?? 'cuenta'})`}>
              <LogOut size={16} strokeWidth={2.2} aria-hidden="true" />
            </button>
          )}
        </div>
      </header>
    );
  }
  return (
    <header className={`city-nav ${active ? 'is-feed-nav' : 'is-home-nav'}`}>
      <Link className="city-nav-logo" to="/" aria-label="Volver al landing de Bruuk"><BruukLogo width={104} /></Link>
      {!active && (
        <div className="city-nav-selector">
          <span>/ CIUDAD</span>
          <BruukSelect
            ariaLabel="Cambiar ciudad"
            value="guadalajara"
            onChange={(city) => transitionTo(`/${city}`)}
            options={[
              { value: 'guadalajara', label: 'GUADALAJARA' },
              { value: 'cdmx', label: 'CDMX · PRÓXIMAMENTE', disabled: true },
              { value: 'monterrey', label: 'MONTERREY · PRÓXIMAMENTE', disabled: true },
              { value: 'madrid', label: 'MADRID · PRÓXIMAMENTE', disabled: true },
            ]}
          />
        </div>
      )}
      {/* En Inicio la pregunta ya es el título de la página: aquí solo la categoría */}
      {active && <div className="city-nav-sections">
          <div className="city-nav-category">
            <span>/ CATEGORÍA</span>
            <BruukSelect
              ariaLabel="Cambiar categoría"
              value={active}
              onChange={(category) => transitionTo(`/guadalajara/${category === 'planes' ? 'senales' : category}`)}
              options={[
                { value: 'spots', label: 'COMER Y TOMAR' },
                { value: 'rack', label: 'VINTAGE Y TIANGUIS' },
                { value: 'planes', label: 'PLANES Y RUTAS' },
              ]}
            />
          </div>
      </div>}
      <div className="city-nav-trailing">{trailing}</div>
    </header>
  );
}
