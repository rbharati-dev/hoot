// Countries, profile, local storage and share links.

export type Lang = 'en' | 'ru' | 'fr' | 'de' | 'it' | 'pt' | 'es' | 'hi' | 'ne';
export const LANGS: Lang[] = ['en', 'ru', 'fr', 'de', 'it', 'pt', 'es', 'hi', 'ne'];

export interface Country {
  code: string;
  name: Record<Lang, string>;
  lang: Lang; // language people born there are most likely to want
}

// Country names in each UI language. hi/ne default to the English name when
// not given (most Western countries read fine transliterated by the reader).
const n = (names: Partial<Record<Lang, string>> & { en: string }): Record<Lang, string> =>
  ({ ru: names.en, fr: names.en, de: names.en, it: names.en, pt: names.en, es: names.en, hi: names.en, ne: names.en, ...names });

// Order = how they appear in the picker. Content exists only for codes listed
// in public/content/index.json; the rest show as "coming soon".
export const COUNTRIES: Country[] = [
  { code: 'in', lang: 'hi', name: n({ en: 'India', ru: 'Индия', fr: 'Inde', de: 'Indien', it: 'India', pt: 'Índia', es: 'India', hi: 'भारत', ne: 'भारत' }) },
  { code: 'np', lang: 'ne', name: n({ en: 'Nepal', ru: 'Непал', fr: 'Népal', de: 'Nepal', it: 'Nepal', pt: 'Nepal', es: 'Nepal', hi: 'नेपाल', ne: 'नेपाल' }) },
  { code: 'ca', lang: 'en', name: n({ en: 'Canada', ru: 'Канада', fr: 'Canada', de: 'Kanada', pt: 'Canadá', es: 'Canadá', hi: 'कनाडा', ne: 'क्यानडा' }) },
  { code: 'us', lang: 'en', name: n({ en: 'United States', ru: 'США', fr: 'États-Unis', de: 'USA', it: 'Stati Uniti', pt: 'Estados Unidos', es: 'Estados Unidos', hi: 'अमेरिका', ne: 'अमेरिका' }) },
  { code: 'mx', lang: 'es', name: n({ en: 'Mexico', ru: 'Мексика', fr: 'Mexique', de: 'Mexiko', it: 'Messico', pt: 'México', es: 'México', hi: 'मेक्सिको', ne: 'मेक्सिको' }) },
  { code: 'gb', lang: 'en', name: n({ en: 'United Kingdom', ru: 'Великобритания', fr: 'Royaume-Uni', de: 'Großbritannien', it: 'Regno Unito', pt: 'Reino Unido', es: 'Reino Unido', hi: 'यूनाइटेड किंगडम', ne: 'बेलायत' }) },
  { code: 'su', lang: 'ru', name: n({ en: 'Soviet Union (USSR)', ru: 'СССР', fr: 'Union soviétique (URSS)', de: 'Sowjetunion (UdSSR)', it: 'Unione Sovietica (URSS)', pt: 'União Soviética (URSS)', es: 'Unión Soviética (URSS)', hi: 'सोवियत संघ', ne: 'सोभियत संघ' }) },
  { code: 'fr', lang: 'fr', name: n({ en: 'France', ru: 'Франция', fr: 'France', de: 'Frankreich', it: 'Francia', pt: 'França', es: 'Francia', hi: 'फ़्रांस', ne: 'फ्रान्स' }) },
  { code: 'de', lang: 'de', name: n({ en: 'West Germany', ru: 'ФРГ (Западная Германия)', fr: 'Allemagne de l’Ouest (RFA)', de: 'Bundesrepublik (West)', it: 'Germania Ovest', pt: 'Alemanha Ocidental', es: 'Alemania Occidental', hi: 'पश्चिम जर्मनी', ne: 'पश्चिम जर्मनी' }) },
  { code: 'dd', lang: 'de', name: n({ en: 'East Germany (GDR)', ru: 'ГДР', fr: 'Allemagne de l’Est (RDA)', de: 'DDR', it: 'Germania Est (DDR)', pt: 'Alemanha Oriental', es: 'Alemania Oriental', hi: 'पूर्वी जर्मनी', ne: 'पूर्वी जर्मनी' }) },
  { code: 'it', lang: 'it', name: n({ en: 'Italy', ru: 'Италия', fr: 'Italie', de: 'Italien', it: 'Italia', pt: 'Itália', es: 'Italia', hi: 'इटली', ne: 'इटाली' }) },
  { code: 'br', lang: 'pt', name: n({ en: 'Brazil', ru: 'Бразилия', fr: 'Brésil', de: 'Brasilien', it: 'Brasile', pt: 'Brasil', es: 'Brasil', hi: 'ब्राज़ील', ne: 'ब्राजिल' }) },
  { code: 'ar', lang: 'es', name: n({ en: 'Argentina', ru: 'Аргентина', fr: 'Argentine', de: 'Argentinien', it: 'Argentina', pt: 'Argentina', es: 'Argentina', hi: 'अर्जेंटीना', ne: 'अर्जेन्टिना' }) },
  { code: 'co', lang: 'es', name: n({ en: 'Colombia', ru: 'Колумбия', fr: 'Colombie', de: 'Kolumbien', it: 'Colombia', pt: 'Colômbia', es: 'Colombia', hi: 'कोलंबिया', ne: 'कोलम्बिया' }) },
];

