import { describe, expect, it } from 'vitest';
import { LANGS, type Lang } from '../../src/lib/data';
import { STRINGS, LANG_NAMES, gameName, typeLabel, interestLabel } from '../../src/lib/i18n';
import { GAMES } from '../../src/lib/activity';
import type { Highlight } from '../../src/lib/report';
import type { Rule } from '../../src/lib/pattern';

const en: any = STRINGS.en;
const S = (l: Lang): any => STRINGS[l];
const NON_EN = LANGS.filter(l => l !== 'en');
const enKeys = Object.keys(en);

// Function-valued keys grouped by the arguments they take.
const NUM1 = ['plusTrial', 'plusTrialActive', 'reportActiveDays', 'reportRounds', 'reportSolved', 'youWere', 'wrongAnswer', 'bestTime_', 'bestScore', 'guessesLeft', 'solvedCount', 'streakDays', 'bestStreak'].filter(k => !k.endsWith('_'));
const STR1 = ['dailyDone', 'bestTime', 'yourTime', 'outOfGuesses', 'wrongWas', 'nameTuneWrong', 'newsAsOf'];
const NUM2 = ['triviaScore', 'wordsFound', 'roundScore'];
const SAMPLES = [0, 1, 2, 5, 21];

// Keys in the Plus / report / help blocks, plus the strings that sit with them.
const BLOCK = enKeys.filter(k => typeof en[k] === 'string' && /^(plus|seePlus|dailyDone|otherGames|levelExpert|size(Classic|Big)|pack|progress|report|help)/.test(k));
// English words that are legitimately identical in other languages (brand and proper names).
const SAME_OK = new Set(['plusName', 'plusLocked', 'seePlus']);

describe('i18n: key parity', () => {
  it('English has the expected number of keys and all the block keys', () => {
    expect(enKeys.length).toBeGreaterThan(200);
    expect(BLOCK.length).toBeGreaterThan(25);
  });
  it.each(NON_EN.map(l => [l]))('%s has exactly the same keys as English', lang => {
    const keys = Object.keys(S(lang as Lang));
    expect(keys.filter(k => !enKeys.includes(k))).toEqual([]);
    expect(enKeys.filter(k => !keys.includes(k))).toEqual([]);
  });
  it.each(LANGS.map(l => [l]))('%s: value types match English for every key', lang => {
    for (const k of enKeys) expect(typeof S(lang as Lang)[k] === typeof en[k] && Array.isArray(S(lang as Lang)[k]) === Array.isArray(en[k]), k).toBe(true);
  });
  it('STRINGS covers exactly the nine languages and LANG_NAMES names each', () => {
    expect(Object.keys(STRINGS).sort()).toEqual([...LANGS].sort());
    for (const l of LANGS) expect(LANG_NAMES[l].length).toBeGreaterThan(2);
    expect(new Set(Object.values(LANG_NAMES)).size).toBe(9);
  });
  it.each(LANGS.map(l => [l]))('%s: nested maps (types, interestNames, sizes) have the same keys as English', lang => {
    const s = S(lang as Lang);
    // typeLabel() falls back to English for missing entries, so a language may lack a few types
    // (ru/fr/de/it/pt/es currently omit 'wisdom' and 'science'), but must never invent extra keys.
    for (const k of Object.keys(s.types)) expect(Object.keys(en.types)).toContain(k);
    expect(Object.keys(s.types).length).toBeGreaterThanOrEqual(9);
    // interestLabel() has the same English fallback (those languages omit a few newer interests).
    for (const k of Object.keys(s.interestNames)) expect(Object.keys(en.interestNames)).toContain(k);
    expect(Object.keys(s.interestNames).length).toBeGreaterThanOrEqual(15);
    expect(s.sizes).toHaveLength(en.sizes.length);
  });
});

