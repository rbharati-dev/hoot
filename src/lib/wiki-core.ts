// The engine that turns Wikipedia's year pages into memory cards. It is kept
// free of anything browser-specific (no DOMParser, no localStorage) so it can
// run both in the reader's browser (src/lib/live.ts) and ahead of time in the
// nightly "overnight build" (scripts/overnight.mjs). The one thing it needs
// from its host is a way to parse an HTML string into a DOM Document, passed in
// as `parse`.

import type { Card } from "./data";

export type Host =
  | "en.wikipedia.org"
  | "es.wikipedia.org"
  | "fr.wikipedia.org"
  | "it.wikipedia.org"
  | "ru.wikipedia.org"
  | "de.wikipedia.org"
  | "pt.wikipedia.org"
  | "hi.wikipedia.org"
  | "ne.wikipedia.org";
export type ParseHTML = (html: string) => Document;

interface Source {
  host: Host;
  page: (y: number) => string;
  kind: "list" | "songs" | "rpm" | "tv" | "films" | "wikidata";
  section: RegExp;
  type: string;
  max: number;
  from?: number;
  to?: number;
  /** Keep only list items that mention the country (for world year pages). */
  filter?: RegExp;
  /** kind "wikidata": the country's Wikidata id; works made there that year. */
  wd?: { country: string; cls: string; minLinks: number };
}

// Wikidata classes for "works made in a country in a year".
const FILM = "Q11424";
// Films from Wikidata: the year's best-known films made in a country, with an
// article on `host`'s Wikipedia (ranked by how many Wikipedias cover them).
const wdFilms = (host: Host, country: string, max: number, minLinks: number, from?: number, to?: number): Source => ({
  host,
  page: () => "",
  kind: "wikidata",
  section: /./,
  type: "film",
  max,
  from,
  to,
  wd: { country, cls: FILM, minLinks },
});

const EVENTS = /^(Events|Acontecimientos)$/i;
// Items on world year pages that belong to a country.
const BIRTH_LINE = /^[^:–—]{3,30}[:–—]\s*[^,.]{3,60},\s*[^,.]{2,40},\s*[\p{L} ,y]{3,60}\.?$/u;
export const SOVIET = /СССР|Советск|советск|Москв|Ленинград|Союз ССР|ЦК КПСС|Хрущ|Брежнев|Горбач|Гагарин|Байконур|Олимпиада-80/;
export const GDR = /\bDDR\b|Ost-Berlin|Ostberlin|Volkskammer|\bSED\b|Ulbricht|Honecker|Deutsche Demokratische Republik|Stasi|DEFA|Nationale Volksarmee|Leipziger|Dresden|Rostock|Karl-Marx-Stadt/;
const CULTURE = /Arts|Culture|Music|Entertainment|Literature/i;

// The standard set pulled from a "<year> in <Country>" page: lots of news,
// plus sport and culture. Deep by design, so feeds rarely repeat.
const yearIn = (page: (y: number) => string, sportType = "sport"): Source[] => [
  {
    host: "en.wikipedia.org",
    page,
    kind: "list",
    section: EVENTS,
    type: "news",
    max: 100,
  },
  {
    host: "en.wikipedia.org",
    page,
    kind: "list",
    section: /^Sports?$/i,
    type: sportType,
    max: 28,
  },
  {
    host: "en.wikipedia.org",
    page,
    kind: "list",
    section: CULTURE,
    type: "culture",
    max: 30,
  },
  {
    host: "en.wikipedia.org",
    page,
    kind: "list",
    section: /Science|Technolog/i,
    type: "science",
    max: 18,
  },
];

