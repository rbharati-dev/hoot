import { describe, expect, it } from 'vitest';
import { LANGS, type Lang } from '../../src/lib/data';
import { makeCrossword, todaySeed, type Crossword } from '../../src/lib/crossword';
import { wordsFor, packWords, alphabet } from '../../src/lib/wordbank';
import { PACK_IDS } from '../../src/lib/packs';

const SEEDS = [1, 2, 3, 42, 777, 20240131, 987654321];

function verify(cw: Crossword, max: number, entries: { word: string; clue: string }[]) {
  expect(cw.rows).toBeLessThanOrEqual(max);
  expect(cw.cols).toBeLessThanOrEqual(max);
  expect(cw.cells.length).toBe(cw.rows);
  expect(cw.numbers.length).toBe(cw.rows);
  for (const row of cw.cells) expect(row.length).toBe(cw.cols);
  const covered = new Set<string>();
  const wordAt = (r: number, c: number) => (r >= 0 && c >= 0 && r < cw.rows && c < cw.cols ? cw.cells[r][c] : null);
  for (const w of cw.words) {
    const dr = w.dir === 'down' ? 1 : 0, dc = w.dir === 'across' ? 1 : 0;
    expect(w.units.join('')).toBe(w.word);
    for (let k = 0; k < w.units.length; k++) {
      expect(cw.cells[w.row + dr * k]?.[w.col + dc * k], `${w.word}[${k}]`).toBe(w.units[k]);
      covered.add(`${w.row + dr * k},${w.col + dc * k}`);
    }
    // nothing touches before / after the word
    expect(wordAt(w.row - dr, w.col - dc)).toBeNull();
    expect(wordAt(w.row + dr * w.units.length, w.col + dc * w.units.length)).toBeNull();
    // clue belongs to the entry
    const e = entries.find(x => x.word === w.word);
    expect(e, w.word).toBeDefined();
    expect(w.clue).toBe(e!.clue);
    expect(w.units.length).toBeGreaterThanOrEqual(2);
  }
  // every white cell belongs to a word
  for (let r = 0; r < cw.rows; r++) for (let c = 0; c < cw.cols; c++) {
    if (cw.cells[r][c] !== null) expect(covered.has(`${r},${c}`), `orphan ${r},${c}`).toBe(true);
    else expect(cw.numbers[r][c]).toBeNull();
  }
  // every maximal run of 2+ white cells is a placed word (no accidental words)
  const runs = (get: (i: number, j: number) => string | null, outer: number, inner: number, dir: 'across' | 'down') => {
    for (let i = 0; i < outer; i++) {
      let j = 0;
      while (j < inner) {
        if (get(i, j) === null) { j++; continue; }
        const s = j;
        while (j < inner && get(i, j) !== null) j++;
        if (j - s >= 2) {
          const r = dir === 'across' ? i : s, c = dir === 'across' ? s : i;
          expect(cw.words.some(w => w.dir === dir && w.row === r && w.col === c && w.units.length === j - s), `run ${dir} ${r},${c}`).toBe(true);
        }
      }
    }
  };
  runs((r, c) => cw.cells[r][c], cw.rows, cw.cols, 'across');
  runs((c, r) => cw.cells[r][c], cw.cols, cw.rows, 'down');
  // numbering: sequential in reading order, matching starts
  let expected = 0;
  const starts = new Set(cw.words.map(w => `${w.row},${w.col}`));
  for (let r = 0; r < cw.rows; r++) for (let c = 0; c < cw.cols; c++) {
    if (starts.has(`${r},${c}`)) {
      expected++;
      expect(cw.numbers[r][c]).toBe(expected);
    } else expect(cw.numbers[r][c]).toBeNull();
  }
  for (const w of cw.words) expect(w.num).toBe(cw.numbers[w.row][w.col]);
  expect(new Set(cw.words.map(w => w.word)).size).toBe(cw.words.length);
  // across and down words sharing a start share the number
  const byStart = new Map<string, number>();
  for (const w of cw.words) {
    const k = `${w.row},${w.col}`;
    if (byStart.has(k)) expect(byStart.get(k)).toBe(w.num);
    byStart.set(k, w.num);
  }
}

