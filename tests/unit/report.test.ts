import { describe, expect, it } from 'vitest';
import { KEEP_DAYS, dayKey, isActive, keyDate, prune, roundsOn, withFive, withSolve, withStart, type ActivityLog, type GameId } from '../../src/lib/activity';
import { gridCells, monthReport, monthsWithActivity, nextMonth, prevMonth } from '../../src/lib/report';

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h);
function play(log: ActivityLog, game: GameId, d: Date, rounds = 1, solved = 0): ActivityLog {
  for (let i = 0; i < rounds; i++) log = withStart(log, game, d);
  for (let i = 0; i < solved; i++) log = withSolve(log, game, d);
  return log;
}

describe('activity log', () => {
  it('uses the local calendar date', () => {
    expect(dayKey(at(2026, 1, 5, 0))).toBe('2026-01-05');
    expect(dayKey(at(2026, 12, 31, 23))).toBe('2026-12-31');
    expect(dayKey(keyDate('2026-03-09'))).toBe('2026-03-09');
  });

  it('counts starts and solves per game per day, immutably', () => {
    const d = at(2026, 10, 22);
    const a: ActivityLog = {};
    const b = withStart(a, 'sudoku', d);
    expect(a).toEqual({});
    const c = withSolve(withStart(b, 'sudoku', d), 'sudoku', d);
    expect(c['2026-10-22'].games.sudoku).toEqual({ started: 2, solved: 1 });
    expect(roundsOn(c, 'sudoku', d)).toBe(2);
    expect(roundsOn(c, 'chess', d)).toBe(0);
  });

  it('a solve without a recorded start still counts as a round', () => {
    const l = withSolve({}, 'trivia', at(2026, 10, 1));
    expect(l['2026-10-01'].games.trivia).toEqual({ started: 1, solved: 1 });
  });

  it('marks Today’s five without losing game counts', () => {
    const d = at(2026, 10, 2);
    const l = withFive(play({}, 'hangman', d, 2), d);
    expect(l['2026-10-02'].five).toBe(true);
    expect(l['2026-10-02'].games.hangman?.started).toBe(2);
    expect(isActive(l['2026-10-02'])).toBe(true);
  });

  it('prunes days older than KEEP_DAYS', () => {
    const now = at(2026, 10, 22);
    const old = new Date(now.getFullYear(), now.getMonth(), now.getDate() - KEEP_DAYS - 1, 12);
    const keep = new Date(now.getFullYear(), now.getMonth(), now.getDate() - KEEP_DAYS + 1, 12);
    const l = prune({ [dayKey(old)]: { games: { chess: { started: 1, solved: 0 } } }, [dayKey(keep)]: { games: { chess: { started: 1, solved: 0 } } } }, now);
    expect(Object.keys(l)).toEqual([dayKey(keep)]);
  });

  it('an empty day is not active', () => {
    expect(isActive(undefined)).toBe(false);
    expect(isActive({ games: {} })).toBe(false);
    expect(isActive({ games: { chess: { started: 0, solved: 0 } } })).toBe(false);
  });
});