// Interests the person can pick at sign-up. Each maps to real content through
// INTEREST_MATCH below, so choosing them actually reshapes the feed.
export const INTERESTS = ['music', 'films', 'tv', 'sport', 'football', 'hockey', 'cricket', 'tennis', 'cycling', 'baseball', 'politics', 'news', 'space', 'science', 'cars', 'books', 'food'] as const;

// How an interest matches a card: by the card's `type`, by its `tags`, or both.
// (Some content is tagged, e.g. a music card about a car; types cover the rest.)
const INTEREST_MATCH: Record<string, { types?: string[]; tags?: string[] }> = {
  music: { types: ['music', 'song'], tags: ['music'] },
  films: { types: ['film'], tags: ['films'] },
  tv: { types: ['tv'] },
  sport: { types: ['sport', 'cricket'], tags: ['football', 'hockey', 'cricket', 'tennis', 'cycling', 'baseball'] },
  football: { tags: ['football'] },
  hockey: { tags: ['hockey'] },
  cricket: { types: ['cricket'], tags: ['cricket'] },
  tennis: { tags: ['tennis'] },
  cycling: { tags: ['cycling'] },
  baseball: { tags: ['baseball'] },
  politics: { types: ['politics'] },
  news: { types: ['news'] },
  space: { types: ['space'], tags: ['space'] },
  science: { types: ['science'], tags: ['science'] },
  cars: { tags: ['cars'] },
  books: { tags: ['books'] },
  food: { tags: ['food'] },
};

// Does a card satisfy any of the person's chosen interests?
export function cardMatchesLikes(card: Card, likes: string[]): boolean {
  for (const like of likes) {
    const m = INTEREST_MATCH[like];
    if (!m) continue;
    if (m.types?.includes(card.type)) return true;
    if (m.tags && (card.tags ?? []).some(t => m.tags!.includes(t))) return true;
  }
  return false;
}

export interface Profile {
  born: number;
  country: string;
  likes: string[];
  hideHeavy: boolean;
}

export interface Settings {
  lang: Lang;
  textSize: 0 | 1 | 2;
  dark: boolean;
  sound?: boolean; // game sound effects (default on)
  contrast?: boolean; // high-contrast reading (default off)
}

