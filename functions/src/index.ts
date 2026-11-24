// Hoot's server functions for the life-story pages.
//   onRecordingCreated   — starts processing as soon as the app registers an upload
//   retryRecording       — the person presses "Try again"
//   regenerateStory      — another version of the story (style change, corrected transcript)
//   deleteMemory         — removes a memory's server copies
//   deleteMyStories      — removes everything (also runs when an account is deleted)
//   usageReport          — totals for the owner (admins only)
//   sweep                — every 30 minutes: retries due, and rescues stuck jobs
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as v1 from 'firebase-functions/v1';
import { setGlobalOptions } from 'firebase-functions/v2';
import { SECRETS, config } from './config.js';
import { deleteAllForUser, deleteMemoryData, makeStory, processRecording, recRef } from './pipeline.js';
import type { EditStyle } from './model.js';

initializeApp();
setGlobalOptions({ region: 'us-central1', maxInstances: 10 });

const ID = /^[A-Za-z0-9_-]{6,64}$/;
const uidOf = (req: CallableRequest) => {
  if (!req.auth?.uid) throw new HttpsError('unauthenticated', 'Please sign in.');
  return req.auth.uid;
};
const idArg = (v: unknown, name: string) => {
  if (typeof v !== 'string' || !ID.test(v)) throw new HttpsError('invalid-argument', `Bad ${name}.`);
  return v;
};

/** Simple per-person rate limit for callables (operational protection). */
async function rateLimit(uid: string, action: string, perHour: number) {
  const ref = getFirestore().doc(`rateLimits/${uid}_${action}`);
  await getFirestore().runTransaction(async tx => {
    const s = await tx.get(ref);
    const hour = Math.floor(Date.now() / 3600_000);
    const n = s.get('hour') === hour ? Number(s.get('n') ?? 0) : 0;
    if (n >= perHour) throw new HttpsError('resource-exhausted', 'Please wait a little and try again.');
    tx.set(ref, { hour, n: n + 1 });
  });
}

export const onRecordingCreated = onDocumentCreated({ document: 'users/{uid}/recordings/{recId}', secrets: SECRETS, timeoutSeconds: 540, memory: '1GiB' }, async event => {
  await processRecording(event.params.uid, event.params.recId);
});

export const retryRecording = onCall({ secrets: SECRETS, timeoutSeconds: 540, memory: '1GiB' }, async req => {
  const uid = uidOf(req);
  const recId = idArg(req.data?.recordingId, 'recording');
  await rateLimit(uid, 'retry', 30);
  const ref = recRef(uid, recId);
  const s = await ref.get();
  if (!s.exists) throw new HttpsError('not-found', 'Not found.');
  const status = s.get('status');
  if (status === 'failed_permanent') await ref.update({ status: 'failed_retryable' }); // the person may try once more
  if (status === 'ready' && s.get('storyError')) {
    return { result: await makeStory(uid, recId, (s.get('style') as EditStyle) ?? 'own_words', String(s.get('transcript') ?? '')) };
  }
  return { result: await processRecording(uid, recId) };
});

export const regenerateStory = onCall({ secrets: SECRETS, timeoutSeconds: 300 }, async req => {
  const uid = uidOf(req);
  const recId = idArg(req.data?.recordingId, 'recording');
  const style = req.data?.style as EditStyle;
  if (!['own_words', 'polished', 'book'].includes(style)) throw new HttpsError('invalid-argument', 'Bad style.');
  await rateLimit(uid, 'regenerate', 20);
  const ref = recRef(uid, recId);
  const s = await ref.get();
  if (!s.exists || s.get('status') === 'deleted') throw new HttpsError('not-found', 'Not found.');
  // The person's own corrected transcript, if they sent one, is the source; the original is kept.
  const corrected = typeof req.data?.transcript === 'string' ? req.data.transcript.slice(0, 200_000) : null;
  if (corrected !== null) await ref.update({ correctedTranscript: corrected });
  const source = corrected ?? String(s.get('correctedTranscript') ?? s.get('transcript') ?? '');
  if (!source.trim()) throw new HttpsError('failed-precondition', 'No transcript yet.');
  await ref.update({ style });
  return { result: await makeStory(uid, recId, style, source) };
});

export const deleteMemory = onCall(async req => {
  const uid = uidOf(req);
  const memoryId = idArg(req.data?.memoryId, 'memory');
  return { removed: await deleteMemoryData(uid, memoryId) };
});

