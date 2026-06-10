import { useNavigate } from 'react-router-dom';
import type { RackProduct } from '../types/rack';
import { CategoryBadge } from './CategoryBadge';
import './ProductCard.css';

interface ProductCardProps {
  product: RackProduct;
}

const CATEGORY_TEXT: Record<RackProduct['category'], string> = {
  'pre-owned': 'PRE-OWNED',
  artesanal:   'ARTESANAL',
};

export function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/rack/pieza/${product.slug}`);
  };

  const formattedPrice = product.price.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const isAgotado = product.status === 'agotado';

  return (
    <article
      className="rack-product-card"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`Ver ${product.title}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); }}
    >
      {/* Foto / placeholder de color */}
      <div
        className="rack-product-card__image"
        style={{ backgroundColor: product.colorPlaceholder }}
      >
        <div className="rack-product-card__badge-overlay">
          <CategoryBadge category={product.category} />
        </div>
      </div>

      {/* Info */}
      <div className="rack-product-card__info">
        <div className="rack-product-card__info-left">
          <p className="rack-product-card__title">{product.title.toUpperCase()}</p>
          {product.condition && (
            <p className="rack-product-card__subtitle">
              Condición: {product.condition}
            </p>
          )}
          {!product.condition && product.tags.length > 0 && (
            <p className="rack-product-card__subtitle">
              {product.tags.slice(0, 2).join(' · ')}
            </p>
          )}
        </div>

        <div className="rack-product-card__info-right">
          <p className={`rack-product-card__price${isAgotado ? ' rack-product-card__price--agotado' : ''}`}>
            {formattedPrice}
          </p>
          <span className={`rack-product-card__category-label rack-product-card__category-label--${product.category}`}>
            {CATEGORY_TEXT[product.category]}
          </span>
        </div>
      </div>
    </article>
  );
}
