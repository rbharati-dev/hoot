import { afterEach, describe, expect, it, vi } from 'vitest';
import { GAMES, KEEP_DAYS, dayKey, isActive, isGame, keyDate, prune, readActivity, recordFive, recordSolve, recordStart, roundsOn, withFive, withSolve, withStart, writeActivity, type ActivityLog } from '../../src/lib/activity';
import { addKey, deepFreeze, memStorage, ymd } from './suite-b-helpers';

const now = new Date(2025, 5, 10, 14);
const k = dayKey(now);

describe('dayKey / keyDate round trip', () => {
  const keys: string[] = [];
  for (let i = 0; i < 1461; i++) keys.push(addKey('2024-01-01', i));
  it('every day of 2024-2027 round-trips (noon and edges)', () => {
    expect(keys.length).toBe(1461);
    for (const key of keys) {
      const d = keyDate(key);
      expect(dayKey(d)).toBe(key);
      expect(d.getHours()).toBe(12);
      const [y, m, dd] = key.split('-').map(Number);
      expect(dayKey(new Date(y, m - 1, dd, 0, 0, 0))).toBe(key);
      expect(dayKey(new Date(y, m - 1, dd, 23, 59, 59))).toBe(key);
    }
  });
  it.each(['2024-01-01', '2024-02-29', '2025-02-28', '2025-12-31', '2026-03-08', '2026-11-01', '2027-07-04'])('single %s', key => {
    expect(dayKey(keyDate(key))).toBe(key);
  });
  it('dayKey pads', () => expect(dayKey(new Date(2025, 0, 5))).toBe('2025-01-05'));
  it('dayKey uses local not UTC date', () => expect(dayKey(new Date(2025, 0, 1, 0, 0))).toBe('2025-01-01'));
  it('month names: keys from ymd agree with dayKey for end-of-month', () => {
    for (let m = 1; m <= 12; m++) expect(dayKey(new Date(2025, m, 0))).toBe(ymd(2025, m + 1, 0));
  });
});

describe('isGame', () => {
  it.each(GAMES.map(g => [g]))('%s is a game', g => expect(isGame(g)).toBe(true));
  it.each(['', 'Trivia', 'poker', 'toString', '__proto__'])('%j is not', g => expect(isGame(g)).toBe(false));
});

describe('immutability and counting', () => {
  it.each(GAMES.map(g => [g]))('%s: withStart/withSolve/withFive never mutate frozen inputs', game => {
    const g = game as (typeof GAMES)[number];
    const log = deepFreeze<ActivityLog>({ [k]: { games: { [g]: { started: 1, solved: 0 } } }, '2025-06-01': { games: { trivia: { started: 2, solved: 2 } }, five: true } });
    const snapshot = JSON.stringify(log);
    const a = withStart(log, g, now);
    const b = withSolve(log, g, now);
    const c = withFive(log, now);
    expect(JSON.stringify(log)).toBe(snapshot);
    expect(a).not.toBe(log);
    expect(a[k].games[g]).toEqual({ started: 2, solved: 0 });
    expect(b[k].games[g]).toEqual({ started: 1, solved: 1 });
    expect(c[k].five).toBe(true);
    expect(c[k].games[g]).toEqual({ started: 1, solved: 0 });
    // outputs are also safe to build on
    deepFreeze(a);
    expect(() => withStart(a, g, now)).not.toThrow();
  });
  it('counts accumulate', () => {
    let log: ActivityLog = {};
    for (let i = 0; i < 5; i++) log = withStart(log, 'sudoku', now);
    for (let i = 0; i < 3; i++) log = withSolve(log, 'sudoku', now);
    expect(log[k].games.sudoku).toEqual({ started: 5, solved: 3 });
    expect(roundsOn(log, 'sudoku', now)).toBe(5);
    expect(roundsOn(log, 'chess', now)).toBe(0);
  });
  it('solve without start counts a round', () => {
    const log = withSolve({}, 'chess', now);
    expect(log[k].games.chess).toEqual({ started: 1, solved: 1 });
    expect(roundsOn(log, 'chess', now)).toBe(1);
    const two = withSolve(log, 'chess', now);
    expect(two[k].games.chess).toEqual({ started: 2, solved: 2 });
  });
  it('start, solve, solve keeps started >= solved', () => {
    let log = withStart({}, 'hangman', now);
    log = withSolve(withSolve(log, 'hangman', now), 'hangman', now);
    expect(log[k].games.hangman).toEqual({ started: 2, solved: 2 });
  });
  it('different games and days are separate', () => {
    let log = withStart({}, 'tune', now);
    log = withStart(log, 'trivia', now);
    log = withStart(log, 'tune', new Date(2025, 5, 11));
    expect(Object.keys(log).sort()).toEqual(['2025-06-10', '2025-06-11']);
    expect(roundsOn(log, 'tune', now)).toBe(1);
    expect(roundsOn(log, 'tune', new Date(2025, 5, 11))).toBe(1);
    expect(roundsOn(log, 'trivia', new Date(2025, 5, 11))).toBe(0);
  });
  it('withFive keeps games and is idempotent', () => {
    let log = withStart({}, 'quickmath', now);
    log = withFive(withFive(log, now), now);
    expect(log[k]).toEqual({ games: { quickmath: { started: 1, solved: 0 } }, five: true });
  });
  it('withFive on an empty day', () => expect(withFive({}, now)[k]).toEqual({ games: {}, five: true }));
  it('withStart preserves five', () => {
    const log = withStart(withFive({}, now), 'pattern', now);
    expect(log[k].five).toBe(true);
  });
});

