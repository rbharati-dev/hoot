import { useEffect, useState } from 'react';
import { makeSudoku, type Level } from '../lib/sudoku';
import type { Strings } from '../lib/i18n';
import { useGate, usePlus } from './PlusProvider';
import { Icon, IconButton } from './Icon';

export default function Sudoku({ t, onSolved }: { t: Strings; onSolved: () => void }) {
  const gate = useGate();
  const { plus, openUpgrade } = usePlus();
  const [level, setLevel] = useState<Level>('easy');
  const [game, setGame] = useState(() => makeSudoku('easy'));
  const [values, setValues] = useState<number[]>(() => game.puzzle.slice());
  const [sel, setSel] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [message, setMessage] = useState('');
  const [done, setDone] = useState(false);

  const fresh = (l: Level) => {
    if (!gate()) return;
    const g = makeSudoku(l);
    setLevel(l);
    setGame(g);
    setValues(g.puzzle.slice());
    setSel(null);
    setChecked(false);
    setMessage('');
    setDone(false);
  };

  const setCell = (n: number) => {
    if (sel === null || game.puzzle[sel] || done) return;
    const v = values.slice();
    v[sel] = n;
    setValues(v);
    setChecked(false);
    setMessage('');
    if (v.every((x, i) => x === game.solution[i])) {
      setDone(true);
      setMessage(t.solved);
      onSolved();
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (sel === null) return;
      if (/^[1-9]$/.test(e.key)) setCell(Number(e.key));
      else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') setCell(0);
      else if (e.key.startsWith('Arrow')) {
        e.preventDefault();
        const r = Math.floor(sel / 9), c = sel % 9;
        const d = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
        if (d) setSel(((r + d[0] + 9) % 9) * 9 + ((c + d[1] + 9) % 9));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const check = () => {
    setChecked(true);
    const wrong = values.some((v, i) => v && v !== game.solution[i]);
    setMessage(wrong ? t.mistakes : t.allGood);
  };

  const selVal = sel !== null ? values[sel] : 0;

  return (
    <div className="sudoku">
      <h1 className="with-icon">
        <Icon name="sudoku" size={32} />
        {t.sudoku}
      </h1>
      <div className="segmented" role="group">
        {(['easy', 'medium', 'hard', 'expert'] as Level[]).map(l => {
          const locked = l === 'expert' && !plus;
          const label = l === 'expert' ? t.levelExpert : t[l];
          return (
            <button
              key={l}
              className={level === l ? 'chip active' : 'chip'}
              onClick={() => (locked ? openUpgrade() : fresh(l))}
              aria-pressed={level === l}
              aria-label={locked ? `${label} – ${t.plusLocked}` : label}
            >
              {label}
              {locked && <Icon name="lock" size={18} />}
            </button>
          );
        })}
      </div>
      <div className="sudoku-grid" role="grid" aria-label={t.sudoku}>
        {values.map((v, i) => {
          const r = Math.floor(i / 9), c = i % 9;
          const given = !!game.puzzle[i];
          const related = sel !== null && (Math.floor(sel / 9) === r || sel % 9 === c);
          const same = !!v && v === selVal;
          const wrong = checked && !!v && v !== game.solution[i];
          const cls = ['cell', given && 'given', sel === i && 'sel', related && 'rel', same && 'same', wrong && 'wrong', c % 3 === 2 && c < 8 && 'br', r % 3 === 2 && r < 8 && 'bb']
            .filter(Boolean)
            .join(' ');
          return (
            <button key={i} className={cls} onClick={() => setSel(i)} aria-label={`row ${r + 1} column ${c + 1}${v ? ', ' + v : ''}`}>
              {v || ''}
            </button>
          );
        })}
      </div>
      <div className="numpad">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
          <button key={n} className="btn num" onClick={() => setCell(n)}>
            {n}
          </button>
        ))}
        <button className="btn num erase" onClick={() => setCell(0)} aria-label={t.erase}>
          <Icon name="erase" size={28} />
        </button>
      </div>
      <div className="row">
        <button className="btn" onClick={check} disabled={done}>
          <Icon name="check" size={26} />
          {t.check}
        </button>
        <IconButton icon="refresh" label={t.newPuzzle} onClick={() => fresh(level)} />
      </div>
      {message && (
        <p className={done ? 'notice good' : 'notice'} role="status">
          {message}
        </p>
      )}
    </div>
  );
}
