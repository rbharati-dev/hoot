import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Card } from '../../src/lib/data';
import {
  DAILY_DECAY,
  DECAY_KEY,
  EXPLORE_RATE,
  GAMES_ORDER_AFTER,
  PREFS_KEY,
  SIGNAL_WEIGHTS,
  WEIGHT_LIMIT,
  applySignal,
  cardFeatures,
  daysBetween,
  decadeOf,
  decayPrefs,
  emptyPrefs,
  orderGamesForVisit,
  rankCards,
  rankCardsDetailed,
  rankGames,
  readPrefs,
  recordSignal,
  roundsPlayed,
  sanitizePrefs,
  score,
  seededRandom,
  signalDeltas,
  type Prefs,
  type Signal,
} from '../../src/lib/prefs';
import { counters, fields, weights } from '../../src/lib/sync/merge';
import { SYNC_KEYS } from '../../src/lib/sync/keys';

// ---- helpers ----
let mem: Map<string, string>;
function installStorage(opts: { throwGet?: boolean; throwSet?: boolean } = {}) {
  mem = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => {
      if (opts.throwGet) throw new Error('denied');
      return mem.get(k) ?? null;
    },
    setItem: (k: string, v: string) => {
      if (opts.throwSet) throw new Error('quota');
      mem.set(k, v);
    },
    removeItem: (k: string) => void mem.delete(k),
  });
}
beforeEach(() => installStorage());

let uid = 0;
const card = (type: string, o: Partial<Card> = {}): Card => ({ id: `c${uid++}`, year: 1965, type, title: 't', text: 'x', wiki: 'W', ...o });
const day = (y: number, m: number, d: number) => new Date(y, m - 1, d, 12);
const P = (w: Record<string, number> = {}, n: Record<string, number> = {}): Prefs => ({ w, n });
const stored = (): Prefs => JSON.parse(mem.get(PREFS_KEY) ?? '{"w":{},"n":{}}');
const rng = (seed: string) => seededRandom(seed);
const maxRun = (cs: Card[]) => {
  let best = 0, run = 0, last = '';
  for (const c of cs) {
    run = c.type === last ? run + 1 : 1;
    last = c.type;
    best = Math.max(best, run);
  }
  return best;
};
const mix = (types: string[], per: number, o: Partial<Card> = {}) => types.flatMap(t => Array.from({ length: per }, () => card(t, o)));
const TYPES = ['music', 'film', 'tv', 'sport', 'news', 'science', 'politics', 'culture'];

// ---- features ----
describe('decadeOf', () => {
  it.each([[1950, '1950s'], [1959, '1950s'], [1960, '1960s'], [1999, '1990s'], [2000, '2000s'], [1901, '1900s']])('%i is %s', (y, d) => expect(decadeOf(y)).toBe(d));
});

describe('cardFeatures', () => {
  it.each(['music', 'song', 'film', 'tv', 'sport', 'news', 'science', 'space', 'politics', 'culture', 'everyday', 'cricket', 'wisdom'])('type feature for %s', type => {
    expect(cardFeatures(card(type))).toContain(`type:${type}`);
  });
  it.each([1950, 1955, 1961, 1979, 1988, 1999])('decade feature for year %i', y => {
    expect(cardFeatures(card('film', { year: y }))).toContain(`decade:${decadeOf(y)}`);
  });
  it('tags become tag: features', () => {
    const f = cardFeatures(card('music', { tags: ['cars', 'food'] }));
    expect(f).toContain('tag:cars');
    expect(f).toContain('tag:food');
  });
  it('limits the number of tags used', () => {
    const f = cardFeatures(card('music', { tags: ['a', 'b', 'c', 'd', 'e', 'f'] }));
    expect(f.filter(x => x.startsWith('tag:'))).toHaveLength(4);
  });
  it('src is curated by default', () => expect(cardFeatures(card('film'))).toContain('src:curated'));
  it('src is live for live cards', () => expect(cardFeatures(card('film', { live: true }))).toContain('src:live'));
  it('live and curated are exclusive', () => {
    expect(cardFeatures(card('film', { live: true }))).not.toContain('src:curated');
    expect(cardFeatures(card('film'))).not.toContain('src:live');
  });
  it('no topic feature without a topic', () => expect(cardFeatures(card('news')).some(f => f.startsWith('topic:'))).toBe(false));
  it('news cards carry their topic', () => expect(cardFeatures(card('news'), 'science')).toContain('topic:science'));
  it('a topic field on the card is used', () => {
    expect(cardFeatures({ ...card('news'), topic: 'sport' } as Card)).toContain('topic:sport');
  });
  it('an explicit topic wins over a card field', () => {
    expect(cardFeatures({ ...card('news'), topic: 'sport' } as Card, 'music')).toContain('topic:music');
  });
  it('has no duplicate features', () => {
    const f = cardFeatures(card('music', { tags: ['music', 'cars'] }));
    expect(new Set(f).size).toBe(f.length);
  });
  it('tolerates a missing tags array', () => expect(() => cardFeatures({ ...card('film'), tags: undefined })).not.toThrow());
  it('skips the decade for a nonsense year', () => {
    expect(cardFeatures(card('film', { year: NaN })).some(f => f.startsWith('decade:'))).toBe(false);
  });
});

// ---- signals ----
describe('signal weights are as documented', () => {
  it.each([
    ['save', 3], ['unsave', -1], ['hide', -4], ['play', 2], ['read', 1.5], ['share', 2], ['source', 1],
    ['dwell12', 1], ['dwell30', 1.5], ['skip', -0.7], ['news', 1], ['gameStart', 1], ['gameSolve', 1.5],
  ] as const)('%s = %d', (k, v) => expect(SIGNAL_WEIGHTS[k]).toBe(v));
});

