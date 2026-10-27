// The preference engine: "show me more of what I like", learned quietly from
// what the person does. No account needed; it syncs with the rest of their
// progress (see sync/keys.ts: 'hoot.prefs' merges `w` by adding each side's
// change and `n` as grow-only counters).
//
// STORAGE (fixed contract): localStorage 'hoot.prefs' = { w: {feature: number}, n: {event: number} }
//   w  learned weights, any real numbers, clamped to [-10, 10] when we write.
//   n  event counters (only grow).
// Nothing else is stored in that key. The only extra state is the day of the
// last "forgetting" step, kept in a device-local key ('hoot.prefs.decay') that
// is NOT synced.
//
// Everything above the "storage" section is pure and unit-tested.

import { cardMatchesLikes, type Card } from './data';

export interface Prefs {
  w: Record<string, number>;
  n: Record<string, number>;
}

export const PREFS_KEY = 'hoot.prefs';
export const DECAY_KEY = 'hoot.prefs.decay';

// ---- tuning ----------------------------------------------------------------

/**
 * How much each signal moves the weights of the card's features, before the
 * per-feature share below. Positive = "more like this".
 */
export const SIGNAL_WEIGHTS = {
  save: 3, //            saving is the clearest "yes"
  unsave: -1, //         changing their mind is a mild "no" (the save was already counted)
  hide: -4, //           "Not for me" is the clearest "no"
  play: 2, //            pressed play on a song/clip
  read: 1.5, //          had it read aloud
  share: 2, //           sent it to someone
  source: 1, //          opened the Source link to read more
  dwell12: 1, //         stayed on a card 12 s or more
  dwell30: 1.5, //       stayed 30 s or more (replaces the 12 s bonus, not added to it)
  skip: -0.7, //         pressed Next within 3 s
  news: 1, //            opened a news story (on its topic)
  gameStart: 1, //       started a round of a game
  gameSolve: 1.5, //     solved a round (on top of the start)
} as const;

export const DWELL_MS = { skip: 3000, read: 12000, long: 30000, away: 5 * 60_000 } as const;

/** Share of a signal that lands on each kind of feature of a card. */
export const FEATURE_SHARE = { type: 1, tag: 0.5, decade: 0.3, src: 0.2, topic: 1, game: 1 } as const;
const MAX_TAGS = 4;

export const WEIGHT_LIMIT = 10;
/** Forgetting: each day of use, weights fade by 2% (applied at most once per calendar day). */
export const DAILY_DECAY = 0.02;
export const MAX_DECAY_DAYS = 60;
/** Weights smaller than this are dropped (keeps the stored object small). */
export const EPSILON = 0.05;

/** The interests picked at onboarding: a strong prior at ranking time, never stored. */
export const LIKES_PRIOR = 2.5;
/** Hand-written memories edge out auto-pulled ones of equal interest. */
export const LIVE_PENALTY = 0.3;
/** Share of positions given to exploration (lower-scored or never-seen-type cards). */
export const EXPLORE_RATE = 0.2;
/** Games are re-ordered only once the person has played this many rounds. */
export const GAMES_ORDER_AFTER = 5;
/** A game must be at least this liked before it floats up the Games page. */
export const GAME_FAVOURITE_AT = 1;

// ---- features --------------------------------------------------------------

export const decadeOf = (year: number) => `${Math.floor(year / 10) * 10}s`;

/** Features of a memory card. `topic` is for cards that came from the News tab. */
export function cardFeatures(card: Card, topic?: string): string[] {
  const f = [`type:${card.type}`];
  for (const tag of (card.tags ?? []).slice(0, MAX_TAGS)) f.push(`tag:${tag}`);
  if (Number.isFinite(card.year)) f.push(`decade:${decadeOf(card.year)}`);
  f.push(`src:${card.live ? 'live' : 'curated'}`);
  const tp = topic ?? (card as Card & { topic?: string }).topic;
  if (tp) f.push(`topic:${tp}`);
  return f;
}

