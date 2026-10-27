import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Card, Lang } from '../../src/lib/data';
import { memStorage } from './suite-b-helpers';

const NON_EN: Lang[] = ['ru', 'fr', 'de', 'it', 'pt', 'es', 'hi', 'ne'];
const LONG = ' est un article assez long pour dépasser le seuil de quarante caractères.';

interface Calls { langlinks: { host: string; n: number }[]; extracts: { host: string; n: number }[]; total: number }
let calls: Calls;
let storage: ReturnType<typeof memStorage>;

/** Fake Wikipedia. Titles starting "Has " exist in every language as "L:<lang>:<title>". */
function install(opts: { offline?: boolean; noExtract?: RegExp } = {}) {
  calls = { langlinks: [], extracts: [], total: 0 };
  storage = memStorage();
  vi.stubGlobal('localStorage', storage);
  vi.stubGlobal('fetch', async (url: string) => {
    calls.total++;
    if (opts.offline) throw new Error('offline');
    const u = new URL(url);
    const titles = (u.searchParams.get('titles') ?? '').split('|');
    const prop = u.searchParams.get('prop');
    const lll = u.searchParams.get('lllang');
    const lang = u.host.split('.')[0];
    let pages: object[];
    if (prop === 'langlinks') {
      calls.langlinks.push({ host: u.host, n: titles.length });
      pages = titles.map(t => (t.startsWith('Has ') ? { title: t, langlinks: [{ lang: lll, title: `L:${lll}:${t}` }] } : { title: t }));
    } else {
      calls.extracts.push({ host: u.host, n: titles.length });
      pages = titles.map(t => (opts.noExtract?.test(t) ? { title: t } : { title: t, extract: `${t}${LONG}` }));
    }
    void lang;
    return { ok: true, json: async () => ({ query: { pages } }) } as Response;
  });
}

const live = (over: Partial<Card> = {}): Card => ({ id: 'c1', year: 1970, type: 'news', title: 'English title (thing)', text: 'English text.', wiki: 'Has page', live: true, date: '3 May', ...over });
async function loc() {
  vi.resetModules();
  return (await import('../../src/lib/localize')).localizeCards;
}
beforeEach(() => install());
afterEach(() => vi.unstubAllGlobals());

