import { describe, expect, it } from 'vitest';
import { Chess } from 'chess.js';
import { computerMove as chessMove } from '../../src/lib/chessAI';
import { apply, computerMove as checkersMove, legalMoves, startBoard, type Board, type Move, type Piece, type Side } from '../../src/lib/checkers';
import { RANKS, SUITS, canToFoundation, canToTableau, deal, isRed, won, type Card, type Game } from '../../src/lib/solitaire';

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ------------------------------------------------------------------ chess
function chessPosition(seed: number, plies: number): string | null {
  const r = mulberry(seed);
  const g = new Chess();
  for (let i = 0; i < plies; i++) {
    const ms = g.moves();
    if (!ms.length) break;
    g.move(ms[Math.floor(r() * ms.length)]);
  }
  return g.isGameOver() ? null : g.fen();
}

describe('chess AI: always returns a legal move', () => {
  const rows: [1 | 2 | 3, number][] = [];
  for (const lvl of [1, 2, 3] as const) for (let s = 1; s <= (lvl === 3 ? 2 : 12); s++) rows.push([lvl, s]);

  it.each(rows)('level %i, random position %i', (level, seed) => {
    const fen = chessPosition(seed * 31, 6 + (seed % 25));
    if (!fen) return;
    const legal = new Chess(fen).moves({ verbose: true });
    const m = chessMove(fen, level);
    expect(m).not.toBeNull();
    expect(legal.some(l => l.from === m!.from && l.to === m!.to && l.promotion === m!.promotion)).toBe(true);
    // the move can actually be played on the board
    expect(() => new Chess(fen).move({ from: m!.from, to: m!.to, promotion: m!.promotion })).not.toThrow();
  });

  it.each([1, 2, 3].map(l => [l]))('level %i returns null when there are no moves (checkmate)', l => {
    const g = new Chess();
    for (const m of ['f3', 'e5', 'g4', 'Qh4#']) g.move(m);
    expect(g.isCheckmate()).toBe(true);
    // white to move and mated
    expect(chessMove(g.fen(), l as 1 | 2 | 3)).toBeNull();
  });
  it.each([1, 2, 3].map(l => [l]))('level %i returns null in stalemate', l => {
    const fen = '7k/5Q2/6K1/8/8/8/8/8 b - - 0 1';
    expect(new Chess(fen).isStalemate()).toBe(true);
    expect(chessMove(fen, l as 1 | 2 | 3)).toBeNull();
  });
  it.each([2, 3].map(l => [l]))('level %i finds mate in one (fool\'s mate Qh4#)', l => {
    const fen = (() => { const g = new Chess(); for (const m of ['f3', 'e5', 'g4']) g.move(m); return g.fen(); })();
    for (let i = 0; i < (l === 3 ? 1 : 3); i++) {
      const m = chessMove(fen, l as 1 | 2 | 3)!;
      expect(m.san).toBe('Qh4#');
    }
  });
  it.each([2, 3].map(l => [l]))('level %i captures a hanging queen', l => {
    // black bishop on b4... simple: black rook a8 attacks undefended white queen a1
    const fen = 'r3k3/8/8/8/8/8/8/Q3K3 b - - 0 1';
    const m = chessMove(fen, l as 1 | 2 | 3)!;
    expect(m.to).toBe('a1');
    expect(m.captured).toBe('q');
  });
  it('level 3 does not hang its queen to a pawn when a safe move exists', () => {
    const fen = 'rnb1kbnr/pppp1ppp/8/4p3/3PP3/8/PPP2PPP/RNBQKBNR b KQkq - 0 3';
    const m = chessMove(fen, 3)!;
    const g = new Chess(fen);
    g.move(m.san);
    expect(g.isCheckmate()).toBe(false);
    // black must not have lost material immediately: white has no capture of a black queen
    const queenCaptured = g.moves({ verbose: true }).some(x => x.captured === 'q');
    expect(queenCaptured).toBe(false);
  });
  it('returned move is for the side to move (black)', () => {
    const fen = chessPosition(5, 9)!;
    const turn = new Chess(fen).turn();
    const m = chessMove(fen, 2)!;
    expect(m.color).toBe(turn);
  });
  it('promotion moves are returned with a promotion piece', () => {
    const fen = '8/8/8/8/8/8/p6k/4K3 b - - 0 1';
    const m = chessMove(fen, 3)!;
    expect(m.promotion).toBeDefined();
  });
});