function share(feature: string): number {
  const kind = feature.slice(0, feature.indexOf(':')) as keyof typeof FEATURE_SHARE;
  return FEATURE_SHARE[kind] ?? 0;
}

// ---- signals ---------------------------------------------------------------

export type Signal =
  | { kind: 'save' | 'unsave' | 'hide' | 'play' | 'read' | 'share' | 'source'; card: Card }
  | { kind: 'view'; card: Card; ms: number } // time spent on a card when the person moved on
  | { kind: 'news'; topic: string }
  | { kind: 'gameStart' | 'gameSolve'; game: string };

/** The counter bumped for a signal (null = nothing happened worth counting). */
function counterFor(s: Signal): string | null {
  if (s.kind !== 'view') return s.kind;
  if (s.ms < DWELL_MS.skip) return 'skip';
  if (s.ms >= DWELL_MS.away) return null; // wandered off; says nothing about the card
  return s.ms >= DWELL_MS.read ? 'dwell' : null;
}

/** The weight changes (feature → delta) a signal causes. */
export function signalDeltas(s: Signal): Record<string, number> {
  const out: Record<string, number> = {};
  const add = (feature: string, amount: number) => {
    const d = amount * share(feature);
    if (d) out[feature] = (out[feature] ?? 0) + d;
  };
  if ('topic' in s) {
    if (s.topic) add(`topic:${s.topic}`, SIGNAL_WEIGHTS.news);
    return out;
  }
  if ('game' in s) {
    if (s.game) add(`game:${s.game}`, SIGNAL_WEIGHTS[s.kind]);
    return out;
  }
  // From here on the signal is about a card.
  let amount: number;
  if (s.kind === 'view') {
    if (s.ms < DWELL_MS.skip) amount = SIGNAL_WEIGHTS.skip;
    else if (s.ms >= DWELL_MS.away) amount = 0;
    else if (s.ms >= DWELL_MS.long) amount = SIGNAL_WEIGHTS.dwell30;
    else if (s.ms >= DWELL_MS.read) amount = SIGNAL_WEIGHTS.dwell12;
    else amount = 0;
  } else amount = SIGNAL_WEIGHTS[s.kind];
  if (!amount) return out;
  for (const f of cardFeatures(s.card)) add(f, amount);
  return out;
}

const clamp = (v: number) => Math.max(-WEIGHT_LIMIT, Math.min(WEIGHT_LIMIT, v));
const round3 = (v: number) => Math.round(v * 1000) / 1000;

/** Pure: prefs after one signal (no forgetting here; see decayPrefs). */
export function applySignal(prefs: Prefs, s: Signal): Prefs {
  const w = { ...prefs.w };
  const n = { ...prefs.n };
  for (const [f, d] of Object.entries(signalDeltas(s))) {
    const v = round3(clamp((w[f] ?? 0) + d));
    if (Math.abs(v) < 1e-9) delete w[f];
    else w[f] = v;
  }
  const c = counterFor(s);
  if (c) n[c] = (n[c] ?? 0) + 1;
  return { w, n };
}

/**
 * Pure: gentle forgetting. Every weight moves toward 0 by 1 - 0.98^days. It is
 * an explicit (negative or positive) change to the stored weight, so when two
 * devices are merged by adding their changes it stays consistent.
 */
export function decayPrefs(prefs: Prefs, days: number): Prefs {
  const d = Math.max(0, Math.min(MAX_DECAY_DAYS, Math.floor(days)));
  if (!d) return prefs;
  const keep = Math.pow(1 - DAILY_DECAY, d);
  const w: Record<string, number> = {};
  for (const [f, v] of Object.entries(prefs.w)) {
    const nv = round3(v * keep);
    if (Math.abs(nv) >= EPSILON) w[f] = nv;
  }
  return { w, n: prefs.n };
}

/** Whole calendar days from day-key a to b ("YYYY-MM-DD"); 0 if unreadable or b is earlier. */
export function daysBetween(a: string, b: string): number {
  const p = (k: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(k);
    return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) / 864e5 : NaN;
  };
  const d = p(b) - p(a);
  return Number.isFinite(d) && d > 0 ? Math.round(d) : 0;
}

