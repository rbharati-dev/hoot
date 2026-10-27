// Quick-math problems: gentle arithmetic with four answer choices. Pure, so
// the generator can be unit-tested. Difficulty widens the number range and
// unlocks multiplication/division.

export type MathLevel = 'easy' | 'medium' | 'hard' | 'expert';
export interface MathProblem {
  prompt: string; // e.g. "14 + 9"
  answer: number;
  options: number[];
}

const rnd = (n: number) => Math.floor(Math.random() * n);

function expertProblem(): { prompt: string; answer: number } {
  const k = rnd(5);
  if (k === 0) {
    const a = 100 + rnd(900), b = 100 + rnd(900);
    return { prompt: `${a} + ${b}`, answer: a + b };
  }
  if (k === 1) {
    const a = 200 + rnd(800), b = 100 + rnd(a - 100); // never negative
    return { prompt: `${a} − ${b}`, answer: a - b };
  }
  if (k === 2) {
    const a = 11 + rnd(19), b = 11 + rnd(19);
    return { prompt: `${a} × ${b}`, answer: a * b };
  }
  if (k === 3) {
    const b = 3 + rnd(17), q = 12 + rnd(38);
    return { prompt: `${b * q} ÷ ${b}`, answer: q };
  }
  // two steps
  const a = 10 + rnd(90), b = 10 + rnd(90), c = 2 + rnd(9);
  if (rnd(2)) return { prompt: `${a} + ${b} × ${c}`, answer: a + b * c };
  return { prompt: `${a * c} ÷ ${c} + ${b}`, answer: a + b };
}

function problem(level: MathLevel): { prompt: string; answer: number } {
  if (level === 'expert') return expertProblem();
  const ops = level === 'easy' ? ['+', '-'] : level === 'medium' ? ['+', '-', '×'] : ['+', '-', '×', '÷'];
  const op = ops[rnd(ops.length)];
  const hi = level === 'easy' ? 20 : level === 'medium' ? 50 : 100;
  if (op === '+') {
    const a = 1 + rnd(hi), b = 1 + rnd(hi);
    return { prompt: `${a} + ${b}`, answer: a + b };
  }
  if (op === '-') {
    const a = 1 + rnd(hi), b = 1 + rnd(a); // never negative
    return { prompt: `${a} − ${b}`, answer: a - b };
  }
  if (op === '×') {
    const a = 2 + rnd(level === 'medium' ? 10 : 12), b = 2 + rnd(level === 'medium' ? 10 : 12);
    return { prompt: `${a} × ${b}`, answer: a * b };
  }
  // division that comes out whole
  const b = 2 + rnd(11), q = 2 + rnd(11);
  return { prompt: `${b * q} ÷ ${b}`, answer: q };
}

export function makeMath(level: MathLevel): MathProblem {
  const { prompt, answer } = problem(level);
  const opts = new Set<number>([answer]);
  while (opts.size < 4) {
    const delta = (1 + rnd(answer < 12 ? 4 : answer > 200 ? 30 : 9)) * (Math.random() < 0.5 ? 1 : -1);
    const cand = answer + delta;
    if (cand >= 0 && cand !== answer) opts.add(cand);
  }
  const options = [...opts];
  for (let i = options.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [options[i], options[j]] = [options[j], options[i]];
  }
  return { prompt, answer, options };
}
