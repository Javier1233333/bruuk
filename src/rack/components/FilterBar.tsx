import type { ProductCategory } from '../types/rack';
import './FilterBar.css';

type FilterOption = 'all' | ProductCategory;

interface FilterBarProps {
  activeFilter: FilterOption;
  onFilterChange: (filter: FilterOption) => void;
}

const FILTERS: Array<{ value: FilterOption; label: string }> = [
  { value: 'all',        label: 'TODO'       },
  { value: 'pre-owned',  label: 'PRE-OWNED'  },
  { value: 'artesanal',  label: 'ARTESANAL'  },
];

export function FilterBar({ activeFilter, onFilterChange }: FilterBarProps) {
  return (
    <nav className="rack-filter-bar" aria-label="Filtros de categoría">
      {FILTERS.map(({ value, label }) => (
        <button
          key={value}
          className={`rack-filter-bar__btn${activeFilter === value ? ' rack-filter-bar__btn--active' : ''}`}
          onClick={() => onFilterChange(value)}
          aria-pressed={activeFilter === value}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
