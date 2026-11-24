// The story store: one state object, kept in IndexedDB, with small typed
// operations. Components read it with useStory(); every change is saved at
// once (no "save" step that can be forgotten).
import { useSyncExternalStore } from 'react';
import { fileDelete, kvGet, kvSet } from './idb';
import type { Book, Chapter, EditStyle, Memory, Photo, QuestionEvent, Recording, Revision, StoryState } from './types';

/** The suggested chapters (titles come from the reader's language until renamed). */
export const PRESET_CHAPTERS = [
  'beginnings',
  'childhood',
  'school',
  'findingWay',
  'work',
  'love',
  'travels',
  'traditions',
  'turningPoints',
  'lessons',
  'today',
  'legacy',
] as const;
export type PresetChapter = (typeof PRESET_CHAPTERS)[number];

const KEY = 'state';
const now = () => Date.now();
export const newId = (prefix: string) => `${prefix}_${now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

function freshState(): StoryState {
  const t = now();
  return {
    memories: [],
    chapters: PRESET_CHAPTERS.map((p, i) => ({ id: `ch_${p}`, title: '', preset: p, order: i, createdAt: t, updatedAt: t })),
    book: { updatedAt: t },
    photos: {},
    questions: {},
    offLimits: [],
    style: 'own_words',
  };
}

let state: StoryState = freshState();
let loaded = false;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(l => l());
/** Changes made since the last save; saved in order so none are lost. */
let saving: Promise<unknown> = Promise.resolve();
let saveError: unknown = null;

/** Load once from the device (call early; components show a skeleton until then). */
export function loadStory(): Promise<void> {
  if (loaded) return Promise.resolve();
  loading ??= kvGet<StoryState>(KEY)
    .then(s => {
      if (s) state = migrate(s);
      loaded = true;
      emit();
    })
    .catch(() => {
      // No IndexedDB (a private window in some browsers): work in memory and say so.
      loaded = true;
      saveError = new Error('no-storage');
      emit();
    });
  return loading;
}
/** Older saved states get any fields added since (additive only). */
function migrate(s: StoryState): StoryState {
  const base = freshState();
  return { ...base, ...s, book: { ...base.book, ...s.book }, photos: s.photos ?? {}, questions: s.questions ?? {}, offLimits: s.offLimits ?? [], style: s.style ?? 'own_words' };
}

function commit(next: StoryState) {
  state = next;
  emit();
  const snapshot = state;
  saving = saving
    .then(() => kvSet(KEY, snapshot))
    .then(() => (saveError = null))
    .catch(e => {
      saveError = e;
      emit();
    });
  return saving;
}
/** Resolves once everything changed so far is really on the device. */
export const flushed = () => saving;
export const storageProblem = () => saveError;
export const isLoaded = () => loaded;
export const getStory = () => state;

export function useStory(): StoryState {
  return useSyncExternalStore(
    l => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
}
export function useStoryLoaded(): boolean {
  return useSyncExternalStore(
    l => {
      listeners.add(l);
      void loadStory();
      return () => listeners.delete(l);
    },
    () => loaded,
  );
}

// ---------------------------------------------------------------- memories
const live = (s: StoryState) => s.memories.filter(m => !m.deleted);
export const liveMemories = live;
export const memoryById = (id: string | null | undefined) => (id ? state.memories.find(m => m.id === id && !m.deleted) : undefined);

function putMemory(m: Memory) {
  const memories = state.memories.some(x => x.id === m.id) ? state.memories.map(x => (x.id === m.id ? m : x)) : [m, ...state.memories];
  return commit({ ...state, memories });
}

export function createMemory(init: Partial<Pick<Memory, 'title' | 'chapterId' | 'questionId' | 'question' | 'sessionId'>> = {}): Memory {
  const t = now();
  const m: Memory = {
    id: newId('mem'),
    title: init.title ?? '',
    chapterId: init.chapterId ?? null,
    questionId: init.questionId,
    question: init.question,
    sessionId: init.sessionId,
    datePrecision: 'unknown',
    status: 'draft',
    visibility: 'private',
    approved: false,
    inBook: true,
    recordings: [],
    revisions: [],
    photoIds: [],
    createdAt: t,
    updatedAt: t,
  };
  void putMemory(m);
  return m;
}

export function updateMemory(id: string, patch: Partial<Memory> | ((m: Memory) => Partial<Memory>)) {
  const m = state.memories.find(x => x.id === id);
  if (!m || m.deleted) return Promise.resolve();
  const p = typeof patch === 'function' ? patch(m) : patch;
  return putMemory({ ...m, ...p, updatedAt: now() });
}

/** Status follows from what the memory holds; recomputed after each change. */
export function statusOf(m: Memory): Memory['status'] {
  if (m.approved) return 'approved';
  if (m.revisions.length) return 'review';
  if (m.recordings.some(r => ['uploading', 'uploaded', 'transcribing', 'transcribed', 'generating_story'].includes(r.status))) return 'processing';
  if (m.recordings.some(r => r.status !== 'recording' && r.status !== 'deleted')) return 'recorded';
  return 'draft';
}
const settle = (m: Memory): Memory => ({ ...m, status: statusOf(m) });

export function addRecording(memoryId: string, rec: Recording) {
  return updateMemory(memoryId, m => settle({ ...m, recordings: [...m.recordings.filter(r => r.id !== rec.id), rec] }));
}
export function updateRecording(memoryId: string, recId: string, patch: Partial<Recording>) {
  return updateMemory(memoryId, m => settle({ ...m, recordings: m.recordings.map(r => (r.id === recId ? { ...r, ...patch } : r)) }));
}
export async function removeRecording(memoryId: string, recId: string) {
  await updateMemory(memoryId, m => settle({ ...m, recordings: m.recordings.filter(r => r.id !== recId) }));
  await fileDelete(recId).catch(() => undefined);
}

/** Adds a version of the story and makes it the current one. Earlier versions stay. */
export function addRevision(memoryId: string, r: Omit<Revision, 'id' | 'createdAt'>): Revision {
  const rev: Revision = { ...r, id: newId('rev'), createdAt: now() };
  void updateMemory(memoryId, m => settle({ ...m, revisions: [...m.revisions, rev], currentRevisionId: rev.id }));
  return rev;
}
export const currentRevision = (m: Memory) => m.revisions.find(r => r.id === m.currentRevisionId) ?? m.revisions[m.revisions.length - 1];
/** The text a reader sees: the current version, else the person's own corrected transcript, else the transcript. */
export function storyText(m: Memory): string {
  const r = currentRevision(m);
  if (r) return r.text;
  return m.recordings
    .map(x => x.correctedTranscript ?? x.transcript ?? '')
    .filter(Boolean)
    .join('\n\n');
}

export function approve(memoryId: string, approved = true) {
  return updateMemory(memoryId, m => settle({ ...m, approved }));
}

/** Removes a memory and everything that belongs to it on this device. */
export async function deleteMemory(id: string) {
  const m = state.memories.find(x => x.id === id);
  if (!m) return;
  const photos = { ...state.photos };
  m.photoIds.forEach(p => delete photos[p]);
  await commit({ ...state, photos, memories: state.memories.map(x => (x.id === id ? { ...x, deleted: true, updatedAt: now(), recordings: [], revisions: [], photoIds: [], title: '' } : x)) });
  await Promise.all([...m.recordings.map(r => fileDelete(r.id)), ...m.photoIds.map(p => fileDelete(p))].map(p => p.catch(() => undefined)));
}

// ---------------------------------------------------------------- chapters
export const visibleChapters = (s: StoryState) => [...s.chapters].sort((a, b) => a.order - b.order);
export const chapterById = (id: string | null | undefined) => state.chapters.find(c => c.id === id);
export const memoriesIn = (s: StoryState, chapterId: string | null) => live(s).filter(m => m.chapterId === chapterId);

export function addChapter(title: string): Chapter {
  const t = now();
  const c: Chapter = { id: newId('ch'), title: title.trim().slice(0, 120), order: Math.max(-1, ...state.chapters.map(x => x.order)) + 1, renamed: true, createdAt: t, updatedAt: t };
  void commit({ ...state, chapters: [...state.chapters, c] });
  return c;
}
export function updateChapter(id: string, patch: Partial<Chapter>) {
  return commit({ ...state, chapters: state.chapters.map(c => (c.id === id ? { ...c, ...patch, updatedAt: now() } : c)) });
}
export const renameChapter = (id: string, title: string) => updateChapter(id, { title: title.trim().slice(0, 120), renamed: true });
/** Only an empty chapter can be deleted (memories are never deleted by accident). */
export function deleteChapter(id: string): boolean {
  if (memoriesIn(state, id).length) return false;
  void commit({ ...state, chapters: state.chapters.filter(c => c.id !== id) });
  return true;
}
export function moveChapter(id: string, dir: -1 | 1) {
  const list = visibleChapters(state);
  const i = list.findIndex(c => c.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  const order = new Map(list.map((c, k) => [c.id, k]));
  return commit({ ...state, chapters: state.chapters.map(c => ({ ...c, order: order.get(c.id) ?? c.order })) });
}
/** Moves every memory of `from` into `into`, then removes `from`. */
export function mergeChapters(from: string, into: string) {
  if (from === into) return;
  const t = now();
  return commit({
    ...state,
    memories: state.memories.map(m => (m.chapterId === from ? { ...m, chapterId: into, updatedAt: t } : m)),
    chapters: state.chapters.filter(c => c.id !== from),
  });
}
export const moveMemory = (memoryId: string, chapterId: string | null) => updateMemory(memoryId, { chapterId });

// ---------------------------------------------------------------- book, photos, questions, settings
export const updateBook = (patch: Partial<Book>) => commit({ ...state, book: { ...state.book, ...patch, updatedAt: now() } });

export function addPhoto(p: Photo) {
  return commit({
    ...state,
    photos: { ...state.photos, [p.id]: p },
    memories: state.memories.map(m => (m.id === p.memoryId ? { ...m, photoIds: [...m.photoIds, p.id], updatedAt: now() } : m)),
  });
}
export const photosOf = (m: Memory): Photo[] => m.photoIds.map(id => state.photos[id]).filter((p): p is Photo => !!p);
export function updatePhoto(id: string, patch: Partial<Photo>) {
  const p = state.photos[id];
  if (!p) return Promise.resolve();
  return commit({ ...state, photos: { ...state.photos, [id]: { ...p, ...patch } } });
}
export async function removePhoto(memoryId: string, id: string) {
  const photos = { ...state.photos };
  delete photos[id];
  await commit({ ...state, photos, memories: state.memories.map(m => (m.id === memoryId ? { ...m, photoIds: m.photoIds.filter(x => x !== id), updatedAt: now() } : m)) });
  await fileDelete(id).catch(() => undefined);
}

export function questionEvent(questionId: string, patch: Partial<QuestionEvent>) {
  const prev = state.questions[questionId] ?? { questionId };
  return commit({ ...state, questions: { ...state.questions, [questionId]: { ...prev, ...patch } } });
}
export const setOffLimits = (cats: string[]) => commit({ ...state, offLimits: cats });
export const setStyle = (style: EditStyle) => commit({ ...state, style });
export const setAiConsent = (at: number | undefined) => commit({ ...state, aiConsentAt: at });

/** Replaces the whole state (used by account sync and by tests). */
export const replaceStory = (s: StoryState) => commit(migrate(s));
/** For tests: start from nothing. */
export function resetStoryForTests() {
  state = freshState();
  loaded = true;
  loading = Promise.resolve();
  emit();
}
