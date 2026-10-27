import { afterEach, describe, expect, it, vi } from 'vitest';
import { localizeCards } from '../../src/lib/localize';
import type { Card } from '../../src/lib/data';

const live = (over: Partial<Card>): Card => ({ id: 'x', year: 1962, type: 'sport', title: 'Tour de France, won by Jacques Anquetil.', text: 'English text.', wiki: '1962 Tour de France', live: true, date: '24 June', ...over });

// A tiny fake of the Wikipedia API: English article → French article → French intro.
function fakeWikipedia() {
  const store = new Map<string, string>();
  vi.stubGlobal('localStorage', { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v) });
  vi.stubGlobal('fetch', async (url: string) => {
    const u = new URL(url);
    const titles = (u.searchParams.get('titles') ?? '').split('|');
    const prop = u.searchParams.get('prop');
    const pages = titles.map(title => {
      if (u.host === 'en.wikipedia.org' && prop === 'langlinks') {
        const fr: Record<string, string> = { '1962 Tour de France': 'Tour de France 1962', 'Some song': 'Une chanson' };
        return fr[title] ? { title, langlinks: [{ lang: 'fr', title: fr[title] }] } : { title };
      }
      if (u.host === 'fr.wikipedia.org' && prop === 'extracts') return { title, extract: `${title} est un article en français, assez long pour être utilisé ici.` };
      return { title };
    });
    return { ok: true, json: async () => ({ query: { pages } }) } as Response;
  });
}

describe('localizeCards', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('leaves English readers untouched', async () => {
    const c = live({});
    expect(await localizeCards([c], 'en')).toEqual([c]);
  });

  it('shows a live English card in French from the French article, with a French source link', async () => {
    fakeWikipedia();
    const [c] = await localizeCards([live({})], 'fr');
    expect(c.t?.fr?.title).toBe('Tour de France 1962');
    expect(c.t?.fr?.text).toMatch(/en français/);
    expect(c.host).toBe('fr.wikipedia.org');
    expect(c.wiki).toBe('Tour de France 1962');
    expect(c.date).toBeUndefined(); // "24 June" is English
  });

  it('drops a live card with no French article instead of showing English', async () => {
    fakeWikipedia();
    expect(await localizeCards([live({ id: 'y', wiki: 'Obscure English-only page' })], 'fr')).toEqual([]);
  });

  it('keeps songs without a local article, with no English "by" and no English text', async () => {
    fakeWikipedia();
    const [c] = await localizeCards([live({ id: 's', type: 'music', title: '“Obscure” by Somebody', wiki: 'Obscure (song)', yt: 'abcdefghijk' })], 'fr');
    expect(c.t?.fr).toEqual({ title: '“Obscure” — Somebody', text: '' });
  });

  it('keeps hand-written translations and only relinks the source', async () => {
    fakeWikipedia();
    const own = { id: 'h', year: 1962, type: 'sport', title: 'EN', text: 'EN', wiki: '1962 Tour de France', t: { fr: { title: 'FR', text: 'FR' } } } as Card;
    const [c] = await localizeCards([own], 'fr');
    expect(c.t?.fr).toEqual({ title: 'FR', text: 'FR' });
    expect(c.host).toBe('fr.wikipedia.org');
  });

  it('when Wikipedia is unreachable, shows no English live cards', async () => {
    vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {} });
    vi.stubGlobal('fetch', async () => { throw new Error('offline'); });
    expect(await localizeCards([live({ id: 'z', wiki: 'Never seen' })], 'de')).toEqual([]);
  });
});
