import { describe, expect, it } from 'vitest';
import { GAMES, dayKey, withStart, type ActivityLog } from '../../src/lib/activity';
import { FREE_ROUNDS_PER_DAY, TRIAL_DAYS, canStartRound, canStartTrial, inTrial, isPaid, isPlus, roundsLeft, trialDaysLeft, trialEnds, withPaid, withTrial, type PlusState } from '../../src/lib/plus';
import { addKey, ymd } from './suite-b-helpers';

// Trial start days: every 5 days across 2024-2025, plus awkward calendar days.
const starts = new Set<string>();
for (let i = 0; i < 731; i += 5) starts.add(addKey('2024-01-01', i));
for (const k of ['2023-12-31', '2024-02-28', '2024-02-29', '2024-03-01', '2025-02-28', '2025-03-01', '2024-12-31', '2025-12-31', '2025-03-09', '2025-11-02', '2025-03-30', '2025-10-26', '2024-03-10', '2024-11-03', '2024-03-31', '2024-10-27']) starts.add(k);
const startList = [...starts].sort();

const at = (key: string, off: number, h: number, mi = 0) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d + off, h, mi);
};

describe('Hoot Plus trial across the calendar', () => {
  it('trial is 14 days', () => expect(TRIAL_DAYS).toBe(14));
  it.each(startList)('trial starting %s: end, window and countdown', start => {
    const s: PlusState = { trialStart: start };
    expect(trialEnds(s)).toBe(addKey(start, 13));
    for (let off = -3; off <= 17; off++) {
      for (const [h, mi] of [[0, 0], [12, 0], [23, 59]]) {
        const now = at(start, off, h, mi);
        const inside = off >= 0 && off <= 13;
        expect(inTrial(s, now), `${start} +${off} ${h}:${mi}`).toBe(inside);
        expect(trialDaysLeft(s, now), `${start} +${off}`).toBe(inside ? 14 - off : 0);
        expect(isPlus(s, now)).toBe(inside);
      }
    }
  });
  it('days left counts 14..1 then 0 (sequence)', () => {
    const s = { trialStart: '2024-02-20' };
    const seq = Array.from({ length: 16 }, (_, i) => trialDaysLeft(s, at('2024-02-20', i, 10)));
    expect(seq).toEqual([14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0, 0]);
  });
  it('no trial: no end, never in trial', () => {
    expect(trialEnds({})).toBeUndefined();
    expect(inTrial({}, new Date())).toBe(false);
    expect(trialDaysLeft({}, new Date())).toBe(0);
  });
});

describe('trial single-use and paid periods', () => {
  it('canStartTrial only on a fresh device', () => {
    expect(canStartTrial({})).toBe(true);
    expect(canStartTrial({ trialStart: '2020-01-01' })).toBe(false);
    expect(canStartTrial({ paidUntil: '2020-01-01' })).toBe(false);
  });
  it.each(startList.filter((_, i) => i % 6 === 0))('withTrial on %s starts once, never restarts', start => {
    const now = at(start, 0, 9);
    const s = withTrial({}, now);
    expect(s.trialStart).toBe(start);
    const later = withTrial(s, at(start, 100, 9));
    expect(later).toBe(s);
    expect(later.trialStart).toBe(start);
    // after expiry, still cannot restart
    expect(canStartTrial(s)).toBe(false);
  });
  it('withTrial does not start for paid devices', () => {
    const s = { paidUntil: '2030-01-01' };
    expect(withTrial(s, new Date())).toBe(s);
  });
  it('withTrial does not mutate input', () => {
    const s = Object.freeze({}) as PlusState;
    expect(() => withTrial(s, new Date())).not.toThrow();
  });

  const paidDays = ['2024-02-28', '2024-02-29', '2025-02-28', '2024-12-31', '2025-12-31', '2025-06-15', '2026-01-01'];
  it.each(paidDays)('isPaid is inclusive of the end day %s', end => {
    const s = { paidUntil: end };
    expect(isPaid(s, at(end, -1, 12))).toBe(true);
    expect(isPaid(s, at(end, 0, 0))).toBe(true);
    expect(isPaid(s, at(end, 0, 23, 59))).toBe(true);
    expect(isPaid(s, at(end, 1, 0))).toBe(false);
    expect(isPaid(s, at(end, 1, 0, 1))).toBe(false);
    expect(isPlus(s, at(end, 0, 12))).toBe(true);
    expect(isPlus(s, at(end, 1, 12))).toBe(false);
  });
  it('isPaid false without paidUntil', () => expect(isPaid({}, new Date())).toBe(false));
  it('isPlus = paid || trial', () => {
    const now = new Date(2025, 5, 10, 12);
    for (const trial of [undefined, '2025-06-05', '2024-01-01'])
      for (const paid of [undefined, '2025-06-10', '2025-06-09']) {
        const s: PlusState = { trialStart: trial, paidUntil: paid };
        expect(isPlus(s, now)).toBe(isPaid(s, now) || inTrial(s, now));
      }
  });
  it('trial days left unaffected by paid', () => {
    expect(trialDaysLeft({ trialStart: '2025-06-10', paidUntil: '2030-01-01' }, new Date(2025, 5, 12, 8))).toBe(12);
  });

  const pairs: [string | undefined, string][] = [[undefined, '2025-01-01'], ['2025-01-01', '2025-02-01'], ['2025-02-01', '2025-01-01'], ['2025-02-01', '2025-02-01'], ['2024-12-31', '2025-01-01'], ['2025-01-01', '2024-12-31']];
  it.each(pairs)('withPaid(%s, %s) never shortens', (cur, until) => {
    const r = withPaid({ paidUntil: cur }, until);
    expect(r.paidUntil).toBe(!cur || until > cur ? until : cur);
    if (cur) expect(r.paidUntil! >= cur).toBe(true);
  });
  it('withPaid keeps the trial and does not mutate', () => {
    const s = Object.freeze({ trialStart: '2025-01-01' });
    const r = withPaid(s, '2025-05-05');
    expect(r).toEqual({ trialStart: '2025-01-01', paidUntil: '2025-05-05' });
    expect(s).toEqual({ trialStart: '2025-01-01' });
  });
  const bad = ['', '2025-1-1', '25-01-01', '2025/01/01', 'tomorrow', '2025-01-01T00:00', ' 2025-01-01', '2025-01-011', 'abcd-ef-gh', '20250101'];
  it.each(bad)('withPaid rejects %j', v => expect(() => withPaid({}, v)).toThrow());
  it.each(['2025-01-01', '1999-12-31', '2100-02-28'])('withPaid accepts %s', v => expect(withPaid({}, v).paidUntil).toBe(v));
});

