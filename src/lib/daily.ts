// The daily ritual: a visit streak, a fixed "today's five" set that is the same
// all day but new each day, and an "on this day" card drawn from Wikipedia's
// own feed filtered to the years the person was growing up. All local — no
// account, nothing leaves the device.

import { rankCards, readPrefs, score } from './prefs';
import { curatedYear, feedYears, loadFeed, worthShowing, type Card, type Profile } from './data';

// ---- date helpers (local time, so "today" matches the person's day) ----
export function todayKey(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function dayBefore(key: string): string {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d - 1);
  return todayKey(dt);
}

// ---- streak ----
export interface Streak {
  last: string; // last day the set was completed
  count: number;
  best: number;
}
function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* ignore */
  }
}

export function getStreak(): Streak {
  return readJSON<Streak>('hoot.streak', { last: '', count: 0, best: 0 });
}

// Call when the person finishes today's five. Idempotent for the same day.
export function completeToday(): Streak {
  recordFive(); // marks the day on the progress calendar
  const today = todayKey();
  const s = getStreak();
  if (s.last === today) return s; // already counted today
  const continued = s.last === dayBefore(today);
  const count = continued ? s.count + 1 : 1;
  const next: Streak = { last: today, count, best: Math.max(s.best, count) };
  writeJSON('hoot.streak', next);
  return next;
}

export function isTodayDone(): boolean {
  return getStreak().last === todayKey();
}

