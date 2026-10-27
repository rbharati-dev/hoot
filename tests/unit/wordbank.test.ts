import { describe, expect, it } from 'vitest';
import { LANGS, COUNTRIES } from '../../src/lib/data';
import { DECKS, wordsFor, alphabet, units } from '../../src/lib/wordbank';
import { makeCrossword } from '../../src/lib/crossword';
import { buildWordSearch } from '../../src/lib/wordsearch';

const SCRIPT: Record<string, RegExp> = {
  ru: /^[А-ЯЁ]+$/u,
  hi: /^[ऀ-ॿ]+$/u,
  ne: /^[ऀ-ॿ]+$/u,
  de: /^[A-ZÄÖÜ]+$/,
  es: /^[A-ZÑ]+$/,
};
const latin = /^[A-Z]+$/;

describe('word bank', () => {
  it('every language has words, written in its own script', () => {
    for (const lang of LANGS) {
      const words = wordsFor(lang);
      expect(words.length, lang).toBeGreaterThanOrEqual(12);
      for (const e of words) expect(e.word, `${lang}: ${e.word}`).toMatch(SCRIPT[lang] ?? latin);
    }
  });

  it('born 1955 in the USSR, Russian: Soviet words in Russian, nothing Canadian', () => {
    const words = wordsFor('ru', { born: 1955, country: 'su' }).map(e => e.word);
    expect(words).toContain('ГАГАРИН');
    expect(words).toContain('СПУТНИК');
    for (const w of words) expect(w).toMatch(SCRIPT.ru);
    for (const canadian of ['HOCKEY', 'GRETZKY', 'LOONIE', 'TRUDEAU', 'EXPO']) expect(words).not.toContain(canadian);
  });

  it('born 1955 in the USSR, English: Soviet words in English, nothing Canadian', () => {
    const words = wordsFor('en', { born: 1955, country: 'su' }).map(e => e.word);
    expect(words).toContain('GAGARIN');
    for (const canadian of ['GRETZKY', 'LOONIE', 'TRUDEAU', 'HENDERSON', 'EXPO']) expect(words).not.toContain(canadian);
  });

  it('a country deck never leaks into another country', () => {
    const ca = new Set(wordsFor('en', { country: 'ca' }).map(e => e.word));
    const gb = wordsFor('en', { country: 'gb' }).map(e => e.word);
    expect(gb.filter(w => ['GRETZKY', 'LOONIE', 'MOUNTIE'].includes(w))).toEqual([]);
    expect(ca.has('GRETZKY')).toBe(true);
  });

  it('every country has a deck in its own language', () => {
    for (const c of COUNTRIES) expect(DECKS[c.code], c.code).toContain(c.lang);
  });

  it('favours the person’s era', () => {
    const words = wordsFor('en', { born: 1930, country: 'us' }).map(e => e.word);
    expect(words).not.toContain('ATARI'); // 1972 is past 1930+35
    expect(words).toContain('ELVIS');
  });

  it('builds a playable crossword and word search for every country in its language', () => {
    for (const c of COUNTRIES) {
      for (const lang of [c.lang, 'en' as const]) {
        const entries = wordsFor(lang, { born: 1955, country: c.code });
        for (let seed = 1; seed <= 5; seed++) {
          const cw = makeCrossword(seed * 7919, 9, entries);
          expect(cw.words.length, `${c.code}/${lang} crossword`).toBeGreaterThanOrEqual(4);
          for (const w of cw.words) expect(entries.some(e => e.word === w.word && e.clue === w.clue)).toBe(true);
          const ws = buildWordSearch(seed, 8, entries, alphabet(lang));
          expect(ws.placed.length, `${c.code}/${lang} word search`).toBeGreaterThanOrEqual(5);
        }
      }
    }
  });

  it('a Soviet-born German reader gets Soviet words in German spelling', () => {
    const words = wordsFor('de', { born: 1955, country: 'su' }).map(e => e.word);
    expect(words).toContain('BRESCHNEW');
    expect(words).not.toContain('KÄFER'); // West German deck must not leak in
  });

  it('every extra deck builds a crossword in its own script', () => {
    for (const [c, langs] of Object.entries(DECKS)) {
      for (const lang of langs) {
        const entries = wordsFor(lang, { born: 1955, country: c });
        for (const e of entries) expect(e.word, `${c}/${lang}: ${e.word}`).toMatch(SCRIPT[lang] ?? latin);
        expect(makeCrossword(42, 9, entries).words.length, `${c}/${lang}`).toBeGreaterThanOrEqual(4);
      }
    }
  });

  it('splits Devanagari into whole syllables', () => {
    expect(units('गांधी')).toEqual(['गां', 'धी']);
  });
});
