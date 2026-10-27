import { describe, expect, it } from 'vitest';
import { GAMES, type ActivityLog, type GameId } from '../../src/lib/activity';
import { gridCells, monthReport, monthsWithActivity, nextMonth, prevMonth } from '../../src/lib/report';
import { daysInMonth, deepFreeze, pad, rng } from './suite-b-helpers';

const key = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;
const prev = (y: number, m: number): [number, number] => (m === 1 ? [y - 1, 12] : [y, m - 1]);

function genLog(seed: number, y: number, m: number, density: number): ActivityLog {
  const r = rng(seed);
  const log: ActivityLog = {};
  const months = [prev(y, m), [y, m]];
  for (const [yy, mm] of months)
    for (let d = 1; d <= daysInMonth(yy, mm); d++) {
      if (r() > density) continue;
      const day: ActivityLog[string] = { games: {} };
      for (const g of GAMES) {
        if (r() < 0.25) {
          const started = Math.floor(r() * 4);
          const solved = r() < 0.15 ? Math.floor(r() * 3) : Math.floor(r() * (started + 1));
          day.games[g] = { started, solved };
        }
      }
      if (r() < 0.3) day.five = true;
      log[key(yy, mm, d)] = day;
    }
  return log;
}

// Brute-force reference, written independently of src.
function brute(log: ActivityLog, y: number, m: number) {
  const n = daysInMonth(y, m);
  const act: boolean[] = [];
  let fives = 0;
  const per: Record<string, { rounds: number; solved: number }> = {};
  for (let d = 1; d <= n; d++) {
    const day = log[key(y, m, d)];
    let a = !!day?.five;
    if (day?.five) fives++;
    for (const g of GAMES) {
      const x = day?.games[g];
      if (!x) continue;
      if (x.started > 0) a = true;
      if (x.started === 0 && x.solved === 0) continue;
      per[g] ??= { rounds: 0, solved: 0 };
      per[g].rounds += x.started >= x.solved ? x.started : x.solved;
      per[g].solved += x.solved;
    }
    act.push(a);
  }
  let longest = 0, run = 0;
  for (const a of act) { run = a ? run + 1 : 0; if (run > longest) longest = run; }
  const rounds = Object.values(per).reduce((s, x) => s + x.rounds, 0);
  const solved = Object.values(per).reduce((s, x) => s + x.solved, 0);
  return { act, activeDays: act.filter(Boolean).length, fives, per, longest, rounds, solved };
}

const months: [number, number][] = [];
for (const y of [2025, 2026, 2027]) for (let m = 1; m <= 12; m++) months.push([y, m]);

