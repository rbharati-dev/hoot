import { describe, expect, it } from 'vitest';
import { Chess } from 'chess.js';
import { chessStatus, takeBackSteps } from '../../src/lib/chessUi';
import { computerMove } from '../../src/lib/chessAI';
import { think } from '../../src/lib/chessThink';

const g = (fen: string) => new Chess(fen);

describe('chess status line', () => {
  it.each([
    ['start position, your move', new Chess().fen(), false, 'yourMove'],
    ['computer is thinking', 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1', true, 'thinking'],
    ['you checkmated the computer (back-rank)', '3R2k1/5ppp/8/8/8/8/5PPP/6K1 b - - 1 1', false, 'youWin'],
    ['the computer checkmated you (fool’s mate)', 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3', false, 'youLose'],
    ['stalemate is a draw', '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1', false, 'draw'],
    ['insufficient material is a draw', '8/8/8/4k3/8/8/4K3/8 w - - 0 1', false, 'draw'],
    ['fifty-move rule is a draw', '8/8/8/4k3/8/8/4K2R/8 w - - 100 80', false, 'draw'],
    ['you are in check', 'rnb1kbnr/pppp1ppp/8/4p3/7q/5P2/PPPPP1PP/RNBQKBNR w KQkq - 1 3', false, 'inCheck'],
    ['game over wins over "thinking"', '3R2k1/5ppp/8/8/8/8/5PPP/6K1 b - - 1 1', true, 'youWin'],
  ] as const)('%s', (_name, fen, thinking, expected) => {
    expect(chessStatus(g(fen), thinking)).toBe(expected);
  });

  it('threefold repetition is a draw', () => {
    const game = new Chess();
    for (let i = 0; i < 2; i++) for (const m of ['Nf3', 'Nf6', 'Ng1', 'Ng8']) game.move(m);
    expect(chessStatus(game, false)).toBe('draw');
  });
});

describe('take back', () => {
  it.each([
    ['your turn after a reply: undo both', 'w', 2, 2],
    ['your turn with a long game', 'w', 9, 2],
    ['nothing played yet', 'w', 0, 0],
    ['only one position (cannot undo a pair)', 'w', 1, 0],
  ] as const)('%s', (_n, turn, len, steps) => {
    expect(takeBackSteps(turn, len)).toBe(steps);
  });

  it.each([
    ['you just ended the game: undo only your move', 1, 1],
    ['you ended the game later on', 7, 1],
    ['game over with no history', 0, 0],
  ] as const)('%s', (_n, len, steps) => {
    expect(takeBackSteps('b', len, true)).toBe(steps);
  });

  it.each([1, 2, 7])('nothing to take back while the computer is still to reply (history %s)', len => {
    expect(takeBackSteps('b', len, false)).toBe(0);
  });
});

describe('computer opponent', () => {
  const positions = [
    new Chess().fen(),
    'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3',
    'r2q1rk1/ppp2ppp/2np1n2/2b1p1B1/2B1P1b1/2NP1N2/PPP2PPP/R2Q1RK1 b - - 0 8',
    '8/5k2/8/8/8/8/1p3K2/8 b - - 0 1', // promotion available
    'r3k2r/pppq1ppp/2n2n2/3p4/3P4/2N2N2/PPPQ1PPP/R3K2R b KQkq - 0 9', // castling available
  ];
  for (const level of [1, 2, 3] as const)
    for (const [i, fen] of positions.entries())
      it(`level ${level} always plays a legal move (position ${i + 1})`, () => {
        for (let k = 0; k < (level === 3 ? 1 : 4); k++) {
          const m = computerMove(fen, level);
          expect(m).not.toBeNull();
          expect(() => new Chess(fen).move(m!)).not.toThrow();
        }
      });

  it('promotes a pawn about to queen (levels 2 and 3)', () => {
    for (const level of [2, 3] as const) expect(computerMove('8/5k2/8/8/8/8/1p3K2/8 b - - 0 1', level)?.promotion).toBe('q');
  });

  it.each([2, 3] as const)('level %s mates in one when it can', level => {
    // Black to move: Qh4-e1 is mate? Use a clear back-rank mate: ...Rd1#
    const fen = '6k1/5ppp/8/8/8/8/5PPP/3r2K1 b - - 0 1';
    const m = computerMove(fen, level)!;
    const after = new Chess(fen);
    after.move(m);
    expect(after.isCheckmate()).toBe(true);
  });

  it.each([2, 3] as const)('level %s does not leave its queen hanging for nothing', level => {
    // Black queen attacked by a pawn; it should move or be defended, not ignore it.
    const fen = 'rnb1kbnr/pppp1ppp/8/4p3/3q4/2P5/PP1PPPPP/RNBQKBNR b KQkq - 0 3';
    const m = computerMove(fen, level)!;
    const after = new Chess(fen);
    after.move(m);
    const lost = after.moves({ verbose: true }).some(x => x.captured === 'q');
    expect(lost).toBe(false);
  });

  it('returns null when the computer has no moves (checkmated)', () => {
    expect(computerMove('3R2k1/5ppp/8/8/8/8/5PPP/6K1 b - - 1 1', 2)).toBeNull();
  });

  it('level 3 answers within 2 seconds in a busy middlegame', () => {
    const t = performance.now();
    computerMove('r2q1rk1/ppp2ppp/2np1n2/2b1p1B1/2B1P1b1/2NP1N2/PPP2PPP/R2Q1RK1 b - - 0 8', 3);
    expect(performance.now() - t).toBeLessThan(2000);
  });

  it('think() falls back to the main thread without Web Workers', async () => {
    const black = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
    const r = await think(black, 2);
    expect(() => new Chess(black).move(r!)).not.toThrow();
  });
});