export interface Card {
  id: string;
  year: number;
  type: string;
  title: string;
  text: string;
  wiki: string;
  listen?: string;
  heavy?: boolean;
  tags?: string[];
  t?: Partial<Record<Lang, { title: string; text: string }>>; // translations
  yt?: string; // YouTube video id to play inside the card
  pl?: string; // YouTube playlist id (e.g. a year's top hits)
  date?: string; // e.g. "April 28", for live Wikipedia entries
  host?: string; // which Wikipedia the article lives on (default English)
  live?: boolean; // pulled live from Wikipedia rather than hand-written
  photo?: string; // another article to borrow a photo from (e.g. the singer)
  era?: string; // for Reflections: when the thought is from (e.g. "Stoic · c. 170 CE")
}

// A song pulled live from a chart with no video yet has nothing to offer in
// the app, so it's left out until the nightly job finds one. Hand-written
// songs always stay (they have a write-up worth reading).
export const worthShowing = (c: Card) => !(c.live && (c.type === 'music' || c.type === 'song') && !c.yt && !c.pl);

// Title and text in the reader's language when we have it, else English.
export function localized(card: Card, lang: Lang) {
  return card.t?.[lang] ?? { title: card.title, text: card.text };
}

// ---- safe localStorage ----
function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: app still works for this visit */
  }
}

export const store = {
  profile: () => read<Profile | null>('hoot.profile', null),
  setProfile: (p: Profile | null) => write('hoot.profile', p),
  settings: () => read<Settings>('hoot.settings', { lang: 'en', textSize: 1, dark: false, sound: true }),
  setSettings: (s: Settings) => write('hoot.settings', s),
  saved: () => read<Card[]>('hoot.saved', []),
  setSaved: (c: Card[]) => write('hoot.saved', c),
  hidden: () => read<string[]>('hoot.hidden', []),
  setHidden: (ids: string[]) => write('hoot.hidden', ids),
  position: () => read<number>('hoot.position', 0),
  setPosition: (n: number) => write('hoot.position', n),
  games: () => read<Record<string, number>>('hoot.games', {}),
  setGames: (g: Record<string, number>) => write('hoot.games', g),
  // Personal bests, keyed per game. Fastest time (seconds, lower is better) for
  // the word search; highest score in the timed round for math and pattern.
  records: () => read<Record<string, number>>('hoot.records', {}),
  setRecords: (r: Record<string, number>) => write('hoot.records', r),
  seenIntro: () => read<boolean>('hoot.seenIntro', false),
  setSeenIntro: (v: boolean) => write('hoot.seenIntro', v),
};

// ---- profile in the link ----
// e.g. ?born=1962&c=su&likes=music,space&calm=1&lang=ru
export function profileFromUrl(): { profile: Profile | null; lang: Lang | null; card: string | null } {
  const q = new URLSearchParams(window.location.search);
  const born = Number(q.get('born'));
  const country = q.get('c') ?? '';
  const langParam = q.get('lang');
  const lang = (LANGS as string[]).includes(langParam ?? '') ? (langParam as Lang) : null;
  const card = q.get('card');
  const valid = born >= 1900 && born <= 2010 && COUNTRIES.some(c => c.code === country);
  const profile = valid
    ? {
        born,
        country,
        likes: (q.get('likes') ?? '').split(',').filter(x => (INTERESTS as readonly string[]).includes(x)),
        hideHeavy: q.get('calm') === '1',
      }
    : null;
  return { profile, lang, card };
}

/** Links people share always use Hoot's own address (except in local testing). */
export const PUBLIC_ORIGIN = 'https://hootdaily.com';
export function shareOrigin(host = window.location.hostname, origin = window.location.origin): string {
  return /(^|\.)hootdaily\.com$|\.web\.app$|\.firebaseapp\.com$/.test(host) ? PUBLIC_ORIGIN : origin;
}
export function shareFeedUrl(p: Profile, lang: Lang): string {
  const q = new URLSearchParams({ born: String(p.born), c: p.country });
  if (p.likes.length) q.set('likes', p.likes.join(','));
  if (p.hideHeavy) q.set('calm', '1');
  if (lang !== 'en') q.set('lang', lang);
  return `${shareOrigin()}/?${q.toString()}`;
}

export function shareCardUrl(card: Card, p: Profile, lang: Lang): string {
  return `${shareFeedUrl(p, lang)}&card=${encodeURIComponent(card.id)}`;
}