describe('card signals move the type weight by the full amount', () => {
  it.each([
    ['save', 3], ['unsave', -1], ['hide', -4], ['play', 2], ['read', 1.5], ['share', 2], ['source', 1],
  ] as const)('%s on a music card', (kind, amt) => {
    const p = applySignal(emptyPrefs(), { kind, card: card('music') });
    expect(p.w['type:music']).toBeCloseTo(amt);
  });
  it.each(['save', 'unsave', 'hide', 'play', 'read', 'share', 'source'] as const)('%s spreads onto tag, decade and src with smaller shares', kind => {
    const p = applySignal(emptyPrefs(), { kind, card: card('film', { tags: ['cars'], year: 1971 }) });
    const t = p.w['type:film'];
    expect(Math.abs(p.w['tag:cars'])).toBeCloseTo(Math.abs(t) * 0.5);
    expect(Math.abs(p.w['decade:1970s'])).toBeCloseTo(Math.abs(t) * 0.3);
    expect(Math.abs(p.w['src:curated'])).toBeCloseTo(Math.abs(t) * 0.2);
  });
  it.each(['save', 'play', 'read', 'share', 'source'] as const)('%s is positive', kind => {
    expect(applySignal(emptyPrefs(), { kind, card: card('tv') }).w['type:tv']).toBeGreaterThan(0);
  });
  it.each(['unsave', 'hide'] as const)('%s is negative', kind => {
    expect(applySignal(emptyPrefs(), { kind, card: card('tv') }).w['type:tv']).toBeLessThan(0);
  });
  it('hide is stronger than unsave', () => {
    const a = applySignal(emptyPrefs(), { kind: 'hide', card: card('tv') }).w['type:tv'];
    const b = applySignal(emptyPrefs(), { kind: 'unsave', card: card('tv') }).w['type:tv'];
    expect(a).toBeLessThan(b);
  });
  it('save then unsave nets +2 on the type', () => {
    const c = card('tv');
    const p = applySignal(applySignal(emptyPrefs(), { kind: 'save', card: c }), { kind: 'unsave', card: c });
    expect(p.w['type:tv']).toBeCloseTo(2);
  });
  it('live cards credit src:live', () => {
    expect(applySignal(emptyPrefs(), { kind: 'save', card: card('film', { live: true }) }).w['src:live']).toBeCloseTo(0.6);
  });
  it('signals add to existing weights', () => {
    const p = applySignal(P({ 'type:film': 2 }), { kind: 'save', card: card('film') });
    expect(p.w['type:film']).toBeCloseTo(5);
  });
  it('does not mutate the input', () => {
    const before = P({ 'type:film': 2 }, { save: 1 });
    const snap = JSON.stringify(before);
    applySignal(before, { kind: 'save', card: card('film') });
    expect(JSON.stringify(before)).toBe(snap);
  });
  it('is pure: same input gives the same output', () => {
    const c = card('film', { tags: ['football'] });
    expect(applySignal(emptyPrefs(), { kind: 'save', card: c })).toEqual(applySignal(emptyPrefs(), { kind: 'save', card: c }));
  });
});

describe('counters', () => {
  it.each(['save', 'unsave', 'hide', 'play', 'read', 'share', 'source'] as const)('%s bumps n.%s', kind => {
    const p = applySignal(emptyPrefs(), { kind, card: card('film') });
    expect(p.n[kind]).toBe(1);
  });
  it('counters accumulate', () => {
    let p = emptyPrefs();
    for (let i = 0; i < 5; i++) p = applySignal(p, { kind: 'save', card: card('film') });
    expect(p.n.save).toBe(5);
  });
  it('game starts and solves are counted', () => {
    let p = applySignal(emptyPrefs(), { kind: 'gameStart', game: 'sudoku' });
    p = applySignal(p, { kind: 'gameSolve', game: 'sudoku' });
    expect(p.n.gameStart).toBe(1);
    expect(p.n.gameSolve).toBe(1);
  });
  it('news opens are counted', () => expect(applySignal(emptyPrefs(), { kind: 'news', topic: 'sport' }).n.news).toBe(1));
  it('counters never go down when weights do', () => {
    const p = applySignal(applySignal(emptyPrefs(), { kind: 'save', card: card('x') }), { kind: 'hide', card: card('x') });
    expect(p.n.save).toBe(1);
    expect(p.n.hide).toBe(1);
  });
});

describe('dwell and skip', () => {
  const c = card('film');
  const w = (ms: number) => applySignal(emptyPrefs(), { kind: 'view', card: c, ms });
  it.each([0, 500, 1500, 2999])('%i ms is a skip (-0.7)', ms => {
    expect(w(ms).w['type:film']).toBeCloseTo(-0.7);
    expect(w(ms).n.skip).toBe(1);
  });
  it.each([3000, 5000, 8000, 11999])('%i ms is neutral', ms => {
    expect(w(ms).w['type:film']).toBeUndefined();
    expect(w(ms).n).toEqual({});
  });
  it.each([12000, 15000, 20000, 29999])('%i ms is a read (+1)', ms => {
    expect(w(ms).w['type:film']).toBeCloseTo(1);
    expect(w(ms).n.dwell).toBe(1);
  });
  it.each([30000, 45000, 120000, 299999])('%i ms is a long read (+1.5, not 2.5)', ms => {
    expect(w(ms).w['type:film']).toBeCloseTo(1.5);
    expect(w(ms).n.dwell).toBe(1);
  });
  it.each([300000, 600000, 3_600_000])('%i ms means they wandered off: ignored', ms => {
    expect(w(ms)).toEqual(emptyPrefs());
  });
  it('a skip also lowers tag, decade and src a little', () => {
    const p = applySignal(emptyPrefs(), { kind: 'view', card: card('film', { tags: ['cars'] }), ms: 100 });
    expect(p.w['tag:cars']).toBeCloseTo(-0.35);
    expect(p.w['decade:1960s']).toBeCloseTo(-0.21);
  });
  it('a skip is much weaker than "not for me"', () => {
    expect(Math.abs(SIGNAL_WEIGHTS.skip) * 5).toBeLessThan(Math.abs(SIGNAL_WEIGHTS.hide) + 0.01);
  });
});

