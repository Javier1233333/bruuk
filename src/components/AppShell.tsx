import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Map, Compass, Calendar, User } from 'lucide-react';
import { motion } from 'framer-motion';
import './AppShell.css';

// Preset avatar gradients (same as used in ProfilePage)
// Kept here for compatibility with ProfilePage's shared avatar picker.
// eslint-disable-next-line react-refresh/only-export-components
export const PRESET_AVATARS = [
  { id: 'avatar1', colors: '#8b7cf6', emoji: '' },
  { id: 'avatar2', colors: '#ff007f', emoji: '' },
  { id: 'avatar3', colors: '#00ff87', emoji: '' },
  { id: 'avatar4', colors: '#0052d4', emoji: '' },
  { id: 'avatar5', colors: '#11998e', emoji: '' },
  { id: 'avatar6', colors: '#ff7a45', emoji: '' },
];

export function AppShell({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [avatarId, setAvatarId] = useState<string>('avatar1');
  const [username, setUsername] = useState<string>('');

  // Sync profile details reactively from localStorage
  const loadProfile = () => {
    const savedAvatar = localStorage.getItem('bruuk_avatar_id') || 'avatar1';
    const savedUser = localStorage.getItem('bruuk_username') || '';
    setAvatarId(savedAvatar);
    setUsername(savedUser);
  };

  useEffect(() => {
    loadProfile();
    // Listen for custom profile update events to update header/tabbar dynamically
    window.addEventListener('bruuk_profile_updated', loadProfile);
    
    // Add in-app class to prevent global scroll bleeding on unmount
    document.documentElement.classList.add('in-app');
    document.body.classList.add('in-app');

    return () => {
      window.removeEventListener('bruuk_profile_updated', loadProfile);
      document.documentElement.classList.remove('in-app');
      document.body.classList.remove('in-app');
    };
  }, []);

  const currentAvatar = PRESET_AVATARS.find(a => a.id === avatarId) || PRESET_AVATARS[0];
  const isImmersive = location.pathname.startsWith('/descubrir');

  // Helper to check if a route is active
  const isActive = (path: string) => {
    if (path === '/descubrir' || path === '/experiencias') {
      return location.pathname.startsWith(path);
    }
    return location.pathname === path;
  };

  return (
    <div className="desktop-browser-wrapper app-shell-standalone">
      {/* Neon ambient glow backdrops */}
      <div className="ambient-glow glow-1"></div>
      <div className="ambient-glow glow-2"></div>
      
      {/* Smartphone mockup frame */}
      <div className="phone-mockup-frame">
        {/* Notch / Speaker header simulation */}
        <div className="phone-notch-container">
          <div className="phone-notch"></div>
        </div>

        {/* Viewport for mobile web app content */}
        <div className="app-viewport">
          <div className={`app-content-area ${isImmersive ? 'app-content-area--immersive' : ''}`}>
            {children}
          </div>

          {/* Persistent Glassmorphism Tab Bar */}
          <nav className="app-tabbar" aria-label="Navegación principal de la app">
            <Link 
              to="/descubrir" 
              className={`tabbar-item ${isActive('/descubrir') ? 'active' : ''}`}
              aria-current={isActive('/descubrir') ? 'page' : undefined}
            >
              {isActive('/descubrir') && (
                <motion.div 
                  layoutId="active-glow"
                  className="tabbar-active-glow"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Map size={22} strokeWidth={2.2} />
              <span>Explora</span>
            </Link>

            <Link 
              to="/experiencias" 
              className={`tabbar-item ${isActive('/experiencias') ? 'active' : ''}`}
              aria-current={isActive('/experiencias') ? 'page' : undefined}
            >
              {isActive('/experiencias') && (
                <motion.div 
                  layoutId="active-glow"
                  className="tabbar-active-glow"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Compass size={22} strokeWidth={2.2} />
              <span>Experiencias</span>
            </Link>

            <Link 
              to="/app" 
              className={`tabbar-item ${isActive('/app') ? 'active' : ''}`}
              aria-current={isActive('/app') ? 'page' : undefined}
            >
              {isActive('/app') && (
                <motion.div 
                  layoutId="active-glow"
                  className="tabbar-active-glow"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Calendar size={22} strokeWidth={2.2} />
              <span>Mis Eventos</span>
            </Link>

            <Link 
              to="/perfil" 
              className={`tabbar-item ${isActive('/perfil') ? 'active' : ''}`}
              aria-current={isActive('/perfil') ? 'page' : undefined}
            >
              {isActive('/perfil') && (
                <motion.div 
                  layoutId="active-glow"
                  className="tabbar-active-glow"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <div 
                className="tabbar-avatar-indicator"
                style={{ background: currentAvatar.colors }}
              >
                {username ? username.slice(0, 1).toUpperCase() : <User size={12} />}
              </div>
              <span>Perfil</span>
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}
