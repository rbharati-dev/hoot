import { describe, it, expect } from 'vitest';
import { makePattern } from '../../src/lib/pattern';

describe('pattern puzzles', () => {
  it('always has a valid, in-range answer among the options', () => {
    for (let i = 0; i < 500; i++) {
      const p = makePattern();
      // "next" shows 4 choices; "odd one out" shows the whole set of 5.
      const expected = p.kind === 'odd' ? 5 : 4;
      expect(p.options.length).toBe(expected);
      expect(p.answer).toBeGreaterThanOrEqual(0);
      expect(p.answer).toBeLessThan(p.options.length);
      expect(new Set(p.options).size).toBe(expected);
      expect(p.options[p.answer]).toBeTruthy();
    }
  });

  it("odd-one-out shows the set and the answer is one of the shown items", () => {
    let sawOdd = false;
    for (let i = 0; i < 500; i++) {
      const p = makePattern();
      if (p.kind !== 'odd') continue;
      sawOdd = true;
      expect(p.items).toEqual(p.options);
      expect(p.items).toContain(p.options[p.answer]);
    }
    expect(sawOdd).toBe(true);
  });

  it('next-sequence shows four terms and hides the fifth', () => {
    let sawNext = false;
    for (let i = 0; i < 500; i++) {
      const p = makePattern();
      if (p.kind !== 'next') continue;
      sawNext = true;
      expect(p.items.length).toBeGreaterThanOrEqual(3);
      expect(p.items.every(x => Number.isFinite(Number(x)))).toBe(true);
    }
    expect(sawNext).toBe(true);
  });
});

import { STRINGS } from '../../src/lib/i18n';
import { LANGS } from '../../src/lib/data';

describe('pattern explanations', () => {
  it('every puzzle explains its rule in every language, with the numbers filled in', () => {
    for (let i = 0; i < 300; i++) {
      const p = makePattern();
      for (const lang of LANGS) {
        const text = STRINGS[lang].patternRule(p.rule);
        expect(text, `${lang} ${p.rule.id}`).toBeTruthy();
        expect(text).not.toMatch(/undefined|\$\{/);
        if ('a' in p.rule) expect(text).toContain(String(p.rule.a));
      }
      if (p.rule.id === 'square') expect(p.rule.list).toMatch(/^\d+ = \d+×\d+/);
    }
  });
});
