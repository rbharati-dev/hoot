// The story pages' words in the reader's language, with English as the
// fallback for anything not translated yet.
import type { Lang } from '../data';
import { en, type StoryStrings } from './strings-en';
import ru from './strings-ru.json';
import fr from './strings-fr.json';
import de from './strings-de.json';
import it from './strings-it.json';
import pt from './strings-pt.json';
import es from './strings-es.json';
import hi from './strings-hi.json';
import ne from './strings-ne.json';

const OTHER: Record<Exclude<Lang, 'en'>, Partial<StoryStrings>> = { ru, fr, de, it, pt, es, hi, ne } as Record<Exclude<Lang, 'en'>, Partial<StoryStrings>>;
const cache = new Map<Lang, StoryStrings>();

export function storyStrings(lang: Lang): StoryStrings {
  let s = cache.get(lang);
  if (!s) {
    s = lang === 'en' ? en : ({ ...en, ...OTHER[lang] } as StoryStrings);
    cache.set(lang, s);
  }
  return s;
}

type Key = { [K in keyof StoryStrings]: StoryStrings[K] extends string ? K : never }[keyof StoryStrings];
/** Fills {placeholders}; uses the key's `_one` form when n is 1. */
export function fmt(s: StoryStrings, key: Key, vars: Record<string, string | number> = {}): string {
  const one = `${key}_one` as Key;
  const template = (vars.n === 1 || vars.m === 1) && one in s ? (s[one] as string) : (s[key] as string);
  return template.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ''));
}
