import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { completeToday, getStreak, isTodayDone, todayKey } from '../../src/lib/daily';

// Minimal localStorage for Node.
beforeEach(() => {
  const mem = new Map<string, string>();
  (globalThis as unknown as { localStorage: Storage }).localStorage = {
    getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
    setItem: (k: string, v: string) => void mem.set(k, v),
    removeItem: (k: string) => void mem.delete(k),
    clear: () => mem.clear(),
    key: () => null,
    length: 0,
  } as Storage;
  vi.useFakeTimers();
});
afterEach(() => vi.useRealTimers());

describe('streak', () => {
  it('counts consecutive days and resets after a gap', () => {
    vi.setSystemTime(new Date(2026, 9, 15, 9));
    expect(completeToday()).toMatchObject({ count: 1, best: 1 });
    expect(isTodayDone()).toBe(true);

    // Same day again does not double-count.
    expect(completeToday()).toMatchObject({ count: 1, best: 1 });

    // Next day continues the streak.
    vi.setSystemTime(new Date(2026, 9, 16, 9));
    expect(isTodayDone()).toBe(false);
    expect(completeToday()).toMatchObject({ count: 2, best: 2 });

    // Day after that, too.
    vi.setSystemTime(new Date(2026, 9, 17, 9));
    expect(completeToday()).toMatchObject({ count: 3, best: 3 });

    // Skip a day → streak resets, but best is remembered.
    vi.setSystemTime(new Date(2026, 9, 19, 9));
    expect(completeToday()).toMatchObject({ count: 1, best: 3 });
    expect(getStreak().best).toBe(3);
  });

  it('formats the day key as YYYY-MM-DD in local time', () => {
    expect(todayKey(new Date(2026, 0, 5))).toBe('2026-01-05');
    expect(todayKey(new Date(2026, 11, 31))).toBe('2026-12-31');
  });
});