describe('i18n: no empty values', () => {
  const rows: [Lang, string][] = [];
  for (const l of LANGS) for (const k of enKeys) rows.push([l, k]);
  // `englishOnly` is intentionally '' in the translated languages (it is the "this is English only" notice).
  const INTENTIONALLY_EMPTY = new Set(['englishOnly']);
  it.each(rows.filter(([, k]) => typeof en[k] === 'string' && !INTENTIONALLY_EMPTY.has(k)))('%s.%s is a non-empty string', (lang, key) => {
    expect(S(lang)[key].trim().length).toBeGreaterThan(0);
  });
  it.each(LANGS.map(l => [l]))('%s.englishOnly exists as a string (intentionally empty)', lang => {
    expect(typeof S(lang as Lang).englishOnly).toBe('string');
  });
  it.each(LANGS.map(l => [l]))('%s: array and object values contain no empty strings', lang => {
    const s = S(lang as Lang);
    for (const k of enKeys) {
      const v = s[k];
      if (Array.isArray(v)) for (const item of v.flat()) expect(String(item).trim().length, k).toBeGreaterThan(0);
      else if (v && typeof v === 'object') for (const x of Object.values(v)) expect(String(x).trim().length, k).toBeGreaterThan(0);
    }
  });
});

describe('i18n: function-valued strings', () => {
  const num: [Lang, string, number][] = [];
  for (const l of LANGS) for (const k of NUM1) for (const n of SAMPLES) num.push([l, k, n]);
  it.each(num)('%s.%s(%i) returns non-empty text', (lang, key, n) => {
    const out = S(lang)[key](n);
    expect(typeof out).toBe('string');
    expect(out.trim().length).toBeGreaterThan(0);
    expect(out).not.toMatch(/undefined|NaN|\[object/);
  });
  const str: [Lang, string][] = [];
  for (const l of LANGS) for (const k of STR1) str.push([l, k]);
  it.each(str)('%s.%s("Sudoku") embeds its argument', (lang, key) => {
    const out = S(lang)[key]('Sudoku');
    expect(out).toContain('Sudoku');
    expect(out).not.toMatch(/undefined|NaN/);
  });
  const two: [Lang, string][] = [];
  for (const l of LANGS) for (const k of NUM2) two.push([l, k]);
  it.each(two)('%s.%s(3, 10) mentions both numbers', (lang, key) => {
    const out = S(lang)[key](3, 10);
    expect(out.length).toBeGreaterThan(0);
    // Devanagari locales may keep Latin digits; require either digit form
    expect(/3|३/.test(out)).toBe(true);
    expect(/10|१०/.test(out)).toBe(true);
  });
  it.each(LANGS.map(l => [l]))('%s: plusTrial embeds the number of days', lang => {
    for (const n of [3, 7, 14, 30]) expect(S(lang as Lang).plusTrial(n)).toMatch(new RegExp(`${n}|${[...String(n)].map(d => String.fromCharCode(0x966 + Number(d))).join('')}`));
  });
  it.each(LANGS.map(l => [l]))('%s: counters embed the count', lang => {
    for (const k of ['reportActiveDays', 'reportRounds', 'reportSolved', 'streakDays', 'plusTrialActive']) {
      expect(S(lang as Lang)[k](5), k).toMatch(/5|५/);
    }
  });
  it('youWere gives a "year you were born" phrase for age 0 in every language', () => {
    for (const l of LANGS) expect(S(l).youWere(0)).not.toBe(S(l).youWere(5));
  });
  it('wrongAnswer embeds the year', () => {
    for (const l of LANGS) expect(S(l).wrongAnswer(1969)).toContain('1969');
  });
});

describe('i18n: plural-sensitive functions', () => {
  const strip = (s: string) => s.replace(/[0-9]+/g, '#');
  const PLURAL = ['plusTrialActive', 'reportActiveDays', 'reportRounds', 'streakDays'];
  const rows: [string, string][] = [];
  for (const l of ['en', 'ru', 'fr']) for (const k of PLURAL) rows.push([l, k]);
  it.each(rows)('%s.%s: wording for 1 differs from wording for 5', (lang, key) => {
    expect(strip(S(lang as Lang)[key](1))).not.toBe(strip(S(lang as Lang)[key](5)));
  });
  it('en: reportRounds uses singular / plural nouns', () => {
    expect(en.reportRounds(1)).toBe('1 round played');
    expect(en.reportRounds(5)).toBe('5 rounds played');
    expect(en.reportActiveDays(1)).toBe('1 day active');
  });
  it('fr: singular and plural', () => {
    expect(S('fr').reportRounds(1)).toContain('1 partie jouée');
    expect(S('fr').reportRounds(5)).toContain('parties');
  });
  it.each([[1, 21], [1, 101], [2, 22], [5, 11], [5, 12], [5, 25]] as [number, number][])('ru: reportRounds(%i) and (%i) follow Slavic plural rules where they should', (a, b) => {
    const same = (x: number, y: number) => strip(S('ru').reportRounds(x)) === strip(S('ru').reportRounds(y));
    const form = (n: number) => (n % 10 === 1 && n % 100 !== 11 ? 'one' : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 12 || n % 100 > 14) ? 'few' : 'many');
    expect(same(a, b)).toBe(form(a) === form(b));
  });
  it('ru: 1, 2 and 5 take three different noun forms', () => {
    const f = (n: number) => strip(S('ru').reportRounds(n));
    expect(new Set([f(1), f(2), f(5)]).size).toBe(3);
    expect(f(11)).toBe(f(5));
    expect(f(22)).toBe(f(2));
  });
  it('ru: plusTrial days agree 1/2/5', () => {
    const f = (n: number) => strip(S('ru').plusTrial(n));
    expect(new Set([f(1), f(2), f(5)]).size).toBe(3);
  });
  it('plusTrialActive(1) says it is the last day in en', () => {
    expect(en.plusTrialActive(1)).toMatch(/last day/);
    expect(en.plusTrialActive(5)).toMatch(/5 days left/);
  });
});

