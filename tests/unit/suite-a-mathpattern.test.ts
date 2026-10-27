import { describe, expect, it } from 'vitest';
import { makeMath, type MathLevel } from '../../src/lib/quickmath';
import { makePattern, type Pattern } from '../../src/lib/pattern';

const LEVELS: MathLevel[] = ['easy', 'medium', 'hard', 'expert'];

function evaluate(prompt: string): number {
  const tokens = prompt.replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/');
  expect(tokens).toMatch(/^[\d+\-*/ ]+$/);
  return Function(`"use strict"; return (${tokens});`)();
}
const ops = (p: string) => (p.match(/[+−×÷]/g) ?? []);

describe('quick math', () => {
  const rows: [MathLevel, number][] = [];
  for (const l of LEVELS) for (let i = 0; i < 150; i++) rows.push([l, i]);

  it.each(rows)('%s #%i: answer equals the shown expression, whole and >= 0', (level, _i) => {
    const p = makeMath(level);
    const v = evaluate(p.prompt);
    expect(Number.isInteger(v)).toBe(true);
    expect(v).toBe(p.answer);
    expect(p.answer).toBeGreaterThanOrEqual(0);
  });
  it.each(rows)('%s #%i: four distinct non-negative integer options including the answer', (level, _i) => {
    const p = makeMath(level);
    expect(p.options).toHaveLength(4);
    expect(new Set(p.options).size).toBe(4);
    expect(p.options).toContain(p.answer);
    for (const o of p.options) { expect(Number.isInteger(o)).toBe(true); expect(o).toBeGreaterThanOrEqual(0); }
  });

  it('easy only uses + and − with operands up to 20', () => {
    for (let i = 0; i < 300; i++) {
      const p = makeMath('easy');
      const o = ops(p.prompt);
      expect(o).toHaveLength(1);
      expect(['+', '−']).toContain(o[0]);
      for (const n of p.prompt.match(/\d+/g)!) expect(Number(n)).toBeLessThanOrEqual(20);
    }
  });
  it('medium never divides, and uses × sometimes', () => {
    let times = 0;
    for (let i = 0; i < 300; i++) {
      const p = makeMath('medium');
      expect(p.prompt).not.toContain('÷');
      if (p.prompt.includes('×')) times++;
    }
    expect(times).toBeGreaterThan(30);
  });
  it('hard uses all four operators across many problems and divides evenly', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 500; i++) {
      const p = makeMath('hard');
      seen.add(ops(p.prompt)[0]);
      if (p.prompt.includes('÷')) {
        const [a, b] = p.prompt.split(' ÷ ').map(Number);
        expect(a % b).toBe(0);
        expect(a / b).toBe(p.answer);
      }
    }
    expect(seen.size).toBe(4);
  });
  it('expert shows larger numbers and multi-step problems', () => {
    let big = 0, multi = 0;
    for (let i = 0; i < 400; i++) {
      const p = makeMath('expert');
      if (p.answer >= 100) big++;
      if (ops(p.prompt).length === 2) multi++;
    }
    expect(big).toBeGreaterThan(100);
    expect(multi).toBeGreaterThan(40);
  });
  it('expert two-step problems respect operator precedence (× before +)', () => {
    let checked = 0;
    for (let i = 0; i < 600 && checked < 20; i++) {
      const p = makeMath('expert');
      const m = p.prompt.match(/^(\d+) \+ (\d+) × (\d+)$/);
      if (m) { expect(p.answer).toBe(+m[1] + +m[2] * +m[3]); checked++; }
    }
    expect(checked).toBeGreaterThan(0);
  });
  it('subtraction never goes negative at any level', () => {
    for (const l of LEVELS) for (let i = 0; i < 300; i++) {
      const p = makeMath(l);
      expect(evaluate(p.prompt)).toBeGreaterThanOrEqual(0);
    }
  });
  it('options are shuffled (answer not always first)', () => {
    const idx = new Set<number>();
    for (let i = 0; i < 100; i++) { const p = makeMath('medium'); idx.add(p.options.indexOf(p.answer)); }
    expect(idx.size).toBeGreaterThan(2);
  });
  it('small answers keep distractors close', () => {
    for (let i = 0; i < 200; i++) {
      const p = makeMath('easy');
      if (p.answer < 12) for (const o of p.options) expect(Math.abs(o - p.answer)).toBeLessThanOrEqual(4);
    }
  });
});

