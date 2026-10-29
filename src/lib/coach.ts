// "Show me how" walkthroughs inside a game, the first time only.
//
// A game counts as already known when its walkthrough was finished or skipped
// (hoot.coached, synced to the account so a new device doesn't repeat it), or
// when the person had already played it before walkthroughs existed (more
// than the one round that opening the game right now records).
import { GAMES, readActivity, type ActivityLog, type GameId } from './activity';

const KEY = 'hoot.coached';

export function coachedList(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(v) ? v.filter(x => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function totalStarts(log: ActivityLog, game: GameId): number {
  return Object.values(log).reduce((n, day) => n + (day?.games?.[game]?.started ?? 0), 0);
}

/** Pure version, for tests. */
export function needsCoachFrom(coached: string[], log: ActivityLog, game: GameId): boolean {
  return GAMES.includes(game) && !coached.includes(game) && totalStarts(log, game) <= 1;
}

export const needsCoach = (game: GameId) => needsCoachFrom(coachedList(), readActivity(), game);

export function markCoached(game: GameId) {
  const list = coachedList();
  if (list.includes(game)) return;
  try {
    localStorage.setItem(KEY, JSON.stringify([...list, game]));
  } catch {
    /* storage unavailable: it may show again next time, which is harmless */
  }
}
