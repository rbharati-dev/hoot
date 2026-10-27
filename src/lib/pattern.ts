// Pattern-recognition puzzles: no words, just numbers and simple shapes, so
// they work in every language. Two kinds: "what comes next" in a sequence,
// and "which one does not belong". Each returns four options and the index of
// the right answer. Kept pure so it can be unit-tested.

export type PatternKind = 'next' | 'odd';
// Why the answer is right, as data so each language can phrase it.
export type Rule =
  | { id: 'add' | 'mul'; a: number }
  | { id: 'alt'; a: number; b: number }
  | { id: 'double' | 'fib' | 'even' }
  | { id: 'multiple'; a: number }
  | { id: 'square'; list: string };
export interface Pattern {
  kind: PatternKind;
  rule: Rule;
  items: string[]; // the sequence (for 'next') or the set (for 'odd')
  options: string[];
  answer: number; // index into options
}

const rnd = (n: number) => Math.floor(Math.random() * n);
const pick = <T,>(a: T[]) => a[rnd(a.length)];

function shuffleWithAnswer(correct: string, distractors: string[]): { options: string[]; answer: number } {
  const options = [correct, ...distractors];
  for (let i = options.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [options[i], options[j]] = [options[j], options[i]];
  }
  return { options, answer: options.indexOf(correct) };
}

function nearby(n: number, avoid: Set<number>): number {
  for (let tries = 0; tries < 20; tries++) {
    const d = pick([-3, -2, -1, 1, 2, 3, 4, 5]);
    const v = n + d;
    if (v > 0 && !avoid.has(v)) {
      avoid.add(v);
      return v;
    }
  }
  const v = n + avoid.size + 1;
  avoid.add(v);
  return v;
}

function nextSequence(): Pattern {
  const kind = pick(['add', 'add', 'mul', 'double', 'fib', 'alt'] as const);
  const start = 1 + rnd(6);
  let seq: number[] = [];
  let rule: Rule = { id: 'double' };
  if (kind === 'add') {
    const step = 2 + rnd(6);
    rule = { id: 'add', a: step };
    seq = Array.from({ length: 5 }, (_, i) => start + i * step);
  } else if (kind === 'mul') {
    const f = 2 + rnd(2);
    rule = { id: 'mul', a: f };
    seq = Array.from({ length: 4 }, (_, i) => start * f ** i);
  } else if (kind === 'double') {
    seq = Array.from({ length: 5 }, (_, i) => start * 2 ** i);
  } else if (kind === 'fib') {
    rule = { id: 'fib' };
    seq = [start, start + rnd(3)];
    while (seq.length < 5) seq.push(seq[seq.length - 1] + seq[seq.length - 2]);
  } else {
    // alternating two steps, e.g. +2 +5 +2 +5
    const a = 2 + rnd(4), b = 3 + rnd(5);
    rule = { id: 'alt', a, b };
    seq = [start];
    for (let i = 1; i < 6; i++) seq.push(seq[i - 1] + (i % 2 ? a : b));
  }
  const answer = seq[seq.length - 1];
  const shown = seq.slice(0, -1);
  const avoid = new Set<number>(seq);
  const distractors = [nearby(answer, avoid), nearby(answer, avoid), nearby(answer, avoid)];
  const { options, answer: idx } = shuffleWithAnswer(String(answer), distractors.map(String));
  return { kind: 'next', rule, items: shown.map(String), options, answer: idx };
}

// Odd-one-out over a simple numeric property (all even but one, all multiples
// of a base but one, all squares but one).
function oddOut(): Pattern {
  const mode = pick(['even', 'multiple', 'square'] as const);
  const set = new Set<number>();
  let belong: number[] = [];
  let intruder = 0;
  let rule: Rule = { id: 'even' };
  if (mode === 'even') {
    while (belong.length < 4) {
      const v = 2 * (2 + rnd(20));
      if (!set.has(v)) (set.add(v), belong.push(v));
    }
    do intruder = 2 * (2 + rnd(20)) + 1;
    while (set.has(intruder));
  } else if (mode === 'multiple') {
    const base = 3 + rnd(5);
    rule = { id: 'multiple', a: base };
    while (belong.length < 4) {
      const v = base * (2 + rnd(9));
      if (!set.has(v)) (set.add(v), belong.push(v));
    }
    do intruder = base * (2 + rnd(9)) + 1 + rnd(base - 1);
    while (set.has(intruder) || intruder % base === 0);
  } else {
    const squares = [4, 9, 16, 25, 36, 49, 64, 81, 100, 121];
    while (belong.length < 4) {
      const v = pick(squares);
      if (!set.has(v)) (set.add(v), belong.push(v));
    }
    do intruder = belong[0] + 1 + rnd(4);
    while (squares.includes(intruder) || set.has(intruder));
  }
  if (mode === 'square') rule = { id: 'square', list: belong.slice().sort((x, y) => x - y).map(v => `${v} = ${Math.sqrt(v)}×${Math.sqrt(v)}`).join(', ') };
  const all = [...belong, intruder];
  for (let i = all.length - 1; i > 0; i--) {
    const j = rnd(i + 1);
    [all[i], all[j]] = [all[j], all[i]];
  }
  return { kind: 'odd', rule, items: all.map(String), options: all.map(String), answer: all.indexOf(intruder) };
}

export function makePattern(): Pattern {
  return Math.random() < 0.55 ? nextSequence() : oddOut();
}