// ---------------------------------------------------------------- pattern
const nums = (a: string[]) => a.map(Number);
function checkNext(p: Pattern) {
  const items = nums(p.items);
  const ans = Number(p.options[p.answer]);
  const full = [...items, ans];
  switch (p.rule.id) {
    case 'add':
      for (let i = 1; i < full.length; i++) expect(full[i] - full[i - 1]).toBe(p.rule.a);
      break;
    case 'mul':
      for (let i = 1; i < full.length; i++) expect(full[i]).toBe(full[i - 1] * p.rule.a);
      break;
    case 'double':
      for (let i = 1; i < full.length; i++) expect(full[i]).toBe(full[i - 1] * 2);
      break;
    case 'fib':
      for (let i = 2; i < full.length; i++) expect(full[i]).toBe(full[i - 1] + full[i - 2]);
      break;
    case 'alt':
      for (let i = 1; i < full.length; i++) expect(full[i] - full[i - 1]).toBe(i % 2 ? p.rule.a : p.rule.b);
      break;
    default:
      throw new Error(`unexpected rule ${p.rule.id} for next`);
  }
}
function checkOdd(p: Pattern) {
  const items = nums(p.items);
  const idx = p.answer;
  const odd = items[idx];
  const rest = items.filter((_, i) => i !== idx);
  const sq = (n: number) => Number.isInteger(Math.sqrt(n));
  switch (p.rule.id) {
    case 'even':
      expect(odd % 2).toBe(1);
      for (const v of rest) expect(v % 2).toBe(0);
      break;
    case 'multiple': {
      const a = p.rule.a;
      expect(odd % a).not.toBe(0);
      for (const v of rest) expect(v % a).toBe(0);
      break;
    }
    case 'square': {
      expect(sq(odd)).toBe(false);
      for (const v of rest) expect(sq(v)).toBe(true);
      const listed = p.rule.list.split(', ').map(s => s.split(' = ')[0]).map(Number);
      expect(listed).toEqual(rest.slice().sort((x, y) => x - y));
      for (const part of p.rule.list.split(', ')) {
        const m = part.match(/^(\d+) = (\d+)×(\d+)$/);
        expect(m, part).not.toBeNull();
        expect(+m![2] * +m![3]).toBe(+m![1]);
        expect(m![2]).toBe(m![3]);
      }
      break;
    }
    default:
      throw new Error(`unexpected rule ${p.rule.id} for odd`);
  }
}

describe('pattern puzzles', () => {
  const all: Pattern[] = Array.from({ length: 600 }, () => makePattern());
  const nexts = all.filter(p => p.kind === 'next');
  const odds = all.filter(p => p.kind === 'odd');

  it('generates both kinds', () => {
    expect(nexts.length).toBeGreaterThan(200);
    expect(odds.length).toBeGreaterThan(100);
  });
  it.each(all.slice(0, 300).map((p, i) => [i, p] as [number, Pattern]))('puzzle #%i: shape is valid (4 distinct options, answer index in range)', (_i, p) => {
    expect(p.options).toHaveLength(p.kind === 'next' ? 4 : 5);
    expect(new Set(p.options).size).toBe(p.options.length);
    expect(p.answer).toBeGreaterThanOrEqual(0);
    expect(p.answer).toBeLessThan(p.options.length);
    for (const s of [...p.items, ...p.options]) expect(s).toMatch(/^\d+$/);
  });
  it.each(nexts.slice(0, 200).map((p, i) => [i, p] as [number, Pattern]))('next #%i (%#): answer follows the rule', (_i, p) => {
    checkNext(p);
    expect(p.items.length).toBeGreaterThanOrEqual(3);
  });
  it.each(odds.slice(0, 150).map((p, i) => [i, p] as [number, Pattern]))('odd #%i: intruder breaks the rule, the others satisfy it', (_i, p) => {
    checkOdd(p);
    expect(p.items).toEqual(p.options);
    expect(p.items).toHaveLength(5);
  });
  it('next puzzles: the three distractors are positive and differ from the answer', () => {
    for (const p of nexts) {
      const ans = p.options[p.answer];
      for (const [i, o] of p.options.entries()) if (i !== p.answer) { expect(o).not.toBe(ans); expect(Number(o)).toBeGreaterThan(0); }
      expect(p.items).not.toContain(ans);
    }
  });
  it('all next rule kinds appear', () => {
    expect(new Set(nexts.map(p => p.rule.id))).toEqual(new Set(['add', 'mul', 'double', 'fib', 'alt']));
  });
  it('all odd rule kinds appear', () => {
    expect(new Set(odds.map(p => p.rule.id))).toEqual(new Set(['even', 'multiple', 'square']));
  });
  it('answer position varies across puzzles', () => {
    expect(new Set(nexts.map(p => p.answer)).size).toBe(4);
  });
  it('sequence step parameters stay in range', () => {
    for (const p of nexts) {
      if (p.rule.id === 'add') { expect(p.rule.a).toBeGreaterThanOrEqual(2); expect(p.rule.a).toBeLessThanOrEqual(7); }
      if (p.rule.id === 'mul') expect([2, 3]).toContain(p.rule.a);
      if (p.rule.id === 'alt') { expect(p.rule.a).toBeGreaterThanOrEqual(2); expect(p.rule.b).toBeGreaterThanOrEqual(3); }
    }
  });
  it('multiple-rule bases are 3..7 and square sets use known squares', () => {
    for (const p of odds) {
      if (p.rule.id === 'multiple') { expect(p.rule.a).toBeGreaterThanOrEqual(3); expect(p.rule.a).toBeLessThanOrEqual(7); }
      if (p.rule.id === 'square') expect(p.rule.list.split(', ')).toHaveLength(4);
    }
  });
});