// ---- deterministic shuffle so "today's five" is stable all day ----
function seedFrom(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pickN<T>(items: T[], n: number, rnd: () => number): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

// Like pickN, but spreads across card types so the daily set isn't three news
// items in a row. Shuffles first (so it's still date-stable), then takes one of
// each fresh type before allowing repeats.
function pickDiverse(items: Card[], n: number, rnd: () => number, likes: string[] = []): Card[] {
  const prefs = readPrefs();
  let shuffled = pickN(items, items.length, rnd);
  if (Object.keys(prefs.w).length || likes.length) {
    // Favour what the person enjoys, still varied and still date-stable (the
    // shuffle above is seeded by the day): rank the best-scoring candidates
    // plus a handful of others for discovery, then take one of each type.
    const byScore = shuffled.map((c, i) => ({ c, i, s: score(c, prefs, likes) })).sort((a, b) => b.s - a.s || a.i - b.i);
    const cut = Math.max(n * 8, 40);
    const pool = [...byScore.slice(0, cut), ...byScore.slice(cut, cut + Math.max(n * 2, 10))].map(x => x.c);
    shuffled = rankCards(pool, prefs, likes, rnd);
  }
  const out: Card[] = [];
  const usedTypes = new Set<string>();
  for (const c of shuffled) {
    if (out.length >= n) break;
    if (!usedTypes.has(c.type)) {
      out.push(c);
      usedTypes.add(c.type);
    }
  }
  // Top up if we didn't reach n (few types available).
  for (const c of shuffled) {
    if (out.length >= n) break;
    if (!out.includes(c)) out.push(c);
  }
  return out;
}

// Words that mark an event as belonging to the person's own country, so "on
// this day" feels like home rather than a random world event.
const COUNTRY_WORDS: Record<string, RegExp> = {
  ca: /\bCanad(a|ian)\b/i,
  us: /\b(United States|American|U\.S\.|Washington|New York)\b/i,
  mx: /\bMexic(o|an)\b/i,
  gb: /\b(United Kingdom|Britain|British|England|English|Scotland|Wales|London)\b/i,
  su: /\b(Soviet|USSR|Russia(n)?|Moscow|Leningrad|Stalin|Khrushchev|Brezhnev)\b/i,
  fr: /\b(France|French|Paris)\b/i,
  de: /\b(West German|Germany|German|Bonn|Berlin)\b/i,
  dd: /\b(East German|GDR|German Democratic|Berlin)\b/i,
  it: /\b(Ital(y|ian)|Rome|Milan)\b/i,
  br: /\b(Brazil(ian)?|Rio|São Paulo)\b/i,
  ar: /\b(Argentin(a|e|ian)|Buenos Aires|Perón)\b/i,
  co: /\b(Colombia(n)?|Bogotá)\b/i,
  in: /\b(India(n)?|Delhi|Bombay|Mumbai|Nehru|Gandhi)\b/i,
  np: /\b(Nepal(ese|i)?|Kathmandu|Everest)\b/i,
};

interface OtdEvent {
  year: number;
  text: string;
  pages?: { title: string; extract?: string }[];
}
import { localizeCards } from './localize';
import { isBadVideo } from './videos';
import { recordFive } from './activity';
import type { Lang } from './data';

// ---- on this day ----
// Wikipedia's own "on this day" feed, filtered to the person's lifetime AND,
// where possible, to their own country — a Mexican reader should see Mexican
// history, not a random Soviet or Canadian event. Falls back to world events
// only when nothing from their country happened on this date.
export async function onThisDay(profile: Profile, d = new Date(), lang: Lang = 'en'): Promise<Card | null> {
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const lo = profile.born + 5;
  const hi = profile.born + 30;
  try {
    const r = await fetch(`https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/${mm}/${dd}`);
    if (!r.ok) return null;
    const j = await r.json();
    const events: OtdEvent[] = j.events ?? [];
    const inEra = events.filter(e => e.year >= lo && e.year <= hi && e.pages?.length);
    if (!inEra.length) return null;
    const matcher = COUNTRY_WORDS[profile.country];
    const matches = (e: OtdEvent) => !!matcher && (matcher.test(e.text) || (e.pages ?? []).some(p => matcher.test(p.title)));
    const home = inEra.filter(matches);
    // Only show a genuine event from the person's own country. On a day with
    // none, we return null and the Today page shows one of their memories
    // instead — never a random foreign event dressed up as "on this day".
    if (!home.length) return null;
    const rnd = mulberry32(seedFrom(`${todayKey(d)}|${profile.born}|${profile.country}`));
    const e = home[Math.floor(rnd() * home.length)];
    const page = e.pages!.find(p => p.extract) ?? e.pages![0];
    const card: Card = {
      id: `otd-${todayKey(d)}-${e.year}`,
      year: e.year,
      type: 'news',
      title: e.text,
      text: page.extract ?? e.text,
      wiki: page.title,
      host: 'en.wikipedia.org',
      live: true,
    };
    // In the reader's language (their Wikipedia's article on the event), with
    // the date written their way; left out if their Wikipedia lacks it.
    const [local] = await localizeCards([card], lang);
    if (!local) return null;
    return { ...local, date: d.toLocaleDateString(lang === 'en' ? 'en-US' : lang, { month: 'long', day: 'numeric' }) };
  } catch {
    return null;
  }
}

// ---- today's set ----
// Shape of a day: on-this-day card, a few curated memories, and a "name that
// tune" round to finish. Memories and the tune are chosen deterministically so
// the set is stable all day but fresh tomorrow.
export interface DailySet {
  memories: Card[]; // on-this-day first (when available) + a few curated
  tune: Tune | null; // the closing game, when a playable song exists
}

export async function todaysSet(profile: Profile, hidden: string[], lang: Lang = 'en'): Promise<DailySet> {
  const [otd, curated, live, songs] = await Promise.all([onThisDay(profile, new Date(), lang), loadFeed(profile), liveCards(profile), songPool(profile)]);
  const rnd = mulberry32(seedFrom(`${todayKey()}|${profile.born}|${profile.country}|set`));
  const tune = buildTune(songs, rnd);
  const tuneId = tune?.answer.id;

  // One big, de-duplicated pool from the curated decks AND the deep feeds.
  const seen = new Set<string>();
  const all: Card[] = [];
  for (const c of [...curated, ...live].filter(worthShowing)) {
    if (!seen.has(c.id)) {
      seen.add(c.id);
      all.push(c);
    }
  }
  const today = todayKey();
  const blocked = (c: Card) => hidden.includes(c.id) || c.id === otd?.id || c.id === tuneId;
  const slotsForMemories = Math.max(1, 5 - (otd ? 1 : 0) - (tune ? 1 : 0));

  // Already generated today? Rebuild the exact same set so it's stable all day.
  const todayMark = readJSON<{ day: string; ids: string[] }>('hoot.todaySet', { day: '', ids: [] });
  let picks: Card[];
  if (todayMark.day === today && todayMark.ids.length) {
    picks = await localizeCards(todayMark.ids.map(id => all.find(c => c.id === id)).filter((c): c is Card => !!c), lang);
  } else {
    // Prefer cards not shown in the last ~dozen days; fall back to the full
    // pool only if that leaves too few (small countries / thin eras).
    const recent = new Set(recentSetIds());
    const fresh = all.filter(c => !blocked(c) && !recent.has(c.id));
    const pool = fresh.length >= slotsForMemories ? fresh : all.filter(c => !blocked(c));
    // Draw a few spares: cards with no version in the reader's language drop out.
    const spares = pickDiverse(pool, Math.min(pool.length, slotsForMemories * 4), rnd, profile.likes);
    picks = (await localizeCards(spares, lang)).slice(0, slotsForMemories);
    rememberSetIds(picks.map(c => c.id));
    writeJSON('hoot.todaySet', { day: today, ids: picks.map(c => c.id) });
  }
  const localTune = tune && lang !== 'en' ? await localizeTune(tune, lang) : tune;
  return { memories: otd ? [otd, ...picks] : picks, tune: localTune };
}

async function localizeTune(tune: Tune, lang: Lang): Promise<Tune> {
  const local = await localizeCards([tune.answer, ...tune.choices], lang);
  const byId = new Map(local.map(c => [c.id, c]));
  return { answer: byId.get(tune.answer.id) ?? tune.answer, choices: tune.choices.map(c => byId.get(c.id) ?? c) };
}

// ---- name that tune ----
export interface Tune {
  answer: Card; // the song actually playing
  choices: Card[]; // answer plus decoys, shuffled
}

// A tune round needs a single, named song to guess. Playlist cards ("The top
// hits of 1967") make poor choices — they're generic and several look alike —
// so only cards with a specific YouTube video and a real song title qualify.
const playable = (c: Card) => (c.type === 'music' || c.type === 'song') && !!c.yt && !c.pl && !isBadVideo(c.yt);

// Songs a tune round can use: the country's curated music plus any songs the
// overnight build pre-rendered (public/content/live/...), which carry YouTube
// ids from Wikidata. Static files, so this is cheap and needs no live calls.
async function songPool(profile: Profile): Promise<Card[]> {
  const curated = (await loadFeed(profile)).filter(playable);
  const live = await prebuiltSongs(profile);
  const byTitle = new Map<string, Card>();
  for (const s of [...curated, ...live]) if (!byTitle.has(s.title)) byTitle.set(s.title, s);
  return [...byTitle.values()];
}

let liveIndex: Record<string, number[]> | null | undefined;
const liveYearCache = new Map<string, Promise<Card[]>>();

// All of the overnight-built deep-feed cards for a profile's era — every type
// (news, sport, culture, science, music, tv, film), across the years they were
// 5–30. This is the big, varied pool the daily set draws from, so "today's
// five" isn't the same handful of curated songs every day.
async function liveCards(profile: Profile): Promise<Card[]> {
  try {
    if (liveIndex === undefined) {
      const r = await fetch('/content/live/index.json');
      liveIndex = r.ok ? await r.json() : null;
    }
    const years = (liveIndex?.[profile.country] ?? []).filter(y => y >= profile.born + 5 && y <= profile.born + 30);
    const lists = await Promise.all(
      years.map(y => {
        const key = `${profile.country}/${y}`;
        let p = liveYearCache.get(key);
        if (!p) {
          p = fetch(`/content/live/${profile.country}/${y}.json`)
            .then(r => (r.ok ? r.json() : []))
            .catch(() => []);
          liveYearCache.set(key, p);
        }
        return p;
      }),
    );
    return lists.flat() as Card[];
  } catch {
    return [];
  }
}

async function prebuiltSongs(profile: Profile): Promise<Card[]> {
  return (await liveCards(profile)).filter(playable);
}

// Ids shown in the last several days, so a fresh day doesn't repeat them.
function recentSetIds(): string[] {
  return readJSON<string[]>('hoot.recentSet', []);
}
function rememberSetIds(ids: string[]) {
  const merged = [...ids, ...recentSetIds()];
  writeJSON('hoot.recentSet', merged.slice(0, 60)); // keep ~a dozen days of history
}

export function buildTune(songs: Card[], rnd: () => number): Tune | null {
  // Need distinct titles so the choices aren't ambiguous.
  const byTitle = new Map<string, Card>();
  for (const s of songs) if (!byTitle.has(s.title)) byTitle.set(s.title, s);
  const uniq = [...byTitle.values()];
  if (uniq.length < 3) return null;
  const shuffled = pickN(uniq, uniq.length, rnd);
  const answer = shuffled[0];
  const decoys = shuffled.slice(1, 4);
  const choices = pickN([answer, ...decoys], 4, rnd).slice(0, Math.min(4, decoys.length + 1));
  return { answer, choices };
}

// A standalone tune round for the Games tab (independent of the daily set).
export async function tuneRound(profile: Profile, lang: Lang = 'en'): Promise<Tune | null> {
  const songs = await songPool(profile);
  const rnd = mulberry32((Math.random() * 1e9) >>> 0);
  const tune = buildTune(songs, rnd);
  return tune && lang !== 'en' ? localizeTune(tune, lang) : tune;
}

// Small helper so the component can lazily warm one curated year if the feed
// is thin (kept for parity with the feed's loader).
export { curatedYear, feedYears };