// --------------------------------------------------------------- checkers
const sq = (r: number, c: number) => r * 8 + c;
const empty = (): Board => Array(64).fill(null);
const P = (s: Side, k = false): Piece => ({ s, k });
const count = (b: Board, s?: Side) => b.filter(p => p && (!s || p.s === s)).length;

function playout(seed: number, plies: number): { b: Board; side: Side; over: boolean } {
  const r = mulberry(seed);
  let b = startBoard();
  let side: Side = 'r';
  for (let i = 0; i < plies; i++) {
    const ms = legalMoves(b, side);
    if (!ms.length) return { b, side, over: true };
    b = apply(b, ms[Math.floor(r() * ms.length)]);
    side = side === 'r' ? 'b' : 'r';
  }
  return { b, side, over: false };
}

describe('checkers: setup and basic moves', () => {
  it('start board has 12 pieces each on dark squares only', () => {
    const b = startBoard();
    expect(count(b, 'r')).toBe(12);
    expect(count(b, 'b')).toBe(12);
    b.forEach((p, i) => { if (p) expect((Math.floor(i / 8) + (i % 8)) % 2).toBe(1); });
    expect(b.every(p => !p || !p.k)).toBe(true);
  });
  it('red starts at the bottom, black at the top', () => {
    const b = startBoard();
    b.forEach((p, i) => { if (p) expect(p.s).toBe(Math.floor(i / 8) < 3 ? 'b' : 'r'); });
  });
  it('red has exactly 7 opening moves, black 7', () => {
    expect(legalMoves(startBoard(), 'r')).toHaveLength(7);
    expect(legalMoves(startBoard(), 'b')).toHaveLength(7);
  });
  it('red men move up only; black men move down only', () => {
    for (const m of legalMoves(startBoard(), 'r')) expect(Math.floor(m.path[1] / 8)).toBeLessThan(Math.floor(m.path[0] / 8));
    for (const m of legalMoves(startBoard(), 'b')) expect(Math.floor(m.path[1] / 8)).toBeGreaterThan(Math.floor(m.path[0] / 8));
  });
  it('a plain step moves the piece and leaves the origin empty', () => {
    const b = startBoard();
    const m = legalMoves(b, 'r')[0];
    const nb = apply(b, m);
    expect(nb[m.path[0]]).toBeNull();
    expect(nb[m.path[1]]).toEqual({ s: 'r', k: false });
    expect(b[m.path[0]]).not.toBeNull(); // original not mutated
  });
  it('a man cannot step backward', () => {
    const b = empty();
    b[sq(4, 3)] = P('r');
    const dest = legalMoves(b, 'r').map(m => m.path[1]);
    expect(dest.sort()).toEqual([sq(3, 2), sq(3, 4)].sort());
  });
  it('a king can step in all four diagonals', () => {
    const b = empty();
    b[sq(4, 3)] = P('r', true);
    expect(legalMoves(b, 'r').map(m => m.path[1]).sort((a, c) => a - c)).toEqual([sq(3, 2), sq(3, 4), sq(5, 2), sq(5, 4)].sort((a, c) => a - c));
  });
  it('pieces at the edge only have moves on the board', () => {
    const b = empty();
    b[sq(4, 7)] = P('r');
    expect(legalMoves(b, 'r').map(m => m.path[1])).toEqual([sq(3, 6)]);
  });
  it('blocked pieces have no moves', () => {
    const b = empty();
    b[sq(7, 0)] = P('r');
    b[sq(6, 1)] = P('r');
    b[sq(5, 2)] = P('r');
    b[sq(5, 0)] = P('r');
    expect(legalMoves(b, 'r').filter(m => m.path[0] === sq(7, 0))).toHaveLength(0);
  });
});

