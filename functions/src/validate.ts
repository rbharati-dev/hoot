// Checks the story editor's answer before anything is saved. Anything odd is
// rejected (and retried) rather than "fixed up" into something not said.
import type { StoryResult } from './model.js';

const CHAPTERS = ['beginnings', 'childhood', 'school', 'findingWay', 'work', 'love', 'travels', 'traditions', 'turningPoints', 'lessons', 'today', 'legacy'];
const PRECISION = ['exact_year', 'approximate_year', 'approximate_range', 'decade', 'unknown'] as const;

type Out = { ok: true; value: StoryResult } | { ok: false; error: string };

const isStr = (v: unknown): v is string => typeof v === 'string';
const clean = (s: string, max: number) => s.replace(/\s+$/g, '').slice(0, max);
const strList = (v: unknown, maxItems: number, maxLen: number): string[] | null =>
  Array.isArray(v) && v.every(isStr) ? v.map(s => clean(s.trim(), maxLen)).filter(Boolean).slice(0, maxItems) : null;

export function validateStory(v: unknown, transcript: string): Out {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return { ok: false, error: 'not_object' };
  const o = v as Record<string, unknown>;
  if (!isStr(o.story) || !o.story.trim()) return { ok: false, error: 'empty_story' };
  const story = clean(o.story.trim(), 60_000);
  // An editor that writes far more than was said is inventing; refuse it.
  if (story.length > transcript.length * 1.6 + 300) return { ok: false, error: 'too_long_for_transcript' };

  const year = (y: unknown) => (y === null || y === undefined ? null : Number.isInteger(y) && (y as number) >= 1850 && (y as number) <= new Date().getFullYear() + 1 ? (y as number) : undefined);
  const yearStart = year(o.yearStart);
  const yearEnd = year(o.yearEnd);
  if (yearStart === undefined || yearEnd === undefined) return { ok: false, error: 'bad_year' };
  if (yearStart !== null && yearEnd !== null && yearEnd < yearStart) return { ok: false, error: 'year_order' };

  const datePrecision = PRECISION.includes(o.datePrecision as (typeof PRECISION)[number]) ? (o.datePrecision as StoryResult['datePrecision']) : 'unknown';
  if (!Array.isArray(o.people)) return { ok: false, error: 'people' };
  const people = o.people
    .filter((p): p is Record<string, unknown> => !!p && typeof p === 'object')
    .map(p => ({ name: isStr(p.name) && p.name.trim() ? clean(p.name.trim(), 80) : null, relationship: isStr(p.relationship) && p.relationship.trim() ? clean(p.relationship.trim(), 60) : null }))
    .filter(p => p.name || p.relationship)
    .slice(0, 30);
  const places = strList(o.places, 30, 120);
  const themes = strList(o.themes, 12, 60);
  const uncertain = strList(o.uncertain, 12, 300);
  const followUps = strList(o.followUps, 3, 250);
  if (!places || !themes || !uncertain || !followUps) return { ok: false, error: 'lists' };

  return {
    ok: true,
    value: {
      title: isStr(o.title) && o.title.trim() ? clean(o.title.trim(), 100) : null,
      story,
      chapter: isStr(o.chapter) && CHAPTERS.includes(o.chapter) ? o.chapter : null,
      yearStart,
      yearEnd,
      // A precision claim without a year is no claim at all.
      datePrecision: yearStart === null ? 'unknown' : datePrecision,
      people,
      places,
      themes,
      uncertain,
      followUps,
    },
  };
}
