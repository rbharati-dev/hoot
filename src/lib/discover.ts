// "Also on Hoot" on the welcome screen: a game the person hasn't played in a
// while, one health study and today's top headline, so the rest of Hoot is
// right there from the first screen. Pure helpers, so they can be tested.
import { GAMES, dayKey, keyDate, type ActivityLog, type GameId } from './activity';
import { seededRandom } from './prefs';

/**
 * The game played least recently. Games never played come first (they're the
 * ones the person may not know about), picked by the day so it changes daily.
 * daysAgo is null for a game never played.
 */
export function gameToSuggest(log: ActivityLog, now: Date): { game: GameId; daysAgo: number | null } {
  const last = new Map<GameId, string>();
  for (const [k, day] of Object.entries(log))
    for (const g of GAMES) if ((day.games?.[g]?.started ?? 0) > 0 && k > (last.get(g) ?? '')) last.set(g, k);
  const today = dayKey(now);
  const never = GAMES.filter(g => !last.has(g));
  const rnd = seededRandom(`discover|${today}`);
  if (never.length) return { game: never[Math.floor(rnd() * never.length)], daysAgo: null };
  // Played-before games: the longest ago (ties broken by the day).
  const played = GAMES.slice().sort((a, b) => last.get(a)!.localeCompare(last.get(b)!) || rnd() - 0.5);
  const game = played[0];
  const daysAgo = Math.round((keyDate(today).getTime() - keyDate(last.get(game)!).getTime()) / 864e5);
  // Played today already: everything is fresh, so just pick one for the day.
  if (daysAgo === 0) return { game: GAMES[Math.floor(rnd() * GAMES.length)], daysAgo: 0 };
  return { game, daysAgo };
}