export const SOURCES: Record<string, Source[]> = {
  ca: [
    ...yearIn((y) => `${y} in Canada`),
    {
      host: "en.wikipedia.org",
      page: (y) => `List of number-one singles of ${y} (Canada)`,
      kind: "rpm",
      section: /./,
      type: "music",
      max: 30,
      from: 1964,
    },
    {
      host: "en.wikipedia.org",
      page: (y) => `Billboard Year-End Hot 100 singles of ${y}`,
      kind: "songs",
      section: /./,
      type: "music",
      max: 30,
      from: 1946,
    },
    {
      host: "en.wikipedia.org",
      page: (y) => `${y} in Canadian television`,
      kind: "tv",
      section: /Debuts/i,
      type: "tv",
      max: 15,
    },
    {
      host: "en.wikipedia.org",
      page: (y) => `${y} in Canadian film`,
      kind: "films",
      section: /./,
      type: "film",
      max: 10,
    },
  ],
  us: [
    ...yearIn((y) => `${y} in the United States`),
    {
      host: "en.wikipedia.org",
      page: (y) => `Billboard Year-End Hot 100 singles of ${y}`,
      kind: "songs",
      section: /./,
      type: "music",
      max: 40,
      from: 1946,
    },
    {
      host: "en.wikipedia.org",
      page: (y) => `${y} in American television`,
      kind: "tv",
      section: /Debuts/i,
      type: "tv",
      max: 20,
    },
    {
      host: "en.wikipedia.org",
      page: (y) => `${y} in film`,
      kind: "films",
      section: /grossing/i,
      type: "film",
      max: 15,
    },
  ],
  gb: [
    ...yearIn((y) => `${y} in the United Kingdom`),
    {
      host: "en.wikipedia.org",
      page: (y) => `List of UK Singles Chart number ones of ${y}`,
      kind: "rpm",
      section: /./,
      type: "music",
      max: 30,
      from: 1952,
    },
    {
      host: "en.wikipedia.org",
      page: (y) => `${y} in British music`,
      kind: "list",
      section: /./,
      type: "music",
      max: 20,
    },
    {
      host: "en.wikipedia.org",
      page: (y) => `${y} in British television`,
      kind: "tv",
      section: /Debuts/i,
      type: "tv",
      max: 15,
    },
    {
      host: "en.wikipedia.org",
      page: (y) => `${y} in British film`,
      kind: "films",
      section: /./,
      type: "film",
      max: 10,
    },
  ],
  su: [
    ...yearIn((y) => `${y} in the Soviet Union`),
    // Russian Wikipedia: the year page (Soviet items only), Soviet films,
    // Soviet sport and television.
    {
      host: "ru.wikipedia.org",
      page: (y) => `${y} год`,
      kind: "list",
      section: /^События$/,
      type: "news",
      max: 18,
      to: 1991,
      filter: SOVIET,
    },
    {
      host: "ru.wikipedia.org",
      page: (y) => `${y} год в кино`,
      kind: "list",
      section: /^Советск/,
      type: "film",
      max: 8,
      to: 1991,
    },
    {
      host: "ru.wikipedia.org",
      page: (y) => `${y} год в спорте`,
      kind: "list",
      section: /^СССР$/,
      type: "sport",
      max: 12,
      to: 1991,
    },
    {
      host: "ru.wikipedia.org",
      page: (y) => `${y} год в телевидении`,
      kind: "list",
      section: /^События$/,
      type: "tv",
      max: 10,
      to: 1991,
    },
    wdFilms("ru.wikipedia.org", "Q15180", 8, 5, 1940, 1991),
  ],
  fr: [
    ...yearIn((y) => `${y} in France`),
    {
      host: "fr.wikipedia.org",
      page: (y) => `${y} en France`,
      kind: "list",
      section: /Événements|Culture/i,
      type: "news",
      max: 40,
    },
    {
      host: "en.wikipedia.org",
      page: (y) => `List of number-one singles of ${y} (France)`,
      kind: "rpm",
      section: /./,
      type: "music",
      max: 20,
      from: 1984,
    },
  ],
  de: [
    ...yearIn((y) => `${y} in West Germany`),
    ...yearIn((y) => `${y} in Germany`),
    {
      host: "en.wikipedia.org",
      page: (y) => `List of number-one hits of ${y} (Germany)`,
      kind: "rpm",
      section: /./,
      type: "music",
      max: 20,
      from: 1956,
    },
  ],
  dd: [
    ...yearIn((y) => `${y} in East Germany`),
    // German Wikipedia's year pages cover both Germanys and the world: keep
    // the East German items. Plus DEFA films from Wikidata.
    ...[/^Politik/, /^Kultur/, /^Sport$/, /^Wirtschaft$/, /^Wissenschaft/, /^Gesellschaft$/].map(
      (section, i): Source => ({
        host: "de.wikipedia.org",
        page: (y) => `${y}`,
        kind: "list",
        section,
        type: ["news", "culture", "sport", "news", "science", "news"][i],
        max: i === 0 ? 30 : 12,
        from: 1949,
        to: 1990,
        filter: GDR,
      }),
    ),
    {
      host: "de.wikipedia.org",
      page: (y) => `Musikjahr ${y}`,
      kind: "list",
      section: /^(Ereignisse|Populäre Musik)/,
      type: "music",
      max: 10,
      from: 1949,
      to: 1990,
      filter: GDR,
    },
    wdFilms("de.wikipedia.org", "Q16957", 6, 4, 1949, 1990),
  ],
  it: [
    ...yearIn((y) => `${y} in Italy`),
    {
      host: "it.wikipedia.org",
      page: (y) => `${y}`,
      kind: "list",
      section: /Italia/i,
      type: "news",
      max: 25,
    },
    {
      host: "en.wikipedia.org",
      page: (y) => `List of number-one hits of ${y} (Italy)`,
      kind: "rpm",
      section: /./,
      type: "music",
      max: 20,
      from: 1960,
    },
  ],
  br: [...yearIn((y) => `${y} in Brazil`)],
  ar: [
    ...yearIn((y) => `${y} in Argentina`),
    {
      host: "en.wikipedia.org",
      page: (y) => `List of number-one hits of ${y} (Argentina)`,
      kind: "rpm",
      section: /./,
      type: "music",
      max: 20,
      from: 1960,
    },
  ],
  co: [
    ...yearIn((y) => `${y} in Colombia`),
    // Spanish Wikipedia: a "Colombia in <year>" page for every year, and the
    // world year page's Colombian items.
    {
      host: "es.wikipedia.org",
      page: (y) => `Anexo:Colombia en ${y}`,
      kind: "list",
      section: EVENTS,
      type: "news",
      max: 40,
    },
    {
      host: "es.wikipedia.org",
      page: (y) => `${y}`,
      kind: "list",
      section: EVENTS,
      type: "news",
      max: 20,
      filter: /Colombia|colombian|Bogotá|Medellín|Cali\b|Barranquilla|Cartagena/,
    },
    {
      host: "es.wikipedia.org",
      page: (y) => `${y}`,
      kind: "list",
      section: /^(Deporte|Música|Cine)$/,
      type: "culture",
      max: 10,
      filter: /Colombia|colombian/,
    },
    wdFilms("es.wikipedia.org", "Q739", 5, 2),
  ],
  mx: [
    {
      host: "es.wikipedia.org",
      page: (y) => `Anexo:México en ${y}`,
      kind: "list",
      section: EVENTS,
      type: "news",
      max: 50,
    },
    ...yearIn((y) => `${y} in Mexico`),
    {
      host: "es.wikipedia.org",
      page: (y) => `Anexo:México en ${y}`,
      kind: "list",
      section: /Cinematograf/i,
      type: "film",
      max: 15,
    },
    {
      host: "en.wikipedia.org",
      page: (y) => `${y} in Mexican cinema`,
      kind: "list",
      section: /highest|grossing|notable|released|films/i,
      type: "film",
      max: 10,
    },
  ],
  in: [
    ...yearIn((y) => `${y} in India`, "cricket"),
    {
      host: "en.wikipedia.org",
      page: (y) => `${y} in Indian cinema`,
      kind: "list",
      section: /highest|grossing|notable|released/i,
      type: "film",
      max: 20,
    },
  ],
  np: [
    ...yearIn((y) => `${y} in Nepal`),
    // Nepal has no "year in Nepal" pages before the 2000s in any language:
    // take the Nepal items from the English and Hindi world year pages, and
    // Nepali films from Wikidata. Hand-written cards carry the rest.
    {
      host: "en.wikipedia.org",
      page: (y) => `${y}`,
      kind: "list",
      section: EVENTS,
      type: "news",
      max: 10,
      filter: /Nepal|Kathmandu|Everest|Gurkha/,
    },
    {
      host: "hi.wikipedia.org",
      page: (y) => `${y}`,
      kind: "list",
      section: /^घटनाएँ$/,
      type: "news",
      max: 10,
      filter: /नेपाल|काठमांडू|काठमाण्डू|एवरेस्ट/,
    },
    wdFilms("ne.wikipedia.org", "Q837", 6, 1),
    wdFilms("en.wikipedia.org", "Q837", 6, 1),
  ],
};

