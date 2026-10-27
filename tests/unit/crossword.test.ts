import { describe, expect, it } from 'vitest';
import { makeCrossword } from '../../src/lib/crossword';
import { wordsFor } from '../../src/lib/wordbank';

const WORDS = wordsFor('en').map(e => [e.word, e.clue] as const);

describe('crossword', () => {
  it('every placed word reads correctly in the grid, and every white cell belongs to a word', () => {
    for (let seed = 1; seed <= 40; seed++) {
      const cw = makeCrossword(seed * 104729);
      expect(cw.words.length).toBeGreaterThanOrEqual(5);
      expect(cw.rows).toBeLessThanOrEqual(13);
      expect(cw.cols).toBeLessThanOrEqual(13);
      const covered = new Set<string>();
      for (const w of cw.words) {
        expect(WORDS.some(([word, clue]) => word === w.word && clue === w.clue)).toBe(true);
        expect(cw.numbers[w.row][w.col]).toBe(w.num);
        for (let k = 0; k < w.units.length; k++) {
          const r = w.row + (w.dir === 'down' ? k : 0), c = w.col + (w.dir === 'across' ? k : 0);
          expect(cw.cells[r][c]).toBe(w.units[k]);
          covered.add(`${r},${c}`);
        }
        // nothing directly before or after the word
        const br = w.row - (w.dir === 'down' ? 1 : 0), bc = w.col - (w.dir === 'across' ? 1 : 0);
        const ar = w.row + (w.dir === 'down' ? w.units.length : 0), ac = w.col + (w.dir === 'across' ? w.units.length : 0);
        expect(cw.cells[br]?.[bc] ?? null).toBeNull();
        expect(cw.cells[ar]?.[ac] ?? null).toBeNull();
      }
      cw.cells.forEach((row, r) => row.forEach((ch, c) => ch && expect(covered.has(`${r},${c}`)).toBe(true)));
    }
  });

  it('every clue word uses letters only', () => {
    for (const [word] of WORDS) expect(word).toMatch(/^[A-Z]+$/);
  });

  it('big target places more words within 15x15', () => {
    let total = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const cw = makeCrossword(seed * 7919, 14);
      expect(cw.rows).toBeLessThanOrEqual(15);
      expect(cw.cols).toBeLessThanOrEqual(15);
      total += cw.words.length;
    }
    expect(total / 20).toBeGreaterThanOrEqual(11);
  });
});
