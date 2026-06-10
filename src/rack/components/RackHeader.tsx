import { useNavigate } from 'react-router-dom';
import { useCart } from '../cart/CartContext';
import rackLogo from '../../../img/rack-logo.png';
import './RackHeader.css';

export function RackHeader() {
  const navigate = useNavigate();
  const { count } = useCart();

  return (
    <header className="rack-header">
      <button className="rack-header__back" onClick={() => navigate(-1)} aria-label="Volver">
        <span className="rack-header__back-arrow">←</span>
      </button>

      <button
        className="rack-header__cart"
        aria-label={`Carrito con ${count} artículos`}
        onClick={() => navigate('/rack/carrito')}
      >
        CARRITO ({count})
      </button>

      <img
        src={rackLogo}
        alt="RACK."
        className="rack-header__logo-img"
      />
    </header>
  );
}
