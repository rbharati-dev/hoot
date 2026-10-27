// Puts every card in the reader's language before it's shown.
//
// Hand-written cards already carry translations (`t`). Cards pulled live from
// English Wikipedia (the overnight feeds, "on this day") don't, so for a
// non-English reader we look up the SAME article on their own Wikipedia and use
// its title and opening paragraph instead. The Source link and photo then come
// from that article too.
//
// A live card whose article doesn't exist in the reader's language is left out
// rather than shown in English. Songs are the exception: a song title reads the
// same in any language, so a song with no local article is kept with its title
// and player and no English text.
//
// Lookups are batched (50 titles per langlinks call, 20 per extracts call) and
// remembered on the device, so each article is only looked up once.
import type { Card, Lang } from './data';

const isMusic = (c: Card) => c.type === 'music' || c.type === 'song';
const hostOf = (c: Card) => c.host ?? 'en.wikipedia.org';
const MAX_TEXT = 420;

interface Local {
  title: string; // article title on the reader's Wikipedia
  text?: string; // its opening paragraph
}
type Memo = Record<string, Local | null>; // null = no article in this language

const memoKey = (lang: Lang) => `hoot.l10n.v1.${lang}`;
const memos = new Map<Lang, Memo>();
function memo(lang: Lang): Memo {
  let m = memos.get(lang);
  if (!m) {
    try {
      m = JSON.parse(localStorage.getItem(memoKey(lang)) ?? '{}') as Memo;
    } catch {
      m = {};
    }
    memos.set(lang, m);
  }
  return m;
}
function saveMemo(lang: Lang) {
  try {
    const m = memo(lang);
    const keys = Object.keys(m);
    // Keep the store bounded: drop the oldest entries past ~6000.
    if (keys.length > 6000) for (const k of keys.slice(0, keys.length - 6000)) delete m[k];
    localStorage.setItem(memoKey(lang), JSON.stringify(m));
  } catch {
    /* storage full or blocked: it just won't be remembered */
  }
}

const chunk = <T,>(a: T[], n: number) => Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

async function api(host: string, params: Record<string, string>) {
  const q = new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', origin: '*', redirects: '1', ...params });
  const r = await fetch(`https://${host}/w/api.php?${q}`);
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}

// Follow normalisation + redirects so a returned page maps back to the title we asked for.
function backMap(j: { query?: { normalized?: { from: string; to: string }[]; redirects?: { from: string; to: string }[] } }) {
  const back = new Map<string, string>();
  for (const n of [...(j.query?.normalized ?? []), ...(j.query?.redirects ?? [])]) back.set(n.to, back.get(n.from) ?? n.from);
  return (t: string) => back.get(t) ?? t;
}

/** Article titles on `lang`'s Wikipedia for titles on `host`. */
async function langTitles(host: string, titles: string[], lang: Lang): Promise<Map<string, string | null>> {
  const out = new Map<string, string | null>();
  for (const batch of chunk(titles, 50)) {
    const j = await api(host, { prop: 'langlinks', lllang: lang, lllimit: 'max', titles: batch.join('|') });
    const orig = backMap(j);
    for (const p of j.query?.pages ?? []) {
      const link = p.langlinks?.[0]?.title as string | undefined;
      out.set(orig(p.title), link ?? null);
    }
    for (const t of batch) if (!out.has(t)) out.set(t, null);
  }
  return out;
}

/** Opening paragraphs on `lang`'s Wikipedia. */
async function extracts(lang: Lang, titles: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const host = `${lang}.wikipedia.org`;
  for (const batch of chunk(titles, 20)) {
    const j = await api(host, { prop: 'extracts', exintro: '1', explaintext: '1', exlimit: 'max', titles: batch.join('|') });
    const orig = backMap(j);
    for (const p of j.query?.pages ?? []) if (p.extract) out.set(orig(p.title), clip(p.extract));
  }
  return out;
}

function clip(s: string) {
  const one = s.split('\n').find(x => x.trim().length > 40) ?? s;
  return one.length > MAX_TEXT ? one.slice(0, MAX_TEXT - 3).replace(/\s+\S*$/, '') + '…' : one;
}

// "“Song” by Artist" → "“Song” — Artist": song titles are names, "by" is English.
const songTitle = (title: string) => title.replace(/” by /, '” — ');
// "Tour de France 1962" stays; "Mercury (planet)" → "Mercury".
const articleTitle = (title: string) => title.replace(/\s*\([^)]*\)$/, '');

/** Resolve (and remember) the reader-language article for each card that needs one. */
async function resolve(cards: Card[], lang: Lang) {
  const m = memo(lang);
  const target = `${lang}.wikipedia.org`;
  const byHost = new Map<string, Set<string>>();
  for (const c of cards) {
    if (hostOf(c) === target || !c.wiki) continue;
    const k = `${hostOf(c)}|${c.wiki}`;
    if (k in m) continue;
    (byHost.get(hostOf(c)) ?? byHost.set(hostOf(c), new Set()).get(hostOf(c))!).add(c.wiki);
  }
  if (!byHost.size) return;
  const needText: string[] = [];
  const found = new Map<string, string>(); // key → local title
  for (const [host, set] of byHost) {
    const links = await langTitles(host, [...set], lang);
    for (const [title, local] of links) {
      const k = `${host}|${title}`;
      if (local) {
        found.set(k, local);
        needText.push(local);
      } else m[k] = null;
    }
  }
  const texts = needText.length ? await extracts(lang, [...new Set(needText)]) : new Map<string, string>();
  for (const [k, local] of found) m[k] = { title: local, text: texts.get(local) };
  saveMemo(lang);
}

/**
 * Cards ready for a reader in `lang`. English readers get the cards untouched.
 * If Wikipedia can't be reached, untranslated live cards are left out.
 */
export async function localizeCards(cards: Card[], lang: Lang): Promise<Card[]> {
  if (lang === 'en' || !cards.length) return cards;
  try {
    await resolve(cards, lang);
  } catch {
    /* offline: fall through with what we already know */
  }
  const m = memo(lang);
  const target = `${lang}.wikipedia.org`;
  const out: Card[] = [];
  for (const c of cards) {
    const local = hostOf(c) === target ? { title: c.wiki } : m[`${hostOf(c)}|${c.wiki}`];
    const own = c.t?.[lang];
    // Source link and photo from the reader's own Wikipedia when it has the article.
    const relink = local ? { wiki: local.title, host: target } : {};
    if (own) {
      out.push({ ...c, ...relink });
    } else if (hostOf(c) === target) {
      out.push({ ...c, date: undefined }); // already from the reader's Wikipedia
    } else if (isMusic(c)) {
      const title = songTitle(c.title);
      out.push({ ...c, ...relink, date: undefined, t: { ...c.t, [lang]: { title, text: local?.text ?? '' } } });
    } else if (local?.text) {
      out.push({ ...c, ...relink, date: undefined, t: { ...c.t, [lang]: { title: articleTitle(local.title), text: local.text } } });
    }
    // else: no article in this language — leave it out rather than show English.
  }
  return out;
}
