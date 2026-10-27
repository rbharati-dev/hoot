// How each piece of a person's progress is merged when two copies meet
// (this device and their account, or two devices).
//
// Every merge is a THREE-WAY merge: `base` is the value both sides last
// agreed on (what this device last synced), `local` is this device now,
// `remote` is the account now. Using the base lets deletions travel (an
// unsaved memory stays unsaved) and stops counts from being added twice.
//
// The rules are chosen so that merging is safe to repeat and order doesn't
// matter: two devices that sync in any order end up with the same data.
//
// Pure functions only: no storage, no network. Heavily unit-tested.

export type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

export interface Rule {
  merge(base: unknown, local: unknown, remote: unknown): unknown;
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Last change wins, decided by the side that actually changed since the base.
 * When both changed, the account (remote) wins: it is the shared copy.
 */
export const lastChange: Rule = {
  merge(base, local, remote) {
    const localChanged = !same(local, base);
    const remoteChanged = !same(remote, base);
    if (localChanged && !remoteChanged) return local;
    if (remoteChanged) return remote ?? local; // never replace something with nothing
    return local;
  },
};

/** Once true, stays true (e.g. "has seen the tutorial"). */
export const anyTrue: Rule = {
  merge: (_b, l, r) => l === true || r === true,
};

/**
 * A set of ids (hidden memories, bad videos). Additions and removals made on
 * either side since the base both survive.
 */
export const idSet: Rule = {
  merge(base, local, remote) {
    const b = new Set(asStrings(base)), l = asStrings(local), r = asStrings(remote);
    const ls = new Set(l), rs = new Set(r);
    const removed = new Set([...b].filter(x => !ls.has(x) || !rs.has(x)));
    const out: string[] = [];
    const seen = new Set<string>();
    // New items from this device first, then the account's order: both
    // devices converge on the same order.
    for (const x of [...l.filter(x => !rs.has(x)), ...r]) if (!seen.has(x) && !removed.has(x)) (seen.add(x), out.push(x));
    return out;
  },
};
const asStrings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

/**
 * A list of objects with an `id` (saved memories), newest first. Same
 * add/remove logic as idSet; when both sides hold the same id, the local copy
 * is kept (identical content in practice).
 */
export const idList: Rule = {
  merge(base, local, remote) {
    const items = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is { id: string } => isObj(x) && typeof x.id === 'string') : []);
    const b = new Set(items(base).map(x => x.id));
    const l = items(local), r = items(remote);
    const ls = new Set(l.map(x => x.id)), rs = new Set(r.map(x => x.id));
    const removed = new Set([...b].filter(x => !ls.has(x) || !rs.has(x)));
    const out: { id: string }[] = [];
    const seen = new Set<string>();
    const lById = new Map(l.map(x => [x.id, x]));
    for (const x of [...l.filter(x => !rs.has(x.id)), ...r.map(x => lById.get(x.id) ?? x)]) if (!seen.has(x.id) && !removed.has(x.id)) (seen.add(x.id), out.push(x));
    return out;
  },
};

/**
 * Counters that only grow ({ sudoku: 12 }). Each side's growth since the base
 * is added, so a game solved on the phone and one on the tablet both count,
 * and syncing twice doesn't double them.
 */
export const counters: Rule = {
  merge(base, local, remote) {
    const b = isObj(base) ? base : {}, l = isObj(local) ? local : {}, r = isObj(remote) ? remote : {};
    const out: Record<string, number> = {};
    for (const k of new Set([...Object.keys(l), ...Object.keys(r)])) {
      const bv = num(b[k]), lv = num(l[k]), rv = num(r[k]);
      out[k] = Math.max(lv, rv, bv + Math.max(0, lv - bv) + Math.max(0, rv - bv));
    }
    return out;
  },
};
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

/**
 * Personal bests: for each game keep the better value. Lower is better for
 * the keys listed in `lower` (times), higher for everything else (scores).
 */
export const bests = (lower: string[]): Rule => ({
  merge(_base, local, remote) {
    const l = isObj(local) ? local : {}, r = isObj(remote) ? remote : {};
    const out: Record<string, number> = {};
    for (const k of new Set([...Object.keys(l), ...Object.keys(r)])) {
      const a = l[k], c = r[k];
      const vals = [a, c].filter((x): x is number => typeof x === 'number' && Number.isFinite(x));
      if (vals.length) out[k] = lower.includes(k) ? Math.min(...vals) : Math.max(...vals);
    }
    return out;
  },
});