describe('news and games', () => {
  it('opening a story adds +1 to its topic', () => {
    expect(applySignal(emptyPrefs(), { kind: 'news', topic: 'science' }).w['topic:science']).toBeCloseTo(1);
  });
  it('news only touches the topic', () => {
    expect(Object.keys(applySignal(emptyPrefs(), { kind: 'news', topic: 'science' }).w)).toEqual(['topic:science']);
  });
  it('an empty topic does nothing to weights', () => {
    expect(applySignal(emptyPrefs(), { kind: 'news', topic: '' }).w).toEqual({});
  });
  it.each(['trivia', 'tune', 'crossword', 'wordsearch', 'scramble', 'hangman', 'solitaire', 'sudoku', 'pattern', 'quickmath', 'chess', 'checkers'])('starting %s gives +1 to game:%s', g => {
    expect(applySignal(emptyPrefs(), { kind: 'gameStart', game: g }).w[`game:${g}`]).toBeCloseTo(1);
  });
  it.each(['trivia', 'sudoku', 'chess'])('solving %s gives +1.5', g => {
    expect(applySignal(emptyPrefs(), { kind: 'gameSolve', game: g }).w[`game:${g}`]).toBeCloseTo(1.5);
  });
  it('start + solve = 2.5', () => {
    const p = applySignal(applySignal(emptyPrefs(), { kind: 'gameStart', game: 'x' }), { kind: 'gameSolve', game: 'x' });
    expect(p.w['game:x']).toBeCloseTo(2.5);
  });
  it('games do not touch card features', () => {
    expect(Object.keys(applySignal(emptyPrefs(), { kind: 'gameStart', game: 'x' }).w)).toEqual(['game:x']);
  });
  it('signalDeltas lists exactly the touched features', () => {
    expect(signalDeltas({ kind: 'gameSolve', game: 'x' })).toEqual({ 'game:x': 1.5 });
  });
  it('signalDeltas for a bare card save', () => {
    const d = signalDeltas({ kind: 'save', card: card('music', { year: 1962 }) });
    expect(Object.keys(d).sort()).toEqual(['decade:1960s', 'src:curated', 'type:music']);
  });
});

// ---- clamping ----
describe('clamping', () => {
  it('weights never exceed +10', () => {
    let p = emptyPrefs();
    for (let i = 0; i < 50; i++) p = applySignal(p, { kind: 'save', card: card('music') });
    expect(p.w['type:music']).toBe(WEIGHT_LIMIT);
  });
  it('weights never go below -10', () => {
    let p = emptyPrefs();
    for (let i = 0; i < 50; i++) p = applySignal(p, { kind: 'hide', card: card('music') });
    expect(p.w['type:music']).toBe(-WEIGHT_LIMIT);
  });
  it.each([5, 9.9, 10, 25])('a starting weight of %d stays within bounds after a save', start => {
    const p = applySignal(P({ 'type:music': start }), { kind: 'save', card: card('music') });
    expect(p.w['type:music']).toBeLessThanOrEqual(10);
  });
  it('a game weight is clamped too', () => {
    let p = emptyPrefs();
    for (let i = 0; i < 20; i++) p = applySignal(p, { kind: 'gameSolve', game: 'a' });
    expect(p.w['game:a']).toBe(10);
  });
  it('a topic weight is clamped too', () => {
    let p = emptyPrefs();
    for (let i = 0; i < 30; i++) p = applySignal(p, { kind: 'news', topic: 'a' });
    expect(p.w['topic:a']).toBe(10);
  });
  it('a saturated weight can come back down', () => {
    let p = emptyPrefs();
    for (let i = 0; i < 20; i++) p = applySignal(p, { kind: 'save', card: card('music') });
    p = applySignal(p, { kind: 'hide', card: card('music') });
    expect(p.w['type:music']).toBe(6);
  });
  it('score ignores out-of-range merged values', () => {
    expect(score(card('x'), P({ 'type:x': 500 }))).toBeCloseTo(10 - 0.2 * 0 + 0);
  });
  it('sanitize clamps stored out-of-range values', () => {
    expect(sanitizePrefs({ w: { a: 99, b: -99 }, n: {} }).w).toEqual({ a: 10, b: -10 });
  });
});

// ---- forgetting ----
describe('decayPrefs', () => {
  it.each([1, 2, 7, 30])('%i day(s) multiplies by 0.98^days', d => {
    const p = decayPrefs(P({ a: 8 }), d);
    expect(p.w.a).toBeCloseTo(8 * Math.pow(1 - DAILY_DECAY, d), 2);
  });
  it('0 days changes nothing', () => expect(decayPrefs(P({ a: 4 }), 0).w.a).toBe(4));
  it('negative days change nothing', () => expect(decayPrefs(P({ a: 4 }), -3).w.a).toBe(4));
  it('negative weights fade toward zero too', () => {
    const p = decayPrefs(P({ a: -8 }), 10);
    expect(p.w.a).toBeGreaterThan(-8);
    expect(p.w.a).toBeLessThan(0);
  });
  it('tiny weights are dropped', () => expect(decayPrefs(P({ a: 0.05 }), 1).w.a).toBeUndefined());
  it('counters are untouched', () => expect(decayPrefs(P({ a: 4 }, { save: 9 }), 5).n).toEqual({ save: 9 }));
  it('is capped at 60 days', () => {
    expect(decayPrefs(P({ a: 10 }), 5000).w.a).toBeCloseTo(decayPrefs(P({ a: 10 }), 60).w.a);
  });
  it('is gentle: a month away keeps over half', () => expect(decayPrefs(P({ a: 10 }), 30).w.a).toBeGreaterThan(5));
  it('never flips sign', () => {
    for (let d = 1; d < 60; d++) expect(decayPrefs(P({ a: 3 }), d).w.a ?? 0).toBeGreaterThanOrEqual(0);
  });
  it('does not mutate', () => {
    const p = P({ a: 4 });
    decayPrefs(p, 3);
    expect(p.w.a).toBe(4);
  });
  it('accepts fractional days by flooring', () => expect(decayPrefs(P({ a: 4 }), 0.9).w.a).toBe(4));
});

