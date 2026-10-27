import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { COUNTRIES, INTERESTS, LANGS, arrange, cardMatchesLikes, localized, profileFromUrl, shareCardUrl, shareFeedUrl, store, withoutDuplicates, worthShowing, type Card, type Lang, type Profile } from '../../src/lib/data';
import { memStorage } from './suite-b-helpers';

const card = (over: Partial<Card> = {}): Card => ({ id: 'x', year: 1970, type: 'news', title: 'T', text: 'X', wiki: 'W', ...over });
const ORIGIN = 'https://hoot.example';
function at(search: string) {
  vi.stubGlobal('window', { location: { search, origin: ORIGIN } });
}
beforeEach(() => at(''));
afterEach(() => vi.unstubAllGlobals());

const likeSets: string[][] = [[], ['music'], ['music', 'space'], ['sport', 'football', 'cricket', 'tv'], [...INTERESTS]];
const years = [1900, 1937, 1962, 1999, 2010];

describe('profile <-> share link round trip', () => {
  const rows = COUNTRIES.flatMap(c => LANGS.map(l => [c.code, l] as [string, Lang]));
  it.each(rows)('country %s, language %s', (country, lang) => {
    for (const born of years)
      for (const likes of likeSets)
        for (const hideHeavy of [false, true]) {
          const p: Profile = { born, country, likes, hideHeavy };
          const url = new URL(shareFeedUrl(p, lang));
          expect(url.origin).toBe(ORIGIN);
          at(url.search);
          const r = profileFromUrl();
          expect(r.profile).toEqual(p);
          expect(r.lang).toBe(lang === 'en' ? null : lang);
          expect(r.card).toBeNull();
        }
  });
  it.each(COUNTRIES.map(c => [c.code]))('card link for %s keeps the card id', code => {
    const p: Profile = { born: 1960, country: code, likes: ['music'], hideHeavy: true };
    const id = 'w-ca-1970-ab/c d&e';
    const url = new URL(shareCardUrl(card({ id }), p, 'fr'));
    at(url.search);
    const r = profileFromUrl();
    expect(r.card).toBe(id);
    expect(r.profile).toEqual(p);
    expect(r.lang).toBe('fr');
  });
  it('omits optional parameters when empty', () => {
    const u = shareFeedUrl({ born: 1950, country: 'us', likes: [], hideHeavy: false }, 'en');
    expect(u).toBe(`${ORIGIN}/?born=1950&c=us`);
  });
});

describe('profileFromUrl validation', () => {
  it.each([
    ['', 'empty'],
    ['?born=1899&c=us', 'born too early'],
    ['?born=2011&c=us', 'born too late'],
    ['?born=abc&c=us', 'born NaN'],
    ['?c=us', 'no born'],
    ['?born=1960', 'no country'],
    ['?born=1960&c=zz', 'unknown country'],
    ['?born=1960&c=US', 'case-sensitive country'],
  ])('%s is rejected (%s)', (q: string) => {
    at(q);
    expect(profileFromUrl().profile).toBeNull();
  });
  it.each([1900, 2010])('born %i is accepted', b => {
    at(`?born=${b}&c=fr`);
    expect(profileFromUrl().profile?.born).toBe(b);
  });
  it('unknown interests are dropped, known kept in order', () => {
    at('?born=1960&c=fr&likes=music,bogus,,space,__proto__');
    expect(profileFromUrl().profile?.likes).toEqual(['music', 'space']);
  });
  it.each([['calm=1', true], ['calm=0', false], ['calm=true', false], ['', false]])('%j -> hideHeavy %s', (q, v) => {
    at(`?born=1960&c=fr&${q}`);
    expect(profileFromUrl().profile?.hideHeavy).toBe(v);
  });
  it.each(['xx', 'EN', 'english', ''])('bad lang %j gives null', l => {
    at(`?born=1960&c=fr&lang=${l}`);
    expect(profileFromUrl().lang).toBeNull();
  });
  it('lang and card survive an invalid profile', () => {
    at('?lang=ru&card=abc');
    const r = profileFromUrl();
    expect(r.profile).toBeNull();
    expect(r.lang).toBe('ru');
    expect(r.card).toBe('abc');
  });
});