// What everyone lived through, whatever the country: the world's big news of
// the year, science and space, new books and art. Added to every country; for
// non-English readers the same articles are shown from their own Wikipedia.
const WORLD: Source[] = [
  { host: "en.wikipedia.org", page: (y) => `${y}`, kind: "list", section: EVENTS, type: "news", max: 22 },
  { host: "en.wikipedia.org", page: (y) => `${y} in science`, kind: "list", section: /^(Events|Astronomy|Space|Technology|Computer science|Medicine|Biology|Physics|Chemistry)/i, type: "science", max: 8 },
  { host: "en.wikipedia.org", page: (y) => `${y} in spaceflight`, kind: "list", section: /^(Events|Highlights|Summary|Orbital launches)/i, type: "space", max: 4, from: 1957 },
  { host: "en.wikipedia.org", page: (y) => `${y} in literature`, kind: "list", section: /^(New books|Fiction|Novels|Events)/i, type: "culture", max: 8 },
  { host: "en.wikipedia.org", page: (y) => `${y} in art`, kind: "list", section: /^(Events|Works)/i, type: "culture", max: 5 },
];
for (const list of Object.values(SOURCES)) list.push(...WORLD);

export function hasLive(country: string) {
  return country in SOURCES;
}

const GENERIC =
  /\b(city|town|village|municipality|province|territory|state of|U\.S\. state|country|capital|political party|county|borough|neighbourhood|neighborhood|ciudad|municipio|estado|país|partido político|capital|year|año|month|calendar|television network|cadena de televisión|Stadt|Gemeinde|Bundesland|Landkreis|Hauptstadt|Jahr|Staat in|Republik in|Begriff|término|concepto|sovereign state|concept|departamento|departamentos de)\b|(^|[\s,(])(город|столица|страна|государство|республика|деревня|село|область|год|месяц|понятие|термин)([\s,.)]|$)/i;