describe('daily free allowance per game and time of day', () => {
  const times: [string, number, number][] = [['00:00', 0, 0], ['00:01', 0, 1], ['11:59', 11, 59], ['23:59', 23, 59]];
  const day = new Date(2025, 5, 10, 12);
  const tomorrow = (h: number, m: number) => new Date(2025, 5, 11, h, m);
  const free: PlusState = {};
  it('one free round per day', () => expect(FREE_ROUNDS_PER_DAY).toBe(1));
  const cases = GAMES.flatMap(g => times.map(t => [g, ...t] as [string, string, number, number]));
  it.each(cases)('%s at %s', (game, _label, h, m) => {
    const g = game as (typeof GAMES)[number];
    const now = new Date(2025, 5, 10, h, m);
    let log: ActivityLog = {};
    expect(canStartRound(free, log, g, now)).toBe(true);
    expect(roundsLeft(free, log, g, now)).toBe(1);
    log = withStart(log, g, now);
    expect(canStartRound(free, log, g, now)).toBe(false);
    expect(roundsLeft(free, log, g, now)).toBe(0);
    // same day, any other time of day: still used up
    expect(canStartRound(free, log, g, new Date(2025, 5, 10, 23, 59, 59))).toBe(false);
    expect(canStartRound(free, log, g, new Date(2025, 5, 10, 0, 0, 0))).toBe(false);
    // resets at local midnight
    expect(canStartRound(free, log, g, tomorrow(0, 0))).toBe(true);
    expect(roundsLeft(free, log, g, tomorrow(0, 0))).toBe(1);
    // other games unaffected
    for (const o of GAMES) if (o !== g) expect(canStartRound(free, log, o, now), o).toBe(true);
    // Plus: unlimited
    const plus = { paidUntil: '2030-01-01' };
    expect(canStartRound(plus, log, g, now)).toBe(true);
    expect(roundsLeft(plus, log, g, now)).toBe(Infinity);
    // many extra starts never block Plus nor produce negatives for free
    for (let i = 0; i < 4; i++) log = withStart(log, g, now);
    expect(roundsLeft(free, log, g, now)).toBe(0);
    expect(canStartRound(plus, log, g, now)).toBe(true);
  });
  it.each(GAMES.map(g => [g]))('%s: trial expiry restores the limit', game => {
    const g = game as (typeof GAMES)[number];
    const trial = { trialStart: '2025-06-01' }; // ends 2025-06-14
    let log: ActivityLog = {};
    const last = new Date(2025, 5, 14, 20);
    log = withStart(withStart(log, g, last), g, last);
    expect(canStartRound(trial, log, g, last)).toBe(true);
    const after = new Date(2025, 5, 15, 8);
    expect(canStartRound(trial, log, g, after)).toBe(true); // new day, no rounds yet
    log = withStart(log, g, after);
    expect(canStartRound(trial, log, g, after)).toBe(false); // trial over: limit applies
  });
  it('day key sanity for this suite', () => expect(dayKey(day)).toBe(ymd(2025, 6, 10)));
});