describe.each(NON_EN)('localizeCards into %s', lang => {
  it('replaces a live card with the local article, relinks the source, removes the date', async () => {
    const f = await loc();
    const [c] = await f([live()], lang);
    expect(c.t?.[lang]?.title).toBe(`L:${lang}:Has page`);
    expect(c.t?.[lang]?.text).toContain('assez long');
    expect(c.host).toBe(`${lang}.wikipedia.org`);
    expect(c.wiki).toBe(`L:${lang}:Has page`);
    expect(c.date).toBeUndefined();
    expect(c.title).toBe('English title (thing)'); // original untouched
  });
  it('strips a trailing parenthetical qualifier from the local title', async () => {
    const f = await loc();
    const [c] = await f([live({ wiki: 'Has Mercury (planet)' })], lang);
    expect(c.t?.[lang]?.title).toBe(`L:${lang}:Has Mercury`);
  });
  it('keeps a hand-written translation but relinks the source', async () => {
    const f = await loc();
    const own = live({ live: undefined, date: undefined, t: { [lang]: { title: 'MINE', text: 'MINE TEXT' } } });
    const [c] = await f([own], lang);
    expect(c.t?.[lang]).toEqual({ title: 'MINE', text: 'MINE TEXT' });
    expect(c.host).toBe(`${lang}.wikipedia.org`);
  });
  it('hand-written translation with no local article stays and keeps its source', async () => {
    const f = await loc();
    const own = live({ wiki: 'Nothing here', t: { [lang]: { title: 'MINE', text: 'MINE TEXT' } } });
    const [c] = await f([own], lang);
    expect(c.t?.[lang]?.title).toBe('MINE');
    expect(c.host).toBeUndefined();
    expect(c.wiki).toBe('Nothing here');
  });
  it('drops live cards with no local article', async () => {
    const f = await loc();
    expect(await f([live({ wiki: 'Missing page' })], lang)).toEqual([]);
  });
  it('drops live cards whose local article has no intro text', async () => {
    install({ noExtract: /./ });
    const f = await loc();
    expect(await f([live()], lang)).toEqual([]);
  });
  it('keeps songs with an em dash instead of "by", even with no article', async () => {
    const f = await loc();
    const out = await f([live({ id: 's', type: 'music', title: '“Hey Jude” by The Beatles', wiki: 'Missing song', yt: 'abcdefghijk' }), live({ id: 's2', type: 'song', title: '“Yesterday” by The Beatles', wiki: 'Has Yesterday', yt: 'bbbbbbbbbbb' })], lang);
    expect(out.map(c => c.id)).toEqual(['s', 's2']);
    expect(out[0].t?.[lang]).toEqual({ title: '“Hey Jude” — The Beatles', text: '' });
    expect(out[0].yt).toBe('abcdefghijk');
    expect(out[0].date).toBeUndefined();
    expect(out[0].host).toBeUndefined();
    expect(out[1].t?.[lang]?.title).toBe('“Yesterday” — The Beatles');
    expect(out[1].t?.[lang]?.text).toContain('assez long');
    expect(out[1].host).toBe(`${lang}.wikipedia.org`);
  });
  it('a card already from the reader\'s Wikipedia is kept, minus date, with no lookup', async () => {
    const f = await loc();
    const [c] = await f([live({ host: `${lang}.wikipedia.org`, wiki: 'Local page' })], lang);
    expect(c.date).toBeUndefined();
    expect(c.wiki).toBe('Local page');
    expect(calls.total).toBe(0);
  });
  it('batches: 120 cards -> langlinks <= 50 titles, extracts <= 20 titles', async () => {
    const f = await loc();
    const cards = Array.from({ length: 120 }, (_, i) => live({ id: `k${i}`, wiki: `Has ${i}` }));
    const out = await f(cards, lang);
    expect(out.length).toBe(120);
    expect(calls.langlinks.map(c => c.n)).toEqual([50, 50, 20]);
    expect(calls.extracts.map(c => c.n)).toEqual([20, 20, 20, 20, 20, 20]);
    expect(calls.langlinks.every(c => c.host === 'en.wikipedia.org')).toBe(true);
    expect(calls.extracts.every(c => c.host === `${lang}.wikipedia.org`)).toBe(true);
  });
  it('memo: a second call makes no more requests', async () => {
    const f = await loc();
    const cards = [live(), live({ id: 'b', wiki: 'Missing page' })];
    await f(cards, lang);
    const n = calls.total;
    expect(n).toBeGreaterThan(0);
    const again = await f(cards, lang);
    expect(calls.total).toBe(n);
    expect(again.length).toBe(1);
    expect(storage.mem.has(`hoot.l10n.v1.${lang}`)).toBe(true);
  });
  it('memo persists in storage across module reloads', async () => {
    let f = await loc();
    await f([live(), live({ id: 'b', wiki: 'Missing page' })], lang);
    const n = calls.total;
    f = await loc();
    const out = await f([live(), live({ id: 'b', wiki: 'Missing page' })], lang);
    expect(calls.total).toBe(n);
    expect(out.length).toBe(1);
  });
  it('offline: no English live cards, but hand-written ones remain', async () => {
    install({ offline: true });
    const f = await loc();
    const own = live({ id: 'own', live: undefined, t: { [lang]: { title: 'T', text: 'X' } } });
    const out = await f([live(), own], lang);
    expect(out.map(c => c.id)).toEqual(['own']);
  });
  it('offline: songs are still kept without English text', async () => {
    install({ offline: true });
    const f = await loc();
    const out = await f([live({ type: 'music', title: '“A” by B', wiki: 'Has x', yt: 'abcdefghijk' })], lang);
    expect(out[0].t?.[lang]).toEqual({ title: '“A” — B', text: '' });
  });
  it('does not mutate input cards', async () => {
    const f = await loc();
    const c = Object.freeze(live({ t: undefined }));
    await expect(f([c], lang)).resolves.toBeTruthy();
    expect(c.date).toBe('3 May');
  });
  it('duplicate wiki titles are looked up once', async () => {
    const f = await loc();
    await f(Array.from({ length: 10 }, (_, i) => live({ id: `d${i}` })), lang);
    expect(calls.langlinks.map(c => c.n)).toEqual([1]);
    expect(calls.extracts.map(c => c.n)).toEqual([1]);
  });
  it('long intros are clipped to <= 420 chars', async () => {
    vi.stubGlobal('fetch', async (url: string) => {
      const u = new URL(url);
      const titles = (u.searchParams.get('titles') ?? '').split('|');
      const pages = u.searchParams.get('prop') === 'langlinks' ? titles.map(t => ({ title: t, langlinks: [{ title: 'Loc' }] })) : titles.map(t => ({ title: t, extract: 'palabra '.repeat(200) }));
      return { ok: true, json: async () => ({ query: { pages } }) } as Response;
    });
    const f = await loc();
    const [c] = await f([live()], lang);
    expect(c.t![lang]!.text.length).toBeLessThanOrEqual(420);
    expect(c.t![lang]!.text.endsWith('…')).toBe(true);
  });
});