// ---- content ----
let indexCache: Record<string, number[]> | null = null;
export async function contentIndex(): Promise<Record<string, number[]>> {
  if (indexCache) return indexCache;
  try {
    const res = await fetch('/content/index.json');
    indexCache = res.ok ? await res.json() : {};
  } catch {
    indexCache = {};
  }
  return indexCache!;
}

export const FEED_AGE_FROM = 5;
export const FEED_AGE_TO = 25;

export function feedYears(p: Profile): number[] {
  const out: number[] = [];
  for (let y = p.born + FEED_AGE_FROM; y <= Math.min(p.born + FEED_AGE_TO, 2000); y++) out.push(y);
  return out;
}

async function fetchCards(url: string): Promise<Card[]> {
  try {
    const r = await fetch(url);
    return r.ok ? await r.json() : [];
  } catch {
    return [];
  }
}

// Hand-written memories for one year: the country's own. (The Reflections
// deck used to be mixed in here, but philosophy sat oddly between pop-culture
// memories, so it now lives in its own calm tab — see reflections().)
export async function curatedYear(country: string, year: number): Promise<Card[]> {
  const index = await contentIndex();
  if (!(index[country] ?? []).includes(year)) return [];
  return fetchCards(`/content/${country}/${year}.json`);
}

// The Reflections deck: short pieces of philosophy, spirituality and wisdom,
// shown in their own tab rather than in the memory feed. Localised like any
// card. Returned newest-thought-first is meaningless here, so we keep the
// deck's own order (roughly chronological by the thinker's era).
let reflectionsCache: Card[] | null = null;
export async function reflections(): Promise<Card[]> {
  if (reflectionsCache) return reflectionsCache;
  reflectionsCache = await fetchCards('/content/wisdom/all.json');
  return reflectionsCache;
}

// Interests first, hard history hidden on request, and no two cards of the
// same kind next to each other where it can be helped.
/**
 * Keep a year varied: songs (whole charts come in every year) make up at most
 * a third of it, and no other kind more than half. Hand-written cards always
 * stay; among live ones the earliest (the biggest chart hits, the first
 * events) are kept.
 */
export function balance(cards: Card[]): Card[] {
  const isSong = (c: Card) => c.type === 'music' || c.type === 'song';
  const songs = cards.filter(isSong);
  const others = cards.length - songs.length;
  const songCap = Math.max(6, Math.floor(others / 2)); // songs ≤ 1/3 of the year
  const kinds = new Map<string, number>();
  for (const c of cards) if (!isSong(c)) kinds.set(c.type, (kinds.get(c.type) ?? 0) + 1);
  const typeCap = Math.max(10, Math.ceil(cards.length / 2));
  const kept = new Map<string, number>();
  const out: Card[] = [];
  // Hand-written first so they always fit under the caps.
  for (const c of [...cards.filter(c => !c.live), ...cards.filter(c => c.live)]) {
    const k = isSong(c) ? 'music' : c.type;
    const n = kept.get(k) ?? 0;
    if (c.live && n >= (k === 'music' ? songCap : typeCap)) continue;
    kept.set(k, n + 1);
    out.push(c);
  }
  // Back in the original order.
  const at = new Map(cards.map((c, i) => [c, i]));
  return out.sort((a, b) => at.get(a)! - at.get(b)!);
}

export function arrange(cards: Card[], p: Profile): Card[] {
  const list = balance(cards.filter(c => !(p.hideHeavy && c.heavy)));
  // Liked interests float to the front; live (auto-pulled) cards sink slightly
  // below hand-written ones of equal interest.
  const score = (c: Card) => (p.likes.length && cardMatchesLikes(c, p.likes) ? 0 : 1) + (c.live ? 1 : 0);
  list.sort((a, b) => score(a) - score(b));
  const out: Card[] = [];
  const rest = list.slice();
  while (rest.length) {
    const prev = out[out.length - 1];
    const i = rest.findIndex(c => !prev || c.type !== prev.type);
    out.push(...rest.splice(i < 0 ? 0 : i, 1));
  }
  return out;
}

