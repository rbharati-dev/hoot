// What the person did, day by day: rounds started and solved per game, and
// whether they finished Today's Five. Small and local (no account): it powers
// the free daily allowance and the monthly brain-fitness report.
//
// Pure functions take the log explicitly so they can be tested; the `store`
// helpers at the bottom read/write localStorage.

export const GAMES = ['trivia', 'tune', 'crossword', 'wordsearch', 'scramble', 'hangman', 'solitaire', 'sudoku', 'pattern', 'quickmath', 'chess', 'checkers'] as const;
export type GameId = (typeof GAMES)[number];

export interface DayGame {
  started: number;
  solved: number;
}
export interface Day {
  games: Partial<Record<GameId, DayGame>>;
  five?: boolean; // finished Today's Five
}
export type ActivityLog = Record<string, Day>; // key: YYYY-MM-DD (local date)

export const KEEP_DAYS = 800; // a little over two years of history

/** Local calendar date as YYYY-MM-DD (not UTC: "today" is the person's today). */
export function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Parse a YYYY-MM-DD key back into a local Date at noon (safe from DST edges). */
export function keyDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export function isGame(x: string): x is GameId {
  return (GAMES as readonly string[]).includes(x);
}

function bump(log: ActivityLog, now: Date, game: GameId, field: keyof DayGame): ActivityLog {
  const k = dayKey(now);
  const day: Day = log[k] ? { ...log[k], games: { ...log[k].games } } : { games: {} };
  const g = day.games[game] ?? { started: 0, solved: 0 };
  day.games[game] = { ...g, [field]: g[field] + 1 };
  // A solve without a recorded start (e.g. state from before this feature)
  // still counts as a round played.
  if (field === 'solved' && day.games[game]!.started < day.games[game]!.solved) day.games[game]!.started = day.games[game]!.solved;
  return prune({ ...log, [k]: day }, now);
}

export const withStart = (log: ActivityLog, game: GameId, now: Date) => bump(log, now, game, 'started');
export const withSolve = (log: ActivityLog, game: GameId, now: Date) => bump(log, now, game, 'solved');
export function withFive(log: ActivityLog, now: Date): ActivityLog {
  const k = dayKey(now);
  return prune({ ...log, [k]: { games: { ...(log[k]?.games ?? {}) }, five: true } }, now);
}

/** Drop days older than KEEP_DAYS so storage stays small. */
export function prune(log: ActivityLog, now: Date): ActivityLog {
  const cutoff = dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - KEEP_DAYS));
  const out: ActivityLog = {};
  for (const [k, v] of Object.entries(log)) if (k >= cutoff) out[k] = v;
  return out;
}

export function roundsOn(log: ActivityLog, game: GameId, day: Date): number {
  return log[dayKey(day)]?.games[game]?.started ?? 0;
}

export function isActive(day: Day | undefined): boolean {
  if (!day) return false;
  if (day.five) return true;
  return Object.values(day.games).some(g => (g?.started ?? 0) > 0);
}

// ---- storage ----
const KEY = 'hoot.activity';
export function readActivity(): ActivityLog {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '{}');
    return v && typeof v === 'object' ? (v as ActivityLog) : {};
  } catch {
    return {};
  }
}
export function writeActivity(log: ActivityLog) {
  try {
    localStorage.setItem(KEY, JSON.stringify(log));
  } catch {
    /* storage full or blocked */
  }
}
export function recordStart(game: GameId, now = new Date()) {
  writeActivity(withStart(readActivity(), game, now));
}
export function recordSolve(game: GameId, now = new Date()) {
  writeActivity(withSolve(readActivity(), game, now));
}
export function recordFive(now = new Date()) {
  writeActivity(withFive(readActivity(), now));
}
