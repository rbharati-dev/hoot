import { describe, expect, it } from 'vitest';
import { LANGS, type Lang } from '../../src/lib/data';
import { buildWordSearch, WS_DIRS, WS_SIZE } from '../../src/lib/wordsearch';
import { wordsFor, alphabet, syllables, packWords } from '../../src/lib/wordbank';
import { PACK_IDS } from '../../src/lib/packs';

const SEEDS = [1, 2, 3, 10, 55, 1234, 20240229, 3000000000];
const entriesFor = (l: Lang) => wordsFor(l, { born: 1955, country: l === 'hi' ? 'in' : l === 'ne' ? 'np' : 'us' });

function verify(lang: Lang, seed: number, count = 8, entries = entriesFor(lang)) {
  const letters = alphabet(lang);
  const ws = buildWordSearch(seed, count, entries, letters);
  expect(ws.grid.length).toBe(WS_SIZE);
  for (const row of ws.grid) {
    expect(row.length).toBe(WS_SIZE);
    for (const cell of row) {
      expect(cell).toBeTruthy();
      if (letters.length) expect(letters).toContain(cell);
      else expect(syllables(entries)).toContain(cell);
    }
  }
  expect(ws.placed.length).toBeGreaterThan(0);
  expect(ws.placed.length).toBeLessThanOrEqual(count);
  const words = new Set<string>();
  for (const p of ws.placed) {
    expect(words.has(p.word)).toBe(false);
    words.add(p.word);
    expect(WS_DIRS.some(([a, b]) => a === p.dr && b === p.dc)).toBe(true);
    expect(entries.some(e => e.word === p.word)).toBe(true);
    for (let k = 0; k < p.units.length; k++) {
      const r = p.r + p.dr * k, c = p.c + p.dc * k;
      expect(r >= 0 && r < WS_SIZE && c >= 0 && c < WS_SIZE, `${p.word} out of bounds`).toBe(true);
      expect(ws.grid[r][c], `${p.word}[${k}]`).toBe(p.units[k]);
    }
    expect(p.units.join('')).toBe(p.word);
  }
  return ws;
}

describe('word search: every language x seed', () => {
  const rows: [Lang, number][] = [];
  for (const l of LANGS) for (const s of SEEDS) rows.push([l, s]);
  it.each(rows)('%s seed %i places words correctly and fills the grid', (lang, seed) => {
    const ws = verify(lang, seed);
    // the German deck has only ~11 usable words, so a few seeds land at 7
    expect(ws.placed.length).toBeGreaterThanOrEqual(7);
    if (lang !== 'de') expect(ws.placed.length).toBe(8);
  });
});

describe('word search: counts and packs', () => {
  it.each([1, 3, 5, 8, 10, 12])('requested count %i is respected (never exceeded)', n => {
    const ws = verify('en', 42, n);
    expect(ws.placed.length).toBeLessThanOrEqual(n);
    expect(ws.placed.length).toBeGreaterThanOrEqual(Math.min(n, 4));
  });
  const rows: [string, Lang][] = [];
  for (const p of PACK_IDS) for (const l of LANGS) rows.push([p, l]);
  it.each(rows)('pack %s / %s words fit', (pack, lang) => {
    verify(lang, 17, 8, packWords(lang, pack as (typeof PACK_IDS)[number]));
  });
});

describe('word search: directions, determinism, constraints', () => {
  it('WS_DIRS has all 8 distinct directions', () => {
    expect(WS_DIRS.length).toBe(8);
    expect(new Set(WS_DIRS.map(d => d.join(','))).size).toBe(8);
    for (const [a, b] of WS_DIRS) { expect(Math.abs(a)).toBeLessThanOrEqual(1); expect(Math.abs(b)).toBeLessThanOrEqual(1); expect(a !== 0 || b !== 0).toBe(true); }
  });
  it('all 8 directions are used across seeds', () => {
    const used = new Set<string>();
    for (let s = 1; s <= 60; s++) for (const p of buildWordSearch(s).placed) used.add(`${p.dr},${p.dc}`);
    expect(used.size).toBe(8);
  });
  it.each(WS_DIRS.map(d => [d.join(',')]))('direction %s appears in at least one puzzle', key => {
    let found = false;
    for (let s = 1; s <= 80 && !found; s++) found = buildWordSearch(s).placed.some(p => `${p.dr},${p.dc}` === key);
    expect(found).toBe(true);
  });
  it.each(LANGS.map(l => [l]))('same seed gives identical %s grids', lang => {
    const e = entriesFor(lang as Lang);
    const a = alphabet(lang as Lang);
    expect(buildWordSearch(9, 8, e, a)).toEqual(buildWordSearch(9, 8, e, a));
  });
  it('different seeds give different grids', () => {
    const seen = new Set(SEEDS.map(s => JSON.stringify(buildWordSearch(s).grid)));
    expect(seen.size).toBeGreaterThan(SEEDS.length - 2);
  });
  it('words are never shorter than 4 letters for alphabetic languages', () => {
    for (let s = 1; s <= 20; s++) for (const p of buildWordSearch(s).placed) expect(p.units.length).toBeGreaterThanOrEqual(4);
  });
  it('words never exceed the grid size', () => {
    for (let s = 1; s <= 20; s++) for (const p of buildWordSearch(s).placed) expect(p.units.length).toBeLessThanOrEqual(WS_SIZE);
  });
  it('syllable languages allow shorter words (>= 2 units)', () => {
    let min = 99;
    for (let s = 1; s <= 30; s++) for (const p of buildWordSearch(s, 8, entriesFor('hi'), []).placed) min = Math.min(min, p.units.length);
    expect(min).toBeGreaterThanOrEqual(2);
  });
  it('seed 0 works', () => {
    verify('en', 0);
  });
  it('when overlapping, crossing words agree on the shared cell', () => {
    for (let s = 1; s <= 40; s++) {
      const ws = buildWordSearch(s);
      const cells = new Map<string, string>();
      for (const p of ws.placed) for (let k = 0; k < p.units.length; k++) {
        const key = `${p.r + p.dr * k},${p.c + p.dc * k}`;
        if (cells.has(key)) expect(cells.get(key)).toBe(p.units[k]);
        cells.set(key, p.units[k]);
      }
    }
  });
  it('filler letters are not all identical', () => {
    const ws = buildWordSearch(5);
    expect(new Set(ws.grid.flat()).size).toBeGreaterThan(8);
  });
});
