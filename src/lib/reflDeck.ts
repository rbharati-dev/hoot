// Reflections change every day: each new day starts with thoughts the person
// hasn't seen yet (in a fresh, day-seeded order), so what they read yesterday
// doesn't come back today. Within a day the order holds, so coming back to the
// tab later picks up where they were. Once every thought has been seen, a new
// cycle starts.
//
// hoot.reflSeen  "<cycle>:<id>" for each thought read (synced to the account,
//                union-merged). Only the highest cycle counts, so starting a new
//                cycle sticks even when another device still has the old one.
// hoot.reflDay   today's order (this device only)
import { dayKeyOf, seededRandom } from './prefs';

const SEEN = 'hoot.reflSeen';
const DAY = 'hoot.reflDay';

function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* storage unavailable: the deck still shuffles by day */
  }
}

function shuffle<T>(a: T[], rnd: () => number): T[] {
  const out = a.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** The current cycle and the ids read in it, from the stored entries. */
export function currentCycle(entries: string[]): { cycle: number; seen: string[] } {
  const parsed = entries.map(e => /^(\d+):(.*)$/.exec(e)).filter(Boolean) as RegExpExecArray[];
  const cycle = parsed.reduce((m, p) => Math.max(m, Number(p[1])), 0);
  return { cycle, seen: parsed.filter(p => Number(p[1]) === cycle && p[2]).map(p => p[2]) };
}

/**
 * Pure: the order for a new day. Unseen thoughts first, each group shuffled
 * by the day. Returns the order and the (possibly reset) seen list.
 */
export function newDayOrder(ids: string[], seen: string[], day: string): { order: string[]; reset: boolean } {
  const rnd = seededRandom(`reflections|${day}`);
  const seenSet = new Set(seen.filter(id => ids.includes(id)));
  let unseen = ids.filter(id => !seenSet.has(id));
  let done = ids.filter(id => seenSet.has(id));
  const reset = !unseen.length && ids.length > 0;
  if (reset) {
    // Everything read: start a new cycle.
    unseen = ids;
    done = [];
  }
  return { order: [...shuffle(unseen, rnd), ...shuffle(done, rnd)], reset };
}

/** Today's order of the deck, made once per day per device. */
export function todaysOrder(ids: string[], now = new Date()): string[] {
  const day = dayKeyOf(now);
  const saved = read<{ day?: string; order?: string[] }>(DAY, {});
  if (saved.day === day && Array.isArray(saved.order)) {
    // Keep today's order; add any thoughts published since, at the end.
    const order = saved.order.filter(id => ids.includes(id));
    return [...order, ...ids.filter(id => !order.includes(id))];
  }
  const entries = read<string[]>(SEEN, []);
  const { cycle, seen } = currentCycle(Array.isArray(entries) ? entries : []);
  const next = newDayOrder(ids, seen, day);
  if (next.reset) write(SEEN, [`${cycle + 1}:`]); // marks the new cycle; nothing read in it yet
  write(DAY, { day, order: next.order });
  return next.order;
}

/** Remember a thought as read, so it isn't shown first again until the cycle ends. */
export function markReflectionSeen(id: string) {
  const raw = read<string[]>(SEEN, []);
  const entries = Array.isArray(raw) ? raw : [];
  const { cycle } = currentCycle(entries);
  // Old cycles' entries are dropped here; the cycle marker keeps the number.
  const keep = entries.filter(e => e.startsWith(`${cycle}:`));
  const entry = `${cycle}:${id}`;
  if (!keep.includes(entry)) write(SEEN, [...keep, entry]);
}
