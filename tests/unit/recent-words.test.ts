import { describe, expect, it } from 'vitest';
import { MIN_FRESH, REMEMBER, freshFirst, withUsed } from '../../src/lib/recentWords';
import { wordsFor } from '../../src/lib/wordbank';
import { makeCrossword } from '../../src/lib/crossword';
import { COUNTRIES } from '../../src/lib/data';

describe('recent words', () => {
  const entries = wordsFor('en', { country: 'ca' });

  it('nothing seen yet → every word is available', () => {
    expect(freshFirst(entries, [])).toEqual(entries);
  });

  it('leaves out recently seen words while enough fresh ones remain', () => {
    const recent = entries.slice(0, 5).map(e => e.word);
    const fresh = freshFirst(entries, recent);
    expect(fresh.some(e => recent.includes(e.word))).toBe(false);
    expect(fresh.length).toBe(entries.length - 5);
  });

  it('never runs dry: with too few fresh words, the stalest come back last', () => {
    const recent = entries.slice(0, entries.length - 3).map(e => e.word); // index 0 = most recent
    const out = freshFirst(entries, recent);
    expect(out).toHaveLength(entries.length);
    expect(out.slice(0, 3).map(e => e.word)).toEqual(entries.slice(-3).map(e => e.word));
    // after the fresh ones, the LEAST recently seen come first
    expect(out[3].word).toBe(recent[recent.length - 1]);
    expect(out[out.length - 1].word).toBe(recent[0]);
  });

  it('withUsed puts the newest first, removes duplicates and caps the list', () => {
    expect(withUsed(['A', 'B', 'C'], ['C', 'D'])).toEqual(['C', 'D', 'A', 'B']);
    const big = Array.from({ length: 500 }, (_, i) => `W${i}`);
    expect(withUsed(big, ['NEW'])).toHaveLength(REMEMBER);
    expect(withUsed(big, ['NEW'])[0]).toBe('NEW');
  });

  it('MIN_FRESH leaves enough words for a full crossword', () => {
    expect(MIN_FRESH).toBeGreaterThanOrEqual(20);
  });

  // Simulate a person playing crossword after crossword: consecutive puzzles
  // should share few words.
  for (const c of COUNTRIES)
    for (const lang of [c.lang, 'en'] as const)
      it(`consecutive crosswords rarely repeat words (${c.code}, ${lang})`, () => {
        let recent: string[] = [];
        let prev = new Set<string>();
        let repeats = 0, total = 0;
        for (let i = 0; i < 12; i++) {
          const pool = freshFirst(wordsFor(lang, { country: c.code, born: 1955 }), recent);
          const words = makeCrossword(1000 + i * 37, 9, pool).words.map(w => w.word);
          repeats += words.filter(w => prev.has(w)).length;
          total += words.length;
          prev = new Set(words);
          recent = withUsed(recent, words);
        }
        // Back-to-back puzzles share at most a small fraction of words.
        expect(repeats / total).toBeLessThan(0.2);
      });
});
