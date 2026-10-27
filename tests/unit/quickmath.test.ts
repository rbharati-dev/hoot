import { describe, it, expect } from 'vitest';
import { makeMath, type MathLevel } from '../../src/lib/quickmath';

const levels: MathLevel[] = ['easy', 'medium', 'hard', 'expert'];

function evaluate(prompt: string): number {
  // prompt uses −, ×, ÷ and + ; turn it into something Function can read
  const expr = prompt.replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/');
  // eslint-disable-next-line no-new-func
  return Function(`return (${expr})`)();
}

describe('quick math', () => {
  for (const level of levels) {
    it(`${level}: the stated answer actually solves the prompt`, () => {
      for (let i = 0; i < 400; i++) {
        const p = makeMath(level);
        expect(evaluate(p.prompt)).toBe(p.answer);
        expect(Number.isInteger(p.answer) && p.answer >= 0).toBe(true);
        expect(p.options).toContain(p.answer);
        expect(p.options.length).toBe(4);
        expect(new Set(p.options).size).toBe(4);
        expect(p.options.every(o => o >= 0)).toBe(true);
      }
    });
  }
});
