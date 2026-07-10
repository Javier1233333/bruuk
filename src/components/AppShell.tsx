import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Map, Compass, MessageCircle, User } from 'lucide-react';
import { motion } from 'framer-motion';
import './AppShell.css';
import citiesData from '../data/cities.json';

// Preset avatar gradients (same as used in ProfilePage)
export const PRESET_AVATARS = [
  { id: 'avatar1', colors: '#8b7cf6', emoji: '' },
  { id: 'avatar2', colors: '#ff007f', emoji: '' },
  { id: 'avatar3', colors: '#00ff87', emoji: '' },
  { id: 'avatar4', colors: '#0052d4', emoji: '' },
  { id: 'avatar5', colors: '#11998e', emoji: '' },
  { id: 'avatar6', colors: '#ff7a45', emoji: '' },
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

    // Load active city accent color and set custom CSS variables
    const savedCityId = localStorage.getItem('bruuk_active_city') || 'hermosillo';
    const cityData = citiesData.find(c => c.id === savedCityId) || citiesData[0];
    const accentColor = cityData.accentColor;
    document.documentElement.style.setProperty('--global-accent', accentColor);
    
    // Parse hex to rgb for opacity-based styles in CSS
    const hex = accentColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    document.documentElement.style.setProperty('--global-accent-rgb', `${r}, ${g}, ${b}`);
  };

  useEffect(() => {
    loadProfile();
    // Inyectar clase al documento para limitar estilos globales al app shell
    document.documentElement.classList.add('app-shell-active');
    document.body.classList.add('app-shell-active');
    
    // Listen for custom profile and city update events to update dynamically
    window.addEventListener('bruuk_profile_updated', loadProfile);
    window.addEventListener('bruuk_city_changed', loadProfile);
    return () => {
      window.removeEventListener('bruuk_profile_updated', loadProfile);
      window.removeEventListener('bruuk_city_changed', loadProfile);
      document.documentElement.classList.remove('app-shell-active');
      document.body.classList.remove('app-shell-active');
    };
  }, []);

  const currentAvatar = PRESET_AVATARS.find(a => a.id === avatarId) || PRESET_AVATARS[0];

  // Helper to check if a route is active
  const isActive = (path: string) => {
    if (path === '/descubrir' || path === '/experiencias') {
      return location.pathname.startsWith(path);
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
          <div className="app-content-area" style={{ height: '100%' }}>
            {children}
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
              <Map size={22} strokeWidth={2.2} />
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
