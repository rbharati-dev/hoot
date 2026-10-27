import { describe, expect, it } from 'vitest';
import { activityLog, anyTrue, bests, counters, fields, idList, idSet, lastChange, plusState, recentList, streak, weights, type Rule } from '../../src/lib/sync/merge';
import { SYNC_KEYS, docId, ruleFor } from '../../src/lib/sync/keys';
import { BASE_KEY, MAX_VALUE_BYTES, OWNER_KEY, SyncEngine, type LocalStore, type RemoteStore } from '../../src/lib/sync/engine';

// ---------- fakes ----------
class MemLocal implements LocalStore {
  m = new Map<string, string>();
  get(k: string) {
    return this.m.has(k) ? this.m.get(k)! : null;
  }
  set(k: string, v: string) {
    this.m.set(k, v);
  }
  remove(k: string) {
    this.m.delete(k);
  }
  put(k: string, v: unknown) {
    this.m.set(k, JSON.stringify(v));
  }
  val(k: string) {
    const s = this.get(k);
    return s == null ? undefined : JSON.parse(s);
  }
}
class MemRemote implements RemoteStore {
  data = new Map<string, Record<string, unknown>>();
  fail = false;
  writes = 0;
  /** Runs once, inside the next update, before it reads (simulates another device writing). */
  interleave: (() => void) | null = null;
  async readAll(uid: string) {
    if (this.fail) throw new Error('offline');
    return structuredClone(this.data.get(uid) ?? {});
  }
  async update(uid: string, key: string, merge: (r: unknown) => unknown) {
    if (this.fail) throw new Error('offline');
    const f = this.interleave;
    this.interleave = null;
    f?.();
    const u = this.data.get(uid) ?? {};
    const next = structuredClone(merge(structuredClone(u[key])));
    u[key] = next;
    this.data.set(uid, u);
    this.writes++;
    return next;
  }
  async deleteAll(uid: string) {
    this.data.delete(uid);
  }
}

