// The processing pipeline for one recording:
//   uploaded → transcribing → transcribed → generating_story → ready
// with awaiting_setup (no key yet), failed_retryable and failed_permanent.
// Each step is claimed in a transaction, so two runs never process the same
// recording at once; a story-editing failure never throws away a transcript;
// and a recording deleted part-way is never written back.
import { getFirestore, FieldValue, type DocumentReference } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { logger } from 'firebase-functions';
import { config, type Config } from './config.js';
import { measureSeconds, maxPlausibleSeconds, sniff, MIME_OF, EXT_OF } from './audio.js';
import { transcribeAudio, transcribeConfigured } from './providers/transcribe.js';
import { editConfigured, editStory } from './providers/edit.js';
import { addUsage, dailyRef, editKey, today, transcriptionKey } from './ledger.js';
import type { EditStyle } from './model.js';

const db = () => getFirestore();
export const recRef = (uid: string, recId: string) => db().doc(`users/${uid}/recordings/${recId}`);
const STYLES: EditStyle[] = ['own_words', 'polished', 'book'];

type Rec = Record<string, unknown> & { status?: string; attempts?: number; storagePath?: string; memoryId?: string };

/** Claims the recording for a step, or returns null if it isn't in a state for it. */
async function claim(ref: DocumentReference, from: string[], to: string, extra: Record<string, unknown> = {}) {
  return db().runTransaction(async tx => {
    const s = await tx.get(ref);
    const d = s.data() as Rec | undefined;
    if (!d || !from.includes(String(d.status))) return null;
    tx.update(ref, { status: to, updatedAt: FieldValue.serverTimestamp(), ...extra });
    return d;
  });
}

/** Writes only if the recording still exists and hasn't been deleted. */
async function settle(ref: DocumentReference, patch: Record<string, unknown>) {
  return db().runTransaction(async tx => {
    const s = await tx.get(ref);
    if (!s.exists || s.get('status') === 'deleted') return false;
    tx.update(ref, { ...patch, updatedAt: FieldValue.serverTimestamp() });
    return true;
  });
}

function backoffMs(attempts: number) {
  return Math.min(6 * 3600_000, 60_000 * 2 ** attempts);
}

