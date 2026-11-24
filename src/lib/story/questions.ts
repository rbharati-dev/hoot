// The storytelling question library, and how the day's question is chosen.
// The choice is the "interviewer": it remembers what was answered, skipped or
// put off-limits, leans towards parts of life with fewer stories so far, and
// offers follow-ups that come from what the person actually said.
import type { Lang } from '../data';
import type { StoryState } from './types';
import { liveMemories } from './store';

export interface Question {
  id: string;
  cat: string;
  chapter: string;
  title: string;
  text: string;
  t?: Partial<Record<Lang, { title: string; text: string }>>;
}
export const CATEGORIES = ['childhood', 'school', 'youth', 'relationships', 'career', 'travel', 'history', 'achievements', 'everyday', 'wisdom'] as const;

let cache: Promise<Question[]> | null = null;
export function loadQuestions(): Promise<Question[]> {
  cache ??= fetch('/content/questions.json')
    .then(r => (r.ok ? (r.json() as Promise<Question[]>) : []))
    .catch(() => {
      cache = null;
      return [];
    });
  return cache;
}
/** The question in the reader's language (English until translated). */
export function qText(q: Pick<Question, 'title' | 'text' | 't'>, lang: Lang): { title: string; text: string } {
  const tr = lang === 'en' ? undefined : q.t?.[lang];
  return tr?.title ? { title: tr.title, text: tr.text } : { title: q.title, text: q.text };
}

/** A number from today's date, so everyone's question changes at midnight. */
export const dayNumber = (d = new Date()) => Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86_400_000);

/** Questions still worth asking, best first. */
export function rankQuestions(all: Question[], s: StoryState): Question[] {
  const answered = new Set(Object.values(s.questions).filter(e => e.answeredAt).map(e => e.questionId));
  liveMemories(s).forEach(m => m.questionId && answered.add(m.questionId));
  const skipped = new Map(Object.values(s.questions).filter(e => e.skippedAt).map(e => [e.questionId, e.skippedAt!]));
  // How many stories each part of life already has.
  const perCat = new Map<string, number>();
  for (const m of liveMemories(s)) {
    const q = all.find(x => x.id === m.questionId);
    if (q) perCat.set(q.cat, (perCat.get(q.cat) ?? 0) + 1);
  }
  const weekAgo = Date.now() - 7 * 86_400_000;
  return all
    .filter(q => !answered.has(q.id) && !s.offLimits.includes(q.cat))
    .filter(q => !(skipped.get(q.id)! > weekAgo)) // a skipped question can come back after a week
    .map((q, i) => ({ q, score: (perCat.get(q.cat) ?? 0) * 10 + (skipped.has(q.id) ? 5 : 0) + i / 1000 }))
    .sort((a, b) => a.score - b.score)
    .map(x => x.q);
}

/** Today's question: steady for the day, different tomorrow, never an answered one. */
export function dailyQuestion(all: Question[], s: StoryState, offset = 0, d = new Date()): Question | undefined {
  const ranked = rankQuestions(all, s);
  if (!ranked.length) return undefined;
  // Spread across the top few so it isn't always the same category in a row.
  const pool = ranked.slice(0, Math.min(ranked.length, 12));
  return pool[(dayNumber(d) + offset) % pool.length];
}

/** The very first question, for a new storyteller. */
export const FIRST_QUESTION_ID = 'q_earliest';

/** Follow-ups when the story editor is not available: the next questions in the same part of life. */
export function nextInCategory(all: Question[], s: StoryState, cat: string, n = 3): Question[] {
  return rankQuestions(all, s)
    .filter(q => q.cat === cat)
    .slice(0, n);
}
