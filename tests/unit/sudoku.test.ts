import { describe, expect, it } from 'vitest';
import { canPlace, CLUES, makeSudoku, type Level } from '../../src/lib/sudoku';

describe('sudoku', () => {
  for (const level of ['easy', 'medium', 'hard', 'expert'] as Level[]) {
    it(`${level}: solution is a valid grid and the puzzle matches it`, () => {
      for (let seed = 1; seed <= 5; seed++) {
        const { puzzle, solution } = makeSudoku(level, seed * 7919);
        expect(solution.every(n => n >= 1 && n <= 9)).toBe(true);
        solution.forEach((n, i) => expect(canPlace(solution, i, n)).toBe(true));
        puzzle.forEach((n, i) => n && expect(n).toBe(solution[i]));
        const given = puzzle.filter(Boolean).length;
        expect(given).toBeGreaterThanOrEqual(CLUES[level]);
        expect(given).toBeLessThan(81);
      }
    });
  }

  it('expert: 50 puzzles are consistent, hard-ish and quick', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const { puzzle, solution } = makeSudoku('expert', seed * 104729);
      puzzle.forEach((n, i) => n && expect(n).toBe(solution[i]));
      solution.forEach((n, i) => expect(canPlace(solution, i, n)).toBe(true));
      expect(puzzle.filter(Boolean).length).toBeLessThanOrEqual(28);
    }
  });
});