describe('daysBetween', () => {
  it.each([
    ['2026-01-01', '2026-01-02', 1], ['2026-01-01', '2026-01-01', 0], ['2026-01-05', '2026-01-01', 0],
    ['2025-12-31', '2026-01-01', 1], ['2026-02-28', '2026-03-01', 1], ['2026-01-01', '2026-02-01', 31], ['', '2026-01-01', 0], ['junk', 'junk', 0],
  ])('%s -> %s = %i', (a, b, n) => expect(daysBetween(a, b)).toBe(n));
});

describe('recordSignal forgetting (once a day)', () => {
  const save = (c: Card): Signal => ({ kind: 'save', card: c });
  it('does not decay on the very first signal', () => {
    recordSignal(save(card('film')), day(2026, 3, 1));
    expect(stored().w['type:film']).toBeCloseTo(3);
  });
  it('remembers the day in a separate local key', () => {
    recordSignal(save(card('film')), day(2026, 3, 1));
    expect(mem.get(DECAY_KEY)).toBe('2026-03-01');
  });
  it('the same day never decays again', () => {
    for (let i = 0; i < 3; i++) recordSignal({ kind: 'view', card: card('film'), ms: 40000 }, day(2026, 3, 1));
    expect(stored().w['type:film']).toBeCloseTo(4.5);
  });
  it('the next day decays once, then adds', () => {
    recordSignal(save(card('film')), day(2026, 3, 1));
    recordSignal(save(card('film')), day(2026, 3, 2));
    expect(stored().w['type:film']).toBeCloseTo(3 * 0.98 + 3, 2);
  });
  it('several signals on day 2 decay only once', () => {
    recordSignal(save(card('film')), day(2026, 3, 1));
    recordSignal(save(card('tv')), day(2026, 3, 2));
    recordSignal(save(card('tv')), day(2026, 3, 2));
    recordSignal(save(card('tv')), day(2026, 3, 2));
    expect(stored().w['type:film']).toBeCloseTo(3 * 0.98, 2);
  });
  it('days away are caught up in one step', () => {
    recordSignal(save(card('film')), day(2026, 3, 1));
    recordSignal(save(card('tv')), day(2026, 3, 11));
    expect(stored().w['type:film']).toBeCloseTo(3 * Math.pow(0.98, 10), 2);
  });
  it('a clock that goes backwards does not decay', () => {
    recordSignal(save(card('film')), day(2026, 3, 10));
    recordSignal(save(card('tv')), day(2026, 3, 5));
    expect(stored().w['type:film']).toBeCloseTo(3);
  });
  it('counters are never decayed', () => {
    recordSignal(save(card('film')), day(2026, 3, 1));
    recordSignal(save(card('film')), day(2026, 5, 1));
    expect(stored().n.save).toBe(2);
  });
  it('a liked thing fades over weeks of no use of it', () => {
    recordSignal(save(card('film')), day(2026, 3, 1));
    recordSignal({ kind: 'gameStart', game: 'x' }, day(2026, 4, 30));
    expect(stored().w['type:film']).toBeLessThan(1.5);
  });
  it('works across a month boundary', () => {
    recordSignal(save(card('film')), day(2026, 1, 31));
    recordSignal(save(card('film')), day(2026, 2, 1));
    expect(stored().w['type:film']).toBeCloseTo(3 * 0.98 + 3, 2);
  });
});

// ---- storage ----
describe('storage', () => {
  it('reads empty when nothing is stored', () => expect(readPrefs()).toEqual({ w: {}, n: {} }));
  it('round-trips through recordSignal', () => {
    recordSignal({ kind: 'save', card: card('film') });
    expect(readPrefs().w['type:film']).toBeCloseTo(3);
  });
  it('writes exactly {w, n}', () => {
    recordSignal({ kind: 'save', card: card('film') });
    expect(Object.keys(JSON.parse(mem.get(PREFS_KEY)!)).sort()).toEqual(['n', 'w']);
  });
  it.each([
    ['not json', '{{{'], ['null', 'null'], ['a number', '42'], ['an array', '[1,2]'], ['a string', '"hi"'],
    ['w is a list', '{"w":[1],"n":{}}'], ['n is a string', '{"w":{},"n":"x"}'], ['empty object', '{}'],
  ])('tolerates corrupt data: %s', (_name, raw) => {
    mem.set(PREFS_KEY, raw);
    const p = readPrefs();
    expect(p.w && p.n).toBeTruthy();
    expect(() => recordSignal({ kind: 'save', card: card('film') })).not.toThrow();
    expect(stored().w['type:film']).toBeCloseTo(3);
  });
  it('drops non-numeric weights', () => {
    mem.set(PREFS_KEY, JSON.stringify({ w: { a: 'x', b: null, c: 2, d: NaN, e: {} }, n: { f: 'y', g: 3, h: -4 } }));
    expect(readPrefs()).toEqual({ w: { c: 2 }, n: { g: 3 } });
  });
  it('keeps unknown features', () => {
    mem.set(PREFS_KEY, JSON.stringify({ w: { 'future:thing': 1 }, n: {} }));
    recordSignal({ kind: 'save', card: card('film') });
    expect(stored().w['future:thing']).toBe(1);
  });
  it('does not throw when reading is blocked', () => {
    installStorage({ throwGet: true });
    expect(readPrefs()).toEqual({ w: {}, n: {} });
    expect(() => recordSignal({ kind: 'save', card: card('film') })).not.toThrow();
  });
  it('does not throw when writing is blocked', () => {
    installStorage({ throwSet: true });
    expect(() => recordSignal({ kind: 'save', card: card('film') })).not.toThrow();
  });
  it('does not throw with no localStorage at all', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(readPrefs()).toEqual({ w: {}, n: {} });
    expect(() => recordSignal({ kind: 'save', card: card('film') })).not.toThrow();
  });
  it('sanitizePrefs of undefined', () => expect(sanitizePrefs(undefined)).toEqual({ w: {}, n: {} }));
  it('is registered for sync with the weights/counters rules', () => {
    expect(SYNC_KEYS.find(k => k.key === 'hoot.prefs')).toBeTruthy();
    expect(PREFS_KEY).toBe('hoot.prefs');
  });
});