const HEAVY =
  /\b(dies|died|dead|death|deaths|killed|kills|murder|assassinat|shot|shooting|massacre|bomb|crash|disaster|explosion|riot|war\b|fire kills|earthquake|hurricane|flood|muere|muerte|mueren|asesin|masacre|terremoto|sismo|accidente|guerra|incendio|abatid|guerriller|secuestr|atentado|stirbt|getötet|Anschlag|Unglück)|(погиб|катастроф|убит|авари|теракт)/i;
const DATEISH =
  /^(\d{1,2} (января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября|ноября|декабря)|\d{1,4} год|\d{1,2}\. (Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)|(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember) \d{4}|\d{1,4}|\d{1,2} de [a-záéíóú]+|(january|february|march|april|may|june|july|august|september|october|november|december) \d{1,2}|\d{1,2} (january|february|march|april|may|june|july|august|september|october|november|december)|[a-záéíóú]+ de \d{4}|\d{4} en [A-ZÁÉÍÓÚ][\w ]+|\d{4} in [A-Z][\w ]+)$/i;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Wikimedia requires a descriptive User-Agent and throttles or blocks requests
// without one. Browsers send their own UA (and forbid overriding it, ignoring
// this header silently), but the Node overnight build must set it or most
// requests come back empty — which is exactly what starved the deep feeds.
// Only in Node — in the browser these are forbidden/preflight-triggering and
// would break the client-side live fetches, and the browser sends its own UA.
const isNode = typeof window === "undefined";
const WIKI_HEADERS: Record<string, string> | undefined = isNode
  ? {
      "User-Agent": "HootApp/1.0 (https://hoot.app; nostalgia app for seniors)",
      "Api-User-Agent": "HootApp/1.0 (https://hoot.app)",
    }
  : undefined;