/**
 * The day-by-day activity log: per day, per game, rounds started and solved
 * are counters (growth on each side is added); "finished Today's five" is
 * true if it was on either side.
 */
export const activityLog: Rule = {
  merge(base, local, remote) {
    const b = isObj(base) ? base : {}, l = isObj(local) ? local : {}, r = isObj(remote) ? remote : {};
    const out: Record<string, unknown> = {};
    for (const day of new Set([...Object.keys(l), ...Object.keys(r)])) {
      const bd = dayOf(b[day]), ld = dayOf(l[day]), rd = dayOf(r[day]);
      const games: Record<string, { started: number; solved: number }> = {};
      for (const g of new Set([...Object.keys(ld.games), ...Object.keys(rd.games)])) {
        const pick = (d: typeof bd, f: 'started' | 'solved') => num(d.games[g]?.[f]);
        const field = (f: 'started' | 'solved') => {
          const bv = pick(bd, f), lv = pick(ld, f), rv = pick(rd, f);
          return Math.max(lv, rv, bv + Math.max(0, lv - bv) + Math.max(0, rv - bv));
        };
        games[g] = { started: field('started'), solved: field('solved') };
        if (games[g].started < games[g].solved) games[g].started = games[g].solved;
      }
      out[day] = ld.five || rd.five ? { games, five: true } : { games };
    }
    return out;
  },
};
function dayOf(v: unknown): { games: Record<string, { started?: number; solved?: number }>; five: boolean } {
  if (!isObj(v)) return { games: {}, five: false };
  return { games: isObj(v.games) ? (v.games as Record<string, { started?: number; solved?: number }>) : {}, five: v.five === true };
}

/** The visit streak: the side with the later last-visit wins; best is the larger. */
export const streak: Rule = {
  merge(_b, local, remote) {
    const s = (v: unknown) => (isObj(v) ? { last: typeof v.last === 'string' ? v.last : '', count: num(v.count), best: num(v.best) } : { last: '', count: 0, best: 0 });
    const l = s(local), r = s(remote);
    const win = l.last > r.last ? l : r.last > l.last ? r : l.count >= r.count ? l : r;
    return { ...win, best: Math.max(l.best, r.best, win.count) };
  },
};

/** Hoot Plus: the earliest trial start (a trial is used once), the latest paid date. */
export const plusState: Rule = {
  merge(_b, local, remote) {
    const l = isObj(local) ? local : {}, r = isObj(remote) ? remote : {};
    const dates = (k: string) => [l[k], r[k]].filter((x): x is string => typeof x === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(x)).sort();
    const out: Record<string, string> = {};
    const t = dates('trialStart'), p = dates('paidUntil');
    if (t.length) out.trialStart = t[0];
    if (p.length) out.paidUntil = p[p.length - 1];
    return out;
  },
};

/** Recently used words: both sides' words, this device's order first, capped. */
export const recentList = (cap: number): Rule => ({
  merge(_b, local, remote) {
    const out: string[] = [];
    const r = asStrings(remote), rs = new Set(r);
    for (const w of [...asStrings(local).filter(w => !rs.has(w)), ...r]) if (!out.includes(w)) out.push(w);
    return out.slice(0, cap);
  },
});

/**
 * Learned preferences: a map of feature → weight. Each side's change since
 * the base is added (like counters, but weights can go down too).
 */
export const weights: Rule = {
  merge(base, local, remote) {
    const b = isObj(base) ? base : {}, l = isObj(local) ? local : {}, r = isObj(remote) ? remote : {};
    const out: Record<string, number> = {};
    for (const k of new Set([...Object.keys(b), ...Object.keys(l), ...Object.keys(r)])) {
      const v = num(b[k]) + (num(l[k]) - num(b[k])) + (num(r[k]) - num(b[k]));
      if (Math.abs(v) > 1e-6) out[k] = Math.round(v * 1000) / 1000;
    }
    return out;
  },
};

/** An object whose fields each follow their own rule (e.g. the preference model). */
export const fields = (rules: Record<string, Rule>, fallback: Rule = lastChange): Rule => ({
  merge(base, local, remote) {
    const b = isObj(base) ? base : {}, l = isObj(local) ? local : {}, r = isObj(remote) ? remote : {};
    const out: Record<string, unknown> = {};
    for (const k of new Set([...Object.keys(l), ...Object.keys(r)])) {
      const v = (rules[k] ?? fallback).merge(b[k], l[k], r[k]);
      if (v !== undefined) out[k] = v;
    }
    return out;
  },
});
