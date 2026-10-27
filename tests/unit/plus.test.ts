import { describe, expect, it } from 'vitest';
import {
  FREE_ROUNDS_PER_DAY,
  TRIAL_DAYS,
  canStartRound,
  canStartTrial,
  inTrial,
  isPaid,
  isPlus,
  roundsLeft,
  trialDaysLeft,
  trialEnds,
  withPaid,
  withTrial,
} from '../../src/lib/plus';
import { GAMES, withStart, type ActivityLog } from '../../src/lib/activity';

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h);

describe('Hoot Plus trial', () => {
  it('starts today and lasts exactly TRIAL_DAYS calendar days', () => {
    const s = withTrial({}, at(2026, 10, 1, 9));
    expect(s.trialStart).toBe('2026-10-01');
    expect(trialEnds(s)).toBe('2026-10-14');
    expect(TRIAL_DAYS).toBe(14);
    expect(inTrial(s, at(2026, 10, 1, 0))).toBe(true);
    expect(inTrial(s, at(2026, 10, 14, 23))).toBe(true);
    expect(inTrial(s, at(2026, 10, 15, 0))).toBe(false);
    expect(inTrial(s, at(2026, 9, 30, 23))).toBe(false);
  });

  it('counts days left including today, and 0 after it ends', () => {
    const s = withTrial({}, at(2026, 10, 1));
    expect(trialDaysLeft(s, at(2026, 10, 1))).toBe(14);
    expect(trialDaysLeft(s, at(2026, 10, 13))).toBe(2);
    expect(trialDaysLeft(s, at(2026, 10, 14))).toBe(1);
    expect(trialDaysLeft(s, at(2026, 10, 15))).toBe(0);
  });

  it('crosses month and year boundaries correctly', () => {
    expect(trialEnds(withTrial({}, at(2026, 12, 25)))).toBe('2027-01-07');
    expect(trialEnds(withTrial({}, at(2028, 2, 20)))).toBe('2028-03-04'); // leap year
    expect(trialEnds(withTrial({}, at(2027, 2, 20)))).toBe('2027-03-05');
  });

  it('is single-use: a second start does not extend it', () => {
    const s = withTrial({}, at(2026, 10, 1));
    expect(canStartTrial(s)).toBe(false);
    expect(withTrial(s, at(2026, 12, 1))).toEqual(s);
    expect(isPlus(s, at(2026, 12, 1))).toBe(false);
  });

  it('is not offered to people who have paid', () => {
    expect(canStartTrial({ paidUntil: '2027-01-01' })).toBe(false);
  });
});

describe('Hoot Plus paid period', () => {
  it('is active through paidUntil inclusive', () => {
    const s = withPaid({}, '2026-12-31');
    expect(isPaid(s, at(2026, 12, 31, 23))).toBe(true);
    expect(isPaid(s, at(2027, 1, 1, 0))).toBe(false);
    expect(isPlus(s, at(2026, 6, 1))).toBe(true);
  });

  it('never shortens an existing paid period', () => {
    const s = withPaid(withPaid({}, '2027-06-30'), '2027-01-31');
    expect(s.paidUntil).toBe('2027-06-30');
    expect(withPaid(s, '2028-01-01').paidUntil).toBe('2028-01-01');
  });

  it('rejects malformed dates', () => {
    expect(() => withPaid({}, '31/12/2026')).toThrow();
    expect(() => withPaid({}, '')).toThrow();
  });

  it('paid + trial overlap stays Plus until the later of the two', () => {
    const s = withPaid(withTrial({}, at(2026, 10, 1)), '2026-10-05');
    expect(isPlus(s, at(2026, 10, 10))).toBe(true); // still in trial
    expect(isPlus(s, at(2026, 10, 20))).toBe(false);
  });

  it('nobody is Plus by default', () => {
    expect(isPlus({}, at(2026, 10, 1))).toBe(false);
  });
});

describe('free daily allowance', () => {
  const day = at(2026, 10, 22, 10);
  it('allows exactly FREE_ROUNDS_PER_DAY rounds per game per day for free users', () => {
    expect(FREE_ROUNDS_PER_DAY).toBe(1);
    let log: ActivityLog = {};
    expect(canStartRound({}, log, 'sudoku', day)).toBe(true);
    expect(roundsLeft({}, log, 'sudoku', day)).toBe(1);
    log = withStart(log, 'sudoku', day);
    expect(canStartRound({}, log, 'sudoku', day)).toBe(false);
    expect(roundsLeft({}, log, 'sudoku', day)).toBe(0);
  });

  it('each game has its own allowance', () => {
    const log = withStart({}, 'sudoku', day);
    for (const g of GAMES) expect(canStartRound({}, log, g, day), g).toBe(g !== 'sudoku');
  });

  it('resets at local midnight', () => {
    const log = withStart({}, 'chess', at(2026, 10, 22, 23));
    expect(canStartRound({}, log, 'chess', at(2026, 10, 22, 23))).toBe(false);
    expect(canStartRound({}, log, 'chess', at(2026, 10, 23, 0))).toBe(true);
  });

  it('Plus is unlimited', () => {
    let log: ActivityLog = {};
    for (let i = 0; i < 50; i++) log = withStart(log, 'crossword', day);
    const s = withTrial({}, day);
    expect(canStartRound(s, log, 'crossword', day)).toBe(true);
    expect(roundsLeft(s, log, 'crossword', day)).toBe(Infinity);
  });

  it('when the trial ends, the free limit applies again', () => {
    const s = withTrial({}, at(2026, 10, 1));
    const after = at(2026, 10, 20);
    const log = withStart({}, 'trivia', after);
    expect(canStartRound(s, log, 'trivia', after)).toBe(false);
  });
});