describe('monthReport vs brute force (36 months, seeded random logs)', () => {
  it.each(months)('%i-%i totals, games, calendar', (y, m) => {
    for (const [salt, density] of [[1, 0.55], [2, 0.2], [3, 0.9]]) {
      const log = deepFreeze(genLog(y * 100 + m + salt * 100000, y, m, density));
      const now = new Date(y, m - 1, 15, 12);
      const r = monthReport(log, y, m, now);
      const b = brute(log, y, m);
      const tag = `${y}-${m} salt${salt}`;
      expect(r.year).toBe(y);
      expect(r.month).toBe(m);
      expect(r.activeDays, tag).toBe(b.activeDays);
      expect(r.rounds, tag).toBe(b.rounds);
      expect(r.solved, tag).toBe(b.solved);
      expect(r.fives, tag).toBe(b.fives);
      expect(r.longestRun, tag).toBe(b.longest);
      expect(r.empty).toBe(b.activeDays === 0);
      // games
      expect(r.games.length).toBe(Object.keys(b.per).length);
      for (const line of r.games) expect(b.per[line.game], tag).toEqual({ rounds: line.rounds, solved: line.solved });
      for (let i = 1; i < r.games.length; i++) expect(r.games[i - 1].rounds).toBeGreaterThanOrEqual(r.games[i].rounds);
      expect(r.games.reduce((s, g) => s + g.rounds, 0)).toBe(r.rounds);
      // calendar
      expect(r.calendar.length).toBe(daysInMonth(y, m));
      r.calendar.forEach((c, i) => {
        expect(c.day).toBe(i + 1);
        expect(c.key).toBe(key(y, m, i + 1));
        expect(c.active).toBe(b.act[i]);
        expect(c.five).toBe(!!log[c.key]?.five);
        const day = log[c.key];
        const rounds = day ? Object.values(day.games).reduce((s, g) => s + Math.max(g!.started, g!.solved), 0) : 0;
        expect(c.rounds).toBe(rounds);
        expect(c.future).toBe(i + 1 > 15);
      });
      expect(r.calendar.reduce((s, c) => s + c.rounds, 0)).toBe(r.rounds);
    }
  });

  it.each(months)('%i-%i previous and highlights', (y, m) => {
    for (const salt of [4, 5, 6, 7]) {
      const log = genLog(y * 100 + m + salt * 100000, y, m, salt === 4 ? 0 : salt === 5 ? 0.6 : 0.5);
      // salt 7: wipe last month to force firstMonth
      const [py, pm] = prev(y, m);
      if (salt === 7) for (const k of Object.keys(log)) if (k.startsWith(`${py}-${pad(pm)}`)) delete log[k];
      const r = monthReport(log, y, m, new Date(y + 1, 0, 1));
      const cur = brute(log, y, m);
      const last = brute(log, py, pm);
      const kinds = r.highlights.map(h => h.kind);
      if (cur.activeDays === 0) {
        expect(r.highlights).toEqual([]);
        expect(r.empty).toBe(true);
        continue;
      }
      if (last.activeDays === 0) {
        expect(r.previous).toBeNull();
        expect(kinds[0]).toBe('firstMonth');
        expect(kinds).not.toContain('moreRounds');
        expect(kinds).not.toContain('steady');
        expect(kinds).not.toContain('newGames');
        expect(kinds).not.toContain('solvedMore');
      } else {
        expect(r.previous).toEqual({ activeDays: last.activeDays, rounds: last.rounds, solved: last.solved });
        expect(kinds).not.toContain('firstMonth');
        const first = r.highlights[0];
        if (cur.rounds > last.rounds) expect(first).toEqual({ kind: 'moreRounds', diff: cur.rounds - last.rounds });
        else expect(first).toEqual({ kind: 'steady' });
        const fresh = GAMES.filter(g => cur.per[g] && !last.per[g]);
        const nh = r.highlights.find(h => h.kind === 'newGames');
        if (fresh.length) expect([...(nh as { games: GameId[] }).games].sort()).toEqual([...fresh].sort());
        else expect(nh).toBeUndefined();
        // solvedMore
        let bestDiff = 0;
        for (const g of GAMES) if (cur.per[g] && last.per[g]?.solved > 0) bestDiff = Math.max(bestDiff, cur.per[g].solved - last.per[g].solved);
        const sm = r.highlights.find(h => h.kind === 'solvedMore') as { game: GameId; diff: number } | undefined;
        if (bestDiff > 0) {
          expect(sm?.diff).toBe(bestDiff);
          expect(cur.per[sm!.game].solved - last.per[sm!.game].solved).toBe(bestDiff);
          expect(last.per[sm!.game].solved).toBeGreaterThan(0);
        } else expect(sm).toBeUndefined();
      }
      const fav = r.highlights.find(h => h.kind === 'favourite') as { game: GameId; rounds: number } | undefined;
      if (r.games[0]) expect(fav).toEqual({ kind: 'favourite', game: r.games[0].game, rounds: r.games[0].rounds });
      expect(fav?.rounds).toBe(Math.max(...Object.values(cur.per).map(x => x.rounds)));
      const lr = r.highlights.find(h => h.kind === 'longestRun');
      if (cur.longest >= 2) expect(lr).toEqual({ kind: 'longestRun', days: cur.longest });
      else expect(lr).toBeUndefined();
      const fv = r.highlights.find(h => h.kind === 'fives');
      if (cur.fives > 0) expect(fv).toEqual({ kind: 'fives', count: cur.fives });
      else expect(fv).toBeUndefined();
    }
  });
});