describe('i18n: help FAQ', () => {
  it.each(LANGS.map(l => [l]))('%s: helpFaq has the same number of [question, answer] pairs as English', lang => {
    const faq = S(lang as Lang).helpFaq;
    expect(faq).toHaveLength(en.helpFaq.length);
    for (const pair of faq) {
      expect(pair).toHaveLength(2);
      expect(pair[0].trim().length).toBeGreaterThan(5);
      expect(pair[1].trim().length).toBeGreaterThan(10);
    }
  });
  it.each(NON_EN.map(l => [l]))('%s: helpFaq pairs are translated (differ from English)', lang => {
    S(lang as Lang).helpFaq.forEach((pair: string[], i: number) => {
      expect(pair[0], `q${i}`).not.toBe(en.helpFaq[i][0]);
      expect(pair[1], `a${i}`).not.toBe(en.helpFaq[i][1]);
    });
  });
  it.each(NON_EN.map(l => [l]))('%s: plusFeatures has 4 translated lines', lang => {
    const f = S(lang as Lang).plusFeatures;
    expect(f).toHaveLength(4);
    f.forEach((line: string, i: number) => expect(line).not.toBe(en.plusFeatures[i]));
  });
  it('FAQ questions in a language are unique', () => {
    for (const l of LANGS) expect(new Set(S(l).helpFaq.map((p: string[]) => p[0])).size).toBe(en.helpFaq.length);
  });
});

describe('i18n: translated, not copied from English (Plus / report / help block)', () => {
  const rows: [Lang, string][] = [];
  for (const l of NON_EN) for (const k of BLOCK) if (!SAME_OK.has(k) && !(l === 'fr' && k === 'levelExpert')) rows.push([l, k]); // fr "Expert" is the correct French word too
  it.each(rows)('%s.%s differs from the English text', (lang, key) => {
    expect(S(lang)[key]).not.toBe(en[key]);
  });
  it.each(NON_EN.map(l => [l]))('%s: brand name "Hoot Plus" is allowed to stay identical', lang => {
    expect(S(lang as Lang).plusName).toContain('Plus');
  });
  it.each(NON_EN.map(l => [l]))('%s: function outputs in the Plus/report block differ from English', lang => {
    for (const k of ['reportActiveDays', 'reportRounds', 'reportSolved', 'plusTrialActive']) expect(S(lang as Lang)[k](5), k).not.toBe(en[k](5));
    expect(S(lang as Lang).plusTrial(7)).not.toBe(en.plusTrial(7));
    expect(S(lang as Lang).dailyDone('Sudoku')).not.toBe(en.dailyDone('Sudoku'));
  });
  it.each(NON_EN.map(l => [l]))('%s: help block strings are translated', lang => {
    for (const k of ['help', 'helpIntro', 'helpMore']) expect(S(lang as Lang)[k], k).not.toBe(en[k]);
  });
});

