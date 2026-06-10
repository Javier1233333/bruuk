import type { Creator } from '../types/rack';
import './CreatorChip.css';

interface CreatorChipProps {
  creator: Creator;
}

export function CreatorChip({ creator }: CreatorChipProps) {
  const initial = creator.name.charAt(0).toUpperCase();

  return (
    <div className="rack-creator-chip" role="button" tabIndex={0} aria-label={`Ver perfil de ${creator.name}`}>
      {/* Avatar circular */}
      <div
        className="rack-creator-chip__avatar"
        style={{ backgroundColor: creator.color }}
        aria-hidden="true"
      >
        {creator.avatar ? (
          <img
            src={creator.avatar}
            alt={creator.name}
            className="rack-creator-chip__avatar-img"
          />
        ) : (
          <span className="rack-creator-chip__avatar-initial">{initial}</span>
        )}
      </div>

      {/* Info */}
      <div className="rack-creator-chip__info">
        <p className="rack-creator-chip__name">{creator.name}</p>
        <p className="rack-creator-chip__bio">{creator.bio}</p>
      </div>
    </div>
  );
}
