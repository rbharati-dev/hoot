// Sudoku generator: builds a full grid, then removes numbers while the puzzle
// still has exactly one solution.

export type Grid = number[]; // 81 cells, 0 = empty

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 1_000_000) / 1_000_000;
  };
}

function shuffle<T>(a: T[], rand: () => number): T[] {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

export function canPlace(g: Grid, i: number, n: number): boolean {
  const r = Math.floor(i / 9), c = i % 9;
  const br = r - (r % 3), bc = c - (c % 3);
  for (let k = 0; k < 9; k++) {
    if (g[r * 9 + k] === n && r * 9 + k !== i) return false;
    if (g[k * 9 + c] === n && k * 9 + c !== i) return false;
    const bi = (br + Math.floor(k / 3)) * 9 + bc + (k % 3);
    if (g[bi] === n && bi !== i) return false;
  }
  return true;
}

function fill(g: Grid, rand: () => number): boolean {
  const i = g.indexOf(0);
  if (i < 0) return true;
  for (const n of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], rand)) {
    if (canPlace(g, i, n)) {
      g[i] = n;
      if (fill(g, rand)) return true;
      g[i] = 0;
    }
  }
  return false;
}

function countSolutions(g: Grid, limit = 2): number {
  // pick the empty cell with the fewest options
  let best = -1, bestOpts: number[] = [];
  for (let i = 0; i < 81; i++) {
    if (g[i]) continue;
    const opts = [];
    for (let n = 1; n <= 9; n++) if (canPlace(g, i, n)) opts.push(n);
    if (opts.length === 0) return 0;
    if (best < 0 || opts.length < bestOpts.length) {
      best = i;
      bestOpts = opts;
      if (opts.length === 1) break;
    }
  }
  if (best < 0) return 1;
  let count = 0;
  for (const n of bestOpts) {
    g[best] = n;
    count += countSolutions(g, limit - count);
    g[best] = 0;
    if (count >= limit) break;
  }
  return count;
}

export const CLUES = { easy: 42, medium: 34, hard: 28, expert: 23 } as const;
export type Level = keyof typeof CLUES;

export function makeSudoku(level: Level, seed = Date.now()): { puzzle: Grid; solution: Grid } {
  const rand = rng(seed);
  const solution: Grid = Array(81).fill(0);
  fill(solution, rand);
  const puzzle = solution.slice();
  let filled = 81;
  for (const i of shuffle([...Array(81).keys()], rand)) {
    if (filled <= CLUES[level]) break;
    const keep = puzzle[i];
    puzzle[i] = 0;
    if (countSolutions(puzzle.slice()) !== 1) puzzle[i] = keep;
    else filled--;
  }
  return { puzzle, solution };
}