describe('monthly report', () => {
  const now = at(2026, 10, 31, 20);

  it('an empty month says so and has no highlights', () => {
    const r = monthReport({}, 2026, 10, now);
    expect(r.empty).toBe(true);
    expect(r.highlights).toEqual([]);
    expect(r.calendar).toHaveLength(31);
    expect(r.previous).toBeNull();
  });

  it('adds up rounds, solves, active days and fives', () => {
    let l: ActivityLog = {};
    l = play(l, 'sudoku', at(2026, 10, 1), 2, 1);
    l = play(l, 'crossword', at(2026, 10, 1), 1, 1);
    l = play(l, 'sudoku', at(2026, 10, 2), 1, 1);
    l = withFive(l, at(2026, 10, 5));
    l = play(l, 'chess', at(2026, 9, 30), 5, 5); // last month: not counted here
    const r = monthReport(l, 2026, 10, now);
    expect(r.rounds).toBe(4);
    expect(r.solved).toBe(3);
    expect(r.activeDays).toBe(3);
    expect(r.fives).toBe(1);
    expect(r.games.map(g => [g.game, g.rounds, g.solved])).toEqual([
      ['sudoku', 3, 2],
      ['crossword', 1, 1],
    ]);
  });

  it('finds the longest run of consecutive active days within the month', () => {
    let l: ActivityLog = {};
    for (const d of [1, 2, 3, 7, 8, 9, 10, 20]) l = play(l, 'trivia', at(2026, 10, d));
    expect(monthReport(l, 2026, 10, now).longestRun).toBe(4);
  });

  it('first month with activity says welcome; later months compare', () => {
    let l = play({}, 'trivia', at(2026, 9, 10), 3);
    expect(monthReport(l, 2026, 9, now).highlights[0]).toEqual({ kind: 'firstMonth' });
    l = play(l, 'trivia', at(2026, 10, 10), 5);
    const r = monthReport(l, 2026, 10, now);
    expect(r.previous).toEqual({ activeDays: 1, rounds: 3, solved: 0 });
    expect(r.highlights[0]).toEqual({ kind: 'moreRounds', diff: 2 });
  });

  it('says "steady" (never scolds) when fewer rounds than last month', () => {
    let l = play({}, 'trivia', at(2026, 9, 10), 9);
    l = play(l, 'trivia', at(2026, 10, 10), 2);
    expect(monthReport(l, 2026, 10, now).highlights[0]).toEqual({ kind: 'steady' });
  });

  it('names the favourite game, new games and the biggest rise in solves', () => {
    let l = play({}, 'sudoku', at(2026, 9, 3), 2, 1);
    l = play(l, 'sudoku', at(2026, 10, 3), 6, 4);
    l = play(l, 'chess', at(2026, 10, 4), 1, 0);
    const r = monthReport(l, 2026, 10, now);
    expect(r.highlights).toContainEqual({ kind: 'favourite', game: 'sudoku', rounds: 6 });
    expect(r.highlights).toContainEqual({ kind: 'newGames', games: ['chess'] });
    expect(r.highlights).toContainEqual({ kind: 'solvedMore', game: 'sudoku', diff: 3 });
  });

  it('marks future days in the current month', () => {
    const r = monthReport({}, 2026, 10, at(2026, 10, 15));
    expect(r.calendar.filter(c => c.future).map(c => c.day)[0]).toBe(16);
    expect(r.calendar.filter(c => c.future)).toHaveLength(16);
  });

  it('builds a Monday-first grid with the right leading blanks', () => {
    // 1 Oct 2026 is a Thursday → 3 blanks (Mon, Tue, Wed)
    const cells = gridCells(monthReport({}, 2026, 10, now));
    expect(cells.slice(0, 3)).toEqual([null, null, null]);
    expect(cells[3]?.day).toBe(1);
    // 1 Feb 2027 is a Monday → no blanks
    expect(gridCells(monthReport({}, 2027, 2, now))[0]?.day).toBe(1);
  });

  it('handles February in leap and normal years', () => {
    expect(monthReport({}, 2028, 2, now).calendar).toHaveLength(29);
    expect(monthReport({}, 2027, 2, now).calendar).toHaveLength(28);
  });

  it('steps months across year boundaries', () => {
    expect(prevMonth(2026, 1)).toEqual({ year: 2025, month: 12 });
    expect(nextMonth(2026, 12)).toEqual({ year: 2027, month: 1 });
  });

  it('lists months with activity, newest first, always including this month', () => {
    let l = play({}, 'trivia', at(2026, 3, 1));
    l = play(l, 'trivia', at(2025, 12, 31));
    expect(monthsWithActivity(l, at(2026, 10, 1))).toEqual([
      { year: 2026, month: 10 },
      { year: 2026, month: 3 },
      { year: 2025, month: 12 },
    ]);
  });
});