describe('English readers and edge cases', () => {
  it('English readers get the very same array', async () => {
    const f = await loc();
    const cards = [live(), live({ id: 'x', wiki: 'Missing' })];
    expect(await f(cards, 'en')).toBe(cards);
    expect(calls.total).toBe(0);
  });
  it('empty list makes no calls', async () => {
    const f = await loc();
    expect(await f([], 'fr')).toEqual([]);
    expect(calls.total).toBe(0);
  });
  it('preserves order of mixed cards', async () => {
    const f = await loc();
    const out = await f([live({ id: 'a', wiki: 'Has a' }), live({ id: 'b', wiki: 'Missing b' }), live({ id: 'c', wiki: 'Has c' })], 'de');
    expect(out.map(c => c.id)).toEqual(['a', 'c']);
  });
  it('corrupt memo storage is tolerated', async () => {
    storage.mem.set('hoot.l10n.v1.fr', '{broken');
    const f = await loc();
    const [c] = await f([live()], 'fr');
    expect(c.t?.fr?.title).toBe('L:fr:Has page');
  });
  it('throwing storage is tolerated', async () => {
    vi.stubGlobal('localStorage', memStorage({ throws: true }));
    const f = await loc();
    const [c] = await f([live()], 'es');
    expect(c.t?.es?.title).toBe('L:es:Has page');
  });
  it('HTTP errors act like offline', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 500, json: async () => ({}) }) as Response);
    const f = await loc();
    expect(await f([live()], 'it')).toEqual([]);
  });
  it('different languages use separate memos', async () => {
    const f = await loc();
    await f([live()], 'fr');
    const n = calls.total;
    await f([live()], 'de');
    expect(calls.total).toBeGreaterThan(n);
  });
  it('redirects/normalisation map back to the requested title', async () => {
    vi.stubGlobal('fetch', async (url: string) => {
      const u = new URL(url);
      const prop = u.searchParams.get('prop');
      const body = prop === 'langlinks'
        ? { query: { normalized: [{ from: 'has page', to: 'Has page' }], redirects: [{ from: 'Has page', to: 'Has Real Page' }], pages: [{ title: 'Has Real Page', langlinks: [{ title: 'Seite' }] }] } }
        : { query: { pages: [{ title: 'Seite', extract: 'Seite' + LONG }] } };
      return { ok: true, json: async () => body } as Response;
    });
    const f = await loc();
    const [c] = await f([live({ wiki: 'has page' })], 'de');
    expect(c.t?.de?.title).toBe('Seite');
  });
});
