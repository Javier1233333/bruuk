import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRackProduct, useRackProducts } from './hooks/useRackApi';
import { useCart } from './cart/CartContext';
import { startCheckout } from './cart/checkout';
import { RackHeader } from './components/RackHeader';
import { CategoryBadge } from './components/CategoryBadge';
import { StockBadge } from './components/StockBadge';
import { CreatorChip } from './components/CreatorChip';
import { ProductCard } from './components/ProductCard';
import './rack.css';
import './RackProductDetail.css';

export function RackProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: product, loading, error } = useRackProduct(slug);
  const { data: allProducts } = useRackProducts();
  const { addItem, has } = useCart();

  const [justAdded, setJustAdded] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  /* Reset del estado local al navegar a otra pieza */
  const [lastSlug, setLastSlug] = useState(slug);
  if (slug !== lastSlug) {
    setLastSlug(slug);
    setJustAdded(false);
    setCheckoutError(null);
  }

  /* Scroll al tope al navegar */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [slug]);

  /* Loading */
  if (loading) {
    return (
      <div className="rack-page rack-product-detail">
        <RackHeader />
        <div className="rack-product-detail__not-found">
          <p className="rack-product-detail__not-found-text">Cargando pieza...</p>
        </div>
      </div>
    );
  }

  /* Pieza no encontrada */
  if (!product || error) {
    return (
      <div className="rack-page rack-product-detail">
        <RackHeader />
        <div className="rack-product-detail__not-found">
          <p className="rack-product-detail__not-found-text">Pieza no encontrada.</p>
          <button
            className="rack-btn-secondary rack-product-detail__not-found-btn"
            onClick={() => navigate('/rack/explorar')}
          >
            VOLVER AL EXPLORAR
          </button>
        </div>
      </div>
    );
  }

  const otherProducts = (allProducts ?? []).filter((p) => p.id !== product.id);

  const formattedPrice = product.price.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  const available = product.status === 'disponible';
  const inCart = has(product.id);

  const handleAddToCart = () => {
    if (inCart) {
      navigate('/rack/carrito');
      return;
    }
    addItem(product);
    setJustAdded(true);
  };

  /* APARTAR = ir directo al pago de esta pieza. La sesión de Stripe
     la reserva 30 min en el servidor. */
  const handleReserve = async () => {
    setReserving(true);
    setCheckoutError(null);
    const result = await startCheckout([product.id]);
    if (result.ok) {
      window.location.assign(result.url);
      return;
    }
    setReserving(false);
    setCheckoutError(result.error);
  };

  const addLabel = !available
    ? product.status === 'apartado' ? 'ALGUIEN LA ESTÁ APARTANDO' : 'YA NO ESTÁ'
    : inCart
      ? 'EN EL CARRITO — VER →'
      : justAdded
        ? 'AGREGADA ✓'
        : 'AGREGAR AL CARRITO';

  return (
    <div className="rack-page rack-product-detail">
      <RackHeader />

      {/* ── Imagen de producto ─────────────────────────────── */}
      <div
        className="rack-product-detail__image-wrap"
        style={{ backgroundColor: product.colorPlaceholder }}
      >
        {/* Badge categoría — positioned absolute top-left */}
        <div className="rack-product-detail__image-badge">
          <CategoryBadge category={product.category} />
        </div>

        {/* Dots de navegación de imágenes */}
        <div className="rack-product-detail__dots" aria-hidden="true">
          <span className="rack-product-detail__dot rack-product-detail__dot--active" />
          <span className="rack-product-detail__dot" />
          <span className="rack-product-detail__dot" />
          <span className="rack-product-detail__dot" />
        </div>
      </div>

      {/* ── Info section ───────────────────────────────────── */}
      <section className="rack-product-detail__info">
        {/* Título */}
        <h1 className="rack-product-detail__title">{product.title.toUpperCase()}</h1>

        {/* Precio + StockBadge */}
        <div className="rack-product-detail__price-row">
          <span className="rack-product-detail__price">{formattedPrice} MXN</span>
          <StockBadge status={product.status} />
        </div>

        {/* Botón AGREGAR AL CARRITO */}
        <button
          className="rack-product-detail__btn-add"
          type="button"
          disabled={!available}
          onClick={handleAddToCart}
        >
          {addLabel}
        </button>

        {/* Botón APARTAR PIEZA — va directo al pago */}
        <button
          className="rack-product-detail__btn-hold"
          type="button"
          disabled={!available || reserving}
          onClick={handleReserve}
        >
          {reserving ? 'APARTANDO...' : 'APARTAR PIEZA'}
        </button>

        {checkoutError && (
          <p className="rack-product-detail__checkout-error" role="alert">
            {checkoutError}
          </p>
        )}

        {/* Separador */}
        <div className="rack-separator rack-product-detail__separator" />

        {/* Condición — solo si el producto la tiene */}
        {product.condition && (
          <div className="rack-product-detail__condition-row">
            <span className="rack-product-detail__condition-label">CONDICIÓN</span>
            <span className="rack-product-detail__condition-value">{product.condition}</span>
          </div>
        )}

        {/* Descripción */}
        <p className="rack-product-detail__description">{product.description}</p>

        {/* Historia */}
        {product.story && (
          <>
            <p className="rack-product-detail__story-label">HISTORIA</p>
            <p className="rack-product-detail__story">{product.story}</p>
          </>
        )}

        {/* Separador */}
        <div className="rack-separator rack-product-detail__separator" />

        {/* CreatorChip */}
        {product.creator && (
          <CreatorChip creator={product.creator} />
        )}
      </section>

      {/* ── Sigue explorando ───────────────────────────────── */}
      <section className="rack-product-detail__more">
        <p className="rack-product-detail__more-label">SIGUE EXPLORANDO</p>
        <div className="rack-product-detail__more-feed">
          {otherProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
