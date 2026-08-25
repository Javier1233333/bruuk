import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Coffee, Croissant, IceCreamBowl, Martini, Music2, ShoppingBag, Utensils, type LucideIcon } from 'lucide-react';

interface Spot {
  id: string;
  name: string;
  type: string;
  description: string;
  imageUrl: string;
  colorAccent: string;
  mapsLink: string;
  city?: string;
  rating?: number;
  price?: string;
}

interface SpotCardProps {
  spot: Spot;
  clickX?: number;
  clickY?: number;
  onClose?: () => void;
}

type SpotVisual = {
  label: string;
  imageUrl: string;
  Icon: LucideIcon;
};

const CATEGORY_VISUALS: Record<string, SpotVisual> = {
  cafe: {
    label: 'CAFÉ',
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=480&q=74',
    Icon: Coffee,
  },
  bakery: {
    label: 'PAN',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=480&q=74',
    Icon: Croissant,
  },
  food: {
    label: 'COMIDA',
    imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=480&q=74',
    Icon: Utensils,
  },
  bar: {
    label: 'BAR',
    imageUrl: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?auto=format&fit=crop&w=480&q=74',
    Icon: Martini,
  },
  night: {
    label: 'NOCHE',
    imageUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=480&q=74',
    Icon: Music2,
  },
  dessert: {
    label: 'POSTRE',
    imageUrl: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&w=480&q=74',
    Icon: IceCreamBowl,
  },
  shop: {
    label: 'TIENDA',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=480&q=74',
    Icon: ShoppingBag,
  },
};

function getSpotVisual(type: string): SpotVisual {
  const value = type.toLocaleLowerCase('es');
  if (value.includes('panader')) return CATEGORY_VISUALS.bakery;
  if (value.includes('helad') || value.includes('postre')) return CATEGORY_VISUALS.dessert;
  if (value.startsWith('café') || value.startsWith('cafe') || value.startsWith('cafetería')) return CATEGORY_VISUALS.cafe;
  if (value.startsWith('restaurante') || value.startsWith('maris') || value.startsWith('pizz') || value.startsWith('bagel') || value.startsWith('sandwich') || value.startsWith('pollería') || value.startsWith('hamburgues')) return CATEGORY_VISUALS.food;
  if (value.includes('club') || value.includes('disco') || value.includes('antro') || value.includes('jazz')) return CATEGORY_VISUALS.night;
  if (value.includes('bar') || value.includes('coctel') || value.includes('cervec')) return CATEGORY_VISUALS.bar;
  if (value.includes('boutique') || value.includes('tienda') || value.includes('concept store')) return CATEGORY_VISUALS.shop;
  if (value.includes('café') || value.includes('cafe') || value.includes('brunch')) return CATEGORY_VISUALS.cafe;
  return CATEGORY_VISUALS.food;
}

const CARD_W = 300;
const CARD_H = 240;
const OFFSET = 24;
const PAD = 12;

function getCardPos(cx: number, cy: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let x = cx + OFFSET;
  let y = cy - CARD_H / 2;

  if (x + CARD_W > vw - PAD) x = cx - CARD_W - OFFSET;
  if (x < PAD) x = PAD;
  if (y < PAD) y = PAD;
  if (y + CARD_H > vh - PAD) y = vh - CARD_H - PAD;

  return { x, y };
}

export function SpotCard({ spot, clickX, clickY, onClose }: SpotCardProps) {
  const isAbsolute = clickX !== undefined && clickY !== undefined;
  const pos = isAbsolute ? getCardPos(clickX!, clickY!) : { x: 0, y: 0 };
  const cardRef = useRef<HTMLDivElement>(null);
  const hasOwnPhoto = /\.(?:jpe?g|png|webp|avif)(?:\?|$)/i.test(spot.imageUrl);
  const visual = getSpotVisual(spot.type);
  const SpotIcon = visual.Icon;

  useEffect(() => {
    if (!onClose || !isAbsolute) return;
    const handle = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('click', handle, true);
    return () => document.removeEventListener('click', handle, true);
  }, [onClose, isAbsolute]);

  return (
    <motion.div
      ref={cardRef}
      className="spot-card"
      style={isAbsolute ? { left: pos.x, top: pos.y, position: 'fixed' } : { position: 'relative' }}
      initial={isAbsolute ? { opacity: 0, scale: 0.6, y: 16 } : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={isAbsolute ? { opacity: 0, scale: 0.5, y: -8 } : undefined}
      transition={isAbsolute ? { type: 'spring', stiffness: 420, damping: 26 } : { duration: 0.3 }}
      onClick={(e: React.MouseEvent) => e.stopPropagation()}
    >
      {/* Accent color stripe */}
      <div
        className="spot-card__stripe"
        style={{ background: spot.colorAccent }}
      />

      {/* Image */}
      <div className={`spot-card__img-wrap ${hasOwnPhoto ? 'has-own-photo' : 'has-category-photo'}`} style={{ '--spot-accent': spot.colorAccent } as React.CSSProperties}>
        {hasOwnPhoto ? (
          <img
            src={spot.imageUrl}
            alt={spot.name}
            className="spot-card__img"
            loading="lazy"
            onError={(e: React.SyntheticEvent<HTMLImageElement>) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <>
            <SpotIcon className="spot-card__category-mark" strokeWidth={1.45} aria-hidden="true" />
            <figure className="spot-card__photo-inset">
              <img
                src={visual.imageUrl}
                alt={`Referencia visual de ${visual.label.toLocaleLowerCase('es')}`}
                loading="lazy"
                onError={(event) => event.currentTarget.closest('figure')?.classList.add('is-error')}
              />
              <figcaption>REFERENCIA / {visual.label}</figcaption>
            </figure>
          </>
        )}
        <span className="spot-card__category-logo" aria-label={`Tipo: ${visual.label}`}><SpotIcon size={16} strokeWidth={2.4} /></span>
        {onClose && (
          <button className="spot-card__close" onClick={onClose} aria-label="Cerrar">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="1" y1="1" x2="11" y2="11" />
              <line x1="11" y1="1" x2="1" y2="11" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="spot-card__body">
        <div className="spot-card__meta">
          <span className="spot-card__type" style={{ background: spot.colorAccent }}>{spot.type}</span>
          <span className="spot-card__label" style={{ textTransform: 'capitalize' }}>{spot.city || 'Guadalajara'}</span>
        </div>
        <h3 className="spot-card__name">{spot.name}</h3>
        {(spot.rating || spot.price) && (
          <div className="spot-card__stats">
            {spot.rating && (
              <span className="spot-card__rating">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                {spot.rating}
              </span>
            )}
            {spot.price && <span className="spot-card__price">{spot.price}</span>}
          </div>
        )}
        <a
          href={spot.mapsLink}
          target="_blank"
          rel="noopener noreferrer"
          className="spot-card__link"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Ver en Maps
        </a>
      </div>
    </motion.div>
  );
}
