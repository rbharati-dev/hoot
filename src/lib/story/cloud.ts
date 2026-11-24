// The account side of life stories (only when someone is signed in):
//  - each memory's words and choices are copied to users/{uid}/stories/{id}
//  - recordings are uploaded to private storage and registered, and the
//    server's transcript and story are brought back as they arrive
//  - deleting a memory deletes the server copies too
// Recording upload and processing need the server functions, which are only
// switched on when the project has them (VITE_STORY_BACKEND=1, or the emulator).
import { cloud, cloudConfigured, useEmulator } from '../cloud/firebase';
import { fileGet } from './idb';
import { extFor } from './recorder';
import { addRevision, getStory, liveMemories, memoryById, replaceStory, updateMemory, updateRecording } from './store';
import type { EditStyle, Memory, Recording, StoryState, Suggested } from './types';

const env = import.meta.env;
/** Are recording upload and transcription available in this build? */
export const storyBackendOn = () => cloudConfigured() && (useEmulator || env.VITE_STORY_BACKEND === '1');

async function extras() {
  const { app, db } = await cloud();
  const [fs, st, fn] = await Promise.all([import('firebase/firestore'), import('firebase/storage'), import('firebase/functions')]);
  const storage = st.getStorage(app);
  const functions = fn.getFunctions(app, 'us-central1');
  if (useEmulator && !(storage as unknown as { _hootConnected?: boolean })._hootConnected) {
    const host = env.VITE_FIREBASE_EMULATOR_HOST ?? '127.0.0.1';
    st.connectStorageEmulator(storage, host, 9199);
    fn.connectFunctionsEmulator(functions, host, 5001);
    (storage as unknown as { _hootConnected?: boolean })._hootConnected = true;
  }
  return { db, fs, st, storage, fn, functions };
}

