// Small crossword generator: places words from a clue list so they cross,
// then numbers the grid the usual way. Words come from the word bank in the
// person's language and culture; each grid cell holds one unit (a letter, or a
// whole Devanagari syllable).
import { wordsFor, type Entry } from './wordbank';

export interface Placed {
  word: string;
  units: string[]; // one per cell
  clue: string;
  row: number;
  col: number;
  dir: 'across' | 'down';
  num: number;
}

export interface Crossword {
  rows: number;
  cols: number;
  cells: (string | null)[][]; // solution letters, null = black
  numbers: (number | null)[][];
  words: Placed[];
}

function rng(seed: number) {
  let s = seed >>> 0 || 7;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const MAX_CLASSIC = 13;
const MAX_BIG = 15; // room for the 14-word "Big" puzzle

/**
 * Builds a crossword from `entries`. Tries a few layouts from the same seed and
 * keeps the one that places the most words (sparse alphabets such as
 * Devanagari syllables cross less often, so one attempt can come out thin).
 * Deterministic: the same seed always gives the same puzzle.
 */
export function makeCrossword(seed: number, target = 9, entries: Entry[] = wordsFor('en')): Crossword {
  let best: Crossword | null = null;
  for (let attempt = 0; attempt < 8; attempt++) {
    const cw = layout((seed + attempt * 7919) >>> 0, target, entries);
    if (!best || cw.words.length > best.words.length) best = cw;
    if (best.words.length >= target) break;
  }
  return best!;
}

function layout(seed: number, target: number, entries: Entry[]): Crossword {
  const MAX = target > 9 ? MAX_BIG : MAX_CLASSIC;
  const rand = rng(seed);
  const pool: [string[], string, string][] = entries
    .filter(e => e.units.length >= 2 && e.units.length <= MAX)
    .map(e => [e.units, e.clue, e.word] as [string[], string, string])
    .sort(() => rand() - 0.5);
  const grid = new Map<string, string>();
  const cellDir = new Map<string, string>(); // which direction(s) use each cell
  const key = (r: number, c: number) => `${r},${c}`;
  const placed: Omit<Placed, 'num'>[] = [];
  let minR = 0, maxR = 0, minC = 0, maxC = 0;

  const fits = (w: string[], r: number, c: number, dir: 'across' | 'down') => {
    const dr = dir === 'down' ? 1 : 0, dc = dir === 'across' ? 1 : 0;
    if (grid.has(key(r - dr, c - dc)) || grid.has(key(r + dr * w.length, c + dc * w.length))) return -1;
    let crossings = 0;
    for (let k = 0; k < w.length; k++) {
      const rr = r + dr * k, cc = c + dc * k;
      const cur = grid.get(key(rr, cc));
      if (cur) {
        if (cur !== w[k] || (cellDir.get(key(rr, cc)) ?? '').includes(dir)) return -1;
        crossings++;
      } else if (grid.has(key(rr + dc, cc + dr)) || grid.has(key(rr - dc, cc - dr))) {
        return -1; // would touch a parallel word
      }
    }
    const nMinR = Math.min(minR, r), nMaxR = Math.max(maxR, r + dr * (w.length - 1));
    const nMinC = Math.min(minC, c), nMaxC = Math.max(maxC, c + dc * (w.length - 1));
    if (nMaxR - nMinR + 1 > MAX || nMaxC - nMinC + 1 > MAX) return -1;
    return crossings;
  };

  const put = (w: string[], clue: string, word: string, r: number, c: number, dir: 'across' | 'down') => {
    const dr = dir === 'down' ? 1 : 0, dc = dir === 'across' ? 1 : 0;
    for (let k = 0; k < w.length; k++) {
      const kk = key(r + dr * k, c + dc * k);
      grid.set(kk, w[k]);
      cellDir.set(kk, (cellDir.get(kk) ?? '') + dir);
    }
    minR = Math.min(minR, r); maxR = Math.max(maxR, r + dr * (w.length - 1));
    minC = Math.min(minC, c); maxC = Math.max(maxC, c + dc * (w.length - 1));
    placed.push({ word, units: w, clue, row: r, col: c, dir });
  };

  const longest = Math.max(...pool.map(([w]) => w.length));
  const first = pool.find(([w]) => w.length >= Math.min(7, longest) && w.length <= 10) ?? pool[0];
  put(first[0], first[1], first[2], 0, 0, 'across');

  for (let pass = 0; pass < 3 && placed.length < target; pass++) {
    for (const [w, clue, word] of pool) {
      if (placed.length >= target) break;
      if (placed.some(p => p.word === word)) continue;
      let best: { r: number; c: number; dir: 'across' | 'down'; score: number } | null = null;
      for (const [k, letter] of grid) {
        const [r0, c0] = k.split(',').map(Number);
        for (let i = 0; i < w.length; i++) {
          if (w[i] !== letter) continue;
          for (const dir of ['across', 'down'] as const) {
            const r = dir === 'down' ? r0 - i : r0;
            const c = dir === 'across' ? c0 - i : c0;
            const s = fits(w, r, c, dir);
            if (s > 0 && (!best || s + rand() * 0.5 > best.score)) best = { r, c, dir, score: s + rand() * 0.5 };
          }
        }
      }
      if (best) put(w, clue, word, best.r, best.c, best.dir);
    }
  }

  const rows = maxR - minR + 1, cols = maxC - minC + 1;
  const cells: (string | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));
  for (const [k, letter] of grid) {
    const [r, c] = k.split(',').map(Number);
    cells[r - minR][c - minC] = letter;
  }
  const numbers: (number | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));
  const words: Placed[] = [];
  let n = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const starts = placed.filter(p => p.row - minR === r && p.col - minC === c);
      if (!starts.length) continue;
      n++;
      numbers[r][c] = n;
      for (const p of starts) words.push({ ...p, row: r, col: c, num: n });
    }
  }
  return { rows, cols, cells, numbers, words };
}

export function todaySeed() {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}
