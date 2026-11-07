import { describe, expect, it } from 'vitest';
import { weekStats, weekText } from '../../src/lib/week';

const w = {
  weekHead: 'My week on Hoot',
  weekDays: (n: number) => `Visited on ${n} days`,
  weekSolved: (n: number) => `Solved ${n} puzzles`,
  weekFives: (n: number) => `Finished Today's Five ${n} times`,
  weekRemembered: 'I remembered:',
  weekJoin: "Come and join me — it's free:",
};
const now = new Date(2026, 10, 8, 10); // Sunday

describe('Share my week with family', () => {
  it('counts only the last 7 days', () => {
    const log = {
      '2026-11-08': { games: { sudoku: { started: 2, solved: 2 } }, five: true },
      '2026-11-03': { games: { hangman: { started: 1, solved: 1 } } },
      '2026-10-30': { games: { sudoku: { started: 5, solved: 5 } }, five: true },
    };
    const s = weekStats(log as never, ['2026-11-08', '2026-11-05', '2026-11-03', '2026-10-20'], [], now);
    expect(s).toEqual({ days: 3, solved: 3, fives: 1, note: null });
  });
  it('includes the latest thing they remembered, and an invitation', () => {
    const note = { id: 'm', text: 'We danced in the kitchen.', at: '2026-11-07T10:00:00Z', title: 'Hey Jude', year: 1968, type: 'song' };
    const s = weekStats({}, ['2026-11-08'], [note], now);
    expect(weekText(w, s)).toBe("🦉 My week on Hoot\n📅 Visited on 1 days\n\n💭 I remembered: Hey Jude (1968)\n“We danced in the kitchen.”\n\nCome and join me — it's free: hootdaily.com");
  });
});