describe('i18n: patternRule', () => {
  const RULES: [string, Rule, (string | number)[]][] = [
    ['add', { id: 'add', a: 7 }, [7]],
    ['mul', { id: 'mul', a: 3 }, [3]],
    ['alt', { id: 'alt', a: 2, b: 5 }, [2, 5]],
    ['multiple', { id: 'multiple', a: 6 }, [6]],
    ['square', { id: 'square', list: '4 = 2×2, 9 = 3×3, 16 = 4×4' }, ['4 = 2×2, 9 = 3×3, 16 = 4×4']],
    ['double', { id: 'double' }, []],
    ['fib', { id: 'fib' }, []],
    ['even', { id: 'even' }, []],
  ];
  const rows: [Lang, string, Rule, (string | number)[]][] = [];
  for (const l of LANGS) for (const [n, r, w] of RULES) rows.push([l, n, r, w]);
  it.each(rows)('%s: rule %s mentions its numbers', (lang, _n, rule, want) => {
    const out = S(lang).patternRule(rule);
    expect(out.trim().length).toBeGreaterThan(5);
    for (const w of want) {
      const s = String(w);
      const dev = [...s].map(d => (/\d/.test(d) ? String.fromCharCode(0x966 + Number(d)) : d)).join('');
      expect(out.includes(s) || out.includes(dev), `${out} should contain ${s}`).toBe(true);
    }
    expect(out).not.toMatch(/undefined|NaN/);
  });
  it.each(NON_EN.map(l => [l]))('%s: eight rule kinds give eight distinct sentences', lang => {
    expect(new Set(RULES.map(([, r]) => S(lang as Lang).patternRule(r))).size).toBe(8);
  });
  it.each(NON_EN.map(l => [l]))('%s: patternRule is translated', lang => {
    for (const [, r] of RULES) expect(S(lang as Lang).patternRule(r)).not.toBe(en.patternRule(r));
  });
  it('en: wording', () => {
    expect(en.patternRule({ id: 'add', a: 4 })).toBe('Add 4 each time.');
    expect(en.patternRule({ id: 'alt', a: 2, b: 5 })).toBe('Add 2, then 5, in turn.');
  });
});

