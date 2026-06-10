import { Sparkles, Calendar, Waves } from 'lucide-react';
import './TabBar.css';

export type AppTab = 'planes' | 'eventos' | 'mar';

interface TabBarProps {
  activeTab: AppTab;
  onChange: (tab: AppTab) => void;
}

const TABS: { id: AppTab; label: string; icon: React.ReactNode }[] = [
  { id: 'planes', label: 'Planes', icon: <Sparkles size={18} /> },
  { id: 'eventos', label: 'Eventos', icon: <Calendar size={18} /> },
  { id: 'mar', label: 'Mar', icon: <Waves size={18} /> },
];

export function TabBar({ activeTab, onChange }: TabBarProps) {
  return (
    <nav className="app-tabbar" aria-label="Navegación principal">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`app-tabbar__btn${activeTab === tab.id ? ' active' : ''}`}
          onClick={() => onChange(tab.id)}
          aria-current={activeTab === tab.id ? 'page' : undefined}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
