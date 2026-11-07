// "Share your result" after a game: a short, friendly brag (Wordle-style)
// that ends with a link back to Hoot, so friends see it and come play.
import type { Lang } from './data';
import { readActivity, dayKey } from './activity';
import { getStreak, todayKey } from './daily';

export function mmss(secs: number): string {
  const s = Math.max(0, Math.round(secs));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Puzzles solved today, across all games. */
export function solvedToday(now = new Date()): number {
  const day = readActivity()[dayKey(now)];
  return Object.values(day?.games ?? {}).reduce((n, g) => n + (g?.solved ?? 0), 0);
}

/** The visit streak, if it is still alive (done today or yesterday). */
export function liveStreak(now = new Date()): number {
  const s = getStreak();
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  return s.last === todayKey(now) || s.last === todayKey(y) ? s.count : 0;
}

export interface BragWords {
  bragSolved: (game: string, time: string) => string;
  bragToday: (n: number) => string;
  bragStreak: (n: number) => string;
  bragPlay: string;
}

/** Pure: the text people send. */
export function bragText(w: BragWords, lang: Lang, game: string, secs: number, today: number, streak: number, now = new Date(), url = 'hootdaily.com'): string {
  const date = now.toLocaleDateString(lang, { month: 'short', day: 'numeric' });
  const lines = [`🦉 Hoot · ${date}`, `${w.bragSolved(game, mmss(secs))} ✅`];
  const extra = [today > 1 ? w.bragToday(today) : '', streak > 1 ? `${w.bragStreak(streak)} 🔥` : ''].filter(Boolean).join(' · ');
  if (extra) lines.push(extra);
  lines.push(`${w.bragPlay} ${url}`);
  return lines.join('\n');
}