export const deleteMyStories = onCall({ timeoutSeconds: 540 }, async req => {
  const uid = uidOf(req);
  await deleteAllForUser(uid);
  return { ok: true };
});
// Deleting an account removes its stories too.
export const onAccountDeleted = v1.auth.user().onDelete(async user => {
  await deleteAllForUser(user.uid);
});

/** Totals for understanding costs before any pricing exists. Admins only. */
export const usageReport = onCall({ timeoutSeconds: 120 }, async req => {
  const uid = uidOf(req);
  if (!config().adminUids.includes(uid)) throw new HttpsError('permission-denied', 'Not allowed.');
  const db = getFirestore();
  const ledger = await db.collection('usageLedger').get();
  let transcribedSeconds = 0;
  let transcribeCost = 0;
  let editCost = 0;
  let recordings = 0;
  let bytes = 0;
  const storytellers = new Set<string>();
  const active30 = new Set<string>();
  const monthAgo = Date.now() - 30 * 86_400_000;
  for (const d of ledger.docs) {
    const e = d.data();
    if (e.type === 'transcription') {
      recordings++;
      transcribedSeconds += Number(e.seconds) || 0;
      transcribeCost += Number(e.actualCostUsd ?? e.estimatedCostUsd) || 0;
      bytes += Number(e.bytes) || 0;
      storytellers.add(e.uid);
      if (((e.createdAt as Timestamp | undefined)?.toMillis?.() ?? 0) > monthAgo) active30.add(e.uid);
    } else if (e.type === 'ai_edit') editCost += Number(e.estimatedCostUsd) || 0;
  }
  const jobs = await db.collection('jobs').get();
  const failed = jobs.docs.filter(j => j.get('status') === 'failed').length;
  const retries = jobs.docs.filter(j => Number(j.get('attempt')) > 1).length;
  let users = 0;
  let page: string | undefined;
  do {
    const r = await getAuth().listUsers(1000, page);
    users += r.users.length;
    page = r.pageToken;
  } while (page);
  const cfg = config();
  return {
    users,
    storytellers: storytellers.size,
    activeStorytellers30d: active30.size,
    recordings,
    transcribedMinutes: transcribedSeconds / 60,
    averageRecordingMinutes: recordings ? transcribedSeconds / 60 / recordings : 0,
    transcriptionCostUsd: transcribeCost,
    editingCostUsd: editCost,
    averageCostPerRecordingUsd: recordings ? (transcribeCost + editCost) / recordings : 0,
    averageCostPerStorytellerUsd: storytellers.size ? (transcribeCost + editCost) / storytellers.size : 0,
    storageGb: bytes / 1024 ** 3,
    storageCostUsdPerMonth: (bytes / 1024 ** 3) * cfg.storageUsdPerGbMonth,
    jobs: jobs.size,
    failedJobs: failed,
    retryRate: jobs.size ? retries / jobs.size : 0,
    note: 'Costs are estimates from settings unless a provider reported them.',
  };
});

/** Every 30 minutes: retry what's due, rescue jobs stuck by a crash or timeout. */
export const sweep = onSchedule({ schedule: 'every 30 minutes', secrets: SECRETS, timeoutSeconds: 540, memory: '1GiB' }, async () => {
  const db = getFirestore();
  const due = await db.collectionGroup('recordings').where('status', 'in', ['failed_retryable', 'uploaded', 'transcribing', 'generating_story']).limit(100).get();
  const now = Date.now();
  for (const d of due.docs) {
    const uid = d.ref.parent.parent?.id;
    if (!uid) continue;
    const status = d.get('status');
    const updated = (d.get('updatedAt') as Timestamp | undefined)?.toMillis?.() ?? 0;
    const stuck = (status === 'transcribing' || status === 'generating_story' || status === 'uploaded') && now - updated > 20 * 60_000;
    if (status === 'failed_retryable' && Number(d.get('nextAttemptAt') ?? 0) <= now) await processRecording(uid, d.id);
    else if (stuck && status === 'generating_story') await d.ref.update({ status: 'transcribed', updatedAt: FieldValue.serverTimestamp() }).then(() => makeStory(uid, d.id, d.get('style') ?? 'own_words', String(d.get('correctedTranscript') ?? d.get('transcript') ?? '')));
    else if (stuck) await d.ref.update({ status: 'failed_retryable', nextAttemptAt: 0 }).then(() => processRecording(uid, d.id));
  }
});
