import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Radar, Compass, MessageCircle, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './AppShell.css';

// Preset avatar gradients (same as used in ProfilePage)
export const PRESET_AVATARS = [
  { id: 'avatar1', colors: 'linear-gradient(135deg, #8b7cf6, #ec4899)' },
  { id: 'avatar2', colors: 'linear-gradient(135deg, #ff007f, #ffaa00)' },
  { id: 'avatar3', colors: 'linear-gradient(135deg, #00ff87, #60efff)' },
  { id: 'avatar4', colors: 'linear-gradient(135deg, #0052d4, #4364f7, #6fb1fc)' },
  { id: 'avatar5', colors: 'linear-gradient(135deg, #11998e, #38ef7d)' },
  { id: 'avatar6', colors: 'linear-gradient(135deg, #8a2387, #e94057, #f27121)' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
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

  const currentAvatar = PRESET_AVATARS.find(a => a.id === avatarId) || PRESET_AVATARS[0];

  // Helper to check if a route is active
  const isActive = (path: string) => {
    if (path === '/descubrir') {
      return location.pathname.startsWith('/descubrir');
    }
    return location.pathname === path;
  };

  return (
    <div className="desktop-browser-wrapper">
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
          <nav className="app-tabbar">
            <Link 
              to="/descubrir" 
              className={`tabbar-item ${isActive('/descubrir') ? 'active' : ''}`}
            >
              {isActive('/descubrir') && (
                <motion.div 
                  layoutId="active-glow"
                  className="tabbar-active-glow"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Radar size={22} strokeWidth={2.2} />
              <span>Explora</span>
            </Link>

            <Link 
              to="/experiencias" 
              className={`tabbar-item ${isActive('/experiencias') ? 'active' : ''}`}
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
