import { useState } from 'react';
import { store, type Lang, type Profile } from '../lib/data';
import type { Strings } from '../lib/i18n';
import MemoryCard from './MemoryCard';
import { Icon, IconButton } from './Icon';
import { recordSignal } from '../lib/prefs';

export default function Saved({ t, lang, profile }: { t: Strings; lang: Lang; profile: Profile }) {
  const [saved, setSaved] = useState(() => store.saved());

  if (!saved.length) return <p className="empty">{t.savedEmpty}</p>;

  return (
    <div className="saved-list">
      <h1 className="with-icon">
        <Icon name="saved" size={32} />
        {t.saved}
      </h1>
      {saved.map(card => (
        <MemoryCard key={card.id} t={t} lang={lang} card={card} age={card.year - profile.born}>
          <div className="actions">
            <IconButton
              icon="trash"
              label={t.remove}
              onClick={() => {
                const list = saved.filter(c => c.id !== card.id);
                store.setSaved(list);
                setSaved(list);
                recordSignal({ kind: 'unsave', card });
              }}
            />
          </div>
        </MemoryCard>
      ))}
    </div>
  );
}
