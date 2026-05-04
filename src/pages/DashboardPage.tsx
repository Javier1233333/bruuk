import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut, MapPin, Calendar, ArrowRight, Zap, Palette,
  Utensils, Users, Clock, ExternalLink, X, Sparkles,
  Map, Star, ChevronRight
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
    foto: null as string | null,
    titulo: 'Cena ciega',
    descripcion: 'Aparece en un restaurante sin saber el menú. Sin planear, sin expectativas. Solo tú y lo que llegue.',
    duracion: '2–3 hrs',
    nivel: 'Espontáneo',
  },
  {
    id: 2,
    categoria: 'Arte',
    color: '#ec4899',
    icon: <Palette size={16} />,
    foto: null as string | null,
    titulo: 'Ruta de galerías indie',
    descripcion: 'Elige una colonia, entra a cada galería pequeña que encuentres. Mezcal en mano, conversación asegurada.',
    duracion: '3–4 hrs',
    nivel: 'Cultural',
  },
  {
    id: 3,
    categoria: 'Social',
    color: '#10b981',
    icon: <Users size={16} />,
    foto: null as string | null,
    titulo: 'Azotea de alguien',
    descripcion: 'Organiza una reunión en una azotea con gente que no conoces bien. El view hace el trabajo.',
    duracion: 'Toda la noche',
    nivel: 'Comunidad',
  },
  {
    id: 4,
    categoria: 'Adrenalina',
    color: '#8b7cf6',
    icon: <Zap size={16} />,
    foto: null as string | null,
    titulo: 'Plan de último minuto',
    descripcion: 'Abre el mapa, elige el punto más interesante a 20 minutos, ve ahora. Sin justificarte a nadie.',
    duracion: 'Lo que sea',
    nivel: 'Impulsivo',
  },
];

const EVENTOS = [
  {
    id: 1,
    titulo: 'Mercado de Diseño Independiente',
    fecha: 'Sáb 10 Mayo',
    hora: '12:00 – 20:00',
    lugar: 'Plaza Río de Janeiro, Condesa',
    organizador: 'Colectivo Campo',
    categoria: 'Diseño',
    color: '#f97316',
    link: '#',
  },
  {
    id: 2,
    titulo: 'Jazz & Mezcal en Foro Alicia',
    fecha: 'Vie 9 Mayo',
    hora: '21:00 – 2:00',
    lugar: 'Foro Alicia, Centro',
    organizador: 'Foro Alicia',
    categoria: 'Música',
    color: '#3b82f6',
    link: '#',
  },
  {
    id: 3,
    titulo: 'Exposición: Arte Emergente CDMX',
    fecha: 'Hasta 25 Mayo',
    hora: 'Mar–Dom 10:00–18:00',
    lugar: 'Museo del Chopo, Sta. Mª la Ribera',
    organizador: 'Museo del Chopo',
    categoria: 'Arte',
    color: '#ec4899',
    link: '#',
  },
  {
    id: 4,
    titulo: 'Feria de Libros Raros & Usados',
    fecha: 'Dom 11 Mayo',
    hora: '10:00 – 17:00',
    lugar: 'Parque México, Condesa',
    organizador: 'Libros Ambulantes',
    categoria: 'Literatura',
    color: '#84cc16',
    link: '#',
  },
  {
    id: 5,
    titulo: 'Noche de Cine Experimental',
    fecha: 'Jue 8 Mayo',
    hora: '19:30 – 23:00',
    lugar: 'Casa del Lago, Chapultepec',
    organizador: 'UNAM Cultura',
    categoria: 'Cine',
    color: '#a855f7',
    link: '#',
  },
  {
    id: 6,
    titulo: 'Taller de Serigrafía en Azotea',
    fecha: 'Sáb 17 Mayo',
    hora: '11:00 – 15:00',
    lugar: 'Col. Roma Norte',
    organizador: 'Taller Tinta',
    categoria: 'Taller',
    color: '#06b6d4',
    link: '#',
  },
];

