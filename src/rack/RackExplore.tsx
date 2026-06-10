import { useState, useMemo } from 'react';
import type { ProductCategory } from './types/rack';
import { useRackProducts, useRackEvents } from './hooks/useRackApi';
import { RackHeader } from './components/RackHeader';
import { FilterBar } from './components/FilterBar';
import { ProductCard } from './components/ProductCard';
import { BruukEventAd } from './components/BruukEventAd';
import { DropsTeaser } from './components/DropsTeaser';
import './rack.css';
import './RackExplore.css';

type FilterOption = 'all' | ProductCategory;

/* ------------------------------------------------------------------ */
/* Lógica de intercalado: inserta ads después del N-ésimo producto     */
/* ------------------------------------------------------------------ */
const AD_POSITIONS = [3, 6, 9] as const;

export function RackExplore() {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const { data: products, loading, error } = useRackProducts();
  const { data: events } = useRackEvents();

  const allEvents = events ?? [];

  const filteredProducts = useMemo(() => {
    const all = products ?? [];
    if (activeFilter === 'all') return all;
    return all.filter((p) => p.category === activeFilter);
  }, [activeFilter, products]);

  /* Construye el feed intercalando ads en las posiciones indicadas */
  const feedItems = useMemo(() => {
    type FeedItem =
      | { type: 'product'; id: string }
      | { type: 'ad'; adIndex: number; position: number };

    const items: FeedItem[] = [];
    let adIndex = 0;

    filteredProducts.forEach((product, i) => {
      items.push({ type: 'product', id: product.id });

      const position = i + 1; // 1-based
      if ((AD_POSITIONS as readonly number[]).includes(position)) {
        items.push({ type: 'ad', adIndex, position });
        adIndex++;
      }
    });

    return items;
  }, [filteredProducts]);

  const AD_CONFIGS: Array<{
    variant: 'centered' | 'lateral' | 'banner';
    eventIndex: number;
    ctaLabel: string;
    description?: string;
    tag?: string;
  }> = [
    {
      variant: 'centered',
      eventIndex: 0,
      ctaLabel: 'EXPLORAR →',
    },
    {
      variant: 'lateral',
      eventIndex: 1,
      ctaLabel: 'VER TALLER →',
      tag: 'TALLER',
      description: 'Aprende serigrafía con artistas locales. Cupos limitados.',
    },
    {
      variant: 'banner',
      eventIndex: 2,
      ctaLabel: 'MÁS INFO →',
      tag: 'EVENTO',
    },
  ];

  return (
    <div className="rack-page rack-explore">
      <RackHeader />

      <FilterBar
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      <main className="rack-explore__feed">
        {loading && (
          <div className="rack-explore__loading">
            <p>Cargando piezas...</p>
          </div>
        )}

        {error && (
          <div className="rack-explore__error">
            <p>Error al cargar las piezas.</p>
            <button className="rack-btn-secondary" onClick={() => window.location.reload()}>
              REINTENTAR
            </button>
          </div>
        )}

        {!loading && !error && feedItems.map((item) => {
          if (item.type === 'product') {
            const product = filteredProducts.find((p) => p.id === item.id);
            if (!product) return null;
            return <ProductCard key={product.id} product={product} />;
          }

          /* Ad */
          const config = AD_CONFIGS[item.adIndex];
          if (!config) return null;
          const event = allEvents[config.eventIndex];
          if (!event) return null;

          return (
            <BruukEventAd
              key={`ad-${item.adIndex}`}
              variant={config.variant}
              event={event}
              ctaLabel={config.ctaLabel}
              description={config.description}
              tag={config.tag}
            />
          );
        })}

        {!loading && !error && filteredProducts.length === 0 && (
          <div className="rack-explore__empty">
            <p>No hay piezas en esta categoría todavía.</p>
          </div>
        )}

        {!loading && <DropsTeaser />}
      </main>
    </div>
  );
}
