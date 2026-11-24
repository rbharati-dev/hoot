// Desktop top menu: each item shows its icon and its name (never an icon alone).
// "Tell a Story" is drawn as the main action.
import { ICONS } from './BottomNav';
import type { Tab } from '../App';

export default function TopNav({ tabs, tab, setTab }: { tabs: [Tab, string][]; tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <nav className="tabs label-tabs" aria-label="Main">
      {tabs.map(([id, label]) => (
        <button
          key={id}
          className={`tab label-tab${id === 'tell' ? ' tell-tab' : ''}${tab === id ? ' active' : ''}`}
          aria-current={tab === id ? 'page' : undefined}
          onClick={() => setTab(id)}
        >
          {ICONS[id]}
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
