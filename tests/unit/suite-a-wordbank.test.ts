import { describe, expect, it } from 'vitest';
import { COUNTRIES, LANGS, type Lang } from '../../src/lib/data';
import { norm, units, wordsFor, packsFor, packWords, alphabet, syllables, isDeva } from '../../src/lib/wordbank';
import { PACKS, PACK_IDS } from '../../src/lib/packs';

const SCRIPT: Record<Lang, RegExp> = {
  en: /^[A-Z]+$/, fr: /^[A-Z]+$/, it: /^[A-Z]+$/, pt: /^[A-Z]+$/,
  de: /^[A-ZÄÖÜ]+$/, es: /^[A-ZÑ]+$/, ru: /^[А-ЯЁ]+$/u, hi: /^[ऀ-ॿ]+$/u, ne: /^[ऀ-ॿ]+$/u,
};
const YEARS = [1940, 1955, 1970];

const combos: [Lang, string, number][] = [];
for (const lang of LANGS) for (const c of COUNTRIES) for (const y of YEARS) combos.push([lang, c.code, y]);

describe('wordsFor: structure for every language x country x birth year', () => {
  it.each(combos)('%s / %s / born %i gives >= 12 well-formed entries', (lang, country, born) => {
    const es = wordsFor(lang, { born, country });
    expect(es.length).toBeGreaterThanOrEqual(12);
    const seen = new Set<string>();
    for (const e of es) {
      expect(e.word, `${lang}/${country}: ${e.word}`).toMatch(SCRIPT[lang]);
      expect(seen.has(e.word), `duplicate ${e.word}`).toBe(false);
      seen.add(e.word);
      expect(e.units.join('')).toBe(e.word);
      expect(e.units).toEqual(units(e.word));
      expect(e.clue.trim().length).toBeGreaterThanOrEqual(4);
      expect(e.clue).not.toBe(e.word);
    }
  });
});

describe('wordsFor: era filtering', () => {
  it.each(combos)('%s / %s / born %i keeps dated local entries inside [born-3, born+35] when enough remain', (lang, country, born) => {
    const everyday = new Set(wordsFor(lang).map(e => e.word));
    const all = wordsFor(lang, { country });
    const local = all.filter(e => !everyday.has(e.word));
    const lo = born - 3, hi = born + 35;
    const inEra = local.filter(e => e.year === undefined || (e.year >= lo && e.year <= hi));
    const got = wordsFor(lang, { born, country });
    if (local.length && inEra.length >= 8) {
      for (const e of got.filter(x => !everyday.has(x.word))) {
        if (e.year !== undefined) {
          expect(e.year, e.word).toBeGreaterThanOrEqual(lo);
          expect(e.year, e.word).toBeLessThanOrEqual(hi);
        }
      }
      expect(got.filter(x => !everyday.has(x.word)).length).toBe(inEra.length);
    } else {
      // too few in era: the full local deck is kept
      expect(got.length).toBe(all.length);
    }
  });
});

describe('wordsFor: general behaviour', () => {
  it('without a profile returns the everyday deck for each language', () => {
    for (const lang of LANGS) expect(wordsFor(lang).length).toBeGreaterThanOrEqual(12);
  });
  it('unknown country falls back to everyday words', () => {
    for (const lang of LANGS) {
      expect(wordsFor(lang, { country: 'zz', born: 1950 }).map(e => e.word)).toEqual(wordsFor(lang).map(e => e.word));
    }
  });
  it('is deterministic', () => {
    expect(wordsFor('ru', { born: 1955, country: 'su' })).toEqual(wordsFor('ru', { born: 1955, country: 'su' }));
  });
  it('a narrower era never yields more entries than the unfiltered deck', () => {
    for (const lang of LANGS) for (const c of COUNTRIES) {
      expect(wordsFor(lang, { born: 1955, country: c.code }).length).toBeLessThanOrEqual(wordsFor(lang, { country: c.code }).length);
    }
  });
  it('culture words come before everyday filler', () => {
    const everyday = new Set(wordsFor('en').map(e => e.word));
    const es = wordsFor('en', { country: 'ca' });
    const firstEveryday = es.findIndex(e => everyday.has(e.word));
    const lastLocal = es.map(e => !everyday.has(e.word)).lastIndexOf(true);
    expect(lastLocal).toBeLessThan(firstEveryday === -1 ? Infinity : firstEveryday + 1 + es.length);
    expect(es.length).toBeGreaterThan(everyday.size);
  });
});

