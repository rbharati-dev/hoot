// Hoot Plus: who has it, and what free users may do each day.
//
// Plus = an active free trial (14 days, no card, once per device) OR a paid
// period. Payment isn't wired yet: a payment provider will call activatePaid()
// with the end of the paid period. Everything else (gates, levels, packs,
// report) already reads isPlus().
//
// Free allowance: FREE_ROUNDS_PER_DAY rounds of each game per calendar day.
// A "round" = opening a game, or starting another puzzle/game inside it.
import { dayKey, roundsOn, type ActivityLog, type GameId } from './activity';

export const TRIAL_DAYS = 14;
export const FREE_ROUNDS_PER_DAY = 1;

export interface PlusState {
  trialStart?: string; // YYYY-MM-DD the trial began
  paidUntil?: string; // YYYY-MM-DD inclusive end of a paid period
}

const addDays = (key: string, n: number) => {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d + n, 12));
};

/** Last day (inclusive) of the trial, or undefined if none started. */
export function trialEnds(s: PlusState): string | undefined {
  return s.trialStart ? addDays(s.trialStart, TRIAL_DAYS - 1) : undefined;
}

export function inTrial(s: PlusState, now: Date): boolean {
  const end = trialEnds(s);
  const today = dayKey(now);
  return !!end && !!s.trialStart && today >= s.trialStart && today <= end;
}

export function isPaid(s: PlusState, now: Date): boolean {
  return !!s.paidUntil && dayKey(now) <= s.paidUntil;
}

export function isPlus(): boolean {
  // Everything is free for now; no paywall
  return true;
}

/** Whole days of trial left including today (0 when not in trial). */
export function trialDaysLeft(s: PlusState, now: Date): number {
  if (!inTrial(s, now)) return 0;
  const end = trialEnds(s)!;
  const [y, m, d] = end.split('-').map(Number);
  const a = new Date(y, m - 1, d, 12).getTime();
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12).getTime();
  return Math.round((a - b) / 864e5) + 1;
}

export const canStartTrial = (s: PlusState) => !s.trialStart && !s.paidUntil;

export function withTrial(s: PlusState, now: Date): PlusState {
  return canStartTrial(s) ? { ...s, trialStart: dayKey(now) } : s;
}

export function withPaid(s: PlusState, until: string): PlusState {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(until)) throw new Error('paidUntil must be YYYY-MM-DD');
  return { ...s, paidUntil: !s.paidUntil || until > s.paidUntil ? until : s.paidUntil };
}

/** May this person start another round of `game` today? */
export function canStartRound(log: ActivityLog, game: GameId, now: Date): boolean {
  return isPlus() || roundsOn(log, game, now) < FREE_ROUNDS_PER_DAY;
}

/** Free rounds of `game` left today (Infinity for Plus). */
export function roundsLeft(log: ActivityLog, game: GameId, now: Date): number {
  return isPlus() ? Infinity : Math.max(0, FREE_ROUNDS_PER_DAY - roundsOn(log, game, now));
}

// ---- storage ----
const KEY = 'hoot.plus';
export function readPlus(): PlusState {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return v && typeof v === 'object' ? (v as PlusState) : {};
  } catch {
    return {};
  }
}
export function writePlus(s: PlusState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage blocked */
  }
}
/** Called by the payment provider integration once a payment succeeds. */
export function activatePaid(until: string) {
  writePlus(withPaid(readPlus(), until));
}
