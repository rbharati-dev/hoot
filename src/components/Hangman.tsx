import { useEffect, useMemo, useState } from 'react';
import { freshFirst, readRecent, rememberUsed } from '../lib/recentWords';
import type { Lang } from '../lib/data';
import { alphabet, isDeva, wordsFor, type Entry, type WordProfile } from '../lib/wordbank';
import { ding, nope } from '../lib/sound';
import type { Strings } from '../lib/i18n';
import { useGate,  } from './PlusProvider';
import PackPicker from './PackPicker';
import type { ThemePack } from '../lib/packs';
import { Icon } from './Icon';

const MAX_WRONG = 6;

const pick = (entries: Entry[], seed: number) => {
  const usable = entries.filter(e => e.units.length >= 3 && e.units.length <= 10);
  return usable[seed % usable.length];
};

// Keys to offer: the language's alphabet; for Devanagari, the answer's
// syllables plus a few others from the deck so it's still a real guess.
function keysFor(lang: Lang, answer: string[], entries: Entry[], seed: number): string[] {
  const abc = alphabet(lang);
  if (abc.length) return abc;
  const own = [...new Set(answer)];
  const others = [...new Set(entries.flatMap(e => e.units))].filter(u => !own.includes(u));
  let s = seed;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const extra = others.sort(() => rnd() - 0.5).slice(0, Math.max(10, 20 - own.length));
  return [...own, ...extra].sort((a, b) => a.localeCompare(b, lang));
}

// The gallows is drawn in stages — one more part per wrong guess.
function Gallows({ wrong }: { wrong: number }) {
  return (
    <svg className="hangman-draw" viewBox="0 0 120 140" width="150" height="175" aria-hidden="true">
      {/* scaffold */}
      <line x1="10" y1="135" x2="80" y2="135" />
      <line x1="30" y1="135" x2="30" y2="10" />
      <line x1="30" y1="10" x2="80" y2="10" />
      <line x1="80" y1="10" x2="80" y2="28" />
      {wrong > 0 && <circle cx="80" cy="40" r="12" />}
      {wrong > 1 && <line x1="80" y1="52" x2="80" y2="92" />}
      {wrong > 2 && <line x1="80" y1="62" x2="64" y2="78" />}
      {wrong > 3 && <line x1="80" y1="62" x2="96" y2="78" />}
      {wrong > 4 && <line x1="80" y1="92" x2="66" y2="112" />}
      {wrong > 5 && <line x1="80" y1="92" x2="94" y2="112" />}
    </svg>
  );
}

export default function Hangman({ t, lang, profile, onSolved }: { t: Strings; lang: Lang; profile: WordProfile; onSolved: () => void }) {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const gate = useGate();
  const [pack, setPack] = useState<ThemePack | undefined>();
  // Prefer words not seen recently; re-read for every new puzzle (seed).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const entries = useMemo(() => freshFirst(wordsFor(lang, profile, pack), readRecent(lang)), [lang, profile, pack, seed]);
  const { units: answer, clue, word } = useMemo(() => pick(entries, seed), [entries, seed]);
  useEffect(() => rememberUsed(lang, [word]), [word, lang]);
  const LETTERS = useMemo(() => keysFor(lang, answer, entries, seed), [lang, answer, entries, seed]);
  const [guessed, setGuessed] = useState<string[]>([]);

  const wrong = guessed.filter(g => !answer.includes(g)).length;
  const lost = wrong >= MAX_WRONG;
  const won = answer.every(ch => guessed.includes(ch));
  const over = lost || won;

  const guess = (ch: string) => {
    if (over || guessed.includes(ch)) return;
    const next = [...guessed, ch];
    setGuessed(next);
    if (answer.includes(ch)) {
      if (answer.every(c => next.includes(c))) {
        ding();
        onSolved();
      }
    } else nope();
  };

  const pickPack = (p: ThemePack | undefined) => {
    if (!gate()) return;
    setPack(p);
    setSeed(Math.floor(Math.random() * 1e9));
    setGuessed([]);
  };

  const reset = () => {
    if (!gate()) return;
    setSeed(Math.floor(Math.random() * 1e9));
    setGuessed([]);
  };

  return (
    <div className="minigame hangman">
      <h1 className="with-icon">
        <Icon name="hangman" size={32} />
        {t.hangman}
      </h1>
      <p className="muted">
        {t.hangmanHelp}
      </p>

      <PackPicker t={t} lang={lang} pack={pack} onPick={pickPack} />
      <Gallows wrong={wrong} />
      <p className={wrong >= MAX_WRONG - 2 && !won ? 'muted small warn' : 'muted small'}>{t.guessesLeft(MAX_WRONG - wrong)}</p>

      <p className="hangman-word" aria-label={won || lost ? word : undefined}>
        {answer.map((ch, i) => (
          <span key={i} className="hm-slot">
            {guessed.includes(ch) || lost ? ch : ''}
          </span>
        ))}
      </p>
      <p className="scramble-clue">
        <strong>{t.clueLabel}:</strong> {clue}
      </p>

      {won && <p className="notice good" role="status">{t.solved}</p>}
      {lost && <p className="notice" role="status">{t.outOfGuesses(word)}</p>}

      {!over ? (
        <div className={isDeva(lang) ? 'hangman-keys deva' : 'hangman-keys'} lang={lang}>
          {LETTERS.map(ch => {
            const used = guessed.includes(ch);
            const miss = used && !answer.includes(ch);
            return (
              <button key={ch} className={['hm-key', used && 'used', miss && 'miss'].filter(Boolean).join(' ')} onClick={() => guess(ch)} disabled={used} aria-label={ch}>
                {ch}
              </button>
            );
          })}
        </div>
      ) : (
        <button className="btn primary big" onClick={reset}>
          <Icon name="refresh" size={28} />
          {t.newPuzzle}
        </button>
      )}
    </div>
  );
}