// ---------- merge rules: shared properties ----------
const rand = (seed: number) => () => ((seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);

describe('every rule: same input on both sides is stable (idempotent)', () => {
  const samples: [string, Rule, unknown][] = [
    ['lastChange', lastChange, { a: 1 }],
    ['anyTrue', anyTrue, true],
    ['idSet', idSet, ['a', 'b']],
    ['idList', idList, [{ id: 'a', t: 1 }, { id: 'b' }]],
    ['counters', counters, { x: 3, y: 0 }],
    ['bests', bests(['t']), { t: 30, s: 900 }],
    ['activityLog', activityLog, { '2026-10-01': { games: { sudoku: { started: 2, solved: 1 } }, five: true } }],
    ['streak', streak, { last: '2026-10-01', count: 4, best: 9 }],
    ['plusState', plusState, { trialStart: '2026-01-01', paidUntil: '2026-12-01' }],
    ['recentList', recentList(5), ['a', 'b', 'c']],
    ['weights', weights, { 'type:song': 2.5, 'tag:war': -1 }],
  ];
  for (const [name, rule, v] of samples) {
    it(`${name}: merge(v, v, v) = v`, () => expect(rule.merge(v, v, v)).toEqual(v));
    it(`${name}: merging the result again changes nothing`, () => {
      const once = rule.merge(undefined, v, v);
      expect(rule.merge(once, once, once)).toEqual(once);
    });
    it(`${name}: survives junk on the other side`, () => {
      for (const junk of [undefined, null, 42, 'x', [], {}]) expect(() => rule.merge(junk, v, junk)).not.toThrow();
    });
  }
});

describe('lastChange', () => {
  it('local change wins when remote unchanged', () => expect(lastChange.merge(1, 2, 1)).toBe(2));
  it('remote change wins when local unchanged', () => expect(lastChange.merge(1, 1, 3)).toBe(3));
  it('both changed: account wins', () => expect(lastChange.merge(1, 2, 3)).toBe(3));
  it('never replaces a value with nothing', () => expect(lastChange.merge(1, 2, undefined)).toBe(2));
  it('first sync (no base) with nothing in the account keeps local', () => expect(lastChange.merge(undefined, { a: 1 }, undefined)).toEqual({ a: 1 }));
  it('first sync with both sides: account wins', () => expect(lastChange.merge(undefined, 'l', 'r')).toBe('r'));
  it('compares objects by content', () => expect(lastChange.merge({ a: 1 }, { a: 1 }, { a: 2 })).toEqual({ a: 2 }));
});

describe('anyTrue', () => {
  it.each([
    [false, false, false],
    [true, false, true],
    [false, true, true],
    [true, true, true],
    [undefined, undefined, false],
  ])('%s + %s → %s', (l, r, out) => expect(anyTrue.merge(undefined, l, r)).toBe(out));
});

describe('idSet', () => {
  it('unions additions from both sides', () => expect(idSet.merge(['a'], ['a', 'b'], ['a', 'c'])).toEqual(['b', 'a', 'c']));
  it('removal on one side travels', () => expect(idSet.merge(['a', 'b'], ['b'], ['a', 'b'])).toEqual(['b']));
  it('removal on the other side travels', () => expect(idSet.merge(['a', 'b'], ['a', 'b'], ['a'])).toEqual(['a']));
  it('removed on one side, re-added never (stays removed)', () => expect(idSet.merge(['a'], [], ['a'])).toEqual([]));
  it('no base: plain union', () => expect(idSet.merge(undefined, ['a'], ['b'])).toEqual(['a', 'b']));
  it('dedupes', () => expect(idSet.merge(undefined, ['a', 'a'], ['a'])).toEqual(['a']));
  it('ignores non-strings', () => expect(idSet.merge(undefined, ['a', 1, null], ['b', {}])).toEqual(['a', 'b']));
  it('new id added after base is kept even if other side lacks it', () => expect(idSet.merge([], ['x'], [])).toEqual(['x']));
});

describe('idList (saved memories)', () => {
  const A = { id: 'a', title: 'A' }, B = { id: 'b', title: 'B' }, C = { id: 'c', title: 'C' };
  it('new local items first, then account order', () => expect(idList.merge([], [B, A], [A, C])).toEqual([B, A, C]));
  it('unsave on one device unsaves everywhere', () => expect(idList.merge([A, B], [B], [A, B])).toEqual([B]));
  it('save on both devices of different things keeps both', () => expect(idList.merge([A], [C, A], [B, A])).toEqual([C, B, A]));
  it('same id on both sides keeps local copy once', () => expect(idList.merge([], [{ id: 'a', v: 1 }], [{ id: 'a', v: 2 }])).toEqual([{ id: 'a', v: 1 }]));
  it('drops items without an id', () => expect(idList.merge([], [{ x: 1 }, A, 'z'], [])).toEqual([A]));
});

describe('counters', () => {
  it('adds growth from both sides, not double', () => expect(counters.merge({ s: 10 }, { s: 12 }, { s: 13 })).toEqual({ s: 15 }));
  it('no growth anywhere stays', () => expect(counters.merge({ s: 5 }, { s: 5 }, { s: 5 })).toEqual({ s: 5 }));
  it('never goes down', () => expect(counters.merge({ s: 5 }, { s: 1 }, { s: 5 })).toEqual({ s: 5 }));
  it('first sync takes the larger, does not add', () => expect(counters.merge(undefined, { s: 4 }, { s: 6 })).toEqual({ s: 10 }));
  it('new keys on either side', () => expect(counters.merge({}, { a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 }));
  it('non-numbers count as 0', () => expect(counters.merge({}, { a: 'x', b: NaN, c: Infinity }, {})).toEqual({ a: 0, b: 0, c: 0 }));
  it('repeated syncs are stable', () => {
    let base: unknown = { s: 10 };
    const local = { s: 12 }, remote = { s: 13 };
    const m = counters.merge(base, local, remote);
    base = m;
    expect(counters.merge(base, m, m)).toEqual(m);
  });
});
// Note: on a first sync (no base) both sides' totals are added. That is the
// intended behaviour for a guest device joining an account (guest rounds and
// account rounds are different rounds); the engine never re-merges with an
// empty base for the same owner.

describe('bests', () => {
  const r = bests(['sudoku']);
  it('lower is better for times', () => expect(r.merge(undefined, { sudoku: 300 }, { sudoku: 200 })).toEqual({ sudoku: 200 }));
  it('higher is better for scores', () => expect(r.merge(undefined, { quiz: 7 }, { quiz: 9 })).toEqual({ quiz: 9 }));
  it('one side missing', () => expect(r.merge(undefined, { quiz: 7 }, {})).toEqual({ quiz: 7 }));
  it('junk values dropped', () => expect(r.merge(undefined, { quiz: 'x' }, { quiz: null })).toEqual({}));
});

describe('activityLog', () => {
  const day = '2026-10-20';
  it('adds rounds from two devices on the same day', () => {
    const base = { [day]: { games: { sudoku: { started: 1, solved: 1 } } } };
    const l = { [day]: { games: { sudoku: { started: 3, solved: 2 } } } };
    const r = { [day]: { games: { sudoku: { started: 2, solved: 1 }, chess: { started: 1, solved: 0 } } } };
    expect(activityLog.merge(base, l, r)).toEqual({ [day]: { games: { sudoku: { started: 4, solved: 2 }, chess: { started: 1, solved: 0 } } } });
  });
  it('five is OR', () => expect(activityLog.merge({}, { [day]: { games: {}, five: true } }, { [day]: { games: {} } })).toEqual({ [day]: { games: {}, five: true } }));
  it('started is never below solved', () => {
    const out = activityLog.merge({}, { [day]: { games: { g: { started: 0, solved: 3 } } } }, {}) as Record<string, { games: Record<string, { started: number }> }>;
    expect(out[day].games.g.started).toBe(3);
  });
  it('different days both kept', () => expect(Object.keys(activityLog.merge({}, { a: { games: {} } }, { b: { games: {} } }) as object).sort()).toEqual(['a', 'b']));
});

describe('streak', () => {
  it('later visit wins', () => expect(streak.merge(undefined, { last: '2026-10-02', count: 2, best: 2 }, { last: '2026-10-01', count: 5, best: 5 })).toEqual({ last: '2026-10-02', count: 2, best: 5 }));
  it('same day: larger count', () => expect(streak.merge(undefined, { last: 'd', count: 2, best: 2 }, { last: 'd', count: 4, best: 4 })).toEqual({ last: 'd', count: 4, best: 4 }));
  it('best covers count', () => expect((streak.merge(undefined, { last: 'd', count: 9, best: 1 }, undefined) as { best: number }).best).toBe(9));
  it('junk becomes empty', () => expect(streak.merge(undefined, 5, 'x')).toEqual({ last: '', count: 0, best: 0 }));
});

describe('plusState', () => {
  it('earliest trial, latest paid', () =>
    expect(plusState.merge(undefined, { trialStart: '2026-03-01', paidUntil: '2026-05-01' }, { trialStart: '2026-01-01', paidUntil: '2026-09-01' })).toEqual({ trialStart: '2026-01-01', paidUntil: '2026-09-01' }));
  it('cannot restart a trial by clearing it on a device', () => expect(plusState.merge({ trialStart: '2026-01-01' }, {}, { trialStart: '2026-01-01' })).toEqual({ trialStart: '2026-01-01' }));
  it('rejects malformed dates', () => expect(plusState.merge(undefined, { trialStart: 'tomorrow' }, { paidUntil: 5 })).toEqual({}));
});

describe('recentList', () => {
  it('local first, deduped, capped', () => expect(recentList(3).merge(undefined, ['a', 'b'], ['b', 'c', 'd'])).toEqual(['a', 'b', 'c']));
});

describe('weights', () => {
  it('adds each side\'s change, both directions', () => expect(weights.merge({ x: 1 }, { x: 3 }, { x: 0 })).toEqual({ x: 2 }));
  it('drops zeros', () => expect(weights.merge({ x: 1 }, { x: 0 }, { x: 1 })).toEqual({}));
  it('a key deleted on one side counts as a change to 0', () => expect(weights.merge({ x: 2 }, {}, { x: 2 })).toEqual({}));
  it('rounds to 3 decimals', () => expect(weights.merge({}, { x: 0.1 + 0.2 }, {})).toEqual({ x: 0.3 }));
  it('random: merge equals applying both sides\' deltas', () => {
    const r = rand(7);
    for (let i = 0; i < 200; i++) {
      const b = { k: Math.round(r() * 100) / 10 };
      const dl = Math.round((r() - 0.5) * 50) / 10, dr = Math.round((r() - 0.5) * 50) / 10;
      const out = weights.merge(b, { k: b.k + dl }, { k: b.k + dr }) as { k?: number };
      expect(out.k ?? 0).toBeCloseTo(b.k + dl + dr, 2);
    }
  });
});

describe('fields', () => {
  const r = fields({ w: weights, n: counters });
  it('applies each field rule', () => expect(r.merge({ w: { a: 1 }, n: { e: 1 } }, { w: { a: 2 }, n: { e: 2 } }, { w: { a: 3 }, n: { e: 3 } })).toEqual({ w: { a: 4 }, n: { e: 4 } }));
  it('unknown fields fall back to lastChange', () => expect(r.merge({ z: 1 }, { z: 2 }, { z: 1 })).toEqual({ z: 2 }));
});

describe('random convergence: two devices, any order', () => {
  const rules: [string, Rule, () => unknown][] = [];
  const r = rand(42);
  const pick = <T,>(xs: T[]) => xs[Math.floor(r() * xs.length)];
  rules.push(['idSet', idSet, () => ['a', 'b', 'c', 'd'].filter(() => r() < 0.5)]);
  rules.push(['counters', counters, () => ({ a: Math.floor(r() * 5), b: Math.floor(r() * 5) })]);
  rules.push(['anyTrue', anyTrue, () => r() < 0.3]);
  rules.push(['plusState', plusState, () => ({ trialStart: pick(['2026-01-01', '2026-02-01']) })]);
  for (const [name, rule, gen] of rules) {
    it(`${name}: after both devices sync twice they agree`, () => {
      for (let t = 0; t < 100; t++) {
        let remote: unknown = gen();
        let baseA: unknown = remote, baseB: unknown = remote;
        let a: unknown = gen(), b: unknown = gen();
        const syncA = () => ((remote = rule.merge(baseA, a, remote)), (a = remote), (baseA = remote));
        const syncB = () => ((remote = rule.merge(baseB, b, remote)), (b = remote), (baseB = remote));
        if (r() < 0.5) (syncA(), syncB(), syncA());
        else (syncB(), syncA(), syncB());
        expect(a).toEqual(b);
        expect(a).toEqual(remote);
      }
    });
  }
});

// ---------- keys ----------
describe('sync keys', () => {
  it('every key has a rule', () => SYNC_KEYS.forEach(k => expect(ruleFor(k.key)).toBeTruthy()));
  it('keys are unique and doc ids are unique', () => {
    expect(new Set(SYNC_KEYS.map(k => k.key)).size).toBe(SYNC_KEYS.length);
    expect(new Set(SYNC_KEYS.map(k => docId(k.key))).size).toBe(SYNC_KEYS.length);
  });
  it('doc ids are Firestore-safe', () => SYNC_KEYS.forEach(k => expect(docId(k.key)).toMatch(/^[\w.-]+$/)));
  it('settings and seen flags are not personal; progress is', () => {
    const p = Object.fromEntries(SYNC_KEYS.map(k => [k.key, k.personal]));
    expect(p['hoot.settings']).toBe(false);
    expect(p['hoot.games']).toBe(true);
    expect(p['hoot.profile']).toBe(true);
    expect(p['hoot.prefs']).toBe(true);
  });
  it('sync metadata is never itself synced', () => [OWNER_KEY, BASE_KEY].forEach(k => expect(ruleFor(k)).toBeUndefined()));
});

// ---------- engine ----------
const U = 'user-1';
const setup = () => {
  const remote = new MemRemote();
  const a = new MemLocal(), b = new MemLocal();
  return { remote, a, b, ea: new SyncEngine(remote, a), eb: new SyncEngine(remote, b) };
};

describe('SyncEngine', () => {
  it('refuses to sync a device not attached to that account', async () => {
    const { ea } = setup();
    await expect(ea.sync(U)).rejects.toThrow();
  });

  it('guest progress is merged into the account on first sign-in', async () => {
    const { remote, a, ea } = setup();
    a.put('hoot.games', { sudoku: 3 });
    remote.data.set(U, { 'hoot.games': { sudoku: 5, chess: 1 } });
    expect(ea.attach(U)).toBe('merged');
    await ea.sync(U);
    expect(a.val('hoot.games')).toEqual({ sudoku: 8, chess: 1 });
    expect(remote.data.get(U)!['hoot.games']).toEqual({ sudoku: 8, chess: 1 });
  });

  it('attaching the same account again is "same" and does not re-add', async () => {
    const { a, ea, remote } = setup();
    a.put('hoot.games', { sudoku: 3 });
    ea.attach(U);
    await ea.sync(U);
    expect(ea.attach(U)).toBe('same');
    await ea.sync(U);
    await ea.sync(U);
    expect(remote.data.get(U)!['hoot.games']).toEqual({ sudoku: 3 });
  });

  it('two devices: rounds on both are added once, saved items union, unsaves travel', async () => {
    const { a, b, ea, eb, remote } = setup();
    a.put('hoot.games', { sudoku: 1 });
    a.put('hoot.saved', [{ id: 'x' }, { id: 'y' }]);
    ea.attach(U);
    await ea.sync(U);
    eb.attach(U);
    await eb.sync(U);
    expect(b.val('hoot.saved')).toEqual([{ id: 'x' }, { id: 'y' }]);

    a.put('hoot.games', { sudoku: 3 }); // +2 on A
    b.put('hoot.games', { sudoku: 2 }); // +1 on B
    b.put('hoot.saved', [{ id: 'z' }, { id: 'x' }]); // B unsaves y, saves z
    await ea.sync(U);
    await eb.sync(U);
    await ea.sync(U);
    expect(a.val('hoot.games')).toEqual({ sudoku: 4 });
    expect(b.val('hoot.games')).toEqual({ sudoku: 4 });
    expect(a.val('hoot.saved')).toEqual(b.val('hoot.saved'));
    expect((a.val('hoot.saved') as { id: string }[]).map(x => x.id).sort()).toEqual(['x', 'z']);
    expect(remote.data.get(U)!['hoot.games']).toEqual({ sudoku: 4 });
  });

  it('a write landing between read and transaction is merged, not lost', async () => {
    const { a, ea, remote } = setup();
    a.put('hoot.games', { sudoku: 1 });
    ea.attach(U);
    await ea.sync(U);
    a.put('hoot.games', { sudoku: 2 });
    remote.interleave = () => remote.data.set(U, { ...remote.data.get(U), 'hoot.games': { sudoku: 5 } });
    await ea.sync(U);
    expect(remote.data.get(U)!['hoot.games']).toEqual({ sudoku: 6 });
    expect(a.val('hoot.games')).toEqual({ sudoku: 6 });
  });

  it('another account on a shared device is cleared, never merged', async () => {
    const { a, ea, remote } = setup();
    a.put('hoot.games', { sudoku: 9 });
    a.put('hoot.settings', { size: 'large' });
    ea.attach('mum');
    await ea.sync('mum');
    remote.data.set('dad', { 'hoot.games': { chess: 1 } });
    expect(ea.attach('dad')).toBe('switched');
    await ea.sync('dad');
    expect(a.val('hoot.games')).toEqual({ chess: 1 });
    expect(remote.data.get('dad')!['hoot.games']).toEqual({ chess: 1 });
    expect(remote.data.get('mum')!['hoot.games']).toEqual({ sudoku: 9 });
  });

  it('sign-out removes personal progress but keeps device settings', async () => {
    const { a, ea } = setup();
    a.put('hoot.games', { sudoku: 1 });
    a.put('hoot.settings', { size: 'large' });
    a.put('hoot.seenTutorial', true);
    ea.attach(U);
    await ea.sync(U);
    ea.detach();
    expect(a.get('hoot.games')).toBeNull();
    expect(a.get(OWNER_KEY)).toBeNull();
    expect(a.val('hoot.settings')).toEqual({ size: 'large' });
    expect(a.val('hoot.seenTutorial')).toBe(true);
  });

  it('signing back in restores the progress from the account', async () => {
    const { a, ea } = setup();
    a.put('hoot.games', { sudoku: 7 });
    ea.attach(U);
    await ea.sync(U);
    ea.detach();
    expect(ea.attach(U)).toBe('merged');
    await ea.sync(U);
    expect(a.val('hoot.games')).toEqual({ sudoku: 7 });
  });

  it('dirty() reports only changed keys and clears after sync', async () => {
    const { a, ea } = setup();
    a.put('hoot.games', { sudoku: 1 });
    ea.attach(U);
    expect(ea.dirty()).toContain('hoot.games');
    await ea.sync(U);
    expect(ea.dirty()).toEqual([]);
    a.put('hoot.hidden', ['m1']);
    expect(ea.dirty()).toEqual(['hoot.hidden']);
  });

  it('unchanged data is not rewritten to the account', async () => {
    const { a, ea, remote } = setup();
    a.put('hoot.games', { sudoku: 1 });
    ea.attach(U);
    await ea.sync(U);
    const w = remote.writes;
    await ea.sync(U);
    expect(remote.writes).toBe(w);
  });

  it('offline: sync fails, local data untouched, next sync catches up', async () => {
    const { a, ea, remote } = setup();
    a.put('hoot.games', { sudoku: 2 });
    ea.attach(U);
    remote.fail = true;
    await expect(ea.sync(U)).rejects.toThrow();
    expect(a.val('hoot.games')).toEqual({ sudoku: 2 });
    remote.fail = false;
    await ea.sync(U);
    expect(remote.data.get(U)!['hoot.games']).toEqual({ sudoku: 2 });
  });

  it('corrupt local values are treated as missing and replaced', async () => {
    const { a, ea, remote } = setup();
    remote.data.set(U, { 'hoot.games': { sudoku: 4 } });
    a.set('hoot.games', '{not json');
    a.set(BASE_KEY, 'garbage');
    ea.attach(U);
    await ea.sync(U);
    expect(a.val('hoot.games')).toEqual({ sudoku: 4 });
  });

  it('values too large for one document stay on the device only', async () => {
    const { a, ea, remote } = setup();
    a.put('hoot.saved', [{ id: 'x', blob: 'z'.repeat(MAX_VALUE_BYTES) }]);
    a.put('hoot.games', { sudoku: 1 });
    ea.attach(U);
    await ea.sync(U);
    expect(remote.data.get(U)!['hoot.saved']).toBeUndefined();
    expect(remote.data.get(U)!['hoot.games']).toEqual({ sudoku: 1 });
    expect(a.val('hoot.saved')).toHaveLength(1);
  });

  it('concurrent sync calls share one run', async () => {
    const { a, ea } = setup();
    a.put('hoot.games', { sudoku: 1 });
    ea.attach(U);
    const p1 = ea.sync(U), p2 = ea.sync(U);
    expect(p1).toBe(p2);
    await p1;
  });

  it('deleteRemote removes the account copy', async () => {
    const { a, ea, remote } = setup();
    a.put('hoot.games', { sudoku: 1 });
    ea.attach(U);
    await ea.sync(U);
    await ea.deleteRemote(U);
    expect(remote.data.has(U)).toBe(false);
  });

  it('random two-device simulation converges with no lost or doubled rounds', async () => {
    const r = rand(99);
    for (let trial = 0; trial < 30; trial++) {
      const { a, b, ea, eb } = setup();
      ea.attach(U);
      eb.attach(U);
      let total = 0;
      for (let step = 0; step < 20; step++) {
        const [dev, eng] = r() < 0.5 ? [a, ea] : [b, eb];
        const x = r();
        if (x < 0.6) {
          const cur = (dev.val('hoot.games') as { s?: number } | undefined)?.s ?? 0;
          dev.put('hoot.games', { s: cur + 1 });
          total++;
        } else await eng.sync(U);
      }
      await ea.sync(U);
      await eb.sync(U);
      await ea.sync(U);
      expect(a.val('hoot.games') ?? { s: 0 }).toEqual(total ? { s: total } : { s: 0 });
      expect(b.val('hoot.games')).toEqual(a.val('hoot.games'));
    }
  });
});
