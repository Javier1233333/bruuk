import type { Category } from './adminCategories';

// Componentes que comparten las secciones del admin (Spots, Rack y Zonas).

// Encabezado plegable de cada categoría: cuántos hay y cuántos sin zona
export function CategoryGroup({ label, Icon, count, missingZone, children }: Category & { count: number; missingZone: number; children: React.ReactNode }) {
  return (
    <details className="sa-group" open>
      <summary>
        <Icon size={16} aria-hidden="true" />
        <span className="sa-group__label">{label}</span>
        <span className="sa-group__count">{count}</span>
        {missingZone > 0 && <span className="sa-group__missing">{missingZone} sin zona</span>}
      </summary>
      <ul className="sa-list">{children}</ul>
    </details>
  );
}

// Miniatura de la lista; los tianguis no tienen foto
export function RowImage({ src, name }: { src?: string | null; name: string }) {
  return src
    ? <img className="sa-row__img" src={src} alt="" loading="lazy" />
    : <span className="sa-row__img sa-row__img--empty" aria-hidden="true">{name.slice(0, 2).toUpperCase()}</span>;
}
