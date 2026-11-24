// Numbers for "your story so far". No percentages of a life: just what's there.
import { liveMemories, storyText } from './store';
import type { Memory, StoryState } from './types';

/** A memory "counts" once it holds something: a recording or written words. */
export const hasContent = (m: Memory) => m.recordings.some(r => r.status !== 'recording') || storyText(m).trim().length > 0;

export interface StoryStats {
  memories: number;
  seconds: number;
  chaptersStarted: number;
  latest?: Memory;
}
export function storyStats(s: StoryState): StoryStats {
  const ms = liveMemories(s).filter(hasContent);
  const seconds = ms.reduce((a, m) => a + m.recordings.filter(r => r.status !== 'recording').reduce((b, r) => b + (r.duration || 0), 0), 0);
  const chapters = new Set(ms.map(m => m.chapterId).filter(Boolean));
  const latest = [...ms].sort((a, b) => b.updatedAt - a.updatedAt)[0];
  return { memories: ms.length, seconds, chaptersStarted: chapters.size, latest };
}

/** "2 h 14 min", "14 min", "45 sec" — seconds kept exactly, shown simply. */
export function formatDuration(seconds: number, units: { h: string; min: string; sec: string }): string {
  const s = Math.round(seconds);
  if (s < 60) return `${s} ${units.sec}`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h} ${units.h} ${m} ${units.min}` : `${m} ${units.min}`;
}
/** 0:00 clock for the recorder and players. */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/** Memories still in progress, newest first (for "Continue where you left off"). */
export function unfinished(s: StoryState): Memory[] {
  return liveMemories(s)
    .filter(m => !m.approved && (hasContent(m) || m.question))
    .filter(m => m.status !== 'draft' || m.recordings.length > 0 || storyText(m))
    .sort((a, b) => b.updatedAt - a.updatedAt);
}
export function recent(s: StoryState, n = 4): Memory[] {
  return liveMemories(s)
    .filter(hasContent)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, n);
}
