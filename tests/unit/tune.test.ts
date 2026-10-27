import { describe, expect, it } from 'vitest';
import { buildTune } from '../../src/lib/daily';
import type { Card } from '../../src/lib/data';

const song = (id: string, title: string, yt = 'abcdefghijk'): Card => ({ id, year: 1967, type: 'music', title, text: 't', wiki: title, yt });

// A deterministic RNG so tests are stable.
const rng = (seed: number) => () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};

describe('buildTune (name that tune)', () => {
  it('returns null when there are fewer than three distinct songs', () => {
    expect(buildTune([], rng(1))).toBeNull();
    expect(buildTune([song('a', 'A'), song('b', 'B')], rng(1))).toBeNull();
  });

  it('builds a round whose answer is among the choices, all distinct titles', () => {
    const songs = ['A', 'B', 'C', 'D', 'E'].map((t, i) => song('s' + i, t));
    const tune = buildTune(songs, rng(7))!;
    expect(tune).not.toBeNull();
    expect(tune.choices).toContainEqual(tune.answer);
    const titles = tune.choices.map(c => c.title);
    expect(new Set(titles).size).toBe(titles.length); // no duplicate titles
    expect(tune.choices.length).toBeGreaterThanOrEqual(3);
  });

  it('the answer always carries something playable', () => {
    const songs = ['A', 'B', 'C', 'D'].map((t, i) => song('s' + i, t));
    for (let s = 0; s < 50; s++) {
      const tune = buildTune(songs, rng(s + 1))!;
      expect(tune.answer.yt).toBeTruthy();
    }
  });
});
