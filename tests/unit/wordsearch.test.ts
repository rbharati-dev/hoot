import { describe, expect, it } from 'vitest';
import { buildWordSearch, WS_DIRS, WS_SIZE } from '../../src/lib/wordsearch';

describe('word search', () => {
  it('places every word within bounds and spelled correctly', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { grid, placed } = buildWordSearch(seed);
      expect(placed.length).toBeGreaterThan(0);
      for (const p of placed) {
        for (let k = 0; k < p.units.length; k++) {
          const r = p.r + p.dr * k;
          const c = p.c + p.dc * k;
          expect(r, 'row in bounds').toBeGreaterThanOrEqual(0);
          expect(r).toBeLessThan(WS_SIZE);
          expect(c, 'col in bounds').toBeGreaterThanOrEqual(0);
          expect(c).toBeLessThan(WS_SIZE);
          expect(grid[r][c]).toBe(p.units[k]);
        }
      }
    }
  });

  it('uses all eight directions across many puzzles', () => {
    const seen = new Set<string>();
    for (let seed = 1; seed <= 400; seed++) {
      for (const p of buildWordSearch(seed).placed) seen.add(`${p.dr},${p.dc}`);
    }
    for (const [dr, dc] of WS_DIRS) {
      expect(seen.has(`${dr},${dc}`), `direction ${dr},${dc} should appear`).toBe(true);
    }
    // In particular the "new" ones the user asked for.
    expect(seen.has('0,-1'), 'backwards horizontal').toBe(true);
    expect(seen.has('-1,0'), 'upward vertical').toBe(true);
    expect(seen.has('-1,1'), 'diagonal up-right').toBe(true);
    expect(seen.has('1,-1'), 'diagonal down-left').toBe(true);
    expect(seen.has('-1,-1'), 'diagonal up-left').toBe(true);
  });

  it('fills the whole grid with letters', () => {
    const { grid } = buildWordSearch(42);
    for (const row of grid) for (const ch of row) expect(ch).toMatch(/^[A-Z]$/);
  });
});
