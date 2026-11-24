// Small helpers shared by the story pages.
import type { Chapter, Memory } from '../../lib/story/types';
import type { StoryStrings } from '../../lib/story/strings-en';
import { storyText } from '../../lib/story/store';

export function chapterTitle(s: StoryStrings, c: Chapter | undefined): string {
  if (!c) return s.noChapter;
  if (c.preset && !c.renamed) return (s as unknown as Record<string, string>)[`ch_${c.preset}`] ?? c.title;
  return c.title || s.untitled;
}
export const memoryTitle = (s: StoryStrings, m: Memory) => m.title || m.question || s.untitled;

/** "1974", "about 1974", "1974–1975", or '' (never invented). */
export function dateLabel(s: StoryStrings, m: Pick<Memory, 'yearStart' | 'yearEnd' | 'datePrecision'>): string {
  if (!m.yearStart) return '';
  const range = m.yearEnd && m.yearEnd !== m.yearStart ? `${m.yearStart}–${m.yearEnd}` : String(m.yearStart);
  return m.datePrecision === 'exact_year' ? range : `${s.approxPrefix} ${range}`;
}
export function excerpt(m: Memory, n = 160): string {
  const t = storyText(m).replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n).replace(/\s+\S*$/, '') + '…' : t;
}
export const secondsOf = (m: Memory) => m.recordings.filter(r => r.status !== 'recording').reduce((a, r) => a + (r.duration || 0), 0);
export const shortDate = (ms: number, lang: string) => new Date(ms).toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric' });

/** Downloads a blob as a file. */
export function saveFile(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}
export const safeName = (s: string) => s.replace(/[^\p{L}\p{N} _-]+/gu, '').trim().slice(0, 60) || 'memory';
