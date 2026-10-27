// Desktop top menu as icons. Each icon still has its name: a large tooltip on
// hover and keyboard focus, and the accessible label for screen readers, so
// nobody has to guess what an icon means.
import { ICONS } from './BottomNav';
import type { Tab } from '../App';

export default function TopNav({ tabs, tab, setTab }: { tabs: [Tab, string][]; tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <nav className="tabs icon-tabs" aria-label="Main">
      {tabs.map(([id, label]) => (
        <button
          key={id}
          className={tab === id ? 'tab icon-tab active' : 'tab icon-tab'}
          aria-current={tab === id ? 'page' : undefined}
          aria-label={label}
          data-tip={label}
          onClick={() => setTab(id)}
        >
          {ICONS[id]}
        </button>
      ))}
    </nav>
  );
}
