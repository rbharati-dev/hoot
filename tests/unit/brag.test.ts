import { describe, expect, it } from 'vitest';
import { bragText, mmss } from '../../src/lib/brag';

const w = {
  bragSolved: (g: string, time: string) => `${g} solved in ${time}`,
  bragToday: (n: number) => `${n} puzzles today`,
  bragStreak: (n: number) => `${n}-day streak`,
  bragPlay: 'Play free at',
};
const now = new Date(2026, 10, 7, 10);

describe('Share your result', () => {
  it('formats times as m:ss', () => {
    expect(mmss(372)).toBe('6:12');
    expect(mmss(5)).toBe('0:05');
  });
  it('makes a short brag with a link back', () => {
    expect(bragText(w, 'en', 'Sudoku', 372, 3, 5, now)).toBe('🦉 Hoot · Nov 7\nSudoku solved in 6:12 ✅\n3 puzzles today · 5-day streak 🔥\nPlay free at hootdaily.com');
  });
  it('leaves out the extras line for a first puzzle with no streak', () => {
    expect(bragText(w, 'en', 'Hangman', 61, 1, 0, now)).toBe('🦉 Hoot · Nov 7\nHangman solved in 1:01 ✅\nPlay free at hootdaily.com');
  });
});