// Wikipedia often has its own entry for something we already wrote by hand
// (the 1967 Stanley Cup, Expo 67). Drop the live copy in that case.
const STOP = new Set(['the', 'and', 'for', 'with', 'from', 'that', 'this', 'their', 'into', 'over', 'los', 'las', 'del', 'por', 'una', 'des', 'les']);
const words = (s: string) => new Set(s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').split(/[^a-z0-9]+/).filter(w => w.length > 2 && !STOP.has(w)));

export function withoutDuplicates(curated: Card[], live: Card[]): Card[] {
  const wikis = new Set(curated.map(c => c.wiki.toLowerCase()));
  const keys = curated.map(c => words(c.wiki)).filter(k => k.size);
  const titles = curated.map(c => words(c.title));
  const seen = new Set<string>();
  return live.filter(l => {
    if (wikis.has(l.wiki.toLowerCase()) || seen.has(l.wiki)) return false;
    const lw = words(`${l.title} ${l.wiki}`);
    // Most of a hand-written card's subject appears in the live entry.
    for (const k of keys) {
      let hit = 0;
      k.forEach(w => lw.has(w) && hit++);
      if (hit / k.size >= 0.6 && hit >= 2) return false;
    }
    for (const t of titles) {
      let hit = 0;
      t.forEach(w => lw.has(w) && hit++);
      if (hit >= 4) return false;
    }
    seen.add(l.wiki);
    return true;
  });
}

// ---- news ----
// A headline aggregated from a publisher's RSS feed. We store only the
// headline, a short summary, the source name and a link back — never the full
// article — and always send the reader to the source to read it in full.
export interface NewsStory {
  id: string;
  title: string;
  summary: string;
  image?: string; // publisher's thumbnail (from the RSS feed)
  source: string; // publisher name, e.g. "BBC News"
  url: string; // link to the original article
  topic: string; // news, politics, science, music, films, sport, business, health…
  published: string; // ISO date
  importance: number; // higher = bigger story (cross-source + recency)
}
export interface NewsFeed {
  built: string; // ISO time the feed was assembled
  stories: NewsStory[];
}

// Which news edition a reader gets, by their interface language. Editions that
// exist as their own file (Spanish, Portuguese, Hindi, Nepali, Russian) serve
// native-language news; everyone else gets the English edition.
const NEWS_EDITIONS = ['es', 'pt', 'hi', 'ne', 'ru', 'de', 'fr', 'it'];
export function newsEdition(lang: Lang): string {
  return NEWS_EDITIONS.includes(lang) ? lang : 'en';
}

const newsCache: Record<string, NewsFeed | null> = {};
async function fetchNewsFile(edition: string): Promise<NewsFeed | null> {
  try {
    const r = await fetch(`/content/news/${edition}.json`);
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}
export async function loadNews(lang: Lang): Promise<NewsFeed | null> {
  const ed = newsEdition(lang);
  if (ed in newsCache) return newsCache[ed];
  let feed = await fetchNewsFile(ed);
  // Thin or missing native edition → fall back to English so there's always news.
  if ((!feed || feed.stories.length < 3) && ed !== 'en') feed = (await fetchNewsFile('en')) ?? feed;
  newsCache[ed] = feed;
  return feed;
}

// How a news topic lines up with the interests picked at sign-up.
const TOPIC_INTERESTS: Record<string, string[]> = {
  news: ['news'],
  politics: ['politics', 'news'],
  world: ['news'],
  science: ['science', 'space'],
  space: ['space', 'science'],
  technology: ['science'],
  health: ['news'],
  business: ['news', 'politics'],
  music: ['music'],
  film: ['films'],
  films: ['films'],
  tv: ['tv', 'films'],
  entertainment: ['films', 'tv', 'music'],
  sport: ['sport', 'football', 'hockey', 'cricket', 'tennis', 'cycling', 'baseball'],
};

export function newsMatchesLikes(story: NewsStory, likes: string[]): boolean {
  const mapped = TOPIC_INTERESTS[story.topic] ?? [story.topic];
  return likes.some(l => mapped.includes(l));
}

// Order stories for a reader: their interests first, then the biggest stories,
// but always keep the day's major world news in the mix so they stay informed.
// Returns at most `limit` stories.
export function rankNews(feed: NewsStory[], likes: string[], limit = 12): NewsStory[] {
  const score = (s: NewsStory) => (likes.length && newsMatchesLikes(s, likes) ? 0 : 1);
  const sorted = feed.slice().sort((a, b) => score(a) - score(b) || b.importance - a.importance);
  return sorted.slice(0, limit);
}

// Every curated card the person could see (used by the quiz).
export async function loadFeed(p: Profile): Promise<Card[]> {
  const lists = await Promise.all(feedYears(p).map(y => curatedYear(p.country, y)));
  return arrange(lists.flat(), p);
}

// ---- Wikipedia summary + Commons photo (fetched live by the browser, no AI) ----
export interface WikiInfo {
  pageUrl: string;
  image?: string;
  imagePage?: string;
}
const wikiCache = new Map<string, Promise<WikiInfo>>();

export function wikiPageUrl(title: string, host = 'en.wikipedia.org') {
  return `https://${host}/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
}

export function wikiInfo(title: string, host = 'en.wikipedia.org'): Promise<WikiInfo> {
  const key = host + '|' + title;
  if (!wikiCache.has(key)) {
    const fallback: WikiInfo = { pageUrl: wikiPageUrl(title, host) };
    wikiCache.set(
      key,
      fetch(`https://${host}/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`)
        .then(r => (r.ok ? r.json() : null))
        .then(j => {
          if (!j) return fallback;
          const info: WikiInfo = { pageUrl: j.content_urls?.desktop?.page ?? fallback.pageUrl };
          const src: string | undefined = j.originalimage?.source ?? j.thumbnail?.source;
          // Only show freely licensed photos from Wikimedia Commons, never
          // non-free images (posters, logos) hosted on English Wikipedia.
          if (src && src.includes('/wikipedia/commons/') && !src.endsWith('.svg')) {
            const parts = src.split('/');
            const isThumb = parts.includes('thumb');
            const file = decodeURIComponent(isThumb ? parts[parts.length - 2] : parts[parts.length - 1]);
            // Use the original if it's modest in size; otherwise ask Commons
            // for a 960px-wide version (only valid when the original is wider).
            const w: number = j.originalimage?.width ?? 0;
            const thumb: string | undefined = j.thumbnail?.source;
            info.image =
              w > 1600 && thumb && /\/\d+px-/.test(thumb) ? thumb.replace(/\/\d+px-/, '/1280px-') : (j.originalimage?.source ?? src);
            info.imagePage = `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}`;
          }
          return info;
        })
        .catch(() => fallback),
    );
  }
  return wikiCache.get(key)!;
}