export function dayKeyOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ---- reading / cleaning ----------------------------------------------------

export const emptyPrefs = (): Prefs => ({ w: {}, n: {} });

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Accept anything; keep only finite numbers. Never throws. */
export function sanitizePrefs(raw: unknown): Prefs {
  const out = emptyPrefs();
  if (!isObj(raw)) return out;
  if (isObj(raw.w)) for (const [k, v] of Object.entries(raw.w)) if (typeof v === 'number' && Number.isFinite(v)) out.w[k] = clamp(v);
  if (isObj(raw.n)) for (const [k, v] of Object.entries(raw.n)) if (typeof v === 'number' && Number.isFinite(v) && v >= 0) out.n[k] = v;
  return out;
}

// ---- scoring & ranking (pure) ---------------------------------------------

/** How much the person is expected to like a card. Higher = show sooner. */
export function score(card: Card, prefs: Prefs, likes: string[] = [], topic?: string): number {
  let s = 0;
  for (const f of cardFeatures(card, topic)) s += clamp(prefs.w[f] ?? 0) * share(f);
  if (likes.length && cardMatchesLikes(card, likes)) s += LIKES_PRIOR;
  if (card.live) s -= LIVE_PENALTY;
  return s;
}

export interface Ranked {
  card: Card;
  explore: boolean; // placed as an exploration pick
}

type Counts = Map<string, number>;

/** Can the remaining cards still be arranged with no type three times in a row? */
function feasible(counts: Counts, total: number, last: string | null, run: number): boolean {
  for (const [type, m] of counts) {
    if (m <= 0) continue;
    const others = total - m;
    const front = type === last ? Math.max(0, 2 - run) : 2;
    if (m > front + 2 * others) return false;
  }
  return true;
}

/**
 * Order cards for a person.
 *  1. Score every card (learned weights + onboarding interests), with a touch
 *     of seeded noise so equal scores don't always come out in the same order.
 *  2. Walk the positions; ~20% (never the first) are exploration picks: a
 *     lower-scored card, or one of a type the person has never reacted to. The
 *     rest take the best card left.
 *  3. Variety: never the same type three times running when that can be
 *     avoided, and prefer a different decade from the previous card.
 * Deterministic for a given `rnd`. Does not mutate its inputs.
 */
export function rankCardsDetailed(cards: Card[], prefs: Prefs, likes: string[], rnd: () => number): Ranked[] {
  const n = cards.length;
  if (!n) return [];
  const noisy = cards.map(c => score(c, prefs, likes) + (rnd() - 0.5) * 0.3);
  const pool = cards.map((_, i) => i).sort((a, b) => noisy[b] - noisy[a] || a - b);
  const counts: Counts = new Map();
  for (const c of cards) counts.set(c.type, (counts.get(c.type) ?? 0) + 1);
  const unseen = (c: Card) => prefs.w[`type:${c.type}`] === undefined;

  const out: Ranked[] = [];
  let last: string | null = null;
  let run = 0;
  for (let p = 0; p < n; p++) {
    const wantExplore = rnd() < EXPLORE_RATE && p > 0;
    const pick = rnd();
    const total = n - p;
    // Which pool entries may go next?
    const okCache = new Map<string, boolean>();
    const feasibleNext = (type: string) => {
      let ok = okCache.get(type);
      if (ok === undefined) {
        const nextRun = type === last ? run + 1 : 1;
        if (type === last && run >= 2) ok = false;
        else {
          counts.set(type, (counts.get(type) ?? 0) - 1);
          ok = feasible(counts, total - 1, type, nextRun);
          counts.set(type, (counts.get(type) ?? 0) + 1);
        }
        okCache.set(type, ok);
      }
      return ok;
    };
    let allowed = pool.map((_, pi) => pi).filter(pi => feasibleNext(cards[pool[pi]].type));
    if (!allowed.length) allowed = pool.map((_, pi) => pi).filter(pi => !(cards[pool[pi]].type === last && run >= 2));
    if (!allowed.length) allowed = pool.map((_, pi) => pi);

    let chosen = -1; // index into pool
    let explore = false;
    if (wantExplore) {
      const half = Math.ceil(pool.length / 2);
      const cands = allowed.filter(pi => pi >= half || unseen(cards[pool[pi]]));
      if (cands.length) {
        chosen = cands[Math.floor(pick * cands.length)];
        explore = true;
      }
    }
    if (chosen < 0) {
      const prevYear = out.length ? out[out.length - 1].card.year : null;
      const prevDecade = prevYear === null ? null : decadeOf(prevYear);
      chosen = allowed[0];
      for (const pi of allowed.slice(0, 4)) {
        if (prevDecade === null || decadeOf(cards[pool[pi]].year) !== prevDecade) {
          chosen = pi;
          break;
        }
      }
    }
    const card = cards[pool[chosen]];
    pool.splice(chosen, 1);
    counts.set(card.type, (counts.get(card.type) ?? 0) - 1);
    run = card.type === last ? run + 1 : 1;
    last = card.type;
    out.push({ card, explore });
  }
  return out;
}

