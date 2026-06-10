import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from './cart/CartContext';
import { startCheckout } from './cart/checkout';
import { RackHeader } from './components/RackHeader';
import { CategoryBadge } from './components/CategoryBadge';
import './rack.css';
import './RackCart.css';

const formatPrice = (n: number) =>
  n.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

export function RackCart() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { items, total, removeItem } = useCart();
  const [paying, setPaying] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const cancelled = searchParams.get('cancelled') === '1';

  const handlePay = async () => {
    setPaying(true);
    setCheckoutError(null);
    const result = await startCheckout(items.map((it) => it.id));
    if (result.ok) {
      window.location.assign(result.url);
      return;
    }
    setPaying(false);
    setCheckoutError(result.error);
  };

  if (items.length === 0) {
    return (
      <div className="rack-page rack-cart">
        <RackHeader />
        <div className="rack-cart__empty">
          <p className="rack-cart__empty-text">Tu carrito está vacío.</p>
          <button
            className="rack-btn-secondary"
            onClick={() => navigate('/rack/explorar')}
          >
            EXPLORAR EL RACK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rack-page rack-cart">
      <RackHeader />

      <section className="rack-cart__content">
        <h1 className="rack-cart__title">TU CARRITO</h1>

        {cancelled && !checkoutError && (
          <p className="rack-cart__notice">
            Pago cancelado. Tus piezas siguen aquí — pero recuerda que son únicas.
          </p>
        )}

        <div className="rack-cart__items">
          {items.map((item) => (
            <article key={item.id} className="rack-cart__item">
              <button
                className="rack-cart__item-image"
                style={{ backgroundColor: item.colorPlaceholder }}
                onClick={() => navigate(`/rack/pieza/${item.slug}`)}
                aria-label={`Ver ${item.title}`}
              >
                {item.image && <img src={item.image} alt="" loading="lazy" />}
              </button>

              <div className="rack-cart__item-info">
                <p className="rack-cart__item-title">{item.title.toUpperCase()}</p>
                <CategoryBadge category={item.category} />
              </div>

              <div className="rack-cart__item-right">
                <p className="rack-cart__item-price">{formatPrice(item.price)}</p>
                <button
                  className="rack-cart__item-remove"
                  onClick={() => removeItem(item.id)}
                  aria-label={`Quitar ${item.title}`}
                >
                  QUITAR
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="rack-separator" />

        <div className="rack-cart__total-row">
          <span className="rack-cart__total-label">TOTAL</span>
          <span className="rack-cart__total-value">{formatPrice(total)} MXN</span>
        </div>

        <button
          className="rack-cart__btn-pay"
          type="button"
          disabled={paying}
          onClick={handlePay}
        >
          {paying ? 'CONECTANDO CON STRIPE...' : 'PAGAR CON TARJETA'}
        </button>

        {checkoutError && (
          <p className="rack-cart__error" role="alert">{checkoutError}</p>
        )}

        <p className="rack-cart__secure-note">
          Pago procesado por Stripe. Tus datos de tarjeta nunca pasan por nuestros servidores.
        </p>
      </section>
    </div>
  );
}
