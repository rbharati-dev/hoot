import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Strings } from '../lib/i18n';
import type { Tab } from '../App';
import { Icon } from './Icon';

// The navigation icons come from the shared set in Icon.tsx.
export const ICONS: Record<string, ReactNode> = Object.fromEntries(
  ['today', 'memories', 'games', 'more', 'news', 'health', 'reflections', 'saved', 'settings', 'help', 'progress'].map(n => [n, <Icon key={n} name={n} size={28} />]),
);

const MORE_TABS: Tab[] = ['news', 'health', 'reflections', 'progress', 'saved', 'settings', 'help'];

export default function BottomNav({ t, tab, setTab, onAccount }: { t: Strings; tab: Tab; setTab: (tab: Tab) => void; onAccount?: () => void }) {
  const [open, setOpen] = useState(false);
  const moreBtn = useRef<HTMLButtonElement>(null);
  const sheet = useRef<HTMLDivElement>(null);

  const close = () => {
    setOpen(false);
    moreBtn.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    sheet.current?.querySelector<HTMLElement>('button.sheet-row')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        moreBtn.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const labels: Record<string, string> = {
    today: t.today, memories: t.memories, games: t.games, more: t.more,
    news: t.news, health: t.health, reflections: t.reflections, saved: t.saved, settings: t.settings, help: t.help, progress: t.progress,
  };
  const moreActive = MORE_TABS.includes(tab);
  const main: Tab[] = ['today', 'memories', 'games'];

  return (
    <>
      <nav className="bottom-nav" aria-label="Hoot">
        {main.map(id => (
          <button key={id} className={tab === id ? 'bn-item active' : 'bn-item'} aria-current={tab === id ? 'page' : undefined} onClick={() => setTab(id)}>
            {ICONS[id]}
            <span>{labels[id]}</span>
          </button>
        ))}
        <button
          ref={moreBtn}
          className={moreActive || open ? 'bn-item active' : 'bn-item'}
          aria-current={moreActive ? 'page' : undefined}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          {ICONS.more}
          <span>{t.more}</span>
        </button>
      </nav>
      {open && (
        <div className="sheet-backdrop" onClick={close}>
          <div ref={sheet} className="sheet" role="dialog" aria-modal="true" aria-label={t.more} onClick={e => e.stopPropagation()}>
            <div className="sheet-head">
              <h2>{t.more}</h2>
              <button className="sheet-close" aria-label={t.close} onClick={close}>
                <Icon name="close" size={28} />
              </button>
            </div>
            {MORE_TABS.map(id => (
              <button
                key={id}
                className={tab === id ? 'sheet-row active' : 'sheet-row'}
                aria-current={tab === id ? 'page' : undefined}
                onClick={() => {
                  setOpen(false);
                  setTab(id);
                }}
              >
                {ICONS[id]}
                <span>{labels[id]}</span>
              </button>
            ))}
            {onAccount && (
              <button
                className="sheet-row"
                onClick={() => {
                  setOpen(false);
                  onAccount();
                }}
              >
                <Icon name="person" size={28} />
                <span>{t.acctButton}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