describe('checkers: jumps are compulsory', () => {
  it('a single jump removes the captured piece', () => {
    const b = empty();
    b[sq(5, 2)] = P('r');
    b[sq(4, 3)] = P('b');
    const ms = legalMoves(b, 'r');
    expect(ms).toEqual([{ path: [sq(5, 2), sq(3, 4)], taken: [sq(4, 3)] }]);
    const nb = apply(b, ms[0]);
    expect(nb[sq(4, 3)]).toBeNull();
    expect(nb[sq(3, 4)]).toEqual({ s: 'r', k: false });
    expect(nb[sq(5, 2)]).toBeNull();
  });
  it('when a jump exists, ordinary steps (even by other pieces) are not offered', () => {
    const b = empty();
    b[sq(5, 2)] = P('r');
    b[sq(4, 3)] = P('b');
    b[sq(7, 6)] = P('r'); // has free steps but must not be offered
    const ms = legalMoves(b, 'r');
    expect(ms.length).toBeGreaterThan(0);
    for (const m of ms) { expect(m.taken.length).toBeGreaterThan(0); expect(m.path[0]).toBe(sq(5, 2)); }
  });
  it('cannot jump over your own piece', () => {
    const b = empty();
    b[sq(5, 2)] = P('r');
    b[sq(4, 3)] = P('r');
    for (const m of legalMoves(b, 'r')) expect(m.taken).toHaveLength(0);
  });
  it('cannot jump when the landing square is occupied', () => {
    const b = empty();
    b[sq(5, 2)] = P('r');
    b[sq(4, 3)] = P('b');
    b[sq(3, 4)] = P('b');
    for (const m of legalMoves(b, 'r')) expect(m.taken).toHaveLength(0);
  });
  it('cannot jump off the board', () => {
    const b = empty();
    b[sq(4, 1)] = P('r');
    b[sq(3, 0)] = P('b');
    for (const m of legalMoves(b, 'r')) expect(m.taken).toHaveLength(0);
  });
  it('multi-jumps continue along the path', () => {
    const b = empty();
    b[sq(6, 1)] = P('r');
    b[sq(5, 2)] = P('b');
    b[sq(3, 4)] = P('b');
    const ms = legalMoves(b, 'r');
    expect(ms).toHaveLength(1);
    expect(ms[0].path).toEqual([sq(6, 1), sq(4, 3), sq(2, 5)]);
    expect(ms[0].taken).toEqual([sq(5, 2), sq(3, 4)]);
    const nb = apply(b, ms[0]);
    expect(count(nb, 'b')).toBe(0);
  });
  it('a multi-jump never offers the shorter partial jump as a legal move', () => {
    const b = empty();
    b[sq(6, 1)] = P('r');
    b[sq(5, 2)] = P('b');
    b[sq(3, 4)] = P('b');
    expect(legalMoves(b, 'r').every(m => m.taken.length === 2)).toBe(true);
  });
  it('the same piece is not jumped twice in one chain', () => {
    const b = empty();
    b[sq(4, 3)] = P('r', true);
    b[sq(3, 4)] = P('b');
    b[sq(5, 4)] = P('b');
    b[sq(5, 2)] = P('b');
    b[sq(3, 2)] = P('b');
    for (const m of legalMoves(b, 'r')) expect(new Set(m.taken).size).toBe(m.taken.length);
  });
  it('kings jump backward too', () => {
    const b = empty();
    b[sq(3, 2)] = P('r', true);
    b[sq(4, 3)] = P('b');
    const ms = legalMoves(b, 'r');
    expect(ms).toEqual([{ path: [sq(3, 2), sq(5, 4)], taken: [sq(4, 3)] }]);
  });
  it('men do not jump backward', () => {
    const b = empty();
    b[sq(3, 2)] = P('r');
    b[sq(4, 3)] = P('b');
    for (const m of legalMoves(b, 'r')) expect(m.taken).toHaveLength(0);
  });
  it('black is also forced to jump', () => {
    const b = empty();
    b[sq(2, 1)] = P('b');
    b[sq(3, 2)] = P('r');
    b[sq(0, 7)] = P('b');
    const ms = legalMoves(b, 'b');
    expect(ms).toEqual([{ path: [sq(2, 1), sq(4, 3)], taken: [sq(3, 2)] }]);
  });
  it('offers a choice between two available jumps', () => {
    const b = empty();
    b[sq(5, 4)] = P('r');
    b[sq(4, 3)] = P('b');
    b[sq(4, 5)] = P('b');
    expect(legalMoves(b, 'r')).toHaveLength(2);
  });
});