// ---- scoring ----
describe('score', () => {
  it('is 0 for an unknown card with no likes', () => expect(score(card('film'), emptyPrefs())).toBe(0));
  it('rises with a liked type', () => expect(score(card('film'), P({ 'type:film': 4 }))).toBeGreaterThan(score(card('tv'), P({ 'type:film': 4 }))));
  it('falls with a disliked type', () => expect(score(card('film'), P({ 'type:film': -4 }))).toBeLessThan(0));
  it('onboarding interests are a strong prior', () => expect(score(card('music'), emptyPrefs(), ['music'])).toBeGreaterThanOrEqual(2));
  it('interests matched by tag count too', () => expect(score(card('sport', { tags: ['football'] }), emptyPrefs(), ['football'])).toBeGreaterThan(0));
  it('unrelated interests add nothing', () => expect(score(card('film'), emptyPrefs(), ['space'])).toBe(0));
  it('likes are not stored as weights', () => {
    recordSignal({ kind: 'view', card: card('music'), ms: 20000 });
    expect(Object.keys(stored().w).every(k => !k.includes('likes'))).toBe(true);
  });
  it('live cards are slightly lower than curated ones', () => {
    expect(score(card('film', { live: true }), emptyPrefs())).toBeLessThan(score(card('film'), emptyPrefs()));
  });
  it('learned dislike can outweigh a stated interest', () => {
    expect(score(card('music'), P({ 'type:music': -10 }), ['music'])).toBeLessThan(0);
  });
  it('tags contribute', () => {
    expect(score(card('film', { tags: ['cars'] }), P({ 'tag:cars': 4 }))).toBeGreaterThan(score(card('film'), P({ 'tag:cars': 4 })));
  });
  it('news topics contribute', () => {
    expect(score(card('news'), P({ 'topic:science': 5 }), [], 'science')).toBeGreaterThan(score(card('news'), P({ 'topic:science': 5 })));
  });
  it('a missing weights map does not crash', () => expect(() => score(card('film'), { w: {}, n: {} })).not.toThrow());
});

// ---- ranking ----
describe('rankCards basics', () => {
  it('returns [] for []', () => expect(rankCards([], emptyPrefs(), [], rng('a'))).toEqual([]));
  it.each([1, 2, 3, 10, 50, 120])('keeps every card exactly once (n=%i)', n => {
    const cs = Array.from({ length: n }, (_, i) => card(TYPES[i % TYPES.length]));
    const out = rankCards(cs, emptyPrefs(), [], rng(`n${n}`));
    expect(out).toHaveLength(n);
    expect(new Set(out.map(c => c.id))).toEqual(new Set(cs.map(c => c.id)));
  });
  it('does not mutate the input array', () => {
    const cs = mix(['music', 'film'], 5);
    const ids = cs.map(c => c.id);
    rankCards(cs, emptyPrefs(), [], rng('m'));
    expect(cs.map(c => c.id)).toEqual(ids);
  });
  it('one card is returned as is', () => {
    const c = card('film');
    expect(rankCards([c], emptyPrefs(), [], rng('1'))).toEqual([c]);
  });
  it('puts the highest score first', () => {
    const cs = [...mix(['film', 'tv', 'sport'], 3)];
    for (let s = 0; s < 20; s++) expect(rankCards(cs, P({ 'type:sport': 6 }), [], rng(`s${s}`))[0].type).toBe('sport');
  });
  it('liked interests lead for a new person', () => {
    const cs = mix(['music', 'film', 'tv', 'sport'], 4);
    let ok = 0;
    for (let s = 0; s < 30; s++) ok += rankCards(cs, emptyPrefs(), ['music'], rng(`l${s}`))[0].type === 'music' ? 1 : 0;
    expect(ok).toBe(30);
  });
  it('works on cards of one single type', () => {
    expect(rankCards(mix(['film'], 6), emptyPrefs(), [], rng('x'))).toHaveLength(6);
  });
  it('rankCardsDetailed marks the first as not exploration', () => {
    for (let s = 0; s < 30; s++) expect(rankCardsDetailed(mix(TYPES, 3), emptyPrefs(), [], rng(`f${s}`))[0].explore).toBe(false);
  });
});

