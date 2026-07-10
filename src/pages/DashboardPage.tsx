import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, MapPin, Calendar, ArrowRight, Zap, Palette,
  Utensils, Users, Clock, ExternalLink, Sparkles, X,
  Map, Star, ChevronRight,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { BruukLogo } from '../components/BruukLogo';
import './DashboardPage.css';

type Tab = 'planes' | 'eventos' | 'spots';

const PLANES = [
  {
    id: 1,
    categoria: 'Gastronomía',
    color: '#f59e0b',
    icon: <Utensils size={16} />,
    titulo: 'Cena sin menú',
    descripcion: 'Entra a un restaurante local que nunca has probado y pide que te sorprendan. Sin Google, sin reseñas. Deja que la ciudad te alimente diferente.',
    duracion: '2–3 hrs',
    nivel: 'Descubrimiento',
  },
  {
    id: 2,
    categoria: 'Arte & Cultura',
    color: '#ec4899',
    icon: <Palette size={16} />,
    titulo: 'Ruta de galerías a pie',
    descripcion: 'Elige una colonia y entra a cada galería pequeña que encuentres en tu camino. Sin itinerario, sin pretensiones. El arte te lleva a donde debes estar.',
    duracion: '3–4 hrs',
    nivel: 'Cultural',
  },
  {
    id: 3,
    categoria: 'Comunidad',
    color: '#10b981',
    icon: <Users size={16} />,
    titulo: 'Reencuentro en azotea',
    descripcion: 'Llama a alguien con quien tengas tiempo sin verse. Nada de plan elaborado: una azotea, algo para tomar y conversación sin teléfono en mano.',
    duracion: 'Toda la noche',
    nivel: 'Reconexión',
  },
  {
    id: 4,
    categoria: 'Exploración',
    color: '#8b7cf6',
    icon: <Map size={16} />,
    titulo: 'La colonia que no conoces',
    descripcion: 'Bájate en una parada de camión que nunca uses. Camina sin destino por 45 minutos. Tu ciudad es más grande de lo que crees.',
    duracion: '1–2 hrs',
    nivel: 'Urbano',
  },
  {
    id: 5,
    categoria: 'Naturaleza',
    color: '#22d3ee',
    icon: <Sparkles size={16} />,
    titulo: 'Amanecer en la ciudad',
    descripcion: 'Pon una alarma para las 5:30 AM, ve al punto más alto que conozcas y mira cómo despierta todo. La misma ciudad, completamente diferente.',
    duracion: '1–2 hrs',
    nivel: 'Contemplativo',
  },
  {
    id: 6,
    categoria: 'Impulso',
    color: '#f97316',
    icon: <Zap size={16} />,
    titulo: 'El plan de los 5 minutos',
    descripcion: 'Tienes 5 minutos para elegir: llama a alguien, dile que salgan en 30 minutos y no decidan a dónde hasta que ya estén en la calle.',
    duracion: 'Abierto',
    nivel: 'Espontáneo',
  },
];

const EVENTOS = [
  { id: 1, titulo: 'Mercado de Diseño Independiente', fecha: 'Sáb 10 Mayo', hora: '12:00 – 20:00', lugar: 'Plaza Tapatía, Centro Histórico', organizador: 'Colectivo Campo', categoria: 'Diseño', color: '#f97316', link: '#' },
  { id: 2, titulo: 'Jazz & Mezcal en Foro Independencia', fecha: 'Vie 9 Mayo', hora: '21:00 – 2:00', lugar: 'Foro Independencia, Centro', organizador: 'Foro Independencia', categoria: 'Música', color: '#3b82f6', link: '#' },
  { id: 3, titulo: 'Exposición: Arte Emergente Guadalajara', fecha: 'Hasta 25 Mayo', hora: 'Mar–Dom 10:00–18:00', lugar: 'Museo de Arte de Zapopan, Andares', organizador: 'MAZ Guadalajara', categoria: 'Arte', color: '#ec4899', link: '#' },
  { id: 4, titulo: 'Feria de Libros Raros & Usados', fecha: 'Dom 11 Mayo', hora: '10:00 – 17:00', lugar: 'Parque Revolución, Guadalajara', organizador: 'Libros Ambulantes', categoria: 'Literatura', color: '#84cc16', link: '#' },
  { id: 5, titulo: 'Noche de Cine Experimental', fecha: 'Jue 8 Mayo', hora: '19:30 – 23:00', lugar: 'Casa Colomos, Guadalajara', organizador: 'UdeG Cultura', categoria: 'Cine', color: '#a855f7', link: '#' },
  { id: 6, titulo: 'Taller de Serigrafía en Azotea', fecha: 'Sáb 17 Mayo', hora: '11:00 – 15:00', lugar: 'Col. Americana, Guadalajara', organizador: 'Taller Tinta', categoria: 'Taller', color: '#06b6d4', link: '#' },
];