describe('checkers: kings and game over', () => {
  it('a red man reaching row 0 is crowned', () => {
    const b = empty();
    b[sq(1, 2)] = P('r');
    const m = legalMoves(b, 'r').find(x => x.path[1] === sq(0, 1))!;
    expect(apply(b, m)[sq(0, 1)]).toEqual({ s: 'r', k: true });
  });
  it('a black man reaching row 7 is crowned', () => {
    const b = empty();
    b[sq(6, 1)] = P('b');
    const m = legalMoves(b, 'b').find(x => x.path[1] === sq(7, 0))!;
    expect(apply(b, m)[sq(7, 0)]).toEqual({ s: 'b', k: true });
  });
  it('a man is not crowned on the near row', () => {
    const b = empty();
    b[sq(5, 2)] = P('r');
    const m = legalMoves(b, 'r')[0];
    expect(apply(b, m)[m.path[1]]!.k).toBe(false);
  });
  it('crowning by capture ends the jump chain', () => {
    const b = empty();
    b[sq(2, 3)] = P('r');
    b[sq(1, 2)] = P('b');
    b[sq(1, 0)] = P('b'); // a king could continue backward over (1,0)? it must stop
    const ms = legalMoves(b, 'r');
    expect(ms).toHaveLength(1);
    expect(ms[0].path).toEqual([sq(2, 3), sq(0, 1)]);
    expect(apply(b, ms[0])[sq(0, 1)]!.k).toBe(true);
  });
  it('a king stays a king after moving', () => {
    const b = empty();
    b[sq(4, 3)] = P('b', true);
    const nb = apply(b, legalMoves(b, 'b')[0]);
    expect(nb.filter(p => p)[0]).toEqual({ s: 'b', k: true });
  });
  it('no pieces means no moves (game over)', () => {
    expect(legalMoves(empty(), 'r')).toEqual([]);
    expect(checkersMove(empty(), 1)).toBeNull();
  });
  it('a side with all pieces blocked has no moves (game over)', () => {
    const b = empty();
    b[sq(0, 1)] = P('r'); // red man on the top row can't move up
    expect(legalMoves(b, 'r')).toEqual([]);
  });
  it('computer (black) returns null when black has no moves', () => {
    const b = empty();
    b[sq(7, 0)] = P('b');
    b[sq(5, 2)] = P('r');
    expect(checkersMove(b, 3)).toBeNull();
  });
  it('capturing the last piece ends the game', () => {
    const b = empty();
    b[sq(5, 2)] = P('r');
    b[sq(4, 3)] = P('b');
    const nb = apply(b, legalMoves(b, 'r')[0]);
    expect(count(nb, 'b')).toBe(0);
    expect(legalMoves(nb, 'b')).toEqual([]);
  });
});