async function api(host: Host, params: Record<string, string>) {
  const q = new URLSearchParams({
    origin: "*",
    format: "json",
    formatversion: "2",
    ...params,
  });
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(`https://${host}/w/api.php?${q}`, {
        headers: WIKI_HEADERS,
      });
      if (r.ok) return r.json();
      if (r.status === 429) await wait(1500 * (attempt + 1)); // backoff on throttle
    } catch {
      /* retry */
    }
    await wait(500);
  }
  return null;
}

// Several sources read the same "<year> in <Country>" page (events, sport,
// culture); cache the fetched+parsed document for the duration of one year so
// we don't download it repeatedly. Cleared at the start of each buildYear.
let docCache = new Map<string, Promise<Document | null>>();
function pageDoc(
  host: Host,
  title: string,
  parse: ParseHTML,
): Promise<Document | null> {
  const key = `${host}|${title}`;
  let p = docCache.get(key);
  if (!p) {
    p = fetchDoc(host, title, parse);
    docCache.set(key, p);
  }
  return p;
}
async function fetchDoc(
  host: Host,
  title: string,
  parse: ParseHTML,
): Promise<Document | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(
        `https://${host}/api/rest_v1/page/html/${encodeURIComponent(title.replace(/ /g, "_"))}`,
        { headers: WIKI_HEADERS },
      );
      if (r.ok) return parse(await r.text());
      if (r.status === 404) return null; // page genuinely doesn't exist
      if (r.status === 429) await wait(1500 * (attempt + 1));
    } catch {
      /* retry */
    }
    await wait(500);
  }
  return null;
}

function sectionOf(doc: Document, re: RegExp): Element | null {
  if (re.source === ".") return doc.body;
  const h = [...doc.querySelectorAll("h2, h3")].find((x) =>
    re.test((x.textContent ?? "").trim()),
  );
  return h?.closest("section") ?? null;
}

const linkTitle = (a: Element) =>
  decodeURIComponent(
    (a.getAttribute("href") ?? "").replace(/^\.\//, "").split("#")[0],
  ).replace(/_/g, " ");
const clean = (s: string) =>
  s
    .replace(/\[[^\]]*\]/g, "")
    .replace(/\s+/g, " ")
    .trim();

interface Raw {
  title: string;
  date?: string;
  links: string[];
  listen?: string;
  photo?: string[];
}

export function readList(sec: Element, filter?: RegExp): Raw[] {
  const out: Raw[] = [];
  for (const li of sec.querySelectorAll("li")) {
    if (li.querySelector("li")) continue;
    const text = clean(li.textContent ?? "");
    if (text.length < 25) continue;
    if (filter && !filter.test(text)) continue;
    // A birthday line ("18 de enero: Name, Medellín, actriz.") is not an event.
    if (BIRTH_LINE.test(text)) continue;
    const links = [...li.querySelectorAll('a[rel="mw:WikiLink"]')]
      .map(linkTitle)
      .filter(
        (t) =>
          t &&
          !/^(File|Archivo|Category|Categoría|Anexo):/.test(t) &&
          !DATEISH.test(t),
      );
    if (!links.length) continue;
    const m = text.match(/^([^:–—-]{3,30})\s*[:–—-]\s+(.+)$/);
    const looksLikeDate =
      m &&
      /\d|january|february|march|april|may|june|july|august|september|october|november|december|enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre/i.test(
        m[1],
      );
    out.push({
      title: looksLikeDate ? m![2] : text,
      date: looksLikeDate ? m![1].trim() : undefined,
      links: links.slice(0, 5),
    });
  }
  return out;
}

