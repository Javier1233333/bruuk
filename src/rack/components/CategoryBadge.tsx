import type { ProductCategory } from '../types/rack';
import './CategoryBadge.css';

interface CategoryBadgeProps {
  category: ProductCategory;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const label = category === 'pre-owned' ? 'PRE-OWNED' : 'ARTESANAL';

  return (
    <span
      className={`rack-category-badge rack-category-badge--${category}`}
      aria-label={`Categoría: ${label}`}
    >
      {label}
    </span>
  );
}