describe('checkers: computer opponent always plays a legal move', () => {
  const rows: [1 | 2 | 3, number][] = [];
  for (const l of [1, 2, 3] as const) for (let s = 1; s <= 20; s++) rows.push([l, s]);
  it.each(rows)('level %i, random position %i', (level, seed) => {
    const { b, side, over } = playout(seed * 17, 2 + (seed % 30) * 2); // even plies => red to move... adjust to black
    if (over) return;
    const board = side === 'b' ? b : apply(b, legalMoves(b, 'r')[0] ?? { path: [0, 0], taken: [] });
    const legal = legalMoves(board, 'b');
    const m = checkersMove(board, level);
    if (!legal.length) { expect(m).toBeNull(); return; }
    expect(legal).toContainEqual(m);
  });
  it('level 3 takes a free capture', () => {
    const b = empty();
    b[sq(2, 1)] = P('b');
    b[sq(3, 2)] = P('r');
    b[sq(7, 6)] = P('r');
    const m = checkersMove(b, 3)!;
    expect(m.taken).toEqual([sq(3, 2)]);
  });
  it('level 2 and 3 always take the compulsory jump', () => {
    const b = empty();
    b[sq(2, 1)] = P('b');
    b[sq(3, 2)] = P('r');
    for (const lvl of [2, 3] as const) expect(checkersMove(b, lvl)!.taken).toHaveLength(1);
  });
  it('level 1 sometimes plays a random legal move, still legal', () => {
    const b = startBoard();
    const afterRed = apply(b, legalMoves(b, 'r')[0]);
    const legal = legalMoves(afterRed, 'b');
    for (let i = 0; i < 40; i++) expect(legal).toContainEqual(checkersMove(afterRed, 1));
  });
  it('full self-play terminates with piece counts only ever going down', () => {
    for (let seed = 1; seed <= 3; seed++) {
      const r = mulberry(seed);
      let b = startBoard();
      let side: Side = 'r';
      let prev = 24;
      for (let ply = 0; ply < 200; ply++) {
        const ms: Move[] = legalMoves(b, side);
        if (!ms.length) break;
        const m = side === 'b' ? checkersMove(b, 1)! : ms[Math.floor(r() * ms.length)];
        b = apply(b, m);
        const n = count(b);
        expect(n).toBeLessThanOrEqual(prev);
        expect(prev - n).toBe(m.taken.length);
        prev = n;
        side = side === 'r' ? 'b' : 'r';
      }
    }
  });
  it('every random-playout position has only legal-shaped moves (path squares on dark squares, in range)', () => {
    for (let s = 1; s <= 25; s++) {
      const { b, side, over } = playout(s, s * 2);
      if (over) continue;
      for (const m of legalMoves(b, side)) {
        for (const q of m.path) { expect(q).toBeGreaterThanOrEqual(0); expect(q).toBeLessThan(64); expect((Math.floor(q / 8) + (q % 8)) % 2).toBe(1); }
        expect(m.path.length).toBe(m.taken.length ? m.taken.length + 1 : 2);
      }
    }
  });
});

// -------------------------------------------------------------- solitaire
const card = (suit: Card['suit'], rank: number, up = true): Card => ({ id: suit * 13 + rank, suit, rank, up });

