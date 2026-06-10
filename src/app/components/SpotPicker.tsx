import { useState, useMemo } from 'react';
import { X, Check } from 'lucide-react';
import type { Spot } from '../hooks/useSpots';
import './SpotPicker.css';

interface SpotPickerProps {
  spots: Spot[];
  excludeIds?: string[];
  onAdd: (selected: Spot[]) => void;
  onClose: () => void;
}

export function SpotPicker({ spots, excludeIds = [], onAdd, onClose }: SpotPickerProps) {
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState<string>('Todos');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Tipos únicos extraídos del array de spots
  const types = useMemo(() => {
    const set = new Set(spots.map((s) => s.type));
    return ['Todos', ...Array.from(set).sort()];
  }, [spots]);

  const filtered = useMemo(() => {
    return spots.filter((s) => {
      if (excludeIds.includes(s.id)) return false;
      if (activeType !== 'Todos' && s.type !== activeType) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.type.toLowerCase().includes(q);
      }
      return true;
    });
  }, [spots, excludeIds, activeType, query]);

  const toggleSpot = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = () => {
    const selected = spots.filter((s) => selectedIds.has(s.id));
    onAdd(selected);
  };

  return (
    <>
      <div className="spot-picker-overlay" onClick={onClose} />
      <div className="spot-picker-sheet" role="dialog" aria-modal="true" aria-label="Agregar spot">
        <div className="spot-picker-handle" />

        <div className="spot-picker__header">
          <h3 className="spot-picker__title">Agregar Spot</h3>
          <button className="spot-picker__close" onClick={onClose} aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <input
          className="spot-picker__search"
          type="text"
          placeholder="Buscar por nombre..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />

        <div className="spot-picker__filters" role="group" aria-label="Filtrar por tipo">
          {types.map((type) => (
            <button
              key={type}
              className={`spot-picker__filter-btn ${
                activeType === type
                  ? 'spot-picker__filter-btn--active'
                  : 'spot-picker__filter-btn--inactive'
              }`}
              onClick={() => setActiveType(type)}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="spot-picker__separator" />

        <div className="spot-picker__list">
          {filtered.map((spot) => {
            const isSelected = selectedIds.has(spot.id);
            return (
              <button
                key={spot.id}
                className={`spot-picker__row${isSelected ? ' spot-picker__row--selected' : ''}`}
                onClick={() => toggleSpot(spot.id)}
                aria-pressed={isSelected}
              >
                <span
                  className="spot-picker__dot"
                  style={{ backgroundColor: spot.colorAccent }}
                />
                <div className="spot-picker__row-info">
                  <span className="spot-picker__row-name">{spot.name}</span>
                  <span className="spot-picker__row-meta">{spot.type}</span>
                </div>
                {spot.price && (
                  <span className="spot-picker__row-price">{spot.price}</span>
                )}
                {isSelected && (
                  <span className="spot-picker__row-check">
                    <Check size={16} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="spot-picker__footer">
          <button
            className="spot-picker__add-btn"
            onClick={handleAdd}
            disabled={selectedIds.size === 0}
          >
            {selectedIds.size > 0
              ? `AGREGAR ${selectedIds.size} SPOT${selectedIds.size > 1 ? 'S' : ''}`
              : 'AGREGAR SELECCIONADOS'}
          </button>
        </div>
      </div>
    </>
  );
}
