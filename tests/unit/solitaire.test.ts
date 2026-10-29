import { describe, expect, it } from 'vitest';
import { anyMove, applyMove, bestMove, canMove, deal, drawCard, won, type Card, type Game } from '../../src/lib/solitaire';

let id = 1000;
const c = (rank: number, suit: Card['suit'], up = true): Card => ({ id: id++, rank, suit, up });
const empty = (): Game => ({ stock: [], waste: [], foundations: [[], [], [], []], tableau: [[], [], [], [], [], [], []] });
const count = (g: Game) => g.stock.length + g.waste.length + g.foundations.flat().length + g.tableau.flat().length;

describe('solitaire', () => {
  it('deals 28 cards to 7 columns with only the last of each face up, 24 in the deck', () => {
    const g = deal(42);
    expect(g.tableau.map(p => p.length)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    for (const p of g.tableau) expect(p.map(x => x.up)).toEqual(p.map((_, i) => i === p.length - 1));
    expect(g.stock).toHaveLength(24);
    expect(new Set([...g.stock, ...g.tableau.flat()].map(x => `${x.suit}-${x.rank}`)).size).toBe(52);
  });

  it('one tap: an Ace goes to its own suit pile', () => {
    const g = empty();
    g.tableau[0] = [c(5, 0, false), c(1, 2)];
    const d = bestMove(g, { kind: 'tab', col: 0, row: 1 });
    expect(d).toEqual({ kind: 'found', pile: 2 });
    const n = applyMove(g, { kind: 'tab', col: 0, row: 1 }, d!);
    expect(n.foundations[2].map(x => x.rank)).toEqual([1]);
    expect(n.tableau[0][0].up).toBe(true); // the card underneath turns over
    expect(g.tableau[0]).toHaveLength(2); // the old game is untouched (Undo)
  });

  it('a red 6 goes on a black 7, never on a red 7 or a black 8', () => {
    const g = empty();
    g.tableau[0] = [c(7, 1)];
    g.tableau[1] = [c(8, 3)];
    g.tableau[2] = [c(7, 3)];
    g.waste = [c(6, 2)];
    expect(bestMove(g, { kind: 'waste' })).toEqual({ kind: 'tab', col: 2 });
    expect(canMove(g, { kind: 'waste' }, { kind: 'tab', col: 0 })).toBe(false);
    expect(canMove(g, { kind: 'waste' }, { kind: 'tab', col: 1 })).toBe(false);
  });

  it('a card from the middle of a column moves with everything on it', () => {
    const g = empty();
    g.tableau[0] = [c(2, 0, false), c(9, 1), c(8, 3), c(7, 2)];
    g.tableau[1] = [c(10, 0)];
    const n = applyMove(g, { kind: 'tab', col: 0, row: 1 }, bestMove(g, { kind: 'tab', col: 0, row: 1 })!);
    expect(n.tableau[1].map(x => x.rank)).toEqual([10, 9, 8, 7]);
    expect(n.tableau[0]).toHaveLength(1);
    expect(n.tableau[0][0].up).toBe(true);
  });

  it('only Kings go to an empty column, and a King already at the top stays put', () => {
    const g = empty();
    g.tableau[0] = [c(13, 0)];
    g.tableau[2] = [c(3, 1, false), c(13, 2)];
    g.waste = [c(12, 1)];
    expect(bestMove(g, { kind: 'tab', col: 0, row: 0 })).toBeNull();
    expect(bestMove(g, { kind: 'tab', col: 2, row: 1 })).toEqual({ kind: 'tab', col: 1 });
    expect(bestMove(g, { kind: 'waste' })).toEqual({ kind: 'tab', col: 0 }); // red Q on black K
  });

  it('a face-down card or an impossible card does not move', () => {
    const g = empty();
    g.tableau[0] = [c(4, 0, false), c(9, 1)];
    expect(bestMove(g, { kind: 'tab', col: 0, row: 0 })).toBeNull();
    expect(bestMove(g, { kind: 'tab', col: 0, row: 1 })).toBeNull();
    expect(anyMove(g)).toBe(false);
  });

  it('only one card at a time goes up to a suit pile, in order', () => {
    const g = empty();
    g.foundations[0] = [c(1, 0)];
    g.tableau[0] = [c(3, 0)];
    g.tableau[1] = [c(2, 0), c(1, 2)];
    expect(canMove(g, { kind: 'tab', col: 0, row: 0 }, { kind: 'found', pile: 0 })).toBe(false);
    expect(canMove(g, { kind: 'tab', col: 1, row: 0 }, { kind: 'found', pile: 0 })).toBe(false); // two cards
  });

  it('the deck turns one card at a time, then starts again in the same order', () => {
    const g = deal(7);
    const order = g.stock.map(x => x.id).reverse();
    let n = g;
    for (let i = 0; i < 24; i++) n = drawCard(n);
    expect(n.waste.map(x => x.id)).toEqual(order);
    expect(n.waste.every(x => x.up)).toBe(true);
    n = drawCard(n);
    expect(n.stock).toHaveLength(24);
    expect(n.waste).toHaveLength(0);
    expect(drawCard(n).waste[0].id).toBe(order[0]);
    expect(count(n)).toBe(52);
  });

  it('a game played only with one-tap moves and the deck never loses or duplicates cards, and some deals are won', () => {
    let wins = 0;
    for (let seed = 1; seed <= 300; seed++) {
      let g = deal(seed);
      let idle = 0;
      for (let step = 0; step < 3000 && !won(g) && idle < 60; step++) {
        let moved = false;
        // Prefer moves to the suit piles, then moves that turn over a face-down card.
        const srcs = [{ kind: 'waste' } as const, ...g.tableau.flatMap((p, col) => p.map((x, row) => ({ kind: 'tab' as const, col, row, x })).filter(s => s.x.up))];
        for (const s of srcs) {
          const d = bestMove(g, s);
          if (!d) continue;
          const reveals = s.kind === 'tab' && s.row > 0 && !g.tableau[s.col][s.row - 1].up;
          if (d.kind === 'found' || reveals || (s.kind === 'waste')) {
            g = applyMove(g, s, d);
            moved = true;
            break;
          }
        }
        if (moved) idle = 0;
        else {
          g = drawCard(g);
          idle++;
        }
        expect(count(g)).toBe(52);
      }
      if (won(g)) wins++;
    }
    expect(wins).toBeGreaterThan(0);
  });
});