export function rankCards(cards: Card[], prefs: Prefs, likes: string[], rnd: () => number): Card[] {
  return rankCardsDetailed(cards, prefs, likes, rnd).map(r => r.card);
}

/** Games ordered by how much the person plays them. Stable: ties keep the original order. */
export function rankGames(gameIds: string[], prefs: Prefs): string[] {
  return gameIds
    .map((id, i) => ({ id, i, s: clamp(prefs.w[`game:${id}`] ?? 0) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .map(x => x.id);
}

/** Rounds played in total: our own counter, or the solved tallies if that is higher (older accounts). */
export function roundsPlayed(prefs: Prefs, solvedByGame: Record<string, number> = {}): number {
  const solved = Object.values(solvedByGame).reduce((a, v) => a + (Number.isFinite(v) ? v : 0), 0);
  return Math.max(prefs.n.gameStart ?? 0, solved);
}

/**
 * The order of the Games page for one visit. Before 5 rounds: as is. After:
 * only the favourites (weight >= 1) float to the top, best first; everything
 * else stays exactly where it was, so the page stays calm.
 */
export function orderGamesForVisit(gameIds: string[], prefs: Prefs, rounds: number): string[] {
  if (rounds < GAMES_ORDER_AFTER) return gameIds.slice();
  const ranked = rankGames(gameIds, prefs);
  const favs = ranked.filter(id => (prefs.w[`game:${id}`] ?? 0) >= GAME_FAVOURITE_AT);
  const favSet = new Set(favs);
  return [...favs, ...gameIds.filter(id => !favSet.has(id))];
}

// ---- storage (thin, never throws) -------------------------------------------

export function readPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? sanitizePrefs(JSON.parse(raw)) : emptyPrefs();
  } catch {
    return emptyPrefs();
  }
}

export function writePrefs(p: Prefs): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ w: p.w, n: p.n }));
  } catch {
    /* storage unavailable: the app works the same, just without learning */
  }
}

function readDecayDay(): string {
  try {
    return localStorage.getItem(DECAY_KEY) ?? '';
  } catch {
    return '';
  }
}
function writeDecayDay(day: string) {
  try {
    localStorage.setItem(DECAY_KEY, day);
  } catch {
    /* ignore */
  }
}

/**
 * Record what the person did. The first signal of a calendar day also applies
 * the day's (or several days') forgetting, once.
 */
export function recordSignal(signal: Signal, now: Date = new Date()): Prefs {
  try {
    let prefs = readPrefs();
    const today = dayKeyOf(now);
    const last = readDecayDay();
    if (last !== today) {
      if (last) prefs = decayPrefs(prefs, daysBetween(last, today));
      writeDecayDay(today);
    }
    prefs = applySignal(prefs, signal);
    writePrefs(prefs);
    return prefs;
  } catch {
    return emptyPrefs();
  }
}

/** Seeded random for day-stable orders. */
export function seededRandom(seed: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