const SPOTS = [
  { id: 1, nombre: 'La Azotea sin nombre', tipo: 'Bar / Terraza', colonia: 'Colonia Americana', foto: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', descripcion: 'Subir por una escalera sin señalización y encontrar la mejor terraza de la colonia. Sin reservaciones, sin publicidad.', horario: 'Jue–Dom 19:00–2:00', nuevo: true },
  { id: 2, nombre: 'Café 47', tipo: 'Café oculto', colonia: 'Providencia', foto: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=80', descripcion: 'Sin letrero afuera. La entrada es un pasillo de edificio. El mejor café de filtro de la colonia, según quienes lo conocen.', horario: 'Lun–Vie 8:00–17:00', nuevo: false },
  { id: 3, nombre: 'El Sótano', tipo: 'Jazz bar underground', colonia: 'Centro Histórico', foto: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=600&q=80', descripcion: 'Cuatro escalones abajo de la calle, jazz en vivo todos los jueves. Capacidad para 30 personas. Llega temprano.', horario: 'Jue–Sáb 21:00–3:00', nuevo: true },
  { id: 4, nombre: 'Jardín del Tiempo', tipo: 'Jardín secreto', colonia: 'Tlaquepaque', foto: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&q=80', descripcion: 'Un jardín escondido entre vecindades. Solo saben los que viven cerca. Llevas algo para tomar, te quedas horas.', horario: 'Siempre abierto', nuevo: false },
  { id: 5, nombre: 'Taller Lunes', tipo: 'Espacio cultural', colonia: 'Analco', foto: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=600&q=80', descripcion: 'Taller de serigrafía, exposiciones emergentes y café de especialidad en un mismo espacio. Sin pretensiones.', horario: 'Lun–Sáb 11:00–20:00', nuevo: true },
  { id: 6, nombre: 'Mirador 36', tipo: 'Vista panorámica', colonia: 'San Juan de Dios', foto: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&q=80', descripcion: 'El edificio más alto de la colonia, azotea abierta los domingos. La mejor vista de la ciudad sin una selfie en el horizonte.', horario: 'Dom 14:00–20:00', nuevo: false },
];

const TABS: { id: Tab; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'planes',  label: 'Planes',  icon: <Sparkles size={15} />, desc: 'Experiencias curadas para reconectar' },
  { id: 'eventos', label: 'Eventos', icon: <Calendar size={15} />, desc: 'Lo que pasa esta semana en tu ciudad' },
  { id: 'spots',   label: 'Spots',   icon: <Map size={15} />,      desc: 'Lugares que deberías conocer' },
];

export function DashboardPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('planes');
  const [showWelcome, setShowWelcome] = useState(true);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <div />
          <div className="dashboard-logo-center"><BruukLogo /></div>
          <div className="dashboard-user">
            {user?.email && <span className="dashboard-email">{user.email}</span>}
            <button className="btn-icon" onClick={handleSignOut} title="Cerrar sesión">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {showWelcome && (
        <div className="welcome-overlay" onClick={() => setShowWelcome(false)}>
          <div className="welcome-modal" onClick={e => e.stopPropagation()}>
            <button className="welcome-modal-close" onClick={() => setShowWelcome(false)}>
              <X size={18} />
            </button>
            <div className="welcome-modal-top">
              <span className="welcome-chip">
                <span className="welcome-dot" />
                ACCESO ANTICIPADO
              </span>
              <h2 className="brand-gradient-text welcome-modal-title">Bienvenido a BRUUK.</h2>
              <p className="welcome-modal-sub">
                Planes reales para redescubrir tu ciudad. Eventos que valen la pena. Spots que no salen en ninguna app.
              </p>
            </div>
            <div className="welcome-modal-items">
              {TABS.map(t => (
                <button
                  key={t.id}
                  className="welcome-item"
                  onClick={() => { setActiveTab(t.id); setShowWelcome(false); }}
                >
                  <span className="welcome-item-icon">{t.icon}</span>
                  <div className="welcome-item-text">
                    <span className="welcome-item-label">{t.label}</span>
                    <span className="welcome-item-desc">{t.desc}</span>
                  </div>
                  <ChevronRight size={16} className="welcome-item-arrow" />
                </button>
              ))}
            </div>
            <button className="welcome-modal-cta btn btn-primary" onClick={() => setShowWelcome(false)}>
              Explorar todo <ArrowRight size={17} strokeWidth={3} />
            </button>
          </div>
        </div>
      )}

      <main className="dashboard-main">
        <div className="tabs-nav-wrap">
          <div className="tabs-nav">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.icon}{t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="tab-content">

          {/* PLANES */}
          {activeTab === 'planes' && (
            <section className="dashboard-section animate-fade-in">
              <div className="container">
                <div className="section-header">
                  <div>
                    <span className="section-tag">/ Planes curados</span>
                    <h2 className="section-title">Redescubre tu ciudad</h2>
                  </div>
                  <p className="section-sub">Experiencias pensadas para salir del loop, reconectar con personas reales y ver tu ciudad con ojos nuevos.</p>
                </div>
                <div className="planes-grid">
                  {PLANES.map(plan => (
                    <div className="plan-card" key={plan.id} style={{ '--card-color': plan.color } as React.CSSProperties}>
                      <div className="plan-card-top">
                        <span className="plan-chip" style={{ background: plan.color }}>
                          {plan.icon}{plan.categoria}
                        </span>
                        <div className="plan-meta">
                          <span className="plan-meta-item"><Clock size={13} />{plan.duracion}</span>
                          <span className="plan-nivel" style={{ color: plan.color }}>{plan.nivel}</span>
                        </div>
                      </div>
                      <h3 className="plan-title">{plan.titulo}</h3>
                      <p className="plan-desc">{plan.descripcion}</p>
                      <button className="plan-cta btn btn-primary" style={{ background: plan.color, borderColor: plan.color }}>
                        Hacer este plan <ArrowRight size={16} strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* EVENTOS */}
          {activeTab === 'eventos' && (
            <section className="dashboard-section animate-fade-in">
              <div className="container">
                <div className="section-header">
                  <div>
                    <span className="section-tag">/ Eventos</span>
                    <h2 className="section-title">Pasa en tu ciudad</h2>
                  </div>
                  <p className="section-sub">Curados por BRUUK, no por un algoritmo.</p>
                </div>
                <div className="eventos-grid">
                  {EVENTOS.map(ev => (
                    <div className="evento-card" key={ev.id} style={{ borderTop: `3px solid ${ev.color}` }}>
                      <div className="evento-card-header">
                        <span className="evento-categoria-chip" style={{ background: ev.color }}>{ev.categoria}</span>
                        <span className="evento-fecha"><Calendar size={13} />{ev.fecha}</span>
                      </div>
                      <h3 className="evento-title">{ev.titulo}</h3>
                      <div className="evento-details">
                        <span className="evento-detail"><MapPin size={13} />{ev.lugar}</span>
                        <span className="evento-detail"><Clock size={13} />{ev.hora}</span>
                      </div>
                      <div className="evento-footer">
                        <span className="evento-org">Por {ev.organizador}</span>
                        <a href={ev.link} className="evento-link" target="_blank" rel="noopener noreferrer">
                          Ver info <ExternalLink size={13} />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* SPOTS */}
          {activeTab === 'spots' && (
            <section className="dashboard-section animate-fade-in">
              <div className="container">
                <div className="section-header">
                  <div>
                    <span className="section-tag">/ Spots by BRUUK</span>
                    <h2 className="section-title">Lugares que deberías conocer</h2>
                  </div>
                  <p className="section-sub">Sin algoritmos. Sin reseñas de influencers. Solo lugares que valen la pena.</p>
                </div>
                <div className="planes-grid">
                  {SPOTS.map(spot => (
                    <div className="spot-card" key={spot.id}>
                      <div
                        className="spot-photo"
                        style={spot.foto
                          ? { backgroundImage: `url(${spot.foto})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                          : { background: 'linear-gradient(135deg, #8b7cf622, #8b7cf655)' }
                        }
                      >
                        {!spot.foto && <Map size={32} className="spot-photo-icon" />}
                        <div className="spot-photo-badges">
                          {spot.nuevo && <span className="spot-nuevo-badge"><Star size={10} fill="currentColor" /> NUEVO</span>}
                          <span className="spot-bruuk-badge">SPOT BRUUK</span>
                        </div>
                      </div>
                      <div className="spot-body">
                        <div className="spot-top">
                          <span className="spot-colonia"><MapPin size={12} />{spot.colonia}</span>
                          <span className="spot-tipo">{spot.tipo}</span>
                        </div>
                        <h3 className="spot-title">{spot.nombre}</h3>
                        <p className="spot-desc">{spot.descripcion}</p>
                        <div className="spot-footer">
                          <span className="spot-horario"><Clock size={12} />{spot.horario}</span>
                          <button className="spot-cta">Cómo llegar <ArrowRight size={13} strokeWidth={3} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

        </div>
      </main>

      <footer className="dashboard-footer">
        <div className="container">
          <span>BRUUK © {new Date().getFullYear()}</span>
          <span>Menos pantalla. Más mundo.</span>
        </div>
      </footer>
    </div>
  );
}
