// "Words from" chooser for the word games: your own years (free) or a themed
// pack (Hoot Plus). Hidden when the language has no packs.
import { usePlus } from './PlusProvider';
import { packsFor } from '../lib/wordbank';
import { PACKS, type ThemePack } from '../lib/packs';
import type { Lang } from '../lib/data';
import type { Strings } from '../lib/i18n';
import { Icon } from './Icon';

const PACK_ICON: Record<ThemePack, string> = { cinema: 'film', worldcup: 'sport', space: 'space', music: 'music' };

export default function PackPicker({ t, lang, pack, onPick }: { t: Strings; lang: Lang; pack?: ThemePack; onPick: (p: ThemePack | undefined) => void }) {
  const { plus, openUpgrade } = usePlus();
  const ids = packsFor(lang);
  if (!ids.length) return null;
  return (
    <div className="pack-picker">
      <span className="muted small pack-label">{t.packLabel}</span>
      <div className="segmented" role="group" aria-label={t.packLabel}>
        <button className={!pack ? 'chip active' : 'chip'} aria-pressed={!pack} onClick={() => pack && onPick(undefined)}>
          {t.packYours}
        </button>
        {ids.map(id => {
          const label = PACKS[id].name[lang];
          const locked = !plus;
          return (
            <button
              key={id}
              className={pack === id ? 'chip active' : 'chip'}
              aria-pressed={pack === id}
              aria-label={locked ? `${label} – ${t.plusLocked}` : label}
              onClick={() => (locked ? openUpgrade() : pack !== id && onPick(id))}
            >
              <Icon name={PACK_ICON[id]} size={20} />
              {label}
              {locked && <Icon name="lock" size={18} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
