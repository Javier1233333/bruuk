import { useRackDrops } from './hooks/useRackApi';
import { RackHeader } from './components/RackHeader';
import './rack.css';
import './RackDrops.css';

export function RackDrops() {
  const { data: drops, loading, error } = useRackDrops();

  return (
    <div className="rack-page rack-drops">
      <RackHeader />

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="rack-drops__hero">
        <span className="rack-drops__tag">DROPS</span>
        <h1 className="rack-drops__title">CADA SEMANA,<br />ALGO NUEVO.</h1>
        <p className="rack-drops__subtitle">
          Nuevas piezas curadas cada semana. Pre-owned y artesanal.
        </p>
      </section>

      {/* ── Lista de drops ─────────────────────────────────── */}
      <section className="rack-drops__list">
        {loading && <p className="rack-drops__loading">Cargando drops...</p>}
        {error && <p className="rack-drops__loading">Error al cargar drops.</p>}
        {(drops ?? []).map((drop) => (
          <div key={drop.id} className="rack-drops__item">
            <div className="rack-drops__item-main">
              {/* Fecha */}
              <span className="rack-drops__item-date">{drop.date}</span>

              {/* Centro — título + teaser */}
              <div className="rack-drops__item-center">
                <p className="rack-drops__item-title">{drop.title}</p>
                {drop.teaser && (
                  <p className="rack-drops__item-teaser">{drop.teaser}</p>
                )}
              </div>

              {/* Cantidad */}
              <span className="rack-drops__item-count">
                {drop.pieceCount} pzs
              </span>
            </div>
          </div>
        ))}
      </section>

      {/* Separador */}
      <div className="rack-separator rack-drops__separator" />

      {/* ── CTA vender ─────────────────────────────────────── */}
      <section className="rack-drops__cta">
        <p className="rack-drops__cta-text">¿Tienes algo que vender?</p>
        <button className="rack-btn-secondary rack-drops__cta-btn" type="button">
          CONTACTAR
        </button>
      </section>
    </div>
  );
}
