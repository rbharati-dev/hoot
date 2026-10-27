import { useEffect, useMemo, useState } from 'react';
import { useGate } from './PlusProvider';
import { Chess, type Square } from 'chess.js';
import { think } from '../lib/chessThink';
import { chessStatus, takeBackSteps } from '../lib/chessUi';
import { useFullscreen } from '../lib/useFullscreen';
import type { Strings } from '../lib/i18n';
import { Icon, IconButton } from './Icon';

const GLYPH: Record<string, string> = { wk: '♔', wq: '♕', wr: '♖', wb: '♗', wn: '♘', wp: '♙', bk: '♚', bq: '♛', br: '♜', bb: '♝', bn: '♞', bp: '♟' };
const FILES = 'abcdefgh';

export default function ChessGame({ t, onSolved }: { t: Strings; onSolved: () => void }) {
  const gate = useGate();
  const [fen, setFen] = useState(() => new Chess().fen());
  const [history, setHistory] = useState<string[]>([]);
  const [sel, setSel] = useState<Square | null>(null);
  const [level, setLevel] = useState<1 | 2 | 3>(1);
  const [thinking, setThinking] = useState(false);
  const [last, setLast] = useState<[string, string] | null>(null);
  const game = useMemo(() => new Chess(fen), [fen]);
  const { ref, full, toggle } = useFullscreen<HTMLDivElement>();

  const targets = useMemo(() => (sel ? game.moves({ square: sel, verbose: true }).map(m => m.to as string) : []), [game, sel]);

  // The computer answers after a short pause, so the person sees their move
  // land. It thinks in the background, so the page never freezes; if the
  // position changes meanwhile (take back, play again) the answer is dropped.
  useEffect(() => {
    if (game.turn() !== 'b' || game.isGameOver()) return;
    let cancelled = false;
    setThinking(true);
    const started = Date.now();
    think(fen, level).then(m => {
      const wait = Math.max(0, 450 - (Date.now() - started));
      setTimeout(() => {
        if (cancelled) return;
        if (m) {
          const g = new Chess(fen);
          g.move(m);
          setHistory(h => [...h, fen]);
          setLast([m.from, m.to]);
          setFen(g.fen());
        }
        setThinking(false);
      }, wait);
    });
    return () => {
      cancelled = true;
      setThinking(false);
    };
  }, [fen, game, level]);

  useEffect(() => {
    if (game.isCheckmate() && game.turn() === 'b') onSolved();
  }, [game]); // eslint-disable-line react-hooks/exhaustive-deps

  const click = (sq: Square) => {
    if (thinking || game.isGameOver() || game.turn() !== 'w') return;
    const piece = game.get(sq);
    if (sel && targets.includes(sq)) {
      const g = new Chess(fen);
      g.move({ from: sel, to: sq, promotion: 'q' });
      setHistory(h => [...h, fen]);
      setLast([sel, sq]);
      setFen(g.fen());
      setSel(null);
      return;
    }
    setSel(piece && piece.color === 'w' && sq !== sel ? sq : null);
  };

  const takeBack = () => {
    // Undo your last move (and the computer's reply to it, if it made one).
    // After you checkmate or stalemate the computer there is no reply to undo.
    const steps = takeBackSteps(game.turn(), history.length, game.isGameOver());
    if (thinking || !steps) return;
    const prev = history[history.length - steps];
    setHistory(h => h.slice(0, -steps));
    setFen(prev);
    setSel(null);
    setLast(null);
  };

  const reset = () => {
    if (!gate()) return;
    setFen(new Chess().fen());
    setHistory([]);
    setSel(null);
    setLast(null);
  };

  const st = chessStatus(game, thinking || (game.turn() === 'b' && !game.isGameOver()));
  const status = { thinking: t.thinking, yourMove: t.yourMove, inCheck: `${t.inCheck} ${t.yourMove}`, youWin: t.youWin, youLose: t.youLose, draw: t.draw }[st];

  const board = game.board();

  return (
    <div className={full ? 'boardgame fullscreen' : 'boardgame'} ref={ref}>
      <div className="board-head">
        <h1 className="with-icon">
        <Icon name="chess" size={32} />
        {t.chess}
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
      <p className={st === 'youWin' ? 'notice good' : game.isGameOver() ? 'notice' : 'status-line'} role="status">
        {status}
      </p>
      <div className="board chess" role="grid" aria-label={t.chess}>
        {board.map((row, r) =>
          row.map((p, c) => {
            const sq = `${FILES[c]}${8 - r}` as Square;
            const dark = (r + c) % 2 === 1;
            const cls = ['sq', dark ? 'dark' : 'light', sel === sq && 'sel', targets.includes(sq) && (p ? 'capture' : 'target'), last && last.includes(sq) && 'last'].filter(Boolean).join(' ');
            return (
              <button key={sq} className={cls} onClick={() => click(sq)} aria-label={`${sq}${p ? ' ' + p.color + p.type : ''}`}>
                {p && <span className={p.color === 'w' ? 'pc white' : 'pc black'}>{GLYPH[p.color + p.type]}</span>}
                {c === 0 && <span className="coord rank">{8 - r}</span>}
                {r === 7 && <span className="coord file">{FILES[c]}</span>}
              </button>
            );
          }),
        )}
      </div>
      <div className="row">
        <IconButton icon="undo" label={t.takeBack} onClick={takeBack} disabled={thinking || !takeBackSteps(game.turn(), history.length, game.isGameOver())} />
        <IconButton icon="refresh" label={t.playAgain} onClick={reset} />
      </div>
      <p className="muted small">{t.chessHelp}</p>
    </div>
  );
}
