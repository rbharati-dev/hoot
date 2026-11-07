import { describe, expect, it } from 'vitest';
import { gameToSuggest } from '../../src/lib/discover';
import { GAMES, type ActivityLog } from '../../src/lib/activity';

const played = (days: Record<string, string[]>): ActivityLog =>
  Object.fromEntries(Object.entries(days).map(([k, gs]) => [k, { games: Object.fromEntries(gs.map(g => [g, { started: 1, solved: 0 }])) }]));

describe('a game for you on the welcome screen', () => {
  it('suggests a game never played first', () => {
    const log = played({ '2026-11-06': GAMES.filter(g => g !== 'chess') });
    expect(gameToSuggest(log, new Date(2026, 10, 7, 9))).toEqual({ game: 'chess', daysAgo: null });
  });
  it('otherwise the one played longest ago, with how long', () => {
    const log = played({ '2026-10-20': ['sudoku'], '2026-11-06': GAMES.filter(g => g !== 'sudoku') });
    expect(gameToSuggest(log, new Date(2026, 10, 7, 9))).toEqual({ game: 'sudoku', daysAgo: 18 });
  });
  it('changes day to day among unplayed games', () => {
    const picks = new Set(Array.from({ length: 10 }, (_, d) => gameToSuggest({}, new Date(2026, 10, 1 + d, 9)).game));
    expect(picks.size).toBeGreaterThan(2);
  });
});
