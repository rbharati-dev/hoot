// What happens after a recording is finished: keep it on the device first
// (so it is safe even offline), then, if the person is signed in, agreed to
// processing, and the server is switched on, upload it and follow its progress.
import { filePut, askPersistence } from './idb';
import { discardPieces, type Finished } from './recorder';
import { addRecording, createMemory, getStory, memoryById, questionEvent, flushed } from './store';
import { storyBackendOn, uploadRecording, watchRecording } from './cloud';
import type { Recording } from './types';
import { count } from '../telemetry';

/** Saves one finished part of a recording to the device. Only resolves once it is really stored. */
export async function keepRecording(memoryId: string, recId: string, f: Finished): Promise<Recording> {
  await filePut(recId, f.blob);
  const rec: Recording = { id: recId, memoryId, mime: f.mime, size: f.blob.size, duration: Math.round(f.duration * 10) / 10, createdAt: Date.now(), status: 'local' };
  await addRecording(memoryId, rec);
  await flushed();
  await discardPieces(recId).catch(() => undefined);
  void askPersistence();
  count('story.recording_completed');
  const m = memoryById(memoryId);
  if (m?.questionId) void questionEvent(m.questionId, { answeredAt: Date.now(), memoryId });
  return rec;
}

/** A recording found after an interruption: attach it to its memory (or a new one). */
export async function adoptRecovered(memoryId: string, recId: string, f: Finished, title: string) {
  const target = memoryById(memoryId) ?? createMemory({ title });
  return keepRecording(target.id, recId, f);
}

const watching = new Map<string, () => void>();
const uploading = new Set<string>();

/** Can recordings be sent for text right now? */
export const canProcess = (uid: string | null | undefined) => !!uid && storyBackendOn() && !!getStory().aiConsentAt;

/** Uploads anything waiting and follows anything in progress. Safe to call often. */
export async function pumpUploads(uid: string, lang: string) {
  if (!canProcess(uid)) return;
  const s = getStory();
  for (const m of s.memories) {
    if (m.deleted) continue;
    for (const r of m.recordings) {
      if (r.status === 'local' && !uploading.has(r.id)) {
        uploading.add(r.id);
        try {
          await uploadRecording(uid, m.id, r, lang, s.style);
          count('story.recording_uploaded');
        } catch {
          /* stays "local"; tried again next time */
        } finally {
          uploading.delete(r.id);
        }
      }
      const live = r.inCloud && !['ready', 'failed_permanent', 'deleted'].includes(r.status);
      const needsStory = r.inCloud && r.status === 'ready' && !m.revisions.some(x => x.model?.startsWith(`ai_${r.id}_`)) && !r.error;
      if ((live || needsStory || (r.inCloud && !r.transcript)) && !watching.has(r.id)) {
        const stop = await watchRecording(uid, m.id, r.id).catch(() => null);
        if (stop) watching.set(r.id, stop);
      }
    }
  }
}
export function stopWatching() {
  watching.forEach(stop => stop());
  watching.clear();
}
