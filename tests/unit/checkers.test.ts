import { describe, expect, it } from 'vitest';
import { apply, computerMove, legalMoves, startBoard, type Board } from '../../src/lib/checkers';

const empty = (): Board => Array(64).fill(null);

describe('checkers', () => {
  it('starts with 12 pieces each and 7 opening moves', () => {
    const b = startBoard();
    expect(b.filter(p => p?.s === 'r').length).toBe(12);
    expect(b.filter(p => p?.s === 'b').length).toBe(12);
    expect(legalMoves(b, 'r').length).toBe(7);
    expect(legalMoves(b, 'b').length).toBe(7);
  });

  it('forces a jump when one is available', () => {
    const b = empty();
    b[5 * 8 + 2] = { s: 'r', k: false };
    b[4 * 8 + 3] = { s: 'b', k: false };
    b[5 * 8 + 6] = { s: 'r', k: false }; // has a quiet move, but it must not be offered
    const moves = legalMoves(b, 'r');
    expect(moves.length).toBe(1);
    expect(moves[0].taken).toEqual([4 * 8 + 3]);
    const after = apply(b, moves[0]);
    expect(after[4 * 8 + 3]).toBeNull();
    expect(after[3 * 8 + 4]?.s).toBe('r');
  });

  it('chains a double jump into one move', () => {
    const b = empty();
    b[7 * 8 + 0] = { s: 'r', k: false };
    b[6 * 8 + 1] = { s: 'b', k: false };
    b[4 * 8 + 3] = { s: 'b', k: false };
    const [m] = legalMoves(b, 'r');
    expect(m.taken.length).toBe(2);
    expect(m.path[m.path.length - 1]).toBe(3 * 8 + 4);
  });

  it('crowns a piece that reaches the far row', () => {
    const b = empty();
    b[1 * 8 + 2] = { s: 'r', k: false };
    const after = apply(b, legalMoves(b, 'r')[0]);
    expect(after.find(p => p?.s === 'r')?.k).toBe(true);
  });

  it('the computer always picks one of its legal moves', () => {
    let b = startBoard();
    for (let i = 0; i < 20; i++) {
      const mine = legalMoves(b, 'r');
      if (!mine.length) break;
      b = apply(b, mine[i % mine.length]);
      const theirs = legalMoves(b, 'b');
      if (!theirs.length) break;
      const m = computerMove(b, 2)!;
      expect(theirs.some(x => JSON.stringify(x) === JSON.stringify(m))).toBe(true);
      b = apply(b, m);
    }
  });
});