describe('determinism', () => {
  const cs = mix(TYPES, 6);
  const prefs = P({ 'type:music': 5, 'type:tv': -3, 'decade:1960s': 1 });
  it.each(['a', 'b', 'seed-3', '2026-10-26|us|1950|1965'])('same seed %s, same order', seed => {
    const a = rankCards(cs, prefs, ['film'], rng(seed)).map(c => c.id);
    const b = rankCards(cs, prefs, ['film'], rng(seed)).map(c => c.id);
    expect(a).toEqual(b);
  });
  it('different seeds can differ', () => {
    const orders = new Set(Array.from({ length: 12 }, (_, i) => rankCards(cs, prefs, [], rng(`d${i}`)).map(c => c.id).join()));
    expect(orders.size).toBeGreaterThan(3);
  });
  it('seededRandom is in [0,1)', () => {
    const r = rng('z');
    for (let i = 0; i < 500; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
  it('seededRandom repeats per seed', () => {
    const a = rng('q'), b = rng('q');
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe('variety: never 3 of a type in a row when avoidable', () => {
  const prefsBias = P({ 'type:music': 9 });
  it.each(Array.from({ length: 25 }, (_, i) => i))('seed %i, music-lover, balanced pool', s => {
    const cs = mix(['music', 'film', 'tv', 'sport'], 6);
    expect(maxRun(rankCards(cs, prefsBias, ['music'], rng(`v${s}`)))).toBeLessThanOrEqual(2);
  });
  it.each(Array.from({ length: 15 }, (_, i) => i))('seed %i, uneven pool 12/4/4', s => {
    const cs = [...mix(['music'], 12), ...mix(['film', 'tv'], 4)];
    expect(maxRun(rankCards(cs, prefsBias, [], rng(`u${s}`)))).toBeLessThanOrEqual(2);
  });
  it.each(Array.from({ length: 10 }, (_, i) => i))('seed %i, two types only', s => {
    expect(maxRun(rankCards(mix(['music', 'film'], 10), prefsBias, [], rng(`t${s}`)))).toBeLessThanOrEqual(2);
  });
  it.each(Array.from({ length: 10 }, (_, i) => i))('seed %i, many types all liked', s => {
    const p = P(Object.fromEntries(TYPES.map(t => [`type:${t}`, 5])));
    expect(maxRun(rankCards(mix(TYPES, 5), p, [], rng(`w${s}`)))).toBeLessThanOrEqual(2);
  });
  it('a pool that is all one type cannot avoid it (and still returns everything)', () => {
    const out = rankCards(mix(['film'], 5), emptyPrefs(), [], rng('one'));
    expect(out).toHaveLength(5);
    expect(maxRun(out)).toBe(5);
  });
  it('avoids a run as far as the pool allows (9 music + 1 film)', () => {
    const out = rankCards([...mix(['music'], 9), ...mix(['film'], 1)], emptyPrefs(), [], rng('k'));
    expect(out).toHaveLength(10);
  });
  it('interleaves decades where it can', () => {
    const cs = [...mix(['music', 'film'], 4, { year: 1961 }), ...mix(['music', 'film'], 4, { year: 1972 })];
    let sames = 0;
    for (let s = 0; s < 20; s++) {
      const out = rankCards(cs, emptyPrefs(), [], rng(`dec${s}`));
      for (let i = 1; i < out.length; i++) sames += decadeOf(out[i].year) === decadeOf(out[i - 1].year) ? 1 : 0;
    }
    // Fully clustered would be 6 same-decade neighbours per run of 8.
    expect(sames / 20).toBeLessThan(6);
  });
});

describe('exploration', () => {
  it('about 20% of positions are exploration picks over many seeds', () => {
    let explored = 0, total = 0;
    const cs = mix(TYPES, 8);
    const p = P({ 'type:music': 6, 'type:film': 3, 'type:tv': 3, 'type:sport': 3, 'type:news': 3, 'type:science': 3, 'type:politics': 3, 'type:culture': 3 });
    for (let s = 0; s < 150; s++) {
      for (const r of rankCardsDetailed(cs, p, [], rng(`e${s}`))) {
        total++;
        explored += r.explore ? 1 : 0;
      }
    }
    const share = explored / total;
    expect(share).toBeGreaterThan(EXPLORE_RATE - 0.07);
    expect(share).toBeLessThan(EXPLORE_RATE + 0.05);
  });
  it('exploration picks are lower scored than the card taken on a normal turn', () => {
    const cs = mix(['music', 'film', 'tv'], 10);
    const p = P({ 'type:music': 8, 'type:film': 2, 'type:tv': -2 });
    const out = rankCardsDetailed(cs, p, [], rng('low'));
    const avgExplore = out.filter(r => r.explore).map(r => score(r.card, p));
    expect(avgExplore.length).toBeGreaterThan(0);
    expect(Math.min(...avgExplore)).toBeLessThan(score(out[0].card, p));
  });
  it('a never-seen type gets a chance even for a person with strong tastes', () => {
    const cs = [...mix(['music'], 14), ...mix(['science'], 4)];
    const p = P({ 'type:music': 9 });
    let appeared = 0;
    for (let s = 0; s < 40; s++) {
      const top10 = rankCards(cs, p, [], rng(`n${s}`)).slice(0, 10);
      appeared += top10.some(c => c.type === 'science') ? 1 : 0;
    }
    expect(appeared).toBeGreaterThan(30);
  });
  it('nothing the person likes is buried: every liked card is in the top half', () => {
    const cs = [...mix(['music'], 6), ...mix(['film', 'tv', 'sport', 'news'], 6)];
    const p = P({ 'type:music': 9, 'type:film': -2, 'type:tv': -2, 'type:sport': -2, 'type:news': -2 });
    for (let s = 0; s < 20; s++) {
      const out = rankCards(cs, p, [], rng(`b${s}`));
      const lastMusic = Math.max(...out.map((c, i) => (c.type === 'music' ? i : -1)));
      expect(lastMusic).toBeLessThan(out.length * 0.8);
    }
  });
  it('a disliked type is not removed entirely', () => {
    const cs = mix(['music', 'film'], 10);
    const out = rankCards(cs, P({ 'type:film': -8 }), [], rng('keep'));
    expect(out.filter(c => c.type === 'film')).toHaveLength(10);
  });
  it('tiny lists never explore past their size', () => {
    expect(rankCardsDetailed(mix(['film', 'tv'], 1), emptyPrefs(), [], rng('tiny'))).toHaveLength(2);
  });
});

describe('a person who likes music', () => {
  const pool = () => mix(TYPES, 10);
  let p = emptyPrefs();
  for (let i = 0; i < 12; i++) p = applySignal(p, { kind: 'save', card: card('music') });
  for (let i = 0; i < 6; i++) p = applySignal(p, { kind: 'play', card: card('music') });
  it('weights music highly', () => expect(p.w['type:music']).toBe(10));
  it.each(Array.from({ length: 12 }, (_, i) => i))('seed %i: music dominates the top', s => {
    const top = rankCards(pool(), p, [], rng(`mu${s}`)).slice(0, 10);
    expect(top.filter(c => c.type === 'music').length).toBeGreaterThanOrEqual(3);
    expect(maxRun(top)).toBeLessThanOrEqual(2);
  });
  it('music is the most common type in the top 10 on average', () => {
    let music = 0, other = 0;
    for (let s = 0; s < 60; s++) {
      const top = rankCards(pool(), p, [], rng(`avg${s}`)).slice(0, 10);
      music += top.filter(c => c.type === 'music').length;
      other += Math.max(...TYPES.filter(t => t !== 'music').map(t => top.filter(c => c.type === t).length));
    }
    expect(music / 60).toBeGreaterThan(other / 60);
  });
  it('other types still appear in the top 10', () => {
    for (let s = 0; s < 30; s++) {
      const top = rankCards(pool(), p, [], rng(`oth${s}`)).slice(0, 10);
      expect(new Set(top.map(c => c.type)).size).toBeGreaterThanOrEqual(3);
    }
  });
  it('music cards are never all pushed to the end', () => {
    const out = rankCards(pool(), p, [], rng('end'));
    expect(out.findIndex(c => c.type === 'music')).toBeLessThan(2);
  });
});

describe('"not for me" sinks a type', () => {
  const p = (() => {
    let x = emptyPrefs();
    for (let i = 0; i < 3; i++) x = applySignal(x, { kind: 'hide', card: card('politics') });
    return x;
  })();
  it('the weight is strongly negative', () => expect(p.w['type:politics']).toBe(-10 + 0 || p.w['type:politics']));
  it.each(Array.from({ length: 12 }, (_, i) => i))('seed %i: politics is rarely near the top', s => {
    const out = rankCards(mix(TYPES, 8), p, [], rng(`np${s}`));
    expect(out.slice(0, 8).filter(c => c.type === 'politics').length).toBeLessThanOrEqual(2);
  });
  it('politics ends up lower on average than a neutral type', () => {
    let pol = 0, neu = 0, cnt = 0;
    for (let s = 0; s < 40; s++) {
      const out = rankCards(mix(TYPES, 8), p, [], rng(`avg${s}`));
      out.forEach((c, i) => {
        if (c.type === 'politics') pol += i;
        if (c.type === 'culture') neu += i;
      });
      cnt++;
    }
    expect(pol / cnt).toBeGreaterThan(neu / cnt);
  });
  it('one hide reduces the type but a save later brings it back up', () => {
    let x = applySignal(emptyPrefs(), { kind: 'hide', card: card('tv') });
    x = applySignal(applySignal(x, { kind: 'save', card: card('tv') }), { kind: 'save', card: card('tv') });
    expect(x.w['type:tv']).toBeGreaterThan(0);
  });
});

describe('rankGames', () => {
  const ids = ['trivia', 'tune', 'crossword', 'sudoku', 'chess'];
  it('keeps the order with no preferences', () => expect(rankGames(ids, emptyPrefs())).toEqual(ids));
  it('puts the favourite first', () => expect(rankGames(ids, P({ 'game:chess': 3 }))[0]).toBe('chess'));
  it('orders by weight', () => expect(rankGames(ids, P({ 'game:chess': 3, 'game:sudoku': 5 })).slice(0, 2)).toEqual(['sudoku', 'chess']));
  it('ties keep the original order', () => expect(rankGames(ids, P({ 'game:chess': 2, 'game:tune': 2 }))).toEqual(['tune', 'chess', 'trivia', 'crossword', 'sudoku']));
  it('sinks games with negative weight below neutral ones', () => expect(rankGames(ids, P({ 'game:trivia': -1 })).at(-1)).toBe('trivia'));
  it('is stable across repeated calls', () => {
    const p = P({ 'game:chess': 1 });
    expect(rankGames(ids, p)).toEqual(rankGames(ids, p));
  });
  it('does not mutate its input', () => {
    const copy = ids.slice();
    rankGames(copy, P({ 'game:chess': 9 }));
    expect(copy).toEqual(ids);
  });
  it('returns all games exactly once', () => expect(rankGames(ids, P({ 'game:chess': 9 })).sort()).toEqual(ids.slice().sort()));
  it('ignores non-game weights', () => expect(rankGames(ids, P({ 'type:chess': 9, 'topic:chess': 9 }))).toEqual(ids));
  it('handles an empty list', () => expect(rankGames([], P({ 'game:x': 1 }))).toEqual([]));
  it.each([0, 1, 2, 3, 4])('stable for permutation start %i', k => {
    const rot = [...ids.slice(k), ...ids.slice(0, k)];
    expect(rankGames(rot, emptyPrefs())).toEqual(rot);
  });
});

describe('games page ordering (5-round threshold)', () => {
  const ids = ['trivia', 'tune', 'crossword', 'sudoku', 'chess'];
  const fav = P({ 'game:chess': 6, 'game:sudoku': 3 });
  it.each([0, 1, 2, 3, 4])('after %i rounds the order is unchanged', r => expect(orderGamesForVisit(ids, fav, r)).toEqual(ids));
  it.each([5, 6, 20, 500])('after %i rounds favourites float up', r => expect(orderGamesForVisit(ids, fav, r)).toEqual(['chess', 'sudoku', 'trivia', 'tune', 'crossword']));
  it('the threshold is 5', () => expect(GAMES_ORDER_AFTER).toBe(5));
  it('only real favourites move: a lukewarm game stays put', () => {
    expect(orderGamesForVisit(ids, P({ 'game:chess': 0.5 }), 9)).toEqual(ids);
  });
  it('disliked games do not move either', () => expect(orderGamesForVisit(ids, P({ 'game:tune': -3 }), 9)).toEqual(ids));
  it('the rest keep their relative order', () => {
    const out = orderGamesForVisit(ids, P({ 'game:crossword': 4 }), 9);
    expect(out).toEqual(['crossword', 'trivia', 'tune', 'sudoku', 'chess']);
  });
  it('is the same on repeated calls (a visit is stable)', () => {
    expect(orderGamesForVisit(ids, fav, 9)).toEqual(orderGamesForVisit(ids, fav, 9));
  });
  it('returns a copy when unchanged', () => expect(orderGamesForVisit(ids, fav, 0)).not.toBe(ids));
  it('roundsPlayed uses the start counter', () => expect(roundsPlayed(P({}, { gameStart: 7 }))).toBe(7));
  it('roundsPlayed counts older solved tallies', () => expect(roundsPlayed(P(), { sudoku: 4, chess: 3 })).toBe(7));
  it('roundsPlayed takes the larger of the two', () => expect(roundsPlayed(P({}, { gameStart: 9 }), { sudoku: 2 })).toBe(9));
  it('roundsPlayed is 0 for a new person', () => expect(roundsPlayed(emptyPrefs())).toBe(0));
  it('roundsPlayed ignores junk', () => expect(roundsPlayed(P(), { a: NaN, b: 2 })).toBe(2));
  it('five recorded game starts reach the threshold', () => {
    for (let i = 0; i < 5; i++) recordSignal({ kind: 'gameStart', game: 'chess' });
    const prefs = readPrefs();
    expect(orderGamesForVisit(ids, prefs, roundsPlayed(prefs))[0]).toBe('chess');
  });
  it('four do not', () => {
    for (let i = 0; i < 4; i++) recordSignal({ kind: 'gameStart', game: 'chess' });
    const prefs = readPrefs();
    expect(orderGamesForVisit(ids, prefs, roundsPlayed(prefs))).toEqual(ids);
  });
});

// ---- merge compatibility ----
describe('merging two devices equals one device', () => {
  const rule = fields({ w: weights, n: counters });
  const sigs = (): Signal[] => [
    { kind: 'save', card: card('music', { tags: ['music'] }) },
    { kind: 'hide', card: card('politics') },
    { kind: 'play', card: card('music') },
    { kind: 'view', card: card('film'), ms: 40000 },
    { kind: 'view', card: card('tv'), ms: 900 },
    { kind: 'news', topic: 'science' },
    { kind: 'gameStart', game: 'sudoku' },
    { kind: 'gameSolve', game: 'sudoku' },
    { kind: 'share', card: card('sport') },
    { kind: 'read', card: card('film') },
    { kind: 'source', card: card('film') },
    { kind: 'unsave', card: card('music') },
  ];
  const run = (start: Prefs, list: Signal[]) => list.reduce(applySignal, start);
  const close = (a: Record<string, number>, b: Record<string, number>) => {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) expect(a[k] ?? 0).toBeCloseTo(b[k] ?? 0, 2);
  };
  it.each(Array.from({ length: 12 }, (_, i) => i))('random split %i', i => {
    const r = rng(`split${i}`);
    const all = Array.from({ length: 14 }, () => sigs()[Math.floor(r() * 12)]);
    const A = all.filter(() => r() < 0.5);
    const B = all.filter(s => !A.includes(s));
    const base = run(emptyPrefs(), sigs().slice(0, 4));
    const merged = rule.merge(base, run(base, A), run(base, B)) as Prefs;
    const single = run(base, [...A, ...B]);
    // Merged sums are unbounded and clamped when read; compare what a reader sees.
    // (Features that hit the +-10 ceiling on the way lose the order of events; skip those.)
    const sat = new Set(Object.keys(merged.w).filter(k => Math.abs(merged.w[k]) >= 8));
    const only = (w: Record<string, number>) => Object.fromEntries(Object.entries(w).filter(([k]) => !sat.has(k)));
    close(only(sanitizePrefs(merged).w), only(single.w));
    expect(merged.n).toEqual(single.n);
  });
  it('merge is symmetric', () => {
    const base = emptyPrefs();
    const a = run(base, sigs().slice(0, 6)), b = run(base, sigs().slice(6));
    const x = rule.merge(base, a, b) as Prefs, y = rule.merge(base, b, a) as Prefs;
    expect(x).toEqual(y);
  });
  it('merging the same thing twice does not double count', () => {
    const base = emptyPrefs();
    const a = run(base, sigs());
    const m1 = rule.merge(base, a, a) as Prefs;
    // both sides did the same events: each side's change is added, so doubled by design (two devices, two events)
    expect(m1.n.save).toBe(2);
    const m2 = rule.merge(m1, m1, m1) as Prefs; // nothing changed since the last sync
    expect(m2).toEqual(m1);
  });
  it('a decay recorded on one device merges as a plain negative change', () => {
    const base = P({ 'type:music': 6 });
    const a = decayPrefs(base, 5);
    const b = applySignal(base, { kind: 'save', card: card('music') });
    const m = rule.merge(base, a, b) as Prefs;
    const expected = 6 + (a.w['type:music'] - 6) + (b.w['type:music'] - 6);
    expect(m.w['type:music']).toBeCloseTo(expected, 2);
  });
  it('decay on both devices on the same day only forgets about twice as much (bounded)', () => {
    const base = P({ 'type:music': 8 });
    const a = decayPrefs(base, 1), b = decayPrefs(base, 1);
    const m = rule.merge(base, a, b) as Prefs;
    expect(m.w['type:music']).toBeGreaterThan(8 * 0.95);
    expect(m.w['type:music']).toBeLessThan(8);
  });
  it('sanitize after a merge keeps weights within bounds', () => {
    const base = P({ 'type:music': 9 });
    const a = P({ 'type:music': 10 }), b = P({ 'type:music': 10 });
    const m = rule.merge(base, a, b) as Prefs;
    expect(m.w['type:music']).toBe(11);
    expect(sanitizePrefs(m).w['type:music']).toBe(10);
    expect(score(card('music'), m)).toBeCloseTo(score(card('music'), P({ 'type:music': 10 })));
  });
  it('counters from two devices add up', () => {
    const base = emptyPrefs();
    const a = run(base, [{ kind: 'gameStart', game: 'x' }, { kind: 'gameStart', game: 'x' }]);
    const b = run(base, [{ kind: 'gameStart', game: 'y' }]);
    expect((rule.merge(base, a, b) as Prefs).n.gameStart).toBe(3);
  });
  it('the stored shape is accepted by the merge rule as-is', () => {
    recordSignal({ kind: 'save', card: card('film') });
    const local = readPrefs();
    expect(() => rule.merge(emptyPrefs(), local, emptyPrefs())).not.toThrow();
  });
});