describe('country data', () => {
  it('codes are unique', () => expect(new Set(COUNTRIES.map(c => c.code)).size).toBe(COUNTRIES.length));
  it.each(COUNTRIES.map(c => [c.code]))('%s has a name in each language and a valid default language', code => {
    const c = COUNTRIES.find(x => x.code === code)!;
    for (const l of LANGS) expect(c.name[l]?.length, l).toBeGreaterThan(0);
    expect(LANGS).toContain(c.lang);
  });
});

// Expected matching table, written separately from the source.
const expectTypes: Record<string, string[]> = {
  music: ['music', 'song'], films: ['film'], tv: ['tv'], sport: ['sport', 'cricket'], football: [], hockey: [], cricket: ['cricket'], tennis: [], cycling: [], baseball: [],
  politics: ['politics'], news: ['news'], space: ['space'], science: ['science'], cars: [], books: [], food: [],
};
const expectTags: Record<string, string[]> = {
  music: ['music'], films: ['films'], tv: [], sport: ['football', 'hockey', 'cricket', 'tennis', 'cycling', 'baseball'], football: ['football'], hockey: ['hockey'], cricket: ['cricket'], tennis: ['tennis'], cycling: ['cycling'], baseball: ['baseball'],
  politics: [], news: [], space: ['space'], science: ['science'], cars: ['cars'], books: ['books'], food: ['food'],
};
describe('cardMatchesLikes', () => {
  it.each(INTERESTS.map(i => [i]))('interest %s', like => {
    for (const t of expectTypes[like]) expect(cardMatchesLikes(card({ type: t }), [like]), `type ${t}`).toBe(true);
    for (const tag of expectTags[like]) expect(cardMatchesLikes(card({ type: 'zzz', tags: [tag] }), [like]), `tag ${tag}`).toBe(true);
    expect(cardMatchesLikes(card({ type: 'zzz' }), [like])).toBe(false);
    expect(cardMatchesLikes(card({ type: 'zzz', tags: ['unrelated'] }), [like])).toBe(false);
    // a wrong-interest list never matches this interest's own types
    const other = INTERESTS.filter(o => o !== like && !expectTypes[o].some(t => expectTypes[like].includes(t)));
    for (const t of expectTypes[like]) expect(cardMatchesLikes(card({ type: t }), other.filter(o => !expectTags[o].includes(t)))).toBe(false);
  });
  it('no likes -> no match; unknown likes ignored', () => {
    expect(cardMatchesLikes(card({ type: 'music' }), [])).toBe(false);
    expect(cardMatchesLikes(card({ type: 'music' }), ['nope'])).toBe(false);
    expect(cardMatchesLikes(card({ type: 'music' }), ['nope', 'music'])).toBe(true);
  });
});

describe('localized', () => {
  it.each(LANGS.map(l => [l]))('%s: translation used, else English', lang => {
    const c = card({ title: 'EN', text: 'EN text', t: { fr: { title: 'FR', text: 'FR text' }, ne: { title: 'NE', text: 'NE text' } } });
    if (lang === 'fr') expect(localized(c, lang)).toEqual({ title: 'FR', text: 'FR text' });
    else if (lang === 'ne') expect(localized(c, lang)).toEqual({ title: 'NE', text: 'NE text' });
    else expect(localized(c, lang)).toEqual({ title: 'EN', text: 'EN text' });
  });
  it('card without translations falls back for every language', () => {
    for (const l of LANGS) expect(localized(card(), l)).toEqual({ title: 'T', text: 'X' });
  });
});

describe('worthShowing', () => {
  it.each([
    [{ live: true, type: 'music' }, false],
    [{ live: true, type: 'song' }, false],
    [{ live: true, type: 'music', yt: 'abc' }, true],
    [{ live: true, type: 'song', pl: 'PL1' }, true],
    [{ live: true, type: 'music', yt: '', pl: '' }, false],
    [{ type: 'music' }, true],
    [{ type: 'song', live: false }, true],
    [{ live: true, type: 'news' }, true],
    [{ live: true, type: 'film' }, true],
    [{ live: true, type: 'sport' }, true],
  ] as [Partial<Card>, boolean][])('%j -> %s', (over, shown) => expect(worthShowing(card(over))).toBe(shown));
});

