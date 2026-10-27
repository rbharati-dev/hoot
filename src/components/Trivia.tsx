import { useEffect, useState } from 'react';
import { useGate } from './PlusProvider';
import { loadFeed, localized, type Card, type Lang, type Profile } from '../lib/data';
import { ding, nope } from '../lib/sound';
import type { Strings } from '../lib/i18n';
import { Icon } from './Icon';

interface Question {
  card: Card;
  options: number[];
}

const ROUND = 10;

function shuffle<T>(a: T[]): T[] {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function makeRound(cards: Card[]): Question[] {
  // Titles that already contain a year would give the answer away.
  const usable = shuffle(cards.filter(c => !/\b(19|20)\d\d\b/.test(c.title)));
  const picked: Card[] = [];
  const years = new Set<number>();
  for (const c of usable) {
    if (picked.length >= ROUND) break;
    if (years.has(c.year) && usable.length > ROUND * 2) continue; // prefer different years
    picked.push(c);
    years.add(c.year);
  }
  return picked.map(card => {
    const opts = new Set([card.year]);
    while (opts.size < 4) {
      const delta = Math.floor(Math.random() * 7) - 3 || 4;
      opts.add(card.year + delta * (Math.random() < 0.5 ? 1 : 2));
    }
    return { card, options: [...opts].sort((a, b) => a - b) };
  });
}

export default function Trivia({ t, lang, profile, onSolved }: { t: Strings; lang: Lang; profile: Profile; onSolved: () => void }) {
  const gate = useGate();
  const [cards, setCards] = useState<Card[] | null>(null);
  const [round, setRound] = useState<Question[]>([]);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  useEffect(() => {
    loadFeed(profile).then(c => {
      setCards(c);
      setRound(makeRound(c));
    });
  }, [profile]);

  if (!cards) return <p className="muted">{t.loading}</p>;
  if (round.length < 3) return <p className="empty">{t.noContent}</p>;

  const restart = () => {
    if (!gate()) return;
    setRound(makeRound(cards));
    setI(0);
    setPicked(null);
    setScore(0);
  };

  if (i >= round.length) {
    return (
      <div className="trivia">
        <h1 className="with-icon">
        <Icon name="quiz" size={32} />
        {t.trivia}
      </h1>
        <p className="notice good">{t.triviaScore(score, round.length)}</p>
        <button className="btn primary big" onClick={restart}>
          <Icon name="refresh" size={28} />
          {t.playAgain}
        </button>
      </div>
    );
  }

  const q = round[i];
  const { title } = localized(q.card, lang);
  const answer = (y: number) => {
    if (picked !== null) return;
    setPicked(y);
    if (y === q.card.year) {
      ding();
      setScore(s => s + 1);
    } else {
      nope();
    }
  };
  const next = () => {
    setPicked(null);
    if (i + 1 >= round.length) onSolved();
    setI(i + 1);
  };

  return (
    <div className="trivia">
      <h1 className="with-icon">
        <Icon name="quiz" size={32} />
        {t.trivia}
      </h1>
      <p className="muted">
        {i + 1} {t.of} {round.length}
      </p>
      <div className="question">
        <p className="muted">{t.triviaQ}</p>
        <h2>{title}</h2>
      </div>
      <div className="answers">
        {q.options.map(y => {
          const cls = picked === null ? 'btn answer' : y === q.card.year ? 'btn answer right' : y === picked ? 'btn answer wrong' : 'btn answer';
          return (
            <button key={y} className={cls} onClick={() => answer(y)} disabled={picked !== null && y !== picked && y !== q.card.year}>
              {y}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <>
          <p className={picked === q.card.year ? 'notice good' : 'notice'} role="status">
            {picked === q.card.year ? t.correct : t.wrongAnswer(q.card.year)} {localized(q.card, lang).text}
          </p>
          <button className="btn primary big" onClick={next}>
            <Icon name="next" size={28} />
            {t.nextQuestion}
          </button>
        </>
      )}
    </div>
  );
}