describe('prune', () => {
  it('keeps exactly the last KEEP_DAYS days (cutoff inclusive)', () => {
    const cutoff = addKey(dayKey(now), -KEEP_DAYS);
    const log: ActivityLog = {};
    for (let i = KEEP_DAYS + 10; i >= 0; i--) log[addKey(dayKey(now), -i)] = { games: {}, five: true };
    const out = prune(log, now);
    const keys = Object.keys(out).sort();
    expect(keys.length).toBe(KEEP_DAYS + 1);
    expect(keys[0]).toBe(cutoff);
    expect(keys.at(-1)).toBe(dayKey(now));
    expect(out[addKey(cutoff, -1)]).toBeUndefined();
  });
  it.each([-1, 0, 1])('boundary %i around the cutoff', off => {
    const cutoff = addKey(dayKey(now), -KEEP_DAYS);
    const key = addKey(cutoff, off);
    expect(key in prune({ [key]: { games: {} } }, now)).toBe(off >= 0);
  });
  it('withStart prunes old days', () => {
    const old = addKey(dayKey(now), -KEEP_DAYS - 1);
    const log = withStart({ [old]: { games: {} }, '2020-01-01': { games: {} } }, 'trivia', now);
    expect(Object.keys(log)).toEqual([k]);
  });
  it('prune does not mutate and keeps future days', () => {
    const log = deepFreeze<ActivityLog>({ '2030-01-01': { games: {} }, '2000-01-01': { games: {} } });
    const out = prune(log, now);
    expect(Object.keys(out)).toEqual(['2030-01-01']);
    expect(Object.keys(log).length).toBe(2);
  });
});

describe('isActive', () => {
  it('rules', () => {
    expect(isActive(undefined)).toBe(false);
    expect(isActive({ games: {} })).toBe(false);
    expect(isActive({ games: {}, five: true })).toBe(true);
    expect(isActive({ games: {}, five: false })).toBe(false);
    expect(isActive({ games: { chess: { started: 0, solved: 0 } } })).toBe(false);
    expect(isActive({ games: { chess: { started: 1, solved: 0 } } })).toBe(true);
    expect(isActive({ games: { chess: { started: 0, solved: 1 } } })).toBe(false);
    expect(isActive({ games: { chess: { started: 0, solved: 0 }, tune: { started: 3, solved: 1 } } })).toBe(true);
  });
  it.each(GAMES.map(g => [g]))('%s started makes the day active', g => {
    expect(isActive({ games: { [g]: { started: 1, solved: 0 } } })).toBe(true);
  });
});

describe('storage', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('round-trips through localStorage', () => {
    const s = memStorage();
    vi.stubGlobal('localStorage', s);
    const log = { '2025-06-10': { games: { chess: { started: 1, solved: 1 } }, five: true } };
    writeActivity(log);
    expect(s.mem.get('hoot.activity')).toBe(JSON.stringify(log));
    expect(readActivity()).toEqual(log);
  });
  it('empty storage gives {}', () => {
    vi.stubGlobal('localStorage', memStorage());
    expect(readActivity()).toEqual({});
  });
  it.each(['{not json', '[', 'undefined', '', '{"a":'])('corrupt JSON %j gives {}', raw => {
    const s = memStorage();
    s.mem.set('hoot.activity', raw);
    vi.stubGlobal('localStorage', s);
    expect(readActivity()).toEqual({});
  });
  it('null JSON gives {}', () => {
    const s = memStorage();
    s.mem.set('hoot.activity', 'null');
    vi.stubGlobal('localStorage', s);
    expect(readActivity()).toEqual({});
  });
  it('storage that throws: read gives {}, write does not throw', () => {
    vi.stubGlobal('localStorage', memStorage({ throws: true }));
    expect(readActivity()).toEqual({});
    expect(() => writeActivity({})).not.toThrow();
    expect(() => recordStart('chess', now)).not.toThrow();
    expect(() => recordSolve('chess', now)).not.toThrow();
    expect(() => recordFive(now)).not.toThrow();
  });
  it('recordStart / recordSolve / recordFive persist', () => {
    vi.stubGlobal('localStorage', memStorage());
    recordStart('sudoku', now);
    recordSolve('sudoku', now);
    recordStart('sudoku', now);
    recordFive(now);
    expect(readActivity()[k]).toEqual({ games: { sudoku: { started: 2, solved: 1 } }, five: true });
  });
});
