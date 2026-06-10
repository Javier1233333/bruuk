import type { ProductStatus } from '../types/rack';
import './StockBadge.css';

interface StockBadgeProps {
  status: ProductStatus;
}

const STATUS_CONFIG: Record<ProductStatus, { label: string; modifier: string }> = {
  disponible: { label: 'PIEZA ÚNICA', modifier: 'disponible' },
  apartado:   { label: 'APARTADO',    modifier: 'apartado' },
  agotado:    { label: 'AGOTADO',     modifier: 'agotado' },
};

export function StockBadge({ status }: StockBadgeProps) {
  const { label, modifier } = STATUS_CONFIG[status];

  return (
    <span
      className={`rack-stock-badge rack-stock-badge--${modifier}`}
      aria-label={`Estado: ${label}`}
    >
      {label}
    </span>
  );
}
