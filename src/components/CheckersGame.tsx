import { useEffect, useMemo, useState } from 'react';
import { useGate } from './PlusProvider';
import { apply, computerMove, legalMoves, startBoard, type Board } from '../lib/checkers';
import { useFullscreen } from '../lib/useFullscreen';
import type { Strings } from '../lib/i18n';
import { Icon, IconButton } from './Icon';

export default function CheckersGame({ t, onSolved }: { t: Strings; onSolved: () => void }) {
  const gate = useGate();
  const [board, setBoard] = useState<Board>(startBoard);
  const [turn, setTurn] = useState<'r' | 'b'>('r');
  const [history, setHistory] = useState<Board[]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [level, setLevel] = useState<1 | 2 | 3>(1);
  const [last, setLast] = useState<number[]>([]);
  const { ref, full, toggle } = useFullscreen<HTMLDivElement>();

  const myMoves = useMemo(() => (turn === 'r' ? legalMoves(board, 'r') : []), [board, turn]);
  const mustJump = myMoves.some(m => m.taken.length);
  const fromSquares = new Set(myMoves.map(m => m.path[0]));
  const targets = sel === null ? [] : myMoves.filter(m => m.path[0] === sel);
  const over = turn === 'r' ? myMoves.length === 0 : legalMoves(board, 'b').length === 0;

  useEffect(() => {
    if (turn !== 'b') return;
    const id = setTimeout(() => {
      const m = computerMove(board, level);
      if (m) {
        setBoard(apply(board, m));
        setLast(m.path);
        setTurn('r');
      }
    }, 600);
    return () => clearTimeout(id);
  }, [turn, board, level]);

  useEffect(() => {
    if (over && turn === 'b') onSolved();
  }, [over, turn]); // eslint-disable-line react-hooks/exhaustive-deps

  const click = (i: number) => {
    if (turn !== 'r' || over) return;
    const m = targets.find(x => x.path[x.path.length - 1] === i);
    if (m) {
      setHistory(h => [...h, board]);
      setBoard(apply(board, m));
      setLast(m.path);
      setSel(null);
      setTurn('b');
      return;
    }
    setSel(fromSquares.has(i) ? i : null);
  };

  const takeBack = () => {
    if (!history.length || turn !== 'r') return;
    setBoard(history[history.length - 1]);
    setHistory(h => h.slice(0, -1));
    setSel(null);
    setLast([]);
  };

  const reset = () => {
    if (!gate()) return;
    setBoard(startBoard());
    setTurn('r');
    setHistory([]);
    setSel(null);
    setLast([]);
  };

  let status = turn === 'b' ? t.thinking : mustJump ? t.mustJump : t.yourMove;
  if (over) status = turn === 'b' ? t.youWin : t.youLose;

  return (
    <div className={full ? 'boardgame fullscreen' : 'boardgame'} ref={ref}>
      <div className="board-head">
        <h1 className="with-icon">
        <Icon name="checkers" size={32} />
        {t.checkers}
      </h1>
        <IconButton className="fs-btn" icon={full ? 'shrink' : 'expand'} label={full ? t.exitFullscreen : t.fullscreen} pressed={full} onClick={toggle} />
      </div>
      <div className="segmented" role="group">
        {([1, 2, 3] as const).map(l => (
          <button key={l} className={level === l ? 'chip active' : 'chip'} onClick={() => setLevel(l)} aria-pressed={level === l}>
            {[t.easy, t.medium, t.hard][l - 1]}
          </button>
        ))}
      </div>
      <p className={over ? 'notice good' : 'status-line'} role="status">
        {status}
      </p>
      <div className="board checkers" role="grid" aria-label={t.checkers}>
        {board.map((p, i) => {
          const r = Math.floor(i / 8), c = i % 8;
          const dark = (r + c) % 2 === 1;
          const isTarget = targets.some(m => m.path[m.path.length - 1] === i);
          const cls = ['sq', dark ? 'dark' : 'light', sel === i && 'sel', isTarget && 'target', last.includes(i) && 'last', fromSquares.has(i) && turn === 'r' && 'movable'].filter(Boolean).join(' ');
          return (
            <button key={i} className={cls} onClick={() => click(i)} disabled={!dark} aria-label={`${r + 1}, ${c + 1}${p ? (p.s === 'r' ? ' red' : ' black') + (p.k ? ' king' : '') : ''}`}>
              {p && <span className={`disc ${p.s === 'r' ? 'red' : 'black'}${p.k ? ' king' : ''}`}>{p.k ? '♛' : ''}</span>}
            </button>
          );
        })}
      </div>
      <div className="row">
        <IconButton icon="undo" label={t.takeBack} onClick={takeBack} disabled={!history.length || turn !== 'r'} />
        <IconButton icon="refresh" label={t.playAgain} onClick={reset} />
      </div>
      <p className="muted small">{t.checkersHelp}</p>
    </div>
  );
}
