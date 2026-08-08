import type { ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { BruukLogo } from './BruukLogo';
import './CityNav.css';

type CitySection = 'spots' | 'rack' | 'planes';

export function CityNav({ active, trailing }: { active?: CitySection; trailing?: ReactNode }) {
  const navigate = useNavigate();
  return (
    <header className="city-nav">
      <Link className="city-nav-logo" to="/" aria-label="Volver al landing de Bruuk"><BruukLogo width={104} /></Link>
      <label className="city-nav-selector">
        <span>/ CIUDAD</span>
        <select value="guadalajara" onChange={(event) => navigate(`/${event.target.value}`)} aria-label="Cambiar ciudad">
          <option value="guadalajara">GUADALAJARA</option>
          <option value="cdmx" disabled>CDMX · PRÓXIMAMENTE</option>
          <option value="monterrey" disabled>MONTERREY · PRÓXIMAMENTE</option>
          <option value="madrid" disabled>MADRID · PRÓXIMAMENTE</option>
        </select>
      </label>
      <nav className="city-nav-sections" aria-label="Secciones de Guadalajara">
        <NavLink to="/guadalajara/spots" className={active === 'spots' ? 'active' : ''}><small>01</small><span>SPOTS</span></NavLink>
        <NavLink to="/guadalajara/rack" className={active === 'rack' ? 'active' : ''}><small>02</small><span>RACK</span></NavLink>
      </nav>
      <div className="city-nav-trailing">{trailing}</div>
    </header>
  );
}
