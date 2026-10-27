import { useEffect, useMemo, useState } from 'react';
import { freshFirst, readRecent, rememberUsed } from '../lib/recentWords';
import type { Lang } from '../lib/data';
import { wordsFor, type Entry, type WordProfile } from '../lib/wordbank';
import type { Strings } from '../lib/i18n';
import { useGate,  } from './PlusProvider';
import PackPicker from './PackPicker';
import type { ThemePack } from '../lib/packs';
import { Icon, IconButton } from './Icon';

// Unscramble a nostalgia-themed word from its clue by tapping the shuffled
// letters in order, in the person's language and culture.
function shuffle(word: string[], seed: number): string[] {
  const a = word.slice();
  let s = seed;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  // Avoid handing back the already-solved order.
  return a.join('') === word.join('') && new Set(word).size > 1 ? shuffle(word, seed + 1) : a;
}

const pick = (entries: Entry[], seed: number) => {
  const usable = entries.filter(e => e.units.length >= 3 && e.units.length <= 9 && new Set(e.units).size > 1);
  return usable[seed % usable.length];
};

export default function WordScramble({ t, lang, profile, onSolved }: { t: Strings; lang: Lang; profile: WordProfile; onSolved: () => void }) {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9));
  const gate = useGate();
  const [pack, setPack] = useState<ThemePack | undefined>();
  // Prefer words not seen recently; re-read for every new puzzle (seed).
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const entries = useMemo(() => freshFirst(wordsFor(lang, profile, pack), readRecent(lang)), [lang, profile, pack, seed]);
  const { units: parts, clue, word: answer } = useMemo(() => pick(entries, seed), [entries, seed]);
  useEffect(() => rememberUsed(lang, [answer]), [answer, lang]);
  const tiles = useMemo(() => shuffle(parts, seed), [parts, seed]);
  const [used, setUsed] = useState<number[]>([]); // indices of tiles, in tap order
  const [reveal, setReveal] = useState(false);

  const built = used.map(i => tiles[i]).join('');
  const solved = built === answer;

  const tap = (i: number) => {
    if (solved || used.includes(i)) return;
    const next = [...used, i];
    setUsed(next);
    if (next.map(k => tiles[k]).join('') === answer) onSolved();
  };

  const pickPack = (p: ThemePack | undefined) => {
    if (!gate()) return;
    setPack(p);
    setSeed(Math.floor(Math.random() * 1e9));
    setUsed([]);
    setReveal(false);
  };

  const newWord = () => {
    if (!gate()) return;
    setSeed(Math.floor(Math.random() * 1e9));
    setUsed([]);
    setReveal(false);
  };

  return (
    <div className="minigame scramble">
      <h1 className="with-icon">
        <Icon name="scramble" size={32} />
        {t.wordscramble}
      </h1>
      <p className="muted">
        {t.scrambleHelp}
      </p>
      <PackPicker t={t} lang={lang} pack={pack} onPick={pickPack} />
      <p className="scramble-clue">
        <strong>{t.clueLabel}:</strong> {clue}
      </p>

      <div className="scramble-slots" aria-label={built}>
        {parts.map((_, i) => (
          <span key={i} className={['slot', used[i] != null && 'filled', solved && 'ok'].filter(Boolean).join(' ')}>
            {reveal ? parts[i] : used[i] != null ? tiles[used[i]] : ''}
          </span>
        ))}
      </div>

      <div className="scramble-tiles">
        {tiles.map((ch, i) => (
          <button key={i} className="tile" onClick={() => tap(i)} disabled={used.includes(i) || solved || reveal} aria-label={ch}>
            {ch}
          </button>
        ))}
      </div>

      {solved && <p className="notice good" role="status">{t.solved}</p>}

      <div className="segmented">
        <IconButton icon="erase" label={t.clearLetters} onClick={() => setUsed([])} disabled={solved || !used.length} />
        {!solved && <IconButton icon="eye" label={t.showAnswer} onClick={() => setReveal(true)} disabled={reveal} />}
        <IconButton className="primary" icon="refresh" label={t.newPuzzle} onClick={newWord} />
      </div>
    </div>
  );
}
