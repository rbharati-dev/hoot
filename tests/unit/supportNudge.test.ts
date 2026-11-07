import { describe, expect, it } from 'vitest';
import { shouldAsk } from '../../src/lib/supportNudge';

const days = (n: number) => Array.from({ length: n }, (_, i) => `2026-10-${String(i + 1).padStart(2, '0')}`);
const now = new Date(2026, 10, 7, 10);

describe('the occasional Support Hoot ask', () => {
  it('waits for 7 days of use or 3 hours', () => {
    expect(shouldAsk({ days: days(6), minutes: 100 }, {}, now)).toBe(false);
    expect(shouldAsk({ days: days(7), minutes: 0 }, {}, now)).toBe(true);
    expect(shouldAsk({ days: days(2), minutes: 180 }, {}, now)).toBe(true);
  });
  it('asks at most once a month', () => {
    expect(shouldAsk({ days: days(9), minutes: 0 }, { last: '2026-10-20' }, now)).toBe(false);
    expect(shouldAsk({ days: days(9), minutes: 0 }, { last: '2026-10-08' }, now)).toBe(true);
  });
  it('stays quiet for six months after a donation', () => {
    expect(shouldAsk({ days: days(20), minutes: 999 }, { last: '2026-06-01', quietUntil: '2026-12-01' }, now)).toBe(false);
    expect(shouldAsk({ days: days(20), minutes: 999 }, { last: '2026-06-01', quietUntil: '2026-11-01' }, now)).toBe(true);
  });
});