describe('i18n: reportHighlight', () => {
  const name = (g: string) => `<<${g}>>`;
  const HL: [string, Highlight][] = [
    ['firstMonth', { kind: 'firstMonth' }],
    ['moreRounds 1', { kind: 'moreRounds', diff: 1 }],
    ['moreRounds 7', { kind: 'moreRounds', diff: 7 }],
    ['steady', { kind: 'steady' }],
    ['favourite', { kind: 'favourite', game: 'sudoku', rounds: 9 }],
    ['longestRun', { kind: 'longestRun', days: 6 }],
    ['newGames', { kind: 'newGames', games: ['chess', 'checkers'] }],
    ['fives 1', { kind: 'fives', count: 1 }],
    ['fives 4', { kind: 'fives', count: 4 }],
    ['solvedMore 1', { kind: 'solvedMore', game: 'crossword', diff: 1 }],
    ['solvedMore 3', { kind: 'solvedMore', game: 'crossword', diff: 3 }],
  ];
  const rows: [Lang, string, Highlight][] = [];
  for (const l of LANGS) for (const [n, h] of HL) rows.push([l, n, h]);

  it.each(rows)('%s: highlight %s is non-empty and well-formed', (lang, _n, h) => {
    const out = S(lang).reportHighlight(h, name);
    expect(typeof out).toBe('string');
    expect(out.trim().length).toBeGreaterThan(8);
    expect(out).not.toMatch(/undefined|NaN|\[object/);
    if (h.kind === 'favourite' || h.kind === 'solvedMore') expect(out).toContain(`<<${h.game}>>`);
    if (h.kind === 'newGames') for (const g of h.games) expect(out).toContain(`<<${g}>>`);
    const numeric = h.kind === 'moreRounds' ? h.diff : h.kind === 'longestRun' ? h.days : h.kind === 'fives' ? h.count : h.kind === 'solvedMore' ? h.diff : null;
    if (numeric !== null && !(h.kind === 'fives' && h.count === 1)) {
      const dev = String.fromCharCode(0x966 + numeric);
      expect(out.includes(String(numeric)) || out.includes(dev), `${out} should show ${numeric}`).toBe(true);
    }
  });
  it.each(NON_EN.map(l => [l]))('%s: highlights are translated', lang => {
    for (const [, h] of HL) expect(S(lang as Lang).reportHighlight(h, name)).not.toBe(en.reportHighlight(h, name));
  });
  it.each(LANGS.map(l => [l]))('%s: different highlight kinds give different sentences', lang => {
    const outs = HL.map(([, h]) => S(lang as Lang).reportHighlight(h, name));
    const kinds = new Set(HL.map(([, h]) => h.kind));
    expect(new Set(outs).size).toBeGreaterThanOrEqual(kinds.size);
  });
  it.each(['en', 'fr', 'ru'].map(l => [l]))('%s: singular and plural highlight text differ', lang => {
    const strip = (s: string) => s.replace(/[0-9]+/g, '#');
    const f = (h: Highlight) => strip(S(lang as Lang).reportHighlight(h, name));
    expect(f({ kind: 'fives', count: 1 })).not.toBe(f({ kind: 'fives', count: 4 }));
    expect(f({ kind: 'moreRounds', diff: 1 })).not.toBe(f({ kind: 'moreRounds', diff: 5 }));
  });
  it('en wording', () => {
    expect(en.reportHighlight({ kind: 'moreRounds', diff: 1 }, name)).toBe('You played 1 more round than last month.');
    expect(en.reportHighlight({ kind: 'solvedMore', game: 'sudoku', diff: 2 }, name)).toBe('You solved 2 more <<sudoku>> puzzles than last month.');
  });
});

describe('i18n: game names and labels', () => {
  const rows: [Lang, string][] = [];
  for (const l of LANGS) for (const g of GAMES) rows.push([l, g]);
  // Regression: crossword and wordscramble once shared one Nepali name (fixed).
  it('ne: all 12 game names are distinct', () => {
    expect(new Set(GAMES.map(g => gameName(S('ne'), g))).size).toBe(12);
  });
  it('there are 12 games', () => {
    expect(GAMES).toHaveLength(12);
  });
  it.each(rows)('%s: gameName(%s) is a non-empty string', (lang, g) => {
    const n = gameName(S(lang), g as (typeof GAMES)[number]);
    expect(typeof n).toBe('string');
    expect(n.trim().length).toBeGreaterThan(1);
  });
  it.each(LANGS.filter(l => l !== 'ne').map(l => [l]))('%s: all 12 game names are distinct', lang => {
    const names = GAMES.map(g => gameName(S(lang as Lang), g));
    expect(new Set(names).size).toBe(12);
  });
  it('en game names are the familiar ones', () => {
    expect(gameName(en, 'sudoku')).toBe(en.sudoku);
    expect(gameName(en, 'scramble')).toBe(en.wordscramble);
    expect(gameName(en, 'tune')).toBe(en.nameTune);
  });
  it.each(LANGS.map(l => [l]))('%s: typeLabel and interestLabel resolve known keys and fall back', lang => {
    const s = S(lang as Lang);
    expect(typeLabel(s, 'music')).toBe(s.types.music);
    expect(typeLabel(s, 'no-such-type')).toBe('no-such-type');
    expect(interestLabel(s, 'football')).toBe(s.interestNames.football);
    expect(interestLabel(s, 'nonsense')).toBe('nonsense');
  });
  it.each(LANGS.map(l => [l]))('%s: typeLabel falls back to English for a key missing in the language', lang => {
    const s = { ...S(lang as Lang), types: {} };
    expect(typeLabel(s, 'music')).toBe(en.types.music);
  });
  it.each(NON_EN.map(l => [l]))('%s: the game names differ from English for most games', lang => {
    const diff = GAMES.filter(g => gameName(S(lang as Lang), g) !== gameName(en, g));
    expect(diff.length).toBeGreaterThanOrEqual(8);
  });
});
