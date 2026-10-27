// Word-search grid builder. Words are placed in all eight directions —
// forwards and backwards, up and down, and both diagonals each way — so the
// puzzle isn't predictable. Pure, so it can be unit-tested.
import { alphabet, syllables, wordsFor, type Entry } from './wordbank';

export const WS_SIZE = 10;

// All 8 directions as [dr, dc].
export const WS_DIRS: [number, number][] = [
  [0, 1], // →
  [0, -1], // ←
  [1, 0], // ↓
  [-1, 0], // ↑
  [1, 1], // ↘
  [1, -1], // ↙
  [-1, 1], // ↗
  [-1, -1], // ↖
];

export interface Placed {
  word: string;
  units: string[];
  r: number;
  c: number;
  dr: number;
  dc: number;
}
export interface WordSearch {
  grid: string[][];
  placed: Placed[];
}

// Valid start index along one axis for a direction component and word length.
function startRange(delta: number, len: number, size: number): [number, number] {
  if (delta === 0) return [0, size - 1];
  if (delta > 0) return [0, size - len]; // moving forward: leave room ahead
  return [len - 1, size - 1]; // moving backward: leave room behind
}

export function buildWordSearch(seed: number, count = 8, entries: Entry[] = wordsFor('en'), letters: string[] = alphabet('en')): WordSearch {
  let s = seed >>> 0 || 3;
  const rand = () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296);
  const randInt = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1));

  const grid: string[][] = Array.from({ length: WS_SIZE }, () => Array(WS_SIZE).fill(''));
  const pool = entries
    .filter(e => e.units.length <= WS_SIZE && e.units.length >= (letters.length ? 4 : 2))
    .sort(() => rand() - 0.5);
  const fill = letters.length ? letters : syllables(entries);

  const placed: Placed[] = [];
  for (const { word, units: u } of pool) {
    if (placed.length >= count) break;
    for (let tries = 0; tries < 80; tries++) {
      const [dr, dc] = WS_DIRS[Math.floor(rand() * WS_DIRS.length)];
      const [rLo, rHi] = startRange(dr, u.length, WS_SIZE);
      const [cLo, cHi] = startRange(dc, u.length, WS_SIZE);
      const r = randInt(rLo, rHi);
      const c = randInt(cLo, cHi);
      let ok = true;
      for (let k = 0; k < u.length; k++) {
        const cur = grid[r + dr * k][c + dc * k];
        if (cur && cur !== u[k]) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      for (let k = 0; k < u.length; k++) grid[r + dr * k][c + dc * k] = u[k];
      placed.push({ word, units: u, r, c, dr, dc });
      break;
    }
  }

  for (const row of grid) for (let c = 0; c < WS_SIZE; c++) if (!row[c]) row[c] = fill[Math.floor(rand() * fill.length)];
  return { grid, placed };
}
