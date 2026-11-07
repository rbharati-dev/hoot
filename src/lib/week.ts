// "Share my week with family": a warm summary of the last 7 days (days with
// Hoot, puzzles solved, today's-five sets finished, and one thing the person
// remembered) to send by WhatsApp, email or text.
import { dayKey, readActivity, type ActivityLog } from './activity';
import { readNotes, type Note } from './notes';
import { readUsage } from './supportNudge';

export interface WeekStats {
  days: number;
  solved: number;
  fives: number;
  note: Note | null;
}

/** Pure: the last 7 days, today included. */
export function weekStats(log: ActivityLog, usageDays: string[], notes: Note[], now: Date): WeekStats {
  const keys = new Set<string>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    keys.add(dayKey(d));
  }
  let solved = 0;
  let fives = 0;
  for (const k of keys) {
    const day = log[k];
    if (!day) continue;
    solved += Object.values(day.games ?? {}).reduce((n, g) => n + (g?.solved ?? 0), 0);
    if (day.five) fives++;
  }
  const since = new Date(now);
  since.setDate(since.getDate() - 7);
  const note = notes.filter(n => new Date(n.at) >= since).sort((a, b) => b.at.localeCompare(a.at))[0] ?? null;
  return { days: usageDays.filter(d => keys.has(d)).length, solved, fives, note };
}
export const myWeek = (now = new Date()) => weekStats(readActivity(), readUsage().days, readNotes(), now);

export interface WeekWords {
  weekHead: string;
  weekDays: (n: number) => string;
  weekSolved: (n: number) => string;
  weekFives: (n: number) => string;
  weekRemembered: string;
  weekJoin: string;
}
/** Pure: the text people send. */
export function weekText(w: WeekWords, s: WeekStats, url = 'hootdaily.com'): string {
  const lines = [`🦉 ${w.weekHead}`];
  if (s.days) lines.push(`📅 ${w.weekDays(s.days)}`);
  if (s.solved) lines.push(`✅ ${w.weekSolved(s.solved)}`);
  if (s.fives) lines.push(`⭐ ${w.weekFives(s.fives)}`);
  if (s.note) {
    const words = s.note.text.length > 220 ? `${s.note.text.slice(0, 217)}…` : s.note.text;
    lines.push('', `💭 ${w.weekRemembered} ${s.note.title} (${s.note.year})`, `“${words}”`);
  }
  lines.push('', `${w.weekJoin} ${url}`);
  return lines.join('\n');
}
