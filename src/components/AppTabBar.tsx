import { CalendarDays, Dices, House, Plus, Shirt } from 'lucide-react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { IS_APP_MODE } from '../lib/appMode';
import './AppTabBar.css';

const TABS = [
  { to: '/guadalajara/spots', label: 'Inicio', icon: House, match: (path: string) => path === '/guadalajara' || path === '/guadalajara/spots' },
  { to: '/guadalajara/rack', label: 'Rack', icon: Shirt, match: (path: string) => path === '/guadalajara/rack' || path === '/guadalajara/atardeceres' },
  { to: '/guadalajara/arma-tu-plan', label: 'Plan', icon: Dices, match: (path: string) => path === '/guadalajara/arma-tu-plan' },
  { to: '/guadalajara/eventos', label: 'Eventos', icon: CalendarDays, match: (path: string) => path === '/guadalajara/eventos' },
];

// Menú inferior del modo app. El botón central es "Sube un spot"; Radar vive arriba, en CityNav.
export function AppTabBar() {
  const { pathname } = useLocation();
  if (!IS_APP_MODE || pathname === '/login' || pathname === '/auth/action') return null;

  const [inicio, rack, plan, eventos] = TABS;
  const renderTab = ({ to, label, icon: Icon, match }: (typeof TABS)[number]) => (
    <Link key={to} to={to} className={`app-tab ${match(pathname) ? 'is-active' : ''}`} aria-current={match(pathname) ? 'page' : undefined}>
      <Icon size={22} strokeWidth={2} aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );

  return (
    <nav className="app-tabbar" aria-label="Menú de Bruuk">
      {renderTab(inicio)}
      {renderTab(rack)}
      <NavLink to="/sube-un-spot" className={({ isActive }) => `app-tab app-tab-add ${isActive ? 'is-active' : ''}`} aria-label="Sube un spot">
        <i><Plus size={26} strokeWidth={2.6} aria-hidden="true" /></i>
        <span>Spot</span>
      </NavLink>
      {renderTab(plan)}
      {renderTab(eventos)}
    </nav>
  );
}