describe('theme packs', () => {
  const rows: [string, Lang][] = [];
  for (const p of PACK_IDS) for (const l of LANGS) rows.push([p, l]);

  it.each(rows)('pack %s in %s has >= 16 well-formed words', (pack, lang) => {
    const ws = packWords(lang, pack as (typeof PACK_IDS)[number]);
    expect(ws.length).toBeGreaterThanOrEqual(16);
    for (const e of ws) {
      expect(e.word).toMatch(SCRIPT[lang]);
      expect(e.units.join('')).toBe(e.word);
      expect(e.clue.length).toBeGreaterThanOrEqual(4);
      expect(e.clue).not.toBe(e.word);
    }
  });

  it.each(rows)('packsFor(%s lang %s) lists the pack', (pack, lang) => {
    expect(packsFor(lang)).toContain(pack);
  });

  it.each(rows)('wordsFor(%s pack, %s) returns only pack words', (pack, lang) => {
    const p = pack as (typeof PACK_IDS)[number];
    const allowed = new Set(packWords(lang, p).map(e => e.word));
    const got = wordsFor(lang, { born: 1955, country: 'us' }, p);
    expect(got.length).toBeGreaterThanOrEqual(12);
    for (const e of got) expect(allowed.has(e.word), e.word).toBe(true);
  });

  it.each(PACK_IDS.map(p => [p]))('pack %s has an icon and a name in every language', pack => {
    const p = PACKS[pack as (typeof PACK_IDS)[number]];
    expect(p.icon.length).toBeGreaterThan(0);
    for (const l of LANGS) expect(p.name[l].length).toBeGreaterThan(2);
  });

  it('pack words ignore the country profile', () => {
    expect(wordsFor('en', { country: 'in', born: 1940 }, 'space')).toEqual(wordsFor('en', { country: 'ca', born: 1970 }, 'space'));
  });
  it('packsFor returns all four packs in every language', () => {
    for (const l of LANGS) expect(packsFor(l)).toEqual([...PACK_IDS]);
  });
});