export function readTable(sec: Element, kind: Source["kind"]): Raw[] {
  const out: Raw[] = [];
  const seen = new Set<string>();
  const rows = (table: Element) => [...table.querySelectorAll("tr")];
  for (const table of sec.querySelectorAll("table.wikitable")) {
    // Which column holds the artist? Read the header so a "Country" column
    // (some French chart years) is never mistaken for the singer.
    const head = rows(table).find(
      (tr) => tr.querySelector("th") && !tr.querySelector("td"),
    );
    const headers = head
      ? [...head.querySelectorAll("th")].map((th) =>
          clean(th.textContent ?? ""),
        )
      : [];
    const artistCol = headers.findIndex((h) =>
      /artist|performer|interpr|singer|band|act\b/i.test(h),
    );
    for (const tr of rows(table)) {
      const cells = [...tr.querySelectorAll("td, th")];
      if (cells.length < 2) continue;
      const linksIn = (c: Element | undefined) =>
        c ? [...c.querySelectorAll('a[rel="mw:WikiLink"]')].map(linkTitle) : [];
      if (kind === "songs" || kind === "rpm") {
        const songCell = cells.find((c) =>
          /^["“]/.test(clean(c.textContent ?? "")),
        );
        if (!songCell) continue;
        // Drop footnote marks (†, ‡, *, [a]) that ride along with titles.
        const song = clean(songCell.textContent ?? "")
          .replace(/["“”]/g, "")
          .replace(/[†‡*§¶]+|\[[^\]]*\]/g, "")
          .trim();
        // Rows that continue a rowspan are shorter than the header; shift to match.
        const shift = headers.length ? headers.length - cells.length : 0;
        const artistCell = headers.length
          ? artistCol >= 0
            ? cells[artistCol - shift]
            : undefined
          : cells[cells.indexOf(songCell) + 1];
        const artist =
          artistCell && artistCell !== songCell
            ? clean(artistCell.textContent ?? "")
                .replace(/[†‡*§¶]+|\[[^\]]*\]/g, "")
                .trim()
            : "";
        if (!song || seen.has(song)) continue;
        seen.add(song);
        out.push({
          title: artist ? `“${song}” by ${artist}` : `“${song}”`,
          links: linksIn(songCell).length
            ? linksIn(songCell)
            : linksIn(artistCell),
          photo: linksIn(artistCell),
          listen: `${song} ${artist}`.trim(),
        });
      } else if (kind === "tv") {
        const link = cells
          .flatMap(linksIn)
          .find(
            (t) =>
              !/(network|NBC|CBS|ABC|CBC|CTV|DuMont|Radio-Canada)$/i.test(t),
          );
        if (!link || seen.has(link)) continue;
        seen.add(link);
        out.push({ title: link.replace(/\s*\((.*?)\)$/, ""), links: [link] });
      } else if (kind === "films") {
        const link = cells.slice(0, 3).flatMap(linksIn)[0];
        if (!link || seen.has(link)) continue;
        seen.add(link);
        out.push({
          title: link.replace(/\s*\((.*?)film\)$/, ""),
          links: [link],
        });
      }
    }
  }
  return out;
}

interface PageInfo {
  title: string;
  description?: string;
  thumb?: string;
  qid?: string;
  extract?: string;
}

async function pageInfo(
  host: Host,
  titles: string[],
): Promise<Map<string, PageInfo>> {
  const map = new Map<string, PageInfo>();
  const uniq = [...new Set(titles)];
  for (let i = 0; i < uniq.length; i += 50) {
    const chunk = uniq.slice(i, i + 50);
    const j = await api(host, {
      action: "query",
      redirects: "1",
      prop: "description|pageimages|pageprops",
      piprop: "thumbnail",
      pithumbsize: "1280",
      ppprop: "wikibase_item|disambiguation",
      titles: chunk.join("|"),
    });
    if (!j?.query) continue;
    const alias = new Map<string, string>();
    for (const n of j.query.normalized ?? []) alias.set(n.from, n.to);
    for (const r of j.query.redirects ?? []) alias.set(r.from, r.to);
    const byTitle = new Map<string, PageInfo>();
    for (const p of j.query.pages ?? []) {
      if (p.missing || p.pageprops?.disambiguation !== undefined) continue;
      byTitle.set(p.title, {
        title: p.title,
        description: p.description,
        thumb: p.thumbnail?.source,
        qid: p.pageprops?.wikibase_item,
      });
    }
    for (const t of chunk) {
      let k = t;
      for (let hop = 0; hop < 3 && alias.has(k); hop++) k = alias.get(k)!;
      const info = byTitle.get(k);
      if (info) map.set(t, info);
    }
  }
  return map;
}

async function addExtracts(host: Host, infos: PageInfo[]) {
  const titles = [...new Set(infos.map((i) => i.title))];
  const ex = new Map<string, string>();
  for (let i = 0; i < titles.length; i += 20) {
    const j = await api(host, {
      action: "query",
      prop: "extracts",
      exintro: "1",
      explaintext: "1",
      exsentences: "2",
      exlimit: "20",
      titles: titles.slice(i, i + 20).join("|"),
    });
    for (const p of j?.query?.pages ?? [])
      if (p.extract)
        ex.set(p.title, clean(p.extract.replace(/\s*\([^)]*\)/, "")));
  }
  for (const info of infos) info.extract = ex.get(info.title);
}