const SPOTS = [
  {
    id: 1,
    nombre: 'La Azotea sin nombre',
    tipo: 'Bar / Terraza',
    colonia: 'Roma Norte',
    foto: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
    descripcion: 'Subir por una escalera sin señalización y encontrar la mejor terraza de la colonia. Sin reservaciones, sin publicidad.',
    horario: 'Jue–Dom 19:00–2:00',
    nuevo: true,
  },
  {
    id: 2,
    nombre: 'Café 47',
    tipo: 'Café oculto',
    colonia: 'Condesa',
    foto: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=80',
    descripcion: 'Sin letrero afuera. La entrada es un pasillo de edificio. El mejor café de filtro de la colonia, según quienes lo conocen.',
    horario: 'Lun–Vie 8:00–17:00',
    nuevo: false,
  },
  {
    id: 3,
    nombre: 'El Sótano',
    tipo: 'Jazz bar underground',
    colonia: 'Centro Histórico',
    foto: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=600&q=80',
    descripcion: 'Cuatro escalones abajo de la calle, jazz en vivo todos los jueves. Capacidad para 30 personas. Llega temprano.',
    horario: 'Jue–Sáb 21:00–3:00',
    nuevo: true,
  },
  {
    id: 4,
    nombre: 'Jardín del Tiempo',
    tipo: 'Jardín secreto',
    colonia: 'Coyoacán',
    foto: 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600&q=80',
    descripcion: 'Un jardín escondido entre vecindades. Solo saben los que viven cerca. Llevas algo para tomar, te quedas horas.',
    horario: 'Siempre abierto',
    nuevo: false,
  },
  {
    id: 5,
    nombre: 'Taller Lunes',
    tipo: 'Espacio cultural',
    colonia: 'Doctores',
    foto: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=600&q=80',
    descripcion: 'Taller de serigrafía, exposiciones emergentes y café de especialidad en un mismo espacio. Sin pretensiones.',
    horario: 'Lun–Sáb 11:00–20:00',
    nuevo: true,
  },
  {
    id: 6,
    nombre: 'Mirador 36',
    tipo: 'Vista panorámica',
    colonia: 'Tepito',
    foto: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&q=80',
    descripcion: 'El edificio más alto de la colonia, azotea abierta los domingos. La mejor vista de la ciudad sin una selfie en el horizonte.',
    horario: 'Dom 14:00–20:00',
    nuevo: false,
  },
];

const TABS: { id: Tab; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'planes', label: 'Planes', icon: <Sparkles size={15} />, desc: 'Ideas curadas para salir' },
  { id: 'eventos', label: 'Eventos', icon: <Calendar size={15} />, desc: 'Pasa esta semana en tu ciudad' },
  { id: 'spots', label: 'Spots', icon: <Map size={15} />, desc: 'Lugares nuevos by BRUUK' },
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
          <div className="dashboard-logo-center">
            <BruukLogo />
          </div>
          <div className="dashboard-user">
            {user?.email && <span className="dashboard-email">{user.email}</span>}
            <button className="btn-icon" onClick={handleSignOut} title="Cerrar sesión">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Modal de bienvenida ── */}
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
                Aquí no hay feed. Hay tres cosas para hacerte salir.
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

        {/* ── Tab nav ── */}
        <div className="tabs-nav-wrap">
          <div className="tabs-nav">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => setActiveTab(t.id)}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Contenido del tab activo ── */}
        <div className="tab-content">

          {/* PLANES */}
          {activeTab === 'planes' && (
            <section className="dashboard-section animate-fade-in">
              <div className="container">
                <div className="section-header">
                  <div>
                    <span className="section-tag">/ Planes</span>
                    <h2 className="section-title">Ideas para salir hoy</h2>
                  </div>
                  <p className="section-sub">No necesitas un plan perfecto. Solo un punto de partida.</p>
                </div>
                <div className="planes-grid">
                  {PLANES.map(plan => (
                    <div
                      className="plan-card"
                      key={plan.id}
                      style={{ '--card-color': plan.color } as React.CSSProperties}
                    >
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
                      <button
                        className="plan-cta btn btn-primary"
                        style={{ background: plan.color, borderColor: plan.color }}
                      >
                        Explorar plan <ArrowRight size={16} strokeWidth={3} />
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
                    <div
                      className="evento-card"
                      key={ev.id}
                      style={{ borderTop: `3px solid ${ev.color}` }}
                    >
                      <div className="evento-card-header">
                        <span className="evento-categoria-chip" style={{ background: ev.color }}>
                          {ev.categoria}
                        </span>
                        <span className="evento-fecha">
                          <Calendar size={13} />{ev.fecha}
                        </span>
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
                          {spot.nuevo && (
                            <span className="spot-nuevo-badge">
                              <Star size={10} fill="currentColor" /> NUEVO
                            </span>
                          )}
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
