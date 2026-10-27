// Remembers the words recently used in the word games (crossword, word
// search, hangman, scramble), per language, so new puzzles prefer words the
// person hasn't just seen. Small and local.
import type { Lang } from './data';
import type { Entry } from './wordbank';

export const REMEMBER = 120; // words remembered per language
export const MIN_FRESH = 24; // keep at least this many words to build from

/** Entries not seen recently; falls back to the full list when too few remain. */
export function freshFirst(entries: Entry[], recent: string[], minFresh = MIN_FRESH): Entry[] {
  if (!recent.length) return entries;
  const seen = new Set(recent);
  const fresh = entries.filter(e => !seen.has(e.word));
  if (fresh.length >= minFresh) return fresh;
  // Not enough fresh words: use them all, but the least recently seen last-resort words after.
  const order = new Map(recent.map((w, i) => [w, i])); // 0 = most recent
  const stale = entries.filter(e => seen.has(e.word)).sort((a, b) => order.get(b.word)! - order.get(a.word)!);
  return [...fresh, ...stale];
}

/** Newest first, de-duplicated, capped. */
export function withUsed(recent: string[], used: string[], cap = REMEMBER): string[] {
  const out = [...used, ...recent.filter(w => !used.includes(w))];
  return out.slice(0, cap);
}

const key = (lang: Lang) => `hoot.recentWords.${lang}`;
export function readRecent(lang: Lang): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(key(lang)) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}
export function rememberUsed(lang: Lang, used: string[]) {
  try {
    localStorage.setItem(key(lang), JSON.stringify(withUsed(readRecent(lang), used)));
  } catch {
    /* storage blocked */
  }
}