async function youtubeIds(qids: string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  const uniq = [...new Set(qids)];
  for (let i = 0; i < uniq.length; i += 50) {
    try {
      const r = await fetch(
        `https://www.wikidata.org/w/api.php?origin=*&format=json&action=wbgetentities&props=claims&ids=${uniq.slice(i, i + 50).join("|")}`,
      );
      const j = await r.json();
      for (const [q, e] of Object.entries<{
        claims?: Record<
          string,
          { mainsnak?: { datavalue?: { value?: string } } }[]
        >;
      }>(j.entities ?? {})) {
        const v = e.claims?.P1651?.[0]?.mainsnak?.datavalue?.value;
        if (v) out.set(q, v);
      }
    } catch {
      /* no videos is fine */
    }
  }
  return out;
}


// Works (films) made in a country in a year, from Wikidata, best-known first
// (by how many Wikipedias have an article), with their article on src.host.
const WDQS = "https://query.wikidata.org/sparql";
export function wikidataQuery(country: string, cls: string, year: number, host: string, limit: number, minLinks = 1) {
  return `SELECT ?article (SAMPLE(?sl) AS ?links) WHERE {
  ?work wdt:P31 wd:${cls}; wdt:P495 wd:${country}; wdt:P577 ?date; wikibase:sitelinks ?sl.
  FILTER(YEAR(?date) = ${year} && ?sl >= ${minLinks})
  ?article schema:about ?work; schema:isPartOf <https://${host}/>.
} GROUP BY ?article ORDER BY DESC(?links) LIMIT ${limit}`;
}
/** Article title from a Wikipedia article URL. */
export const titleFromUrl = (url: string) => decodeURIComponent(url.replace(/^https:\/\/[^/]+\/wiki\//, "")).replace(/_/g, " ");
/** "Bonnie and Clyde (film)" / "Die Legende von Paul und Paula (Film)" → the plain name. */
export const workTitle = (t: string) => t.replace(/\s*\((?:[^()]*(?:\bfilm\b|\bFilm\b|фильм|película|filme|फ़िल्म|फिल्म|चलचित्र)[^()]*|\d{4})\)$/, "");

async function wikidataWorks(src: Source, year: number): Promise<Raw[]> {
  if (!src.wd) return [];
  const q = wikidataQuery(src.wd.country, src.wd.cls, year, src.host, src.max * 2, src.wd.minLinks);
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(`${WDQS}?format=json&query=${encodeURIComponent(q)}`, {
        headers: { ...(WIKI_HEADERS ?? {}), Accept: "application/sparql-results+json" },
      });
      if (r.ok) {
        const j = await r.json();
        return (j.results?.bindings ?? []).map((b: { article: { value: string } }) => {
          const title = titleFromUrl(b.article.value);
          return { title: workTitle(title), links: [title] };
        });
      }
      if (r.status === 429) await wait(3000 * (attempt + 1));
    } catch {
      /* retry */
    }
    await wait(1000);
  }
  return [];
}

