import { LogOut } from 'lucide-react';
import { BruukLogo } from '../../components/BruukLogo';
import './AppHeader.css';

interface AppHeaderProps {
  displayName: string;
  avatarColor: string;
  onSignOut: () => void;
}

function getInitials(displayName: string): string {
  const trimmed = displayName.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function AppHeader({ displayName, avatarColor, onSignOut }: AppHeaderProps) {
  return (
    <header className="app-header">
      <BruukLogo width={90} />
      <div className="app-header__right">
        <div
          className="app-header__avatar"
          style={{ backgroundColor: avatarColor }}
          title={displayName}
        >
          {getInitials(displayName)}
        </div>
        <button
          className="app-header__signout"
          onClick={onSignOut}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