describe('solitaire: dealing', () => {
  const seeds = [1, 2, 3, 7, 42, 99, 12345, 2024, 777777, 4000000000];
  it.each(seeds.map(s => [s]))('seed %i deals 52 unique cards', seed => {
    const g = deal(seed);
    const all = [...g.stock, ...g.waste, ...g.foundations.flat(), ...g.tableau.flat()];
    expect(all).toHaveLength(52);
    expect(new Set(all.map(c => c.id)).size).toBe(52);
    expect(new Set(all.map(c => `${c.suit}-${c.rank}`)).size).toBe(52);
  });
  it.each(seeds.map(s => [s]))('seed %i: tableau piles are sized 1..7 with only the top card face up', seed => {
    const g = deal(seed);
    expect(g.tableau.map(p => p.length)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    for (const pile of g.tableau) {
      pile.forEach((c, i) => expect(c.up).toBe(i === pile.length - 1));
    }
  });
  it.each(seeds.map(s => [s]))('seed %i: stock has 24 face-down cards, waste and foundations empty', seed => {
    const g = deal(seed);
    expect(g.stock).toHaveLength(24);
    expect(g.stock.every(c => !c.up)).toBe(true);
    expect(g.waste).toEqual([]);
    expect(g.foundations).toEqual([[], [], [], []]);
  });
  it('is deterministic per seed and varies between seeds', () => {
    expect(deal(5)).toEqual(deal(5));
    expect(JSON.stringify(deal(5))).not.toBe(JSON.stringify(deal(6)));
  });
  it('ranks and suits are in range', () => {
    const g = deal(31);
    for (const c of [...g.stock, ...g.tableau.flat()]) {
      expect(c.rank).toBeGreaterThanOrEqual(1); expect(c.rank).toBeLessThanOrEqual(13);
      expect([0, 1, 2, 3]).toContain(c.suit);
    }
  });
  it('is not just an unshuffled deck', () => {
    const g = deal(8);
    expect(g.tableau[6].map(c => c.id)).not.toEqual([...g.tableau[6]].map(c => c.id).sort((a, b) => a - b));
  });
  it('labels: 4 suits, ranks A..K', () => {
    expect(SUITS).toHaveLength(4);
    expect(RANKS).toHaveLength(14);
    expect(RANKS[1]).toBe('A');
    expect(RANKS[13]).toBe('K');
  });
  it('isRed: diamonds and hearts only', () => {
    expect([0, 1, 2, 3].map(s => isRed(card(s as Card['suit'], 5)))).toEqual([false, true, true, false]);
  });
});

describe('solitaire: rules', () => {
  it('foundation starts with an ace of any suit', () => {
    for (let s = 0; s < 4; s++) expect(canToFoundation(card(s as Card['suit'], 1), [])).toBe(true);
  });
  it('foundation does not start with a non-ace', () => {
    for (let r = 2; r <= 13; r++) expect(canToFoundation(card(0, r), [])).toBe(false);
  });
  it.each([1, 2, 5, 12])('foundation accepts the next rank of the same suit (on %i)', r => {
    expect(canToFoundation(card(2, r + 1), [card(2, r)])).toBe(true);
  });
  it.each([1, 2, 5, 12])('foundation refuses another suit (on %i)', r => {
    expect(canToFoundation(card(3, r + 1), [card(2, r)])).toBe(false);
  });
  it.each([1, 4, 9])('foundation refuses skipping or repeating ranks (on %i)', r => {
    expect(canToFoundation(card(1, r + 2), [card(1, r)])).toBe(false);
    expect(canToFoundation(card(1, r), [card(1, r)])).toBe(false);
    expect(canToFoundation(card(1, r - 1 || 13), [card(1, r)])).toBe(false);
  });
  it('foundation: cannot go beyond king', () => {
    expect(canToFoundation(card(0, 1), [card(0, 13)])).toBe(false);
  });
  it('only a king goes on an empty tableau column', () => {
    for (let r = 1; r <= 13; r++) for (let s = 0; s < 4; s++) expect(canToTableau(card(s as Card['suit'], r), [])).toBe(r === 13);
  });
  it.each([[0, 1], [0, 2], [3, 1], [3, 2]] as [number, number][])('black suit %i can go on red %i of next rank up', (bs, rs) => {
    expect(canToTableau(card(bs as Card['suit'], 6), [card(rs as Card['suit'], 7)])).toBe(true);
  });
  it.each([[1, 0], [1, 3], [2, 0], [2, 3]] as [number, number][])('red suit %i can go on black %i of next rank up', (rs, bs) => {
    expect(canToTableau(card(rs as Card['suit'], 6), [card(bs as Card['suit'], 7)])).toBe(true);
  });
  it.each([[0, 0], [0, 3], [3, 0], [3, 3], [1, 1], [1, 2], [2, 1], [2, 2]] as [number, number][])('same colour (suits %i on %i) is refused', (a, b) => {
    expect(canToTableau(card(a as Card['suit'], 6), [card(b as Card['suit'], 7)])).toBe(false);
  });
  it('tableau requires descending by exactly one', () => {
    expect(canToTableau(card(0, 5), [card(1, 7)])).toBe(false);
    expect(canToTableau(card(0, 7), [card(1, 7)])).toBe(false);
    expect(canToTableau(card(0, 8), [card(1, 7)])).toBe(false);
  });
  it('cannot place on a face-down card', () => {
    expect(canToTableau(card(0, 6), [card(1, 7, false)])).toBe(false);
  });
  it('only the top card of the pile matters', () => {
    const pile = [card(0, 13), card(1, 12), card(0, 11)];
    expect(canToTableau(card(1, 10), pile)).toBe(true);
    expect(canToTableau(card(1, 11), pile)).toBe(false);
  });
  it('an ace can go on a two of the opposite colour', () => {
    expect(canToTableau(card(1, 1), [card(0, 2)])).toBe(true);
  });
  it('won() requires four full foundations', () => {
    const full = (s: number) => Array.from({ length: 13 }, (_, i) => card(s as Card['suit'], i + 1));
    const g: Game = { stock: [], waste: [], tableau: [[], [], [], [], [], [], []], foundations: [full(0), full(1), full(2), full(3)] };
    expect(won(g)).toBe(true);
    g.foundations[3].pop();
    expect(won(g)).toBe(false);
    expect(won(deal(1))).toBe(false);
  });
});
