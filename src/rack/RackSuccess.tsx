import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from './cart/CartContext';
import { RackHeader } from './components/RackHeader';
import './rack.css';
import './RackSuccess.css';

interface OrderSummary {
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  items: { title: string; price: number; category: string }[];
  amountTotal: number;
}

const formatPrice = (n: number) =>
  n.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

/* El webhook de Stripe puede tardar unos segundos en confirmar la
   orden después del redirect, así que se reintenta hasta 5 veces. */
const MAX_ATTEMPTS = 5;
const RETRY_MS = 2000;

export function RackSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clear } = useCart();
  const sessionId = searchParams.get('session_id');

  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [exhausted, setExhausted] = useState(false);
  const clearedRef = useRef(false);
  const failed = exhausted || !sessionId;

  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    let attempt = 0;

    const fetchOrder = async () => {
      attempt += 1;
      try {
        const res = await fetch(`/api/rack/orders?session_id=${encodeURIComponent(sessionId)}`);
        if (res.ok) {
          const data: OrderSummary = await res.json();
          if (cancelled) return;
          setOrder(data);
          if (data.status === 'paid') return; // listo
        }
      } catch {
        // red caída — se reintenta abajo
      }
      if (!cancelled && attempt < MAX_ATTEMPTS) {
        setTimeout(fetchOrder, RETRY_MS);
      } else if (!cancelled) {
        setExhausted(true);
      }
    };

    fetchOrder();
    return () => { cancelled = true; };
  }, [sessionId]);

  /* Vaciar el carrito una sola vez cuando se confirma el pago */
  useEffect(() => {
    if (order?.status === 'paid' && !clearedRef.current) {
      clearedRef.current = true;
      clear();
    }
  }, [order, clear]);

  const paid = order?.status === 'paid';

  return (
    <div className="rack-page rack-success">
      <RackHeader />

      <section className="rack-success__content">
        {paid ? (
          <>
            <p className="rack-success__tag">/ ORDEN CONFIRMADA</p>
            <h1 className="rack-success__title">ES TUYA.</h1>
            <p className="rack-success__subtitle">
              Pago recibido. Te escribimos al correo que dejaste en el checkout
              para coordinar la entrega.
            </p>

            <div className="rack-success__items">
              {order.items.map((it, i) => (
                <div key={i} className="rack-success__item">
                  <span className="rack-success__item-title">{it.title?.toUpperCase()}</span>
                  <span className="rack-success__item-price">{formatPrice(it.price ?? 0)}</span>
                </div>
              ))}
              <div className="rack-success__item rack-success__item--total">
                <span className="rack-success__item-title">TOTAL</span>
                <span className="rack-success__item-price">{formatPrice(order.amountTotal)} MXN</span>
              </div>
            </div>
          </>
        ) : failed ? (
          <>
            <p className="rack-success__tag">/ ORDEN</p>
            <h1 className="rack-success__title">CASI.</h1>
            <p className="rack-success__subtitle">
              No pudimos confirmar tu orden todavía. Si el cargo aparece en tu
              tarjeta, no te preocupes — la confirmación llegará a tu correo.
            </p>
          </>
        ) : (
          <>
            <p className="rack-success__tag">/ ORDEN</p>
            <h1 className="rack-success__title">CONFIRMANDO...</h1>
            <p className="rack-success__subtitle">Verificando tu pago con Stripe.</p>
          </>
        )}

        <button
          className="rack-btn-secondary rack-success__btn"
          onClick={() => navigate('/rack/explorar')}
        >
          SEGUIR EXPLORANDO
        </button>
      </section>
    </div>
  );
}
