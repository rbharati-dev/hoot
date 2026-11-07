// A gentle "Support Hoot" ask for people who clearly enjoy Hoot: shown only
// after 7 different days of use or 3 hours in all, at most once a month, and
// not again for six months once they donate or say they already have.
//
// hoot.usage       { days: ['YYYY-MM-DD', ...], minutes: n }   (synced)
// hoot.supportAsk  { last?: 'YYYY-MM-DD', quietUntil?: 'YYYY-MM-DD' } (synced)
import { dayKey } from './activity';

export const ASK_AFTER_DAYS = 7;
export const ASK_AFTER_MINUTES = 180;
export const ASK_EVERY_DAYS = 30;
export const QUIET_AFTER_DONATING_DAYS = 182;

export interface Usage {
  days: string[];
  minutes: number;
}
export interface AskState {
  last?: string;
  quietUntil?: string;
}

const USAGE = 'hoot.usage';
const ASK = 'hoot.supportAsk';

function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? { ...fallback, ...(JSON.parse(v) as T) } : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* storage unavailable: no ask, which is fine */
  }
}

const addDays = (key: string, n: number) => {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d + n, 12));
};

export const readUsage = (): Usage => read<Usage>(USAGE, { days: [], minutes: 0 });
export const readAsk = (): AskState => read<AskState>(ASK, {});

/** Count today as a day of use. */
export function recordVisit(now = new Date()) {
  const u = readUsage();
  const k = dayKey(now);
  if (!u.days.includes(k)) write(USAGE, { ...u, days: [...u.days, k].slice(-400) });
}
/** One more minute with Hoot open on screen. */
export function recordMinute() {
  const u = readUsage();
  write(USAGE, { ...u, minutes: (u.minutes || 0) + 1 });
}

/** Pure: is it a good moment to ask? */
export function shouldAsk(usage: Usage, ask: AskState, now: Date): boolean {
  const today = dayKey(now);
  const enough = usage.days.length >= ASK_AFTER_DAYS || usage.minutes >= ASK_AFTER_MINUTES;
  if (!enough) return false;
  if (ask.quietUntil && today < ask.quietUntil) return false;
  if (ask.last && today < addDays(ask.last, ASK_EVERY_DAYS)) return false;
  return true;
}

/** The ask was shown today ("Not now" just closes it: next ask in a month). */
export function markAsked(now = new Date()) {
  write(ASK, { ...readAsk(), last: dayKey(now) });
}
/** Donated (or already had): quiet for six months. */
export function markDonated(now = new Date()) {
  const today = dayKey(now);
  write(ASK, { ...readAsk(), last: today, quietUntil: addDays(today, QUIET_AFTER_DONATING_DAYS) });
}