describe('highlight scenarios (hand-built)', () => {
  const day = (g: Partial<Record<GameId, [number, number]>>, five?: boolean) => ({
    games: Object.fromEntries(Object.entries(g).map(([k, v]) => [k, { started: v![0], solved: v![1] }])),
    five,
  });
  const now = new Date(2026, 5, 30);
  it('first month only when previous month empty', () => {
    const r = monthReport({ '2026-05-03': day({ chess: [1, 1] }) }, 2026, 5, now);
    expect(r.highlights[0]).toEqual({ kind: 'firstMonth' });
    expect(r.previous).toBeNull();
  });
  it('previous month with only unstarted solves counts as empty', () => {
    const r = monthReport({ '2026-04-03': day({ chess: [0, 2] }), '2026-05-03': day({ chess: [1, 1] }) }, 2026, 5, now);
    expect(r.highlights[0].kind).toBe('firstMonth');
  });
  it('steady when equal rounds', () => {
    const r = monthReport({ '2026-04-03': day({ chess: [2, 0] }), '2026-05-03': day({ chess: [2, 0] }) }, 2026, 5, now);
    expect(r.highlights[0]).toEqual({ kind: 'steady' });
  });
  it('steady when fewer rounds', () => {
    const r = monthReport({ '2026-04-03': day({ chess: [5, 0] }), '2026-05-03': day({ chess: [1, 0] }) }, 2026, 5, now);
    expect(r.highlights[0]).toEqual({ kind: 'steady' });
  });
  it('moreRounds diff', () => {
    const r = monthReport({ '2026-04-03': day({ chess: [2, 0] }), '2026-05-03': day({ chess: [7, 0] }) }, 2026, 5, now);
    expect(r.highlights[0]).toEqual({ kind: 'moreRounds', diff: 5 });
  });
  it('new games are those absent last month', () => {
    const r = monthReport({ '2026-04-03': day({ chess: [2, 0] }), '2026-05-03': day({ chess: [2, 0], tune: [1, 0], sudoku: [1, 1] }) }, 2026, 5, now);
    const h = r.highlights.find(x => x.kind === 'newGames') as { games: GameId[] };
    expect([...h.games].sort()).toEqual(['sudoku', 'tune']);
  });
  it('solvedMore picks the biggest positive increase among games in both months', () => {
    const log = {
      '2026-04-03': day({ chess: [3, 1], sudoku: [3, 1], tune: [3, 2], trivia: [3, 0] }),
      '2026-05-03': day({ chess: [4, 3], sudoku: [4, 5], tune: [3, 1], trivia: [5, 5], hangman: [9, 9] }),
    };
    const r = monthReport(log, 2026, 5, now);
    expect(r.highlights.find(x => x.kind === 'solvedMore')).toEqual({ kind: 'solvedMore', game: 'sudoku', diff: 4 });
  });
  it('solvedMore ignores games with 0 solved last month and falling games', () => {
    const log = {
      '2026-04-03': day({ trivia: [3, 0], tune: [3, 3] }),
      '2026-05-03': day({ trivia: [5, 5], tune: [3, 1] }),
    };
    expect(monthReport(log, 2026, 5, now).highlights.some(x => x.kind === 'solvedMore')).toBe(false);
  });
  it('favourite is the top game', () => {
    const r = monthReport({ '2026-05-03': day({ chess: [2, 0], tune: [6, 1], sudoku: [3, 0] }) }, 2026, 5, now);
    expect(r.highlights.find(x => x.kind === 'favourite')).toEqual({ kind: 'favourite', game: 'tune', rounds: 6 });
    expect(r.games.map(g => g.game)).toEqual(['tune', 'sudoku', 'chess']);
  });
  it('longest run requires 2 days; breaks on gaps', () => {
    const one = monthReport({ '2026-05-03': day({ chess: [1, 0] }), '2026-05-05': day({ chess: [1, 0] }) }, 2026, 5, now);
    expect(one.longestRun).toBe(1);
    expect(one.highlights.some(x => x.kind === 'longestRun')).toBe(false);
    const three = monthReport({ '2026-05-03': day({}, true), '2026-05-04': day({ chess: [1, 0] }), '2026-05-05': day({}, true), '2026-05-07': day({}, true) }, 2026, 5, now);
    expect(three.longestRun).toBe(3);
    expect(three.highlights.find(x => x.kind === 'longestRun')).toEqual({ kind: 'longestRun', days: 3 });
  });
  it('run does not carry across the month boundary', () => {
    const r = monthReport({ '2026-04-30': day({}, true), '2026-05-01': day({}, true) }, 2026, 5, now);
    expect(r.longestRun).toBe(1);
  });
  it('empty month has no highlights and previous info is still reported', () => {
    const r = monthReport({ '2026-04-03': day({ chess: [2, 1] }) }, 2026, 5, now);
    expect(r.empty).toBe(true);
    expect(r.highlights).toEqual([]);
    expect(r.previous).toEqual({ activeDays: 1, rounds: 2, solved: 1 });
    expect(r.games).toEqual([]);
  });
  it('fives only counted when set', () => {
    const r = monthReport({ '2026-05-03': day({ chess: [1, 0] }, false), '2026-05-04': day({}, true) }, 2026, 5, now);
    expect(r.fives).toBe(1);
  });
  it('does not mutate the log', () => {
    const log = deepFreeze({ '2026-05-03': day({ chess: [1, 0] }) });
    expect(() => monthReport(log, 2026, 5, now)).not.toThrow();
  });
  it('ties on rounds ordered by solved then game order', () => {
    const r = monthReport({ '2026-05-03': day({ chess: [2, 0], checkers: [2, 2], trivia: [2, 0] }) }, 2026, 5, now);
    expect(r.games.map(g => g.game)).toEqual(['checkers', 'trivia', 'chess']);
  });
});

