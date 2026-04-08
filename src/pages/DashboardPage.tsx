import { useNavigate } from 'react-router-dom';
import { LogOut, Map, Sparkles, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { BruukLogo } from '../components/BruukLogo';
import './DashboardPage.css';

export function DashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <BruukLogo />
          <div className="dashboard-user">
            <span className="dashboard-email">{user?.email}</span>
            <button className="btn-icon" onClick={handleSignOut} title="Cerrar sesión">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-hero-glow"></div>
        <div className="dashboard-content">
          <h1 className="brand-gradient-text dashboard-title">
            Bienvenido a BRUUK.
          </h1>
          <p className="dashboard-subtitle">
            La app está en construcción. Eres de los primeros en estar aquí.
          </p>

          <div className="dashboard-cards">
            <div className="dashboard-card coming-soon">
              <div className="dashboard-card-icon">
                <Map size={28} color="#fff" />
              </div>
              <h3>Explorar</h3>
              <p>Descubre lugares y planes cerca de ti.</p>
              <span className="badge">Próximamente</span>
            </div>

            <div className="dashboard-card coming-soon">
              <div className="dashboard-card-icon">
                <Sparkles size={28} color="#fff" />
              </div>
              <h3>Planes</h3>
              <p>Lanza o únete a planes espontáneos.</p>
              <span className="badge">Próximamente</span>
            </div>

            <div className="dashboard-card coming-soon">
              <div className="dashboard-card-icon">
                <Users size={28} color="#fff" />
              </div>
              <h3>Comunidad</h3>
              <p>Conecta con personas que quieren salir.</p>
              <span className="badge">Próximamente</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
