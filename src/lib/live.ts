// Live memories in the reader's browser. The heavy lifting (reading
// Wikipedia's year pages and turning them into cards) lives in wiki-core.ts so
// the exact same logic can run ahead of time in the nightly overnight build.
// Here we add the two browser-only pieces: a DOM parser and a localStorage
// cache, and we prefer a pre-built file when the overnight build has made one.

import type { Card } from './data';
import { buildYear, hasLive } from './wiki-core';

export { hasLive };

const parse = (html: string) => new DOMParser().parseFromString(html, 'text/html');

const CACHE = 'hoot.live.v2';
function cacheGet(key: string): Card[] | null {
  try {
    const raw = localStorage.getItem(`${CACHE}.${key}`);
    if (!raw) return null;
    const { at, cards } = JSON.parse(raw);
    return Date.now() - at < 14 * 864e5 ? cards : null;
  } catch {
    return null;
  }
}
function cacheSet(key: string, cards: Card[]) {
  try {
    localStorage.setItem(`${CACHE}.${key}`, JSON.stringify({ at: Date.now(), cards }));
  } catch {
    /* storage full: skip caching */
  }
}

// Years the overnight build has already produced, so we fetch a ready file
// instead of hitting Wikipedia live. Loaded once; absent file is fine.
let prebuiltIndex: Record<string, number[]> | null | undefined;
async function prebuilt(country: string, year: number): Promise<Card[] | null> {
  if (prebuiltIndex === undefined) {
    try {
      const r = await fetch('/content/live/index.json');
      prebuiltIndex = r.ok ? await r.json() : null;
    } catch {
      prebuiltIndex = null;
    }
  }
  if (!prebuiltIndex?.[country]?.includes(year)) return null;
  try {
    const r = await fetch(`/content/live/${country}/${year}.json`);
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

const inflight = new Map<string, Promise<Card[]>>();

export function liveYear(country: string, year: number): Promise<Card[]> {
  const key = `${country}.${year}`;
  const cached = cacheGet(key);
  if (cached) return Promise.resolve(cached);
  if (!inflight.has(key)) {
    inflight.set(
      key,
      (async () => {
        const ready = await prebuilt(country, year);
        const cards = ready ?? (await buildYear(country, year, parse));
        if (cards.length) cacheSet(key, cards);
        inflight.delete(key);
        return cards;
      })(),
    );
  }
  return inflight.get(key)!;
}