export async function processRecording(uid: string, recId: string, cfg: Config = config()): Promise<string> {
  const ref = recRef(uid, recId);
  const jobRef = db().collection('jobs').doc();
  const rec = await claim(ref, ['uploaded', 'failed_retryable', 'awaiting_setup'], 'transcribing', { attempts: FieldValue.increment(1), jobId: jobRef.id });
  if (!rec) return 'skipped';
  const attempts = (rec.attempts ?? 0) + 1;
  await jobRef.set({ uid, recordingId: recId, type: 'transcription', status: 'started', attempt: attempts, createdAt: FieldValue.serverTimestamp(), startedAt: FieldValue.serverTimestamp() });
  const finishJob = (status: string, code?: string, message?: string) =>
    jobRef.update({ status, errorCode: code ?? null, errorMessage: message?.slice(0, 300) ?? null, completedAt: FieldValue.serverTimestamp() });

  const failWith = async (code: string, retryable: boolean, message?: string) => {
    const permanent = !retryable || attempts >= cfg.maxRetries;
    await settle(ref, {
      status: permanent ? 'failed_permanent' : 'failed_retryable',
      error: { code, at: Date.now() },
      nextAttemptAt: permanent ? null : Date.now() + backoffMs(attempts),
    });
    await finishJob('failed', code, message);
    logger.warn('transcription failed', { uid, recId, code, attempts }); // never the transcript
    return code;
  };

  // 1. Not set up yet? Keep it safe and say so — never pretend.
  if (!transcribeConfigured(cfg)) {
    await settle(ref, { status: 'awaiting_setup', attempts: FieldValue.increment(-1) });
    await finishJob('waiting', 'not_configured');
    return 'awaiting_setup';
  }

  // 2. Safety limits per person per day (operational, not a paywall).
  const day = today();
  const daily = (await dailyRef(db(), uid, day).get()).data() ?? {};
  if ((daily.recordings ?? 0) >= cfg.dailyRecordingsLimit || (daily.seconds ?? 0) >= cfg.dailySecondsLimit) {
    await settle(ref, { status: 'failed_retryable', error: { code: 'daily_limit', at: Date.now() }, nextAttemptAt: Date.now() + 6 * 3600_000, attempts: FieldValue.increment(-1) });
    await finishJob('deferred', 'daily_limit');
    return 'daily_limit';
  }

  // 3. Fetch and check the file itself.
  const path = String(rec.storagePath ?? '');
  if (!path.startsWith(`users/${uid}/recordings/`)) return failWith('bad_path', false);
  const file = getStorage().bucket().file(path);
  let audio: Buffer;
  try {
    const [meta] = await file.getMetadata();
    if (Number(meta.size) > cfg.maxUploadBytes) return failWith('too_large', false);
    [audio] = await file.download();
  } catch (e) {
    return failWith('download', true, (e as Error).message);
  }
  const kind = sniff(audio);
  if (!kind) return failWith('not_audio', false);
  const mime = MIME_OF[kind];
  const measured = await measureSeconds(audio, mime);
  if (measured !== null && measured > cfg.maxRecordingSeconds + 5) return failWith('too_long', false);

  // 4. Transcribe, with the question and names from earlier stories as hints.
  const hints = Array.isArray(rec.hints) ? (rec.hints as unknown[]).filter((h): h is string => typeof h === 'string').slice(0, 50) : [];
  const language = typeof rec.language === 'string' ? rec.language.slice(0, 5) : 'en';
  const question = typeof rec.question === 'string' ? rec.question.slice(0, 300) : '';
  const tr = await transcribeAudio({ audio, mime, filename: `${recId}.${EXT_OF[kind]}`, languages: [language], prompt: question, keywords: hints }, cfg);
  if (!tr.ok) return failWith(tr.code, tr.retryable, tr.message);

  // Seconds counted: measured from the file; else the provider's; else the app's, capped by what the file could hold.
  const clientSeconds = Math.max(0, Number(rec.clientDuration) || 0);
  const seconds = measured ?? tr.seconds ?? Math.min(clientSeconds, maxPlausibleSeconds(audio.length));
  const durationSource = measured !== null ? 'file' : tr.seconds !== null ? 'provider' : 'app (capped)';

  // 5. Save the transcript and count the usage once, in one transaction.
  const saved = await db().runTransaction(async tx => {
    const s = await tx.get(ref);
    if (!s.exists || s.get('status') === 'deleted') return false;
    const added = await addUsage(db(), tx, {
      uid,
      recordingId: recId,
      jobId: jobRef.id,
      type: 'transcription',
      seconds,
      billableSeconds: seconds,
      bytes: audio.length,
      provider: tr.provider,
      model: tr.model,
      estimatedCostUsd: (seconds / 60) * cfg.transcribeUsdPerMin,
      actualCostUsd: tr.costUsd,
      currency: 'USD',
      idempotencyKey: transcriptionKey(uid, recId),
      basis: `${tr.usageBasis}; duration from ${durationSource}`,
    });
    // Counted once: a retry finds the ledger entry already there and adds nothing.
    if (added) tx.set(dailyRef(db(), uid, day), { recordings: FieldValue.increment(1), seconds: FieldValue.increment(seconds) }, { merge: true });
    tx.update(ref, {
      status: 'transcribed',
      transcript: tr.text,
      transcriptLanguage: tr.language,
      provider: tr.provider,
      model: tr.model,
      measuredSeconds: seconds,
      durationSource,
      sniffedType: kind,
      transcribedSeconds: tr.seconds ?? seconds,
      accounted: true,
      error: FieldValue.delete(),
      nextAttemptAt: null,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return true;
  });
  if (!saved) {
    await finishJob('cancelled', 'deleted');
    await file.delete().catch(() => undefined);
    return 'deleted';
  }
  await finishJob('done');

  // 6. Turn it into a story (a failure here keeps the transcript).
  const style = STYLES.includes(rec.style as EditStyle) ? (rec.style as EditStyle) : 'own_words';
  await makeStory(uid, recId, style, tr.text, cfg);
  return 'done';
}

/** Story editing on its own: after transcription, or when the person asks for another version. */
export async function makeStory(uid: string, recId: string, style: EditStyle, transcript: string, cfg: Config = config(), fromStatuses = ['transcribed', 'ready']) {
  const ref = recRef(uid, recId);
  if (!editConfigured(cfg)) {
    await settle(ref, { status: 'ready', storyError: 'not_configured' });
    return 'not_configured';
  }
  const rec = await claim(ref, fromStatuses, 'generating_story', { editAttempts: FieldValue.increment(1) });
  if (!rec) return 'skipped';
  const attempt = Number(rec.editAttempts ?? 0) + 1;
  const hints = Array.isArray(rec.hints) ? (rec.hints as string[]) : [];
  const r = await editStory({ transcript, style, question: String(rec.question ?? ''), hints, language: String(rec.transcriptLanguage ?? rec.language ?? 'en') }, cfg);
  if (!r.ok) {
    await settle(ref, { status: 'ready', storyError: r.code });
    logger.warn('story editing failed', { uid, recId, code: r.code });
    return r.code;
  }
  await db().runTransaction(async tx => {
    const s = await tx.get(ref);
    if (!s.exists || s.get('status') === 'deleted') return;
    await addUsage(db(), tx, {
      uid,
      recordingId: recId,
      jobId: String(rec.jobId ?? ''),
      type: 'ai_edit',
      seconds: 0,
      billableSeconds: 0, // editing is our cost, never counted against the person's minutes
      bytes: 0,
      provider: r.provider,
      model: r.model,
      estimatedCostUsd: r.costUsd,
      actualCostUsd: null,
      currency: 'USD',
      idempotencyKey: editKey(uid, recId, attempt),
      basis: `estimate: ${r.inputTokens} input + ${r.outputTokens} output tokens`,
    });
    tx.update(ref, {
      status: 'ready',
      story: { ...r.result, style, provider: r.provider, model: r.model, at: Date.now(), version: attempt },
      storyError: FieldValue.delete(),
      updatedAt: FieldValue.serverTimestamp(),
    });
  });
  return 'done';
}

/** Removes a memory's server copies: audio files, transcripts, stories. The ledger keeps only seconds. */
export async function deleteMemoryData(uid: string, memoryId: string) {
  const recs = await db().collection(`users/${uid}/recordings`).where('memoryId', '==', memoryId).get();
  const bucket = getStorage().bucket();
  for (const d of recs.docs) {
    // Mark first, so a job still running can't write anything back.
    await d.ref.set({ status: 'deleted', deletedAt: FieldValue.serverTimestamp(), transcript: FieldValue.delete(), story: FieldValue.delete(), hints: FieldValue.delete(), question: FieldValue.delete() }, { merge: true });
    const p = d.get('storagePath');
    if (typeof p === 'string' && p.startsWith(`users/${uid}/`)) await bucket.file(p).delete().catch(() => undefined);
  }
  await bucket.deleteFiles({ prefix: `users/${uid}/photos/${memoryId}/` }).catch(() => undefined);
  await db().doc(`users/${uid}/stories/${memoryId}`).delete().catch(() => undefined);
  return recs.size;
}

/** Everything for one person (account deletion). */
export async function deleteAllForUser(uid: string) {
  await getStorage().bucket().deleteFiles({ prefix: `users/${uid}/` }).catch(() => undefined);
  for (const sub of ['recordings', 'stories']) {
    const docs = await db().collection(`users/${uid}/${sub}`).listDocuments();
    for (const d of docs) await d.delete();
  }
  const ledger = await db().collection('usageLedger').where('uid', '==', uid).get();
  for (const d of ledger.docs) await d.ref.delete();
  const jobs = await db().collection('jobs').where('uid', '==', uid).get();
  for (const d of jobs.docs) await d.ref.delete();
}
