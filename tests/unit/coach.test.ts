import { describe, expect, it } from 'vitest';
import { needsCoachFrom } from '../../src/lib/coach';

describe('first-time walkthrough', () => {
  it('shows for someone who never opened the game (the current open counts as one round)', () => {
    expect(needsCoachFrom([], {}, 'solitaire')).toBe(true);
    expect(needsCoachFrom([], { '2026-10-28': { games: { solitaire: { started: 1, solved: 0 } } } }, 'solitaire')).toBe(true);
  });
  it('not once finished or skipped, or for someone who played before', () => {
    expect(needsCoachFrom(['solitaire'], {}, 'solitaire')).toBe(false);
    expect(needsCoachFrom([], { '2026-01-02': { games: { solitaire: { started: 1, solved: 0 } } }, '2026-10-28': { games: { solitaire: { started: 1, solved: 0 } } } }, 'solitaire')).toBe(false);
  });
  it('playing other games does not count', () => {
    expect(needsCoachFrom(['sudoku'], { '2026-01-02': { games: { sudoku: { started: 9, solved: 2 } } } }, 'solitaire')).toBe(true);
  });
});