describe('norm()', () => {
  it.each([
    ['en', 'Café', 'CAFE'],
    ['en', 'rock-and-roll', 'ROCKANDROLL'],
    ['en', "Rock 'n' Roll", 'ROCKNROLL'],
    ['en', 'naïve', 'NAIVE'],
    ['fr', 'Élève', 'ELEVE'],
    ['fr', 'garçon', 'GARCON'],
    ['fr', 'cerf-volant', 'CERFVOLANT'],
    ['fr', 'Noël', 'NOEL'],
    ['it', 'città', 'CITTA'],
    ['it', 'perché', 'PERCHE'],
    ['pt', 'coração', 'CORACAO'],
    ['pt', 'avô', 'AVO'],
    ['pt', 'São Paulo', 'SAOPAULO'],
    ['es', 'España', 'ESPAÑA'],
    ['es', 'niño', 'NIÑO'],
    ['es', 'canción', 'CANCION'],
    ['es', 'pingüino', 'PINGUINO'],
    ['es', 'AÑO', 'AÑO'],
    ['de', 'Müller', 'MÜLLER'],
    ['de', 'Käse', 'KÄSE'],
    ['de', 'Österreich', 'ÖSTERREICH'],
    ['de', 'Straße', 'STRASSE'],
    ['de', 'Fußball', 'FUSSBALL'],
    ['de', 'über', 'ÜBER'],
    ['ru', 'Ёлка', 'ЕЛКА'],
    ['ru', 'всё', 'ВСЕ'],
    ['ru', 'Гагарин', 'ГАГАРИН'],
    ['ru', 'как-то', 'КАКТО'],
    ['hi', 'चाय पानी', 'चायपानी'],
    ['hi', 'राज-कपूर', 'राजकपूर'],
    ['hi', 'डॉ. बच्चन', 'डॉबच्चन'],
    ['ne', 'सगरमाथा', 'सगरमाथा'],
    ['ne', 'नारायण गोपाल', 'नारायणगोपाल'],
  ] as [Lang, string, string][])('norm(%s, %j) = %j', (lang, input, expected) => {
    expect(norm(lang, input)).toBe(expected);
  });

  it('English strips Ñ to N but Spanish keeps it', () => {
    expect(norm('en', 'ñ')).toBe('N');
    expect(norm('es', 'ñ')).toBe('Ñ');
  });
  it('Russian turns Ё into Е', () => {
    expect(norm('ru', 'ёлка')).toBe('ЕЛКА');
  });
  // Regression: Russian Й was once folded to И by accent stripping (fixed).
  it('Russian keeps Й (norm must not fold Й to И)', () => {
    expect(norm('ru', 'ёй')).toBe('ЕЙ');
  });
  it('Russian everyday deck still contains ТРАМВАЙ', () => {
    expect(wordsFor('ru').map(e => e.word)).toContain('ТРАМВАЙ');
  });
  it('German keeps umlauts, French folds them to the base letter', () => {
    expect(norm('de', 'ö')).toBe('Ö');
    expect(norm('fr', 'ö')).toBe('O');
  });
  it('norm is idempotent for every word in the bank', () => {
    for (const l of LANGS) for (const e of wordsFor(l, { country: COUNTRIES.find(c => c.lang === l)?.code })) {
      expect(norm(l, e.word), `${l}:${e.word}`).toBe(e.word);
    }
  });
});

describe('units / alphabet / syllables', () => {
  it('units splits Latin text into letters', () => {
    expect(units('HOOT')).toEqual(['H', 'O', 'O', 'T']);
  });
  it('units keeps a Devanagari syllable with its vowel signs together', () => {
    const u = units('सगरमाथा');
    expect(u.join('')).toBe('सगरमाथा');
    expect(u.length).toBeLessThan('सगरमाथा'.length);
    expect(u.length).toBe(5);
  });
  it('units of the empty string is empty', () => {
    expect(units('')).toEqual([]);
  });
  it.each(LANGS.map(l => [l]))('alphabet(%s) matches the expected script and size', lang => {
    const a = alphabet(lang as Lang);
    if (isDeva(lang as Lang)) expect(a).toEqual([]);
    else {
      expect(new Set(a).size).toBe(a.length);
      for (const ch of a) expect(ch).toMatch(SCRIPT[lang as Lang]);
    }
  });
  it('alphabet sizes: 26 Latin, 29 German, 27 Spanish, 32 Russian', () => {
    expect(alphabet('en')).toHaveLength(26);
    expect(alphabet('de')).toHaveLength(29);
    expect(alphabet('es')).toHaveLength(27);
    expect(alphabet('ru')).toHaveLength(32);
  });
  it('isDeva is true only for hi and ne', () => {
    expect(LANGS.filter(isDeva)).toEqual(['hi', 'ne']);
  });
  it('syllables returns distinct units covering every entry', () => {
    const es = wordsFor('hi', { country: 'in' });
    const s = syllables(es);
    expect(new Set(s).size).toBe(s.length);
    for (const e of es) for (const u of e.units) expect(s).toContain(u);
  });
  it.each(LANGS.filter(l => !isDeva(l)).map(l => [l]))('every word letter for %s is inside its alphabet', lang => {
    const a = new Set(alphabet(lang as Lang));
    for (const c of COUNTRIES) for (const e of wordsFor(lang as Lang, { country: c.code })) for (const u of e.units) expect(a.has(u), `${e.word}:${u}`).toBe(true);
  });
});