const isFree = (src?: string) =>
  !!src && src.includes("/wikipedia/commons/") && !/\.svg/i.test(src);

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

async function fromSource(
  country: string,
  year: number,
  src: Source,
  parse: ParseHTML,
): Promise<Card[]> {
  if (src.from && year < src.from) return [];
  if (src.to && year > src.to) return [];
  let raws: Raw[];
  if (src.kind === "wikidata") {
    raws = (await wikidataWorks(src, year)).slice(0, src.max * 2);
  } else {
    const doc = await pageDoc(src.host, src.page(year), parse);
    if (!doc) return [];
    const sec = sectionOf(doc, src.section);
    if (!sec) return [];
    raws = (
      src.kind === "list" ? readList(sec, src.filter) : readTable(sec, src.kind)
    ).slice(0, src.max * 2);
  }
  if (!raws.length) return [];

  const infos = await pageInfo(
    src.host,
    raws.flatMap((r) => [...r.links, ...(r.photo ?? [])]),
  );
  const chosen: { raw: Raw; info: PageInfo; photo?: string }[] = [];
  for (const raw of raws) {
    const cands = raw.links
      .map((l) => infos.get(l))
      .filter((x): x is PageInfo => !!x);
    const good = cands.filter(
      (c) => !GENERIC.test(c.description ?? "") && !DATEISH.test(c.title),
    );
    const pick =
      src.kind === "list"
        ? (good.find((c) => isFree(c.thumb)) ?? good[0])
        : cands[0];
    if (!pick) continue;
    const photo = !isFree(pick.thumb)
      ? (raw.photo ?? [])
          .map((l) => infos.get(l))
          .find((c) => c && isFree(c.thumb))?.title
      : undefined;
    chosen.push({ raw, info: pick, photo });
    if (chosen.length >= src.max) break;
  }
  await addExtracts(
    src.host,
    chosen.map((c) => c.info),
  );
  const yt =
    src.kind === "songs" || src.kind === "rpm"
      ? await youtubeIds(chosen.map((c) => c.info.qid!).filter(Boolean))
      : new Map<string, string>();

  return chosen
    // A film needs more than "X is a 1981 film by Y" to be worth a card.
    .filter((c) => c.info.extract && c.info.extract.length > (src.type === "film" ? 110 : 40))
    .map(({ raw, info, photo }) => {
      const card: Card = {
        id: `w-${country}-${year}-${hash(src.host + raw.title)}`,
        year,
        type: src.type,
        // Keep the whole title — the card shows it in full. Only trim an
        // extreme outlier, and then at a word boundary so it never cuts a word.
        title:
          raw.title.length > 240
            ? raw.title.slice(0, 240).replace(/\s+\S*$/, "") + "…"
            : raw.title,
        text:
          info.extract!.length > 420
            ? info.extract!.slice(0, 417) + "…"
            : info.extract!,
        wiki: info.title,
        host: src.host,
        date: raw.date,
        live: true,
      };
      if (HEAVY.test(raw.title)) card.heavy = true;
      if (raw.listen) card.listen = raw.listen;
      if (photo) card.photo = photo;
      const v = info.qid && yt.get(info.qid);
      if (v) card.yt = v;
      return card;
    });
}

// Fetch and de-duplicate every source for one country-year. Host-agnostic.
export async function buildYear(
  country: string,
  year: number,
  parse: ParseHTML,
): Promise<Card[]> {
  docCache = new Map(); // fresh page cache per country-year
  const lists = await Promise.all(
    (SOURCES[country] ?? []).map((s) =>
      fromSource(country, year, s, parse).catch(() => [] as Card[]),
    ),
  );
  const seen = new Set<string>();
  return lists
    .flat()
    .filter((c) => (seen.has(c.wiki) ? false : (seen.add(c.wiki), true)));
}
