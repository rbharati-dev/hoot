// The account copy of a person's progress, in Firestore.
//
//   users/{uid}/data/{key}   { json: string, updatedAt: serverTimestamp }
//   usernames/{name}         { uid }            (unique display names)
//   users/{uid}              { username, createdAt }
//
// Each synced key is its own small document, stored as a JSON string so any
// shape (nested lists included) round-trips exactly. Security rules
// (firestore.rules) let a signed-in person read and write only their own.
import type { RemoteStore } from '../sync/engine';
import { MAX_VALUE_BYTES } from '../sync/engine';
import { docId, SYNC_KEY_NAMES } from '../sync/keys';
import { cloud } from './firebase';

export const firestoreRemote: RemoteStore = {
  async readAll(uid) {
    const { db } = await cloud();
    const { collection, getDocs } = await import('firebase/firestore');
    const snap = await getDocs(collection(db, 'users', uid, 'data'));
    const out: Record<string, unknown> = {};
    snap.forEach(d => {
      const key = SYNC_KEY_NAMES.find(k => docId(k) === d.id);
      const json = d.get('json');
      if (!key || typeof json !== 'string') return;
      try {
        out[key] = JSON.parse(json);
      } catch {
        /* a corrupt value is ignored and rewritten by the next sync */
      }
    });
    return out;
  },

  async update(uid, key, merge) {
    const { db } = await cloud();
    const { doc, runTransaction, serverTimestamp } = await import('firebase/firestore');
    const ref = doc(db, 'users', uid, 'data', docId(key));
    return runTransaction(db, async tx => {
      const cur = await tx.get(ref);
      let current: unknown;
      try {
        current = cur.exists() ? JSON.parse(cur.get('json')) : undefined;
      } catch {
        current = undefined;
      }
      const next = merge(current);
      const json = JSON.stringify(next);
      if (json.length > MAX_VALUE_BYTES) throw new Error(`sync: ${key} too large`);
      tx.set(ref, { json, updatedAt: serverTimestamp() });
      return next;
    });
  },

  async deleteAll(uid) {
    const { db } = await cloud();
    const { collection, getDocs, writeBatch, doc } = await import('firebase/firestore');
    const snap = await getDocs(collection(db, 'users', uid, 'data'));
    const batch = writeBatch(db);
    snap.forEach(d => batch.delete(d.ref));
    batch.delete(doc(db, 'users', uid));
    await batch.commit();
  },
};

// ---- usernames ----

/** 3–20 characters: letters, numbers, dot, underscore, hyphen. Stored lower-case. */
export function normalizeUsername(name: string): string | null {
  const n = name.trim().toLowerCase();
  return /^[a-z0-9][a-z0-9._-]{1,18}[a-z0-9]$/.test(n) && !/[._-]{2}/.test(n) ? n : null;
}

/** Claim a username for this account (fails if someone else has it). */
export async function claimUsername(uid: string, name: string): Promise<'ok' | 'taken' | 'invalid'> {
  const n = normalizeUsername(name);
  if (!n) return 'invalid';
  const { db } = await cloud();
  const { doc, runTransaction, serverTimestamp } = await import('firebase/firestore');
  return runTransaction(db, async tx => {
    const ref = doc(db, 'usernames', n);
    const cur = await tx.get(ref);
    if (cur.exists() && cur.get('uid') !== uid) return 'taken' as const;
    tx.set(ref, { uid });
    tx.set(doc(db, 'users', uid), { username: n, createdAt: serverTimestamp() }, { merge: true });
    return 'ok' as const;
  });
}

export async function usernameOf(uid: string): Promise<string | null> {
  const { db } = await cloud();
  const { doc, getDoc } = await import('firebase/firestore');
  const d = await getDoc(doc(db, 'users', uid));
  return d.exists() ? ((d.get('username') as string) ?? null) : null;
}

export async function releaseUsername(uid: string) {
  const name = await usernameOf(uid);
  if (!name) return;
  const { db } = await cloud();
  const { doc, deleteDoc } = await import('firebase/firestore');
  await deleteDoc(doc(db, 'usernames', name)).catch(() => {});
}