describe('arrange', () => {
  const mk = (n: number, type: string, o: Partial<Card> = {}) => card({ id: `${type}${n}`, type, ...o });
  const p = (o: Partial<Profile> = {}): Profile => ({ born: 1960, country: 'us', likes: [], hideHeavy: false, ...o });
  it('keeps every card exactly once', () => {
    const cards = [mk(1, 'news'), mk(2, 'news'), mk(3, 'music'), mk(4, 'film'), mk(5, 'news', { live: true })];
    const out = arrange(cards, p());
    expect(out.map(c => c.id).sort()).toEqual(cards.map(c => c.id).sort());
  });
  it('hides heavy cards only on request', () => {
    const cards = [mk(1, 'news', { heavy: true }), mk(2, 'music')];
    expect(arrange(cards, p({ hideHeavy: true })).map(c => c.id)).toEqual(['music2']);
    expect(arrange(cards, p()).length).toBe(2);
  });
  it('liked interests first', () => {
    const out = arrange([mk(1, 'news'), mk(2, 'film'), mk(3, 'music')], p({ likes: ['music'] }));
    expect(out[0].id).toBe('music3');
  });
  it('live cards sink below hand-written of equal interest', () => {
    const out = arrange([mk(1, 'news', { live: true }), mk(2, 'film')], p());
    expect(out.map(c => c.id)).toEqual(['film2', 'news1']);
  });
  it('avoids same-type neighbours where possible', () => {
    const cards = [...[1, 2, 3].map(i => mk(i, 'news')), ...[1, 2, 3].map(i => mk(i, 'music'))];
    const out = arrange(cards, p());
    for (let i = 1; i < out.length; i++) expect(out[i].type).not.toBe(out[i - 1].type);
  });
  it('does not mutate its input', () => {
    const cards = Object.freeze([mk(1, 'news'), mk(2, 'music')]) as Card[];
    expect(() => arrange(cards, p({ likes: ['music'] }))).not.toThrow();
    expect(cards[0].id).toBe('news1');
  });
  it('empty in, empty out', () => expect(arrange([], p())).toEqual([]));
});

describe('withoutDuplicates', () => {
  it('drops live cards whose wiki matches a curated one (case-insensitive)', () => {
    const out = withoutDuplicates([card({ wiki: 'Expo 67' })], [card({ id: 'a', wiki: 'expo 67' }), card({ id: 'b', wiki: 'Apollo 11' })]);
    expect(out.map(c => c.id)).toEqual(['b']);
  });
  it('drops repeated live wiki pages', () => {
    const out = withoutDuplicates([], [card({ id: 'a', wiki: 'P' }), card({ id: 'b', wiki: 'P' }), card({ id: 'c', wiki: 'Q' })]);
    expect(out.map(c => c.id)).toEqual(['a', 'c']);
  });
  it('drops near-duplicates by overlapping subject words', () => {
    const curated = [card({ wiki: '1967 Stanley Cup Finals', title: 'Leafs win the Cup' })];
    const out = withoutDuplicates(curated, [card({ id: 'a', wiki: '1967 Stanley Cup', title: 'x' }), card({ id: 'b', wiki: 'Moon landing', title: 'y' })]);
    expect(out.map(c => c.id)).toEqual(['b']);
  });
  it('keeps everything when curated is empty', () => {
    const live = [1, 2, 3].map(i => card({ id: `l${i}`, wiki: `Page ${i}` }));
    expect(withoutDuplicates([], live).length).toBe(3);
  });
  it('accent-insensitive matching', () => {
    const curated = [card({ wiki: 'Mexico City Olympics', title: 'Olympics' })];
    expect(withoutDuplicates(curated, [card({ id: 'a', wiki: 'México City Olympics', title: 'z' })])).toEqual([]);
  });
});

describe('store', () => {
  it('records round trip, defaults, corrupt, and blocked storage', () => {
    const s = memStorage();
    vi.stubGlobal('localStorage', s);
    expect(store.records()).toEqual({});
    store.setRecords({ a: 3 });
    expect(store.records()).toEqual({ a: 3 });
    expect(store.seenIntro()).toBe(false);
    store.setSeenIntro(true);
    expect(store.seenIntro()).toBe(true);
    s.mem.set('hoot.records', '{bad');
    expect(store.records()).toEqual({});
    vi.stubGlobal('localStorage', memStorage({ throws: true }));
    expect(() => store.setRecords({})).not.toThrow();
    expect(store.records()).toEqual({});
  });
});
