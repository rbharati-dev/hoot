import { describe, expect, it } from 'vitest';
import { Chess } from 'chess.js';
import { computerMove } from '../../src/lib/chessAI';

describe('chess computer', () => {
  it('plays a legal reply at every level', () => {
    const g = new Chess();
    g.move('e4');
    for (const level of [1, 2, 3] as const) {
      const m = computerMove(g.fen(), level)!;
      expect(g.moves({ verbose: true }).some(x => x.san === m.san)).toBe(true);
    }
  });

  it('takes a free queen', () => {
    // Black to move; White's queen on d4 can be captured by the knight on c6.
    const fen = 'r1b1kbnr/pppp1ppp/2n5/8/3Q4/8/PPP2PPP/RNB1KBNR b KQkq - 0 4';
    expect(computerMove(fen, 2)!.san).toBe('Nxd4');
  });

  it('finds mate in one', () => {
    // Black to move: Qh4# style back-rank finish.
    const fen = 'rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR b KQkq - 1 3';
    const g = new Chess(fen);
    g.move(computerMove(fen, 2)!);
    expect(g.isCheckmate()).toBe(true);
  });

  it('returns null when there are no moves', () => {
    expect(computerMove('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1', 1)).toBeNull();
  });
});