// ------------------------------------------------------------ text sync
const META_ID = 'story_meta';
const PUSHED_KEY = 'hoot.story.pushed';
type Pushed = Record<string, number>;
const readPushed = (): Pushed => {
  try {
    return JSON.parse(localStorage.getItem(PUSHED_KEY) ?? '{}') as Pushed;
  } catch {
    return {};
  }
};
const writePushed = (p: Pushed) => {
  try {
    localStorage.setItem(PUSHED_KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
};
/** What goes to the account for a memory: everything but upload-only details. */
const forCloud = (m: Memory) => ({ ...m, recordings: m.recordings.map(r => ({ ...r, status: r.status === 'uploading' ? 'local' : r.status })) });

/**
 * Two-way copy of the person's stories with their account. Newest change wins
 * for each memory; a deletion on any device removes it everywhere.
 */
export async function syncStories(uid: string): Promise<void> {
  const { db, fs } = await extras();
  const col = fs.collection(db, 'users', uid, 'stories');
  const snap = await fs.getDocs(col);
  const s = getStory();
  const local = new Map(s.memories.map(m => [m.id, m]));
  const merged: Memory[] = [];
  type Meta = Pick<StoryState, 'chapters' | 'book' | 'questions' | 'offLimits' | 'style' | 'photos'>;
  const metaBox: { v: Meta | null } = { v: null };
  const remoteIds = new Set<string>();
  snap.forEach(d => {
    const raw = d.get('json');
    if (typeof raw !== 'string') return;
    let v: unknown;
    try {
      v = JSON.parse(raw);
    } catch {
      return;
    }
    if (d.id === META_ID) {
      metaBox.v = v as Meta;
      return;
    }
    const r = v as Memory;
    remoteIds.add(d.id);
    const l = local.get(d.id);
    if (!l || r.updatedAt > l.updatedAt) {
      // Keep this device's knowledge of which audio files it holds.
      merged.push(l ? { ...r, recordings: r.recordings.map(x => ({ ...x, ...(l.recordings.find(y => y.id === x.id)?.status === 'local' ? { status: 'local' as const } : {}) })) } : r);
    } else merged.push(l);
    local.delete(d.id);
  });
  for (const m of local.values()) merged.push(m);
  const next: StoryState = { ...s, memories: merged };
  if (metaBox.v) {
    const m = metaBox.v;
    // Chapters and the book: whichever list was changed most recently.
    const remoteNewest = Math.max(0, ...m.chapters.map(c => c.updatedAt), m.book?.updatedAt ?? 0);
    const localNewest = Math.max(0, ...s.chapters.map(c => c.updatedAt), s.book.updatedAt);
    if (remoteNewest > localNewest) Object.assign(next, { chapters: m.chapters, book: m.book, offLimits: m.offLimits, style: m.style });
    next.questions = { ...m.questions, ...s.questions };
    next.photos = { ...m.photos, ...s.photos };
  }
  await replaceStory(next);

  // Push what changed here since last time.
  const pushed = readPushed();
  for (const mem of next.memories) {
    if (pushed[mem.id] === mem.updatedAt && remoteIds.has(mem.id)) continue;
    const ref = fs.doc(db, 'users', uid, 'stories', mem.id);
    await fs.setDoc(ref, { json: JSON.stringify(forCloud(mem)), updatedAt: fs.serverTimestamp(), ...(mem.deleted ? { deleted: true } : {}) });
    pushed[mem.id] = mem.updatedAt;
  }
  const metaJson = JSON.stringify({ chapters: next.chapters, book: next.book, questions: next.questions, offLimits: next.offLimits, style: next.style, photos: next.photos });
  await fs.setDoc(fs.doc(db, 'users', uid, 'stories', META_ID), { json: metaJson, updatedAt: fs.serverTimestamp() });
  writePushed(pushed);
}

// ------------------------------------------------------------ recordings
/** Names and places already in the person's stories: spelling hints for transcription. */
export function hintsFrom(s: StoryState): string[] {
  const out = new Set<string>();
  for (const m of liveMemories(s)) {
    for (const p of m.people ?? m.suggested?.people ?? []) if (p.name) out.add(p.name);
    for (const p of m.places ?? m.suggested?.places ?? []) out.add(p);
  }
  return [...out].slice(0, 50);
}

/**
 * Uploads one recording and registers it for processing. Safe to call again:
 * a recording already registered is left alone (no duplicate processing).
 */
export async function uploadRecording(uid: string, memoryId: string, rec: Recording, lang: string, style: EditStyle, onProgress?: (f: number) => void) {
  const { db, fs, st, storage } = await extras();
  const docRef = fs.doc(db, 'users', uid, 'recordings', rec.id);
  if ((await fs.getDoc(docRef)).exists()) {
    await updateRecording(memoryId, rec.id, { status: 'uploaded', inCloud: true });
    return;
  }
  const blob = await fileGet(rec.id);
  if (!blob) throw new Error('missing-audio');
  const path = `users/${uid}/recordings/${rec.id}`;
  const ref = st.ref(storage, path);
  await updateRecording(memoryId, rec.id, { status: 'uploading' });
  try {
    await new Promise<void>((resolve, reject) => {
      const task = st.uploadBytesResumable(ref, blob, { contentType: rec.mime || blob.type || 'audio/webm', customMetadata: { ext: extFor(rec.mime) } });
      task.on('state_changed', snap => onProgress?.(snap.bytesTransferred / Math.max(1, snap.totalBytes)), reject, () => resolve());
    });
  } catch (e) {
    // Already uploaded by an earlier attempt that lost its connection afterwards?
    const exists = await st.getMetadata(ref).then(() => true, () => false);
    if (!exists) {
      await updateRecording(memoryId, rec.id, { status: 'local', error: 'upload' });
      throw e;
    }
  }
  const m = memoryById(memoryId);
  await fs.setDoc(docRef, {
    memoryId,
    storagePath: path,
    mime: (rec.mime || 'audio/webm').slice(0, 60),
    size: blob.size,
    clientDuration: Math.max(0, rec.duration),
    language: lang.slice(0, 5),
    style,
    hints: hintsFrom(getStory()),
    question: (m?.question ?? '').slice(0, 300),
    createdAt: fs.serverTimestamp(),
    status: 'uploaded',
  });
  await updateRecording(memoryId, rec.id, { status: 'uploaded', inCloud: true, error: undefined });
}

interface ServerStory extends Suggested {
  story: string;
  style: EditStyle;
  model: string;
  version: number;
  title?: string;
}

/** Brings the server's progress for a recording into the memory, as it happens. */
export async function watchRecording(uid: string, memoryId: string, recId: string): Promise<() => void> {
  const { db, fs } = await extras();
  return fs.onSnapshot(fs.doc(db, 'users', uid, 'recordings', recId), snap => {
    if (!snap.exists()) return;
    const d = snap.data();
    const m = memoryById(memoryId);
    if (!m) return;
    const patch: Partial<Recording> = { status: d.status, provider: d.provider, model: d.model, error: d.error?.code ?? d.storyError };
    if (typeof d.transcript === 'string') patch.transcript = d.transcript;
    if (typeof d.transcriptLanguage === 'string') patch.language = d.transcriptLanguage;
    if (typeof d.measuredSeconds === 'number') patch.duration = d.measuredSeconds;
    void updateRecording(memoryId, recId, patch);
    const story = d.story as ServerStory | undefined;
    if (story?.story) {
      const revId = `ai_${recId}_${story.version}`;
      if (!m.revisions.some(r => r.id === revId || r.model === revId)) {
        addRevision(memoryId, { text: story.story, style: story.style, source: 'ai', model: revId });
        const suggested: Suggested = {
          title: story.title,
          chapter: story.chapter,
          yearStart: story.yearStart,
          yearEnd: story.yearEnd,
          datePrecision: story.datePrecision,
          people: story.people,
          places: story.places,
          themes: story.themes,
          uncertain: story.uncertain,
          followUps: story.followUps,
        };
        void updateMemory(memoryId, cur => ({
          suggested,
          // Suggestions fill only what the person hasn't set themselves.
          title: cur.title || story.title || '',
          chapterId: cur.chapterId ?? (story.chapter ? `ch_${story.chapter}` : null),
        }));
      }
    }
  });
}

export async function retryRecording(recId: string) {
  const { fn, functions } = await extras();
  await fn.httpsCallable(functions, 'retryRecording')({ recordingId: recId });
}
export async function regenerateStory(recId: string, style: EditStyle, correctedTranscript?: string) {
  const { fn, functions } = await extras();
  await fn.httpsCallable(functions, 'regenerateStory')({ recordingId: recId, style, ...(correctedTranscript !== undefined ? { transcript: correctedTranscript } : {}) });
}
export async function deleteServerCopies(memoryId: string) {
  const { fn, functions } = await extras();
  await fn.httpsCallable(functions, 'deleteMemory')({ memoryId });
}
export async function usageReport(): Promise<Record<string, number | string>> {
  const { fn, functions } = await extras();
  const r = await fn.httpsCallable(functions, 'usageReport')({});
  return r.data as Record<string, number | string>;
}
