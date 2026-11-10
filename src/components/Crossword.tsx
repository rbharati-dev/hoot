import { useEffect, useMemo, useRef, useState } from 'react';
import { freshFirst, readRecent, rememberUsed } from '../lib/recentWords';
import { makeCrossword, todaySeed, type Placed } from '../lib/crossword';
import type { Strings } from '../lib/i18n';
import type { Lang } from '../lib/data';
import { useGate } from './PlusProvider';
import type { ThemePack } from '../lib/packs';
import { isDeva, norm, units, wordsFor, type WordProfile } from '../lib/wordbank';
import { Icon, IconButton } from './Icon';

type Dir = 'across' | 'down';

export default function Crossword({ t, lang, profile, onSolved }: { t: Strings; lang: Lang; profile: WordProfile; onSolved: () => void }) {
  const [seed, setSeed] = useState(todaySeed);
  const gate = useGate();
  const [pack, setPack] = useState<ThemePack | undefined>();
  const [big, setBig] = useState(false);
  const target = big ? 14 : 9;
  // The words to build from: the person's deck, minus words they saw recently.
  // Held in state so the grid and the reset below always use the same list.
  const [entries, setEntries] = useState(() => freshFirst(wordsFor(lang, profile, pack), readRecent(lang)));
  const cw = useMemo(() => makeCrossword(seed, target, entries), [seed, target, entries]);
  useEffect(() => rememberUsed(lang, cw.words.map(w => w.word)), [cw, lang]);
  const deva = isDeva(lang);
  const [letters, setLetters] = useState<string[][]>(() => cw.cells.map(r => r.map(() => '')));
  const [pos, setPos] = useState<[number, number] | null>(null);
  const [dir, setDir] = useState<Dir>('across');
  const [checked, setChecked] = useState(false);
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[][]>([]);

  // Starts a new puzzle (a new round) with optional new size / word pack.
  const reset = (s: number, nb: boolean = big, np: ThemePack | undefined = pack) => {
    if (!gate()) return;
    const pool = freshFirst(wordsFor(lang, profile, np), readRecent(lang));
    const next = makeCrossword(s, nb ? 14 : 9, pool);
    setEntries(pool);
    setBig(nb);
    setPack(np);
    setSeed(s);
    setLetters(next.cells.map(r => r.map(() => '')));
    setPos(null);
    setChecked(false);
    setMessage('');
    setDone(false);
  };

  const open = (r: number, c: number) => r >= 0 && c >= 0 && r < cw.rows && c < cw.cols && cw.cells[r][c] !== null;
  const wordAt = (r: number, c: number, d: Dir): Placed | undefined =>
    cw.words.find(w => w.dir === d && (d === 'across' ? w.row === r && c >= w.col && c < w.col + w.units.length : w.col === c && r >= w.row && r < w.row + w.units.length));

  const focus = (r: number, c: number) => {
    setPos([r, c]);
    refs.current[r]?.[c]?.focus();
  };

  const select = (r: number, c: number) => {
    if (pos && pos[0] === r && pos[1] === c) {
      const other: Dir = dir === 'across' ? 'down' : 'across';
      if (wordAt(r, c, other)) setDir(other);
    } else if (!wordAt(r, c, dir)) {
      setDir(dir === 'across' ? 'down' : 'across');
    }
    focus(r, c);
  };

  const step = (r: number, c: number, delta: number, d: Dir = dir) => {
    const nr = d === 'down' ? r + delta : r, nc = d === 'across' ? c + delta : c;
    if (open(nr, nc)) focus(nr, nc);
  };

  const type = (r: number, c: number, ch: string) => {
    if (done) return;
    const L = letters.map(row => row.slice());
    L[r][c] = ch;
    setLetters(L);
    setChecked(false);
    setMessage('');
    if (cw.cells.every((row, i) => row.every((s, j) => s === null || L[i][j] === s))) {
      setDone(true);
      setMessage(t.solved);
      onSolved();
    }
  };

  const check = () => {
    setChecked(true);
    const wrong = cw.cells.some((row, i) => row.some((s, j) => s !== null && letters[i][j] && letters[i][j] !== s));
    setMessage(wrong ? t.mistakes : t.allGood);
  };

  const reveal = () => {
    if (!pos) return;
    const [r, c] = pos;
    type(r, c, cw.cells[r][c]!);
    step(r, c, 1);
  };

  const active = pos ? wordAt(pos[0], pos[1], dir) : undefined;
  const inActive = (r: number, c: number) =>
    !!active && (active.dir === 'across' ? r === active.row && c >= active.col && c < active.col + active.units.length : c === active.col && r >= active.row && r < active.row + active.units.length);

  const clueList = (d: Dir) => (
    <div className="clues">
      <h2>{d === 'across' ? t.across : t.down}</h2>
      <ol>
        {cw.words
          .filter(w => w.dir === d)
          .sort((a, b) => a.num - b.num)
          .map(w => (
            <li key={w.num + d}>
              <button
                className={active === w ? 'clue active' : 'clue'}
                onClick={() => {
                  setDir(d);
                  focus(w.row, w.col);
                }}
              >
                <strong>{w.num}</strong> {w.clue} <span className="muted">({w.units.length})</span>
              </button>
            </li>
          ))}
      </ol>
    </div>
  );

  return (
    <div className="crossword">
      <h1 className="with-icon">
        <Icon name="crossword" size={32} />
        {t.crossword}
      </h1>
      <div className="segmented" role="group" aria-label={t.sizeClassic + ' / ' + t.sizeBig}>
        {[false, true].map(b => {
          const label = b ? t.sizeBig : t.sizeClassic;
          return (
            <button
              key={String(b)}
              className={big === b ? 'chip active' : 'chip'}
              aria-pressed={big === b}
              aria-label={label}
              onClick={() => big !== b && reset(Math.floor(Math.random() * 1e9), b)}
            >
              {label}
            </button>
          );
        })}
      </div>
      {active && (
        <p className="current-clue" aria-live="polite">
          <strong>
            {active.num} {active.dir === 'across' ? t.across : t.down}:
          </strong>{' '}
          {active.clue}
        </p>
      )}
      <div className="cw-grid" style={{ gridTemplateColumns: `repeat(${cw.cols}, var(--cw-cell))` }}>
        {cw.cells.map((row, r) =>
          row.map((sol, c) => {
            if (sol === null) return <div key={`${r}-${c}`} className="cw-block" aria-hidden="true" />;
            const n = cw.numbers[r][c];
            const v = letters[r]?.[c] ?? '';
            const wrong = checked && v && v !== sol;
            const isSel = pos && pos[0] === r && pos[1] === c;
            return (
              <div key={`${r}-${c}`} className={['cw-cell', inActive(r, c) && 'word', isSel && 'sel', wrong && 'wrong'].filter(Boolean).join(' ')}>
                {n && <span className="cw-num">{n}</span>}
                <input
                  ref={el => {
                    (refs.current[r] ??= [])[c] = el;
                  }}
                  value={v}
                  maxLength={deva ? 8 : 1}
                  lang={lang}
                  aria-label={`${r + 1}, ${c + 1}`}
                  autoComplete="off"
                  onFocus={() => setPos([r, c])}
                  onMouseDown={e => {
                    e.preventDefault();
                    select(r, c);
                  }}
                  onChange={e => {
                    // Devanagari syllables are built from several keystrokes
                    // (and IMEs), so take the whole typed cluster here and only
                    // move on once it matches the square.
                    if (!deva) return;
                    const u = units(norm(lang, e.target.value));
                    const ch = u[u.length - 1] ?? '';
                    type(r, c, ch);
                    if (ch && ch === sol) step(r, c, 1);
                  }}
                  onKeyDown={e => {
                    if (!deva && e.key.length === 1 && /\p{L}/u.test(e.key) && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      const ch = norm(lang, e.key);
                      if (!ch) return;
                      type(r, c, ch);
                      step(r, c, 1);
                    } else if (e.key === 'Backspace') {
                      e.preventDefault();
                      if (v) type(r, c, '');
                      else step(r, c, -1);
                    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                      e.preventDefault();
                      if (dir !== 'across' && wordAt(r, c, 'across')) setDir('across');
                      else step(r, c, e.key === 'ArrowRight' ? 1 : -1, 'across');
                    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                      e.preventDefault();
                      if (dir !== 'down' && wordAt(r, c, 'down')) setDir('down');
                      else step(r, c, e.key === 'ArrowDown' ? 1 : -1, 'down');
                    }
                  }}
                />
              </div>
            );
          }),
        )}
      </div>
      <div className="row">
        <button className="btn" onClick={check} disabled={done}>
          <Icon name="check" size={26} />
          {t.check}
        </button>
        <IconButton icon="lightbulb" label={t.reveal} onClick={reveal} disabled={!pos || done} />
        <IconButton icon="refresh" label={t.newPuzzle} onClick={() => reset(Math.floor(Math.random() * 1e9))} />
      </div>
      {message && (
        <p className={done ? 'notice good' : 'notice'} role="status">
          {message}
        </p>
      )}
      <div className="clue-columns">
        {clueList('across')}
        {clueList('down')}
      </div>
    </div>
  );
}
