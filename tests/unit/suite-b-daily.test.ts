import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildTune, completeToday, getStreak, isTodayDone, todayKey } from '../../src/lib/daily';
import { readActivity } from '../../src/lib/activity';
import type { Card } from '../../src/lib/data';
import { addKey, memStorage, rng } from './suite-b-helpers';

const song = (i: number, title = `Song ${i}`): Card => ({ id: `s${i}`, year: 1970, type: 'music', title, text: '', wiki: `W${i}`, yt: `yt${i}` });
const songs = (n: number) => Array.from({ length: n }, (_, i) => song(i));

describe('buildTune', () => {
  it.each([0, 1, 2])('%i distinct songs: no round', n => expect(buildTune(songs(n), rng(1))).toBeNull());
  it('two songs sharing a title count once', () => {
    expect(buildTune([song(1, 'Same'), song(2, 'Same'), song(3, 'Other')], rng(1))).toBeNull();
  });
  it.each([3, 4, 5, 8, 20, 60])('%i songs: valid round for 25 seeds', n => {
    for (let seed = 1; seed <= 25; seed++) {
      const t = buildTune(songs(n), rng(seed * 7919))!;
      expect(t).not.toBeNull();
      const titles = t.choices.map(c => c.title);
      expect(new Set(titles).size).toBe(titles.length);
      expect(t.choices.some(c => c.id === t.answer.id)).toBe(true);
      expect(t.choices.length).toBe(Math.min(4, n));
      expect(songs(n).some(s => s.id === t.answer.id)).toBe(true);
    }
  });
  it('duplicates in the pool never produce duplicate choices', () => {
    const pool = [...songs(6), song(100, 'Song 1'), song(101, 'Song 2'), song(102, 'Song 3')];
    for (let seed = 1; seed <= 40; seed++) {
      const t = buildTune(pool, rng(seed))!;
      expect(new Set(t.choices.map(c => c.title)).size).toBe(t.choices.length);
    }
  });
  it('first card wins for a duplicated title', () => {
    const pool = [song(1, 'Dup'), song(2, 'Dup'), song(3), song(4), song(5)];
    for (let seed = 1; seed <= 30; seed++) {
      const t = buildTune(pool, rng(seed))!;
      for (const c of t.choices) if (c.title === 'Dup') expect(c.id).toBe('s1');
    }
  });
  it.each([1, 2, 3, 42, 1000])('deterministic for seed %i', seed => {
    const a = buildTune(songs(15), rng(seed))!;
    const b = buildTune(songs(15), rng(seed))!;
    expect(b.answer.id).toBe(a.answer.id);
    expect(b.choices.map(c => c.id)).toEqual(a.choices.map(c => c.id));
  });
  it('different seeds give variety', () => {
    const answers = new Set(Array.from({ length: 40 }, (_, i) => buildTune(songs(15), rng(i + 1))!.answer.id));
    expect(answers.size).toBeGreaterThan(5);
  });
  it('answer position among the choices varies', () => {
    const pos = new Set(Array.from({ length: 60 }, (_, i) => { const t = buildTune(songs(10), rng(i + 1))!; return t.choices.findIndex(c => c.id === t.answer.id); }));
    expect(pos.size).toBeGreaterThan(1);
  });
  it('does not mutate the input array', () => {
    const pool = songs(10);
    const copy = pool.map(s => s.id);
    buildTune(pool, rng(3));
    expect(pool.map(s => s.id)).toEqual(copy);
  });
});