describe('future flags relative to now', () => {
  const cases: [number, number, Date][] = [
    [2026, 2, new Date(2026, 1, 1, 0, 0)],
    [2026, 2, new Date(2026, 1, 28, 23, 59)],
    [2024, 2, new Date(2024, 1, 29, 12)],
    [2026, 5, new Date(2026, 4, 31, 23, 59)],
    [2026, 5, new Date(2026, 3, 30)],
    [2026, 5, new Date(2026, 5, 1)],
    [2025, 12, new Date(2025, 11, 31)],
  ];
  it.each(cases)('%i-%i with now %s', (y, m, now) => {
    const r = monthReport({}, y, m, now);
    const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    for (const c of r.calendar) expect(c.future).toBe(c.key > today);
    const futureDays = r.calendar.filter(c => c.future).length;
    if (now.getFullYear() === y && now.getMonth() + 1 === m) expect(futureDays).toBe(daysInMonth(y, m) - now.getDate());
  });
});

describe('gridCells', () => {
  it.each(months)('%i-%i leading blanks match weekday of the 1st (Monday-first)', (y, m) => {
    const r = monthReport({}, y, m, new Date(y, m - 1, 1));
    const cells = gridCells(r);
    const wd = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(); // 0 Sun
    const lead = (wd + 6) % 7;
    expect(cells.slice(0, lead).every(c => c === null)).toBe(true);
    expect(cells[lead]?.day).toBe(1);
    expect(cells.length).toBe(lead + daysInMonth(y, m));
    expect(cells.filter(Boolean).map(c => c!.day)).toEqual(Array.from({ length: daysInMonth(y, m) }, (_, i) => i + 1));
  });
  it('known: June 2026 starts on a Monday (0 blanks), Feb 2026 on Sunday (6)', () => {
    expect(gridCells(monthReport({}, 2026, 6, new Date())).findIndex(Boolean)).toBe(0);
    expect(gridCells(monthReport({}, 2026, 2, new Date())).findIndex(Boolean)).toBe(6);
  });
});

describe('prevMonth / nextMonth', () => {
  it.each(Array.from({ length: 12 }, (_, i) => [i + 1]))('month %i', m => {
    const p = prevMonth(2026, m);
    const n = nextMonth(2026, m);
    expect(p).toEqual(m === 1 ? { year: 2025, month: 12 } : { year: 2026, month: m - 1 });
    expect(n).toEqual(m === 12 ? { year: 2027, month: 1 } : { year: 2026, month: m + 1 });
    expect(nextMonth(p.year, p.month)).toEqual({ year: 2026, month: m });
    expect(prevMonth(n.year, n.month)).toEqual({ year: 2026, month: m });
  });
});

describe('monthsWithActivity', () => {
  it('current month always included, newest first, deduped', () => {
    const log: ActivityLog = {
      '2025-01-03': { games: { chess: { started: 1, solved: 0 } } },
      '2025-01-20': { games: {}, five: true },
      '2024-12-31': { games: {}, five: true },
      '2025-03-01': { games: { chess: { started: 1, solved: 0 } } },
      '2025-02-10': { games: {} }, // inactive: ignored
    };
    expect(monthsWithActivity(log, new Date(2025, 5, 5))).toEqual([
      { year: 2025, month: 6 }, { year: 2025, month: 3 }, { year: 2025, month: 1 }, { year: 2024, month: 12 },
    ]);
  });
  it('current month with activity not duplicated', () => {
    const log: ActivityLog = { '2025-06-01': { games: {}, five: true } };
    expect(monthsWithActivity(log, new Date(2025, 5, 5))).toEqual([{ year: 2025, month: 6 }]);
  });
  it('empty log gives just now', () => expect(monthsWithActivity({}, new Date(2027, 0, 1))).toEqual([{ year: 2027, month: 1 }]));
  it('future activity sorts first', () => {
    const log: ActivityLog = { '2026-09-01': { games: {}, five: true } };
    expect(monthsWithActivity(log, new Date(2026, 0, 1))[0]).toEqual({ year: 2026, month: 9 });
  });
  it.each([1, 2, 3, 4, 5])('random log seed %i: strictly descending, no dupes', seed => {
    const r = rng(seed);
    const log: ActivityLog = {};
    for (let i = 0; i < 80; i++) log[key(2024 + Math.floor(r() * 3), 1 + Math.floor(r() * 12), 1 + Math.floor(r() * 28))] = { games: {}, five: true };
    const out = monthsWithActivity(log, new Date(2025, 6, 1));
    for (let i = 1; i < out.length; i++) expect(out[i - 1].year * 12 + out[i - 1].month).toBeGreaterThan(out[i].year * 12 + out[i].month);
    const expected = new Set(Object.keys(log).map(k => k.slice(0, 7)));
    expected.add('2025-07');
    expect(out.length).toBe(expected.size);
  });
});
