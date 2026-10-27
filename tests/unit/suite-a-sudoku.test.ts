import { describe, expect, it } from 'vitest';
import { CLUES, canPlace, makeSudoku, type Grid, type Level } from '../../src/lib/sudoku';

const LEVELS: Level[] = ['easy', 'medium', 'hard', 'expert'];
const SEEDS = Array.from({ length: 15 }, (_, i) => 1000 + i * 37);

function validComplete(g: Grid) {
  expect(g.length).toBe(81);
  for (let i = 0; i < 9; i++) {
    const row = new Set<number>(), col = new Set<number>(), box = new Set<number>();
    for (let k = 0; k < 9; k++) {
      row.add(g[i * 9 + k]);
      col.add(g[k * 9 + i]);
      const br = Math.floor(i / 3) * 3, bc = (i % 3) * 3;
      box.add(g[(br + Math.floor(k / 3)) * 9 + bc + (k % 3)]);
    }
    for (const s of [row, col, box]) {
      expect(s.size).toBe(9);
      for (let n = 1; n <= 9; n++) expect(s.has(n)).toBe(true);
    }
  }
}

// Independent backtracking solver that counts solutions up to `limit`.
function countSolutions(g: Grid, limit = 2): number {
  const a = g.slice();
  const ok = (i: number, n: number) => {
    const r = Math.floor(i / 9), c = i % 9;
    for (let k = 0; k < 9; k++) {
      if (a[r * 9 + k] === n || a[k * 9 + c] === n) return false;
      if (a[(r - (r % 3) + Math.floor(k / 3)) * 9 + c - (c % 3) + (k % 3)] === n) return false;
    }
    return true;
  };
  let count = 0;
  const go = () => {
    let best = -1, bestOpts: number[] = [];
    for (let i = 0; i < 81; i++) {
      if (a[i]) continue;
      const o: number[] = [];
      for (let n = 1; n <= 9; n++) if (ok(i, n)) o.push(n);
      if (!o.length) return;
      if (best < 0 || o.length < bestOpts.length) { best = i; bestOpts = o; }
    }
    if (best < 0) { count++; return; }
    for (const n of bestOpts) {
      a[best] = n;
      go();
      a[best] = 0;
      if (count >= limit) return;
    }
  };
  go();
  return count;
}

const cache = new Map<string, { puzzle: Grid; solution: Grid }>();
const gen = (level: Level, seed: number) => {
  const k = `${level}:${seed}`;
  if (!cache.has(k)) cache.set(k, makeSudoku(level, seed));
  return cache.get(k)!;
};
const givens = (g: Grid) => g.filter(Boolean).length;

describe('sudoku: generated puzzles', () => {
  const rows: [Level, number][] = [];
  for (const l of LEVELS) for (const s of SEEDS) rows.push([l, s]);

  it.each(rows)('%s seed %i: solution is a valid completed grid', (level, seed) => {
    validComplete(gen(level, seed).solution);
  });
  it.each(rows)('%s seed %i: givens agree with the solution and contain only 0-9', (level, seed) => {
    const { puzzle, solution } = gen(level, seed);
    expect(puzzle.length).toBe(81);
    puzzle.forEach((v, i) => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(9);
      if (v) expect(v).toBe(solution[i]);
    });
  });
  it.each(rows)('%s seed %i: has exactly one solution', (level, seed) => {
    expect(countSolutions(gen(level, seed).puzzle)).toBe(1);
  });
  it.each(rows)('%s seed %i: clue count is near the level target', (level, seed) => {
    const n = givens(gen(level, seed).puzzle);
    expect(n).toBeGreaterThanOrEqual(CLUES[level]);
    expect(n).toBeLessThanOrEqual(CLUES[level] + 12);
  });
  it.each(rows)('%s seed %i: givens are not in conflict (canPlace on each)', (level, seed) => {
    const { puzzle } = gen(level, seed);
    puzzle.forEach((v, i) => { if (v) expect(canPlace(puzzle, i, v)).toBe(true); });
  });
});

