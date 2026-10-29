// The "Next" button on wide screens: a disc half out of the card's right
// edge, like a CD sliding out of its tray. Styles in index.css (.next-disc).
// animKey (the card id) replays the little slide-in for each new card.
import { Icon } from './Icon';

export default function NextDisc({ label, icon = 'next', onClick, animKey }: { label: string; icon?: string; onClick: () => void; animKey?: string }) {
  return (
    <div className="feed-rail right">
      <div className="feed-rail-inner">
        <button key={animKey} className="next-disc" onClick={onClick} aria-label={label}>
          <span className="nd-face" aria-hidden="true" />
          <span className="nd-label" aria-hidden="true">
            <Icon name={icon} size={32} />
            {label}
          </span>
        </button>
      </div>
    </div>
  );
}
