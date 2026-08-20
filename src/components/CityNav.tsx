import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BruukLogo } from './BruukLogo';
import { BruukSelect } from './BruukSelect';
import { useRecommendationTransition } from './RecommendationTransition';
import './CityNav.css';

type CitySection = 'spots' | 'rack' | 'planes';

export function CityNav({ active, trailing }: { active?: CitySection; trailing?: ReactNode }) {
  const transitionTo = useRecommendationTransition();
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
      <div className="city-nav-sections">
        {active ? (
          <div className="city-nav-category">
            <span>/ CATEGORÍA</span>
            <BruukSelect
              ariaLabel="Cambiar categoría"
              value={active}
              onChange={(category) => transitionTo(`/guadalajara/${category === 'planes' ? 'senales' : category}`)}
              options={[
                { value: 'spots', label: 'SPOTS' },
                { value: 'rack', label: 'RACK' },
                { value: 'planes', label: 'SEÑALES' },
              ]}
            />
          </div>
        ) : (
          <span className="city-nav-current city-nav-current-home"><strong>¿QUÉ QUIERES DESCUBRIR HOY?</strong></span>
        )}
      </div>
      <div className="city-nav-trailing">{trailing}</div>
    </header>
  );
}