describe('crossword: classic (target 9) in every language', () => {
  const rows: [Lang, number][] = [];
  for (const l of LANGS) for (const s of SEEDS) rows.push([l, s]);
  it.each(rows)('%s seed %i is a consistent 13x13-max grid with most of 9 words', (lang, seed) => {
    const entries = wordsFor(lang, { born: 1955, country: lang === 'hi' ? 'in' : lang === 'ne' ? 'np' : undefined });
    const cw = makeCrossword(seed, 9, entries);
    verify(cw, 13, entries);
    expect(cw.words.length).toBeGreaterThanOrEqual(5);
    expect(cw.words.length).toBeLessThanOrEqual(9);
    // small decks (de with only ~14 usable words) may land at 8
    if (!['hi', 'ne', 'de'].includes(lang)) expect(cw.words.length).toBe(9);
    else expect(cw.words.length).toBeGreaterThanOrEqual(7);
  });
});

describe('crossword: big (target 14)', () => {
  const rows: [Lang, number][] = [];
  for (const l of LANGS) for (const s of [5, 99, 31337]) rows.push([l, s]);
  it.each(rows)('%s seed %i is consistent within 15x15 and has up to 14 words', (lang, seed) => {
    const entries = wordsFor(lang, { born: 1955, country: lang === 'hi' ? 'in' : lang === 'ne' ? 'np' : 'us' });
    const cw = makeCrossword(seed, 14, entries);
    verify(cw, 15, entries);
    expect(cw.words.length).toBeGreaterThanOrEqual(6);
    expect(cw.words.length).toBeLessThanOrEqual(14);
  });
});

describe('crossword: theme packs', () => {
  const rows: [string, Lang, number][] = [];
  for (const p of PACK_IDS) for (const l of LANGS) rows.push([p, l, 11], [p, l, 12]);
  it.each(rows)('pack %s / %s target 9 seed %i only uses pack words', (pack, lang, seed) => {
    const entries = packWords(lang, pack as (typeof PACK_IDS)[number]);
    const cw = makeCrossword(seed, 9, entries);
    verify(cw, 13, entries);
    expect(cw.words.length).toBeGreaterThanOrEqual(4);
  });
  it.each(PACK_IDS.map(p => [p]))('pack %s target 14 fits in 15x15', pack => {
    const entries = packWords('en', pack as (typeof PACK_IDS)[number]);
    verify(makeCrossword(8, 14, entries), 15, entries);
  });
});

describe('crossword: determinism and variety', () => {
  it.each(LANGS.map(l => [l]))('same seed gives an identical puzzle in %s', lang => {
    const entries = wordsFor(lang as Lang);
    expect(makeCrossword(123, 9, entries)).toEqual(makeCrossword(123, 9, entries));
    expect(makeCrossword(4, 14, entries)).toEqual(makeCrossword(4, 14, entries));
  });
  it('different seeds give different puzzles', () => {
    const seen = new Set(SEEDS.map(s => JSON.stringify(makeCrossword(s).cells)));
    expect(seen.size).toBeGreaterThan(SEEDS.length - 2);
  });
  it('default entries are English words', () => {
    const cw = makeCrossword(3);
    for (const w of cw.words) expect(w.word).toMatch(/^[A-Z]+$/);
    verify(cw, 13, wordsFor('en'));
  });
  it('never places words that are shorter than 2 or longer than the limit', () => {
    for (const s of [1, 2, 3, 4]) {
      for (const w of makeCrossword(s, 9).words) expect(w.units.length).toBeLessThanOrEqual(13);
      for (const w of makeCrossword(s, 14).words) expect(w.units.length).toBeLessThanOrEqual(15);
    }
  });
  it('all letters in an English grid are in the alphabet', () => {
    const a = new Set(alphabet('en'));
    for (const row of makeCrossword(77).cells) for (const c of row) if (c) expect(a.has(c)).toBe(true);
  });
  it('seed 0 still produces a usable puzzle', () => {
    verify(makeCrossword(0), 13, wordsFor('en'));
  });
  it('the first word starts at the top-left corner of the trimmed grid or the grid is trimmed to its words', () => {
    const cw = makeCrossword(9);
    expect(cw.cells[0].some(c => c !== null)).toBe(true);
    expect(cw.cells.some(r => r[0] !== null)).toBe(true);
    expect(cw.cells[cw.rows - 1].some(c => c !== null)).toBe(true);
    expect(cw.cells.some(r => r[cw.cols - 1] !== null)).toBe(true);
  });
  it('todaySeed encodes the current date as YYYYMMDD', () => {
    const d = new Date();
    const s = todaySeed();
    expect(Math.floor(s / 10000)).toBe(d.getFullYear());
    expect(Math.floor((s % 10000) / 100)).toBe(d.getMonth() + 1);
    expect(s % 100).toBe(d.getDate());
  });
});