// ---- Health tips ----
export interface HealthTip {
  id: string;
  topic: string;
  title: string;
  text: string;
  doctor?: boolean; // worth talking to a doctor about
  intimate?: true; // sexual health: shown only under Intimacy & desire
  en?: true; // not translated yet: shown in English
}
/** Topics in the order the Health tab offers them: results people ask about most first. */
export const HEALTH_TOPICS = ['intimacy', 'menopause', 'energy', 'sleep', 'memory', 'heart', 'joints', 'strength', 'weight', 'mood', 'men', 'eating', 'digestion', 'bladder', 'senses', 'skin', 'pain', 'lungs', 'staywell', 'longevity'] as const;
export type HealthTopic = (typeof HEALTH_TOPICS)[number];
const healthCache = new Map<string, Promise<HealthTip[]>>();
export function healthTips(lang: Lang): Promise<HealthTip[]> {
  let p = healthCache.get(lang);
  if (!p) {
    p = fetch(`/content/health/${lang}.json`)
      .then(r => (r.ok ? r.json() : []))
      .catch(() => [] as HealthTip[]);
    healthCache.set(lang, p);
  }
  return p;
}

/**
 * The "For you" mix: tips taken in turns across topics, the most asked-about
 * topics first and more often (intimacy, menopause, energy, sleep), each topic
 * shuffled with `rnd` so every visit feels fresh.
 */
