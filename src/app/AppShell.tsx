import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { AppHeader } from './components/AppHeader';
import { TabBar } from './components/TabBar';
import type { AppTab } from './components/TabBar';
import { PlanesTab } from './tabs/PlanesTab';
import { EventosTab } from './tabs/EventosTab';
import { MarTab } from './tabs/MarTab';
import '../rack/rack.css';
import './AppShell.css';

interface Profile {
  display_name: string;
  avatar_color: string;
}

export function AppShell() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Leer el tab de la query string (para retorno de Stripe con ?tab=eventos)
  const params = new URLSearchParams(location.search);
  const tabFromUrl = params.get('tab') as AppTab | null;
  const validTabs: AppTab[] = ['planes', 'eventos', 'mar'];
  const initialTab: AppTab =
    tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : 'planes';

  const [activeTab, setActiveTab] = useState<AppTab>(initialTab);
  const [profile, setProfile] = useState<Profile>({
    display_name: '',
    avatar_color: '#6366f1',
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('display_name, avatar_color')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfile({
            display_name: (data as Profile).display_name ?? user.email?.split('@')[0] ?? '',
            avatar_color: (data as Profile).avatar_color ?? '#6366f1',
          });
        } else {
          setProfile({
            display_name: user.email?.split('@')[0] ?? '',
            avatar_color: '#6366f1',
          });
        }
      });
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isMarFullscreen = activeTab === 'mar';

  return (
    <div className={`app-shell${isMarFullscreen ? ' app-shell--mar-fullscreen' : ''}`}>
      <div className="app-shell__header">
        <AppHeader
          displayName={profile.display_name}
          avatarColor={profile.avatar_color}
          onSignOut={handleSignOut}
        />
      </div>

      <main className="app-shell__content">
        {activeTab === 'planes' && <PlanesTab />}
        {activeTab === 'eventos' && <EventosTab />}
        {activeTab === 'mar' && <MarTab onBack={() => setActiveTab('planes')} />}
      </main>

      <div className="app-shell__tabbar">
        <TabBar activeTab={activeTab} onChange={setActiveTab} />
      </div>
    </div>
  );
}
