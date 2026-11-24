import { Icon } from '../Icon';
import type { Strings } from '../../lib/i18n';
import type { StoryStrings } from '../../lib/story/strings-en';
import type { Tab } from '../../App';

/** News, health, memories of the years, reflections and saved things, in one place. */
export default function Discover({ s, t, setTab }: { s: StoryStrings; t: Strings; setTab: (t: Tab) => void }) {
  const tiles: [Tab, string, string][] = [
    ['news', s.discoverNews, 'news'],
    ['health', s.discoverHealth, 'health'],
    ['memories', s.discoverMemories, 'memories'],
    ['reflections', s.discoverReflections, 'reflections'],
    ['saved', s.discoverSaved, 'saved'],
    ['progress', t.progress, 'progress'],
  ];
  return (
    <div className="story-page discover">
      <h1 className="with-icon">
        <Icon name="compass" size={30} /> {s.discoverTitle}
      </h1>
      <p className="lead">{s.discoverIntro}</p>
      <div className="discover-grid">
        {tiles.map(([tab, label, icon]) => (
          <button key={tab} className="discover-hub-tile" onClick={() => setTab(tab)}>
            <span className="today-row-icon" aria-hidden="true">
              <Icon name={icon} size={30} />
            </span>
            <strong>{label}</strong>
            <Icon name="forward" size={22} />
          </button>
        ))}
      </div>
    </div>
  );
}