/** Sexual-health items appear only under the Intimacy & desire topic. */
export const isIntimate = (x: { topic: string; intimate?: boolean }) => x.topic === 'intimacy' || !!x.intimate;
/** What a topic button shows: its own items, plus sexual-health ones filed elsewhere for Intimacy. */
export function inTopic<T extends { topic: string; intimate?: boolean }>(list: T[], topic: string): T[] {
  if (topic === 'all' || topic === 'news') return list.filter(x => !isIntimate(x));
  if (topic === 'intimacy') return list.filter(isIntimate);
  return list.filter(x => x.topic === topic && !isIntimate(x));
}
export function healthMix(tips: HealthTip[], rnd: () => number): HealthTip[] {
  const by = new Map<string, HealthTip[]>();
  for (const t of tips) (by.get(t.topic) ?? by.set(t.topic, []).get(t.topic)!).push(t);
  for (const list of by.values())
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
  const order = [...HEALTH_TOPICS.filter(t => by.has(t)), ...[...by.keys()].filter(t => !(HEALTH_TOPICS as readonly string[]).includes(t))];
  // Lead topics get two turns per round.
  const turns = order.flatMap((t, i) => (i < 4 ? [t, t] : [t]));
  const out: HealthTip[] = [];
  while (out.length < tips.length) {
    for (const t of turns) {
      const next = by.get(t)?.shift();
      if (next) out.push(next);
    }
  }
  return out;
}

// ---- Health research news ----
export interface HealthStory {
  id: string;
  title: string;
  summary: string;
  image: string;
  source: string;
  url: string;
  topic: string;
  published: string;
  animal?: boolean;
  en?: boolean;
  intimate?: boolean; // sexual health: shown only under Intimacy & desire
  /** How fascinating the story is for readers 50-80 (sleep, drugs, longevity...). */
  score?: number;
}
/** Most fascinating first, with a nudge for freshness (a week-old story loses ~3 points). */
export function byInterest(stories: HealthStory[], now = Date.now()): HealthStory[] {
  const v = (s: HealthStory) => (s.score ?? 6) - (now - Date.parse(s.published)) / (2.3 * 864e5);
  return stories.slice().sort((a, b) => v(b) - v(a));
}
const healthNewsCache = new Map<string, Promise<HealthStory[]>>();
/** Fresh studies and medical news for the Health tab (newest first). */
export function healthNews(lang: Lang): Promise<HealthStory[]> {
  let p = healthNewsCache.get(lang);
  if (!p) {
    p = fetch(`/content/research/${lang}.json`)
      .then(r => (r.ok ? r.json() : { stories: [] }))
      .then(j => (Array.isArray(j?.stories) ? (j.stories as HealthStory[]) : []))
      .catch(() => [] as HealthStory[]);
    healthNewsCache.set(lang, p);
  }
  return p;
}

export type HealthItem = { kind: 'story'; story: HealthStory } | { kind: 'tip'; tip: HealthTip };
/**
 * The "For you" feed: new research leads (two studies, then a tip), newest
 * studies first, so the tab reads like a health magazine rather than a list
 * of rules. Once the studies run out it carries on with tips.
 */
export function healthFeed(stories: HealthStory[], tips: HealthTip[]): HealthItem[] {
  const out: HealthItem[] = [];
  let s = 0;
  let t = 0;
  while (s < stories.length || t < tips.length) {
    for (let k = 0; k < 2 && s < stories.length; k++) out.push({ kind: 'story', story: stories[s++] });
    if (t < tips.length) out.push({ kind: 'tip', tip: tips[t++] });
  }
  return out;
}
