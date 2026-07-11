import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Radar, Compass, MessageCircle, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './AppShell.css';
import citiesData from '../data/cities.json';

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

function readStoredProfile() {
  return {
    avatarId: localStorage.getItem('bruuk_avatar_id') || 'avatar1',
    username: localStorage.getItem('bruuk_username') || '',
  };
}

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
    return () => {
      window.removeEventListener('bruuk_profile_updated', loadProfile);
    };
  }, []);

  const currentAvatar = PRESET_AVATARS.find(a => a.id === profile.avatarId) || PRESET_AVATARS[0];
  const isImmersive = location.pathname.startsWith('/descubrir');
  const shouldShowTabbar = location.pathname !== '/descubrir';

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
          <div className="app-content-area">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                style={{ height: '100%' }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Persistent Glassmorphism Tab Bar */}
          {shouldShowTabbar && (
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
              to="/chats" 
              className={`tabbar-item ${isActive('/chats') ? 'active' : ''}`}
              aria-current={isActive('/chats') ? 'page' : undefined}
            >
              {isActive('/chats') && (
                <motion.div 
                  layoutId="active-glow"
                  className="tabbar-active-glow"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <div className="tabbar-badge-container">
                <MessageCircle size={22} strokeWidth={2.2} />
                <span className="tabbar-badge-dot"></span>
              </div>
              <span>Chats</span>
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
                {profile.username ? profile.username.slice(0, 1).toUpperCase() : <User size={12} />}
              </div>
              <span>Perfil</span>
            </Link>
          </nav>
          )}
        </div>
      </div>
    </div>
  );
}
