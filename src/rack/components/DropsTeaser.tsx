import { useNavigate } from 'react-router-dom';
import './DropsTeaser.css';

export function DropsTeaser() {
  const navigate = useNavigate();

  return (
    <div className="rack-drops-teaser">
      <span className="rack-drops-teaser__tag">DROPS</span>
      <h3 className="rack-drops-teaser__headline">
        CADA SEMANA,<br />ALGO NUEVO.
      </h3>
      <button
        className="rack-drops-teaser__btn"
        onClick={() => navigate('/rack/drops')}
      >
        VER DROPS
      </button>
    </div>
  );
}
