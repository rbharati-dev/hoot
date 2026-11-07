import { beforeEach, describe, expect, it } from 'vitest';
import { currentCycle, markReflectionSeen, newDayOrder, todaysOrder } from '../../src/lib/reflDeck';

const ids = Array.from({ length: 30 }, (_, i) => 'r' + i);
const day = (n: number) => new Date(2026, 10, n, 9);

describe('Reflections change every day', () => {
  beforeEach(() => {
    // Minimal localStorage for Node.
    const mem = new Map<string, string>();
    (globalThis as unknown as { localStorage: Storage }).localStorage = {
      getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
      setItem: (k: string, v: string) => void mem.set(k, v),
      removeItem: (k: string) => void mem.delete(k),
      clear: () => mem.clear(),
      key: () => null,
      length: 0,
    } as Storage;
  });

  it('keeps the same order all day', () => {
    expect(todaysOrder(ids, day(7))).toEqual(todaysOrder(ids, new Date(2026, 10, 7, 21)));
  });

  it("leads the next day with thoughts not read today", () => {
    const today = todaysOrder(ids, day(7));
    today.slice(0, 8).forEach(markReflectionSeen);
    const tomorrow = todaysOrder(ids, day(8));
    expect(tomorrow.slice(0, 22).some(id => today.slice(0, 8).includes(id))).toBe(false);
    expect(new Set(tomorrow).size).toBe(ids.length);
    expect(tomorrow.slice(0, 8)).not.toEqual(today.slice(8, 16)); // a fresh order, not just the next slice
  });

  it('starts a new cycle once everything has been read, and the reset survives a sync merge', () => {
    todaysOrder(ids, day(7)).forEach(markReflectionSeen);
    const before = JSON.parse(localStorage.getItem('hoot.reflSeen')!);
    const next = todaysOrder(ids, day(8));
    expect(next).toHaveLength(ids.length);
    // Another device still holds the old cycle: union-merge keeps the new cycle on top.
    const merged = [...new Set([...before, ...JSON.parse(localStorage.getItem('hoot.reflSeen')!)])];
    expect(currentCycle(merged).seen).toEqual([]);
  });

  it('is deterministic for a given day', () => {
    expect(newDayOrder(ids, [], '2026-11-07').order).toEqual(newDayOrder(ids, [], '2026-11-07').order);
    expect(newDayOrder(ids, [], '2026-11-07').order).not.toEqual(newDayOrder(ids, [], '2026-11-08').order);
  });
});
