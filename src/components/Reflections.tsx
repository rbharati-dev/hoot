import Loading from './Loading';
import { useEffect, useState } from 'react';
import { reflections, type Card, type Lang, type Profile } from '../lib/data';
import type { Strings } from '../lib/i18n';
import MemoryCard from './MemoryCard';
import { Icon, IconButton } from './Icon';
import { markReflectionSeen, todaysOrder } from '../lib/reflDeck';

// A calm, separate space for philosophy, spirituality and wisdom — one thought
// at a time, unhurried, apart from the pop-culture memory feed.
export default function Reflections({ t, lang, profile }: { t: Strings; lang: Lang; profile: Profile }) {
  const [cards, setCards] = useState<Card[] | null>(null);
  const [i, setI] = useState(0);

  useEffect(() => {
    let live = true;
    // A new order every day, leading with thoughts not yet read (see reflDeck).
    reflections().then(c => {
      if (!live) return;
      const byId = new Map(c.map(x => [x.id, x]));
      setCards(todaysOrder(c.map(x => x.id)).map(id => byId.get(id)!));
    });
    return () => {
      live = false;
    };
  }, []);

  const shown = cards?.[i]?.id;
  useEffect(() => {
    if (shown) markReflectionSeen(shown);
  }, [shown]);

  if (!cards) return <Loading label={t.loading} />;
  if (!cards.length) return <p className="muted">{t.noContent}</p>;

  const card = cards[i];
  const go = (d: number) => {
    setI((i + d + cards.length) % cards.length);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="reflections">
      <div className="reflections-head">
        <h1 className="with-icon">
          <Icon name="reflections" size={32} />
          {t.reflections}
        </h1>
        <p className="muted">{t.reflectionsIntro}</p>
      </div>
      <MemoryCard t={t} lang={lang} card={card} age={card.year - profile.born} hideAge>
        <div className="actions">
          <button className="btn primary big next" onClick={() => go(1)}>
            <Icon name="next" size={28} />
            {t.next}
          </button>
          <div className="row">
            <IconButton icon="back" label={t.back} onClick={() => go(-1)} />
          </div>
        </div>
      </MemoryCard>
    </div>
  );
}