describe('sudoku: levels', () => {
  it('CLUES are strictly decreasing with difficulty', () => {
    expect(CLUES.easy).toBeGreaterThan(CLUES.medium);
    expect(CLUES.medium).toBeGreaterThan(CLUES.hard);
    expect(CLUES.hard).toBeGreaterThan(CLUES.expert);
  });
  it('has the four levels with sensible targets', () => {
    expect(CLUES).toEqual({ easy: 42, medium: 34, hard: 28, expert: 23 });
  });
  it('average given-count orders easy > medium > hard >= expert', () => {
    const avg = (l: Level) => SEEDS.reduce((a, s) => a + givens(gen(l, s).puzzle), 0) / SEEDS.length;
    expect(avg('easy')).toBeGreaterThan(avg('medium'));
    expect(avg('medium')).toBeGreaterThan(avg('hard'));
    expect(avg('hard')).toBeGreaterThanOrEqual(avg('expert'));
  });
  it.each(SEEDS.slice(0, 5).map(s => [s]))('seed %i: easy has more givens than hard', seed => {
    expect(givens(gen('easy', seed).puzzle)).toBeGreaterThan(givens(gen('hard', seed).puzzle));
  });
  it('same level and seed is deterministic', () => {
    const a = makeSudoku('medium', 555), b = makeSudoku('medium', 555);
    expect(a).toEqual(b);
  });
  it('different seeds give different solutions', () => {
    const set = new Set(SEEDS.map(s => gen('easy', s).solution.join('')));
    expect(set.size).toBe(SEEDS.length);
  });
  it('same seed shares the solution across levels (clues only differ)', () => {
    expect(gen('easy', SEEDS[0]).solution).toEqual(gen('expert', SEEDS[0]).solution);
  });
  it('works without an explicit seed', () => {
    const { puzzle, solution } = makeSudoku('easy');
    validComplete(solution);
    expect(givens(puzzle)).toBeGreaterThanOrEqual(42);
  });
});

describe('canPlace', () => {
  const empty = (): Grid => Array(81).fill(0);
  it('allows anything on an empty grid', () => {
    const g = empty();
    for (let i = 0; i < 81; i += 7) for (let n = 1; n <= 9; n++) expect(canPlace(g, i, n)).toBe(true);
  });
  it.each([[0, 5], [8, 5], [40, 9], [80, 1]])('rejects a repeat in the same row (cell %i digit %i)', (i, n) => {
    const g = empty();
    const r = Math.floor(i / 9);
    const other = r * 9 + ((i % 9) + 4) % 9;
    g[other] = n;
    expect(canPlace(g, i, n)).toBe(false);
  });
  it.each([[0, 3], [9, 3], [44, 7], [80, 2]])('rejects a repeat in the same column (cell %i digit %i)', (i, n) => {
    const g = empty();
    const c = i % 9;
    const other = (((Math.floor(i / 9) + 5) % 9)) * 9 + c;
    g[other] = n;
    expect(canPlace(g, i, n)).toBe(false);
  });
  it.each([[0, 4], [10, 6], [40, 8], [80, 1]])('rejects a repeat in the same 3x3 box (cell %i digit %i)', (i, n) => {
    const g = empty();
    const r = Math.floor(i / 9), c = i % 9;
    const br = r - (r % 3), bc = c - (c % 3);
    // a cell in the box that shares neither row nor column
    const orow = br + ((r - br + 1) % 3), ocol = bc + ((c - bc + 1) % 3);
    g[orow * 9 + ocol] = n;
    expect(canPlace(g, i, n)).toBe(false);
  });
  it('digits in other rows, columns and boxes do not block', () => {
    const g = empty();
    g[1 * 9 + 4] = 5; // different row, col and box from cell 0
    g[4 * 9 + 1] = 5;
    expect(canPlace(g, 0, 5)).toBe(true);
  });
  it('a cell does not conflict with itself', () => {
    const g = empty();
    g[30] = 7;
    expect(canPlace(g, 30, 7)).toBe(true);
  });
  it('different digit in the same unit is fine', () => {
    const g = empty();
    g[1] = 3;
    expect(canPlace(g, 0, 4)).toBe(true);
  });
  it('on a full solution, only the right digit fits each cell once cleared', () => {
    const { solution } = gen('easy', SEEDS[0]);
    for (const i of [0, 13, 40, 66, 80]) {
      const g = solution.slice();
      g[i] = 0;
      for (let n = 1; n <= 9; n++) expect(canPlace(g, i, n)).toBe(n === solution[i]);
    }
  });
});