describe('streak', () => {
  let store: ReturnType<typeof memStorage>;
  beforeEach(() => {
    store = memStorage();
    vi.stubGlobal('localStorage', store);
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });
  const on = (key: string, h = 10) => { const [y, m, d] = key.split('-').map(Number); vi.setSystemTime(new Date(y, m - 1, d, h)); };

  it('fresh device has no streak', () => {
    on('2026-03-01');
    expect(getStreak()).toEqual({ last: '', count: 0, best: 0 });
    expect(isTodayDone()).toBe(false);
  });
  it('todayKey reflects the faked local date', () => {
    on('2026-12-31', 23);
    expect(todayKey()).toBe('2026-12-31');
    expect(todayKey(new Date(2025, 0, 5))).toBe('2025-01-05');
  });
  it('consecutive days build the streak (across month/year/leap boundaries)', () => {
    let key = '2023-12-25';
    for (let i = 1; i <= 80; i++) {
      on(key);
      expect(completeToday()).toEqual({ last: key, count: i, best: i });
      expect(isTodayDone()).toBe(true);
      key = addKey(key, 1);
    }
    expect(addKey('2023-12-25', 79)).toBe('2024-03-13'); // crossed Feb 29, 2024
  });
  it('same day twice does not double count, also across the day', () => {
    on('2026-05-05', 0);
    completeToday();
    on('2026-05-05', 23);
    expect(completeToday()).toMatchObject({ count: 1, best: 1 });
    expect(getStreak().count).toBe(1);
  });
  it.each([2, 3, 7, 30, 400])('a gap of %i days resets count to 1 but keeps best', gap => {
    on('2026-01-01'); completeToday();
    on('2026-01-02'); completeToday();
    on('2026-01-03'); completeToday();
    on(addKey('2026-01-03', gap));
    expect(isTodayDone()).toBe(false);
    expect(completeToday()).toMatchObject({ count: 1, best: 3 });
  });
  it('best is kept, and only raised when beaten', () => {
    on('2026-02-01'); completeToday();
    on('2026-02-02'); completeToday();
    on('2026-02-05'); expect(completeToday()).toMatchObject({ count: 1, best: 2 });
    on('2026-02-06'); expect(completeToday()).toMatchObject({ count: 2, best: 2 });
    on('2026-02-07'); expect(completeToday()).toMatchObject({ count: 3, best: 3 });
  });
  it('isTodayDone flips at midnight', () => {
    on('2026-02-01', 23); completeToday();
    expect(isTodayDone()).toBe(true);
    vi.setSystemTime(new Date(2026, 1, 2, 0, 0, 1));
    expect(isTodayDone()).toBe(false);
  });
  it('completeToday records Today\'s Five in the activity log', () => {
    on('2026-04-04');
    completeToday();
    expect(readActivity()['2026-04-04']).toEqual({ games: {}, five: true });
    on('2026-04-05');
    completeToday();
    const log = readActivity();
    expect(Object.keys(log).sort()).toEqual(['2026-04-04', '2026-04-05']);
    expect(log['2026-04-05'].five).toBe(true);
  });
  it('repeat completion keeps one activity entry', () => {
    on('2026-04-04'); completeToday(); completeToday();
    expect(Object.keys(readActivity())).toEqual(['2026-04-04']);
  });
  it('corrupt streak storage falls back to a fresh streak', () => {
    on('2026-04-04');
    store.mem.set('hoot.streak', '{oops');
    expect(getStreak()).toEqual({ last: '', count: 0, best: 0 });
    expect(completeToday()).toMatchObject({ count: 1, best: 1 });
  });
  it('storage that throws does not crash', () => {
    vi.stubGlobal('localStorage', memStorage({ throws: true }));
    on('2026-04-04');
    expect(getStreak().count).toBe(0);
    expect(() => completeToday()).not.toThrow();
  });
  it('DST weekend days still count as consecutive', () => {
    for (const [a, b] of [['2026-03-07', '2026-03-08'], ['2026-03-08', '2026-03-09'], ['2026-10-31', '2026-11-01'], ['2026-11-01', '2026-11-02'], ['2026-03-28', '2026-03-29'], ['2026-10-24', '2026-10-25']]) {
      store.mem.clear();
      on(a); completeToday();
      on(b);
      expect(completeToday().count, `${a}->${b}`).toBe(2);
    }
  });
});
