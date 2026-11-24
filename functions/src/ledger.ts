// The usage ledger: one document per usage event, its id the idempotency key.
// Creating it inside the same transaction that saves the transcript means a
// recording is counted exactly once, however many times processing is retried.
import { FieldValue, type Firestore, type Transaction } from 'firebase-admin/firestore';
import type { UsageEvent } from './model.js';

export const LEDGER = 'usageLedger';
export const transcriptionKey = (uid: string, recId: string) => `transcription_${uid}_${recId}`;
export const editKey = (uid: string, recId: string, attempt: number) => `ai_edit_${uid}_${recId}_${attempt}`;

/** Adds the event unless it is already there. Returns false if it already existed. */
export async function addUsage(db: Firestore, tx: Transaction, e: Omit<UsageEvent, 'createdAt'>): Promise<boolean> {
  const ref = db.collection(LEDGER).doc(e.idempotencyKey);
  const snap = await tx.get(ref);
  if (snap.exists) return false;
  tx.create(ref, { ...e, createdAt: FieldValue.serverTimestamp() });
  return true;
}

/** Per-person daily totals, for the operational safety limits. */
export const dailyRef = (db: Firestore, uid: string, day: string) => db.collection('usageDaily').doc(`${uid}_${day}`);
export const today = (d = new Date()) => d.toISOString().slice(0, 10);
