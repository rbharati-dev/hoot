// The monthly "brain fitness" report: a gentle summary of what the person did,
// built from the activity log. Pure, so every number can be unit-tested.
// It celebrates effort and progress; it never makes medical claims.
import { GAMES, dayKey, isActive, type ActivityLog, type GameId } from './activity';

export interface GameLine {
  game: GameId;
  rounds: number;
  solved: number;
}
export interface CalendarDay {
  key: string; // YYYY-MM-DD
  day: number; // 1..31
  rounds: number;
  five: boolean;
  active: boolean;
  future: boolean; // after "now": shown greyed
}

/** A highlight the report can mention. Each language phrases these itself. */
export type Highlight =
  | { kind: 'firstMonth' }
  | { kind: 'moreRounds'; diff: number }
  | { kind: 'steady' }
  | { kind: 'favourite'; game: GameId; rounds: number }
  | { kind: 'longestRun'; days: number }
  | { kind: 'newGames'; games: GameId[] }
  | { kind: 'fives'; count: number }
  | { kind: 'solvedMore'; game: GameId; diff: number };

export interface MonthReport {
  year: number;
  month: number; // 1..12
  activeDays: number;
  rounds: number;
  solved: number;
  fives: number;
  longestRun: number; // most consecutive active days within the month
  games: GameLine[]; // games played this month, most rounds first
  calendar: CalendarDay[];
  previous: { activeDays: number; rounds: number; solved: number } | null; // null when nothing last month
  highlights: Highlight[];
  empty: boolean; // nothing at all this month
}

const daysIn = (year: number, month: number) => new Date(year, month, 0).getDate();
const key = (year: number, month: number, day: number) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
export const prevMonth = (year: number, month: number) => (month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 });
export const nextMonth = (year: number, month: number) => (month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 });

function totals(log: ActivityLog, year: number, month: number) {
  const per = new Map<GameId, GameLine>();
  let activeDays = 0, rounds = 0, solved = 0, fives = 0, run = 0, longestRun = 0;
  for (let d = 1; d <= daysIn(year, month); d++) {
    const day = log[key(year, month, d)];
    const active = isActive(day);
    if (active) {
      activeDays++;
      run++;
      longestRun = Math.max(longestRun, run);
    } else run = 0;
    if (day?.five) fives++;
    for (const g of GAMES) {
      const x = day?.games[g];
      if (!x || (!x.started && !x.solved)) continue;
      const line = per.get(g) ?? { game: g, rounds: 0, solved: 0 };
      line.rounds += Math.max(x.started, x.solved);
      line.solved += x.solved;
      per.set(g, line);
    }
  }
  const games = [...per.values()].sort((a, b) => b.rounds - a.rounds || b.solved - a.solved || GAMES.indexOf(a.game) - GAMES.indexOf(b.game));
  for (const l of games) {
    rounds += l.rounds;
    solved += l.solved;
  }
  return { activeDays, rounds, solved, fives, longestRun, games };
}

export function monthReport(log: ActivityLog, year: number, month: number, now: Date): MonthReport {
  const cur = totals(log, year, month);
  const p = prevMonth(year, month);
  const last = totals(log, p.year, p.month);
  const today = dayKey(now);

  const calendar: CalendarDay[] = [];
  for (let d = 1; d <= daysIn(year, month); d++) {
    const k = key(year, month, d);
    const day = log[k];
    const rounds = day ? Object.values(day.games).reduce((n, g) => n + Math.max(g?.started ?? 0, g?.solved ?? 0), 0) : 0;
    calendar.push({ key: k, day: d, rounds, five: !!day?.five, active: isActive(day), future: k > today });
  }

  const hadLast = last.activeDays > 0;
  const highlights: Highlight[] = [];
  if (cur.activeDays > 0) {
    if (!hadLast) highlights.push({ kind: 'firstMonth' });
    else if (cur.rounds > last.rounds) highlights.push({ kind: 'moreRounds', diff: cur.rounds - last.rounds });
    else highlights.push({ kind: 'steady' });
    if (cur.games[0]) highlights.push({ kind: 'favourite', game: cur.games[0].game, rounds: cur.games[0].rounds });
    if (cur.longestRun >= 2) highlights.push({ kind: 'longestRun', days: cur.longestRun });
    if (hadLast) {
      const before = new Set(last.games.map(g => g.game));
      const fresh = cur.games.map(g => g.game).filter(g => !before.has(g));
      if (fresh.length) highlights.push({ kind: 'newGames', games: fresh });
      // The game with the biggest rise in puzzles solved.
      let best: { game: GameId; diff: number } | null = null;
      for (const g of cur.games) {
        const was = last.games.find(x => x.game === g.game)?.solved ?? 0;
        const diff = g.solved - was;
        if (was > 0 && diff > 0 && (!best || diff > best.diff)) best = { game: g.game, diff };
      }
      if (best) highlights.push({ kind: 'solvedMore', ...best });
    }
    if (cur.fives > 0) highlights.push({ kind: 'fives', count: cur.fives });
  }

  return {
    year,
    month,
    ...cur,
    calendar,
    previous: hadLast ? { activeDays: last.activeDays, rounds: last.rounds, solved: last.solved } : null,
    highlights,
    empty: cur.activeDays === 0,
  };
}

/** Months (newest first) that have any activity, plus the current month. */
export function monthsWithActivity(log: ActivityLog, now: Date): { year: number; month: number }[] {
  const set = new Set<string>([`${now.getFullYear()}-${now.getMonth() + 1}`]);
  for (const [k, d] of Object.entries(log)) if (isActive(d)) set.add(`${Number(k.slice(0, 4))}-${Number(k.slice(5, 7))}`);
  return [...set]
    .map(s => ({ year: Number(s.split('-')[0]), month: Number(s.split('-')[1]) }))
    .sort((a, b) => b.year - a.year || b.month - a.month);
}

/** Calendar cells for a month grid starting on Monday: leading blanks, then days. */
export function gridCells(r: MonthReport): (CalendarDay | null)[] {
  const first = new Date(r.year, r.month - 1, 1).getDay(); // 0 = Sunday
  const lead = (first + 6) % 7; // Monday-first
  return [...Array<null>(lead).fill(null), ...r.calendar];
}
