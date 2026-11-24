import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, getDocs, collection, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';

let env: RulesTestEnvironment;
beforeAll(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-hoot', firestore: { rules: readFileSync('firestore.rules', 'utf8') } });
});
afterAll(() => env?.cleanup());
beforeEach(() => env.clearFirestore());

const as = (uid: string | null) => (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).firestore();
const data = (json = '{}') => ({ json, updatedAt: serverTimestamp() });

describe('progress documents', () => {
  it('owner can write and read their own', async () => {
    const db = as('alice');
    await assertSucceeds(setDoc(doc(db, 'users/alice/data/hoot.games'), data('{"sudoku":1}')));
    await assertSucceeds(getDoc(doc(db, 'users/alice/data/hoot.games')));
    await assertSucceeds(getDocs(collection(db, 'users/alice/data')));
  });
  it('nobody else can read or write them', async () => {
    await env.withSecurityRulesDisabled(c => setDoc(doc(c.firestore(), 'users/alice/data/hoot.games'), { json: '{}', updatedAt: new Date() }));
    await assertFails(getDoc(doc(as('bob'), 'users/alice/data/hoot.games')));
    await assertFails(getDocs(collection(as('bob'), 'users/alice/data')));
    await assertFails(setDoc(doc(as('bob'), 'users/alice/data/hoot.games'), data()));
    await assertFails(deleteDoc(doc(as('bob'), 'users/alice/data/hoot.games')));
    await assertFails(getDoc(doc(as(null), 'users/alice/data/hoot.games')));
  });
  it('rejects bad keys, extra fields, non-string json, client timestamps', async () => {
    const db = as('alice');
    await assertFails(setDoc(doc(db, 'users/alice/data/evil'), data()));
    await assertFails(setDoc(doc(db, 'users/alice/data/hoot.games'), { ...data(), admin: true }));
    await assertFails(setDoc(doc(db, 'users/alice/data/hoot.games'), { json: 5, updatedAt: serverTimestamp() }));
    await assertFails(setDoc(doc(db, 'users/alice/data/hoot.games'), { json: '{}', updatedAt: new Date(0) }));
  });
  it('rejects values over the size limit', async () => {
    await assertFails(setDoc(doc(as('alice'), 'users/alice/data/hoot.saved'), data('x'.repeat(900_001))));
  });
});

describe('usernames', () => {
  const claim = (db: ReturnType<typeof as>, uid: string, name: string) => {
    const b = writeBatch(db);
    b.set(doc(db, 'usernames', name), { uid });
    b.set(doc(db, 'users', uid), { username: name, createdAt: serverTimestamp() });
    return b.commit();
  };
  it('can claim a free name together with the account record', async () => {
    await assertSucceeds(claim(as('alice'), 'alice', 'alice.k'));
  });
  it('cannot take a claimed name', async () => {
    await claim(as('alice'), 'alice', 'sam');
    await assertFails(claim(as('bob'), 'bob', 'sam'));
    await assertFails(setDoc(doc(as('bob'), 'usernames/sam'), { uid: 'bob' }));
  });
  it('cannot claim a name for someone else', async () => {
    await assertFails(setDoc(doc(as('bob'), 'usernames/freddy'), { uid: 'alice' }));
  });
  it('cannot point the account record at a name it does not own', async () => {
    await claim(as('alice'), 'alice', 'sam');
    await assertFails(setDoc(doc(as('bob'), 'users/bob'), { username: 'sam', createdAt: serverTimestamp() }));
  });
  it('rejects invalid names', async () => {
    for (const n of ['ab', 'Sam', '-sam', 'sam-', 'a'.repeat(21), 'sa m']) await assertFails(setDoc(doc(as('x'), 'usernames', n), { uid: 'x' }));
  });
  it('anyone signed in can check one name, nobody can list, guests cannot check', async () => {
    await claim(as('alice'), 'alice', 'sam');
    await assertSucceeds(getDoc(doc(as('bob'), 'usernames/sam')));
    await assertFails(getDocs(collection(as('bob'), 'usernames')));
    await assertFails(getDoc(doc(as(null), 'usernames/sam')));
  });
  it('only the owner can release a name; nobody can change it', async () => {
    await claim(as('alice'), 'alice', 'sam');
    await assertFails(deleteDoc(doc(as('bob'), 'usernames/sam')));
    await assertFails(setDoc(doc(as('alice'), 'usernames/sam'), { uid: 'alice', x: 1 }));
    await assertSucceeds(deleteDoc(doc(as('alice'), 'usernames/sam')));
  });
});

describe('everything else is closed', () => {
  it('random collections', async () => {
    await assertFails(setDoc(doc(as('alice'), 'admin/config'), { a: 1 }));
    await assertFails(getDoc(doc(as('alice'), 'admin/config')));
  });
});

describe('life stories', () => {
  const rec = (uid: string, id: string, extra: Record<string, unknown> = {}) => ({
    memoryId: 'mem_aaaaaa1', storagePath: `users/${uid}/recordings/${id}`, mime: 'audio/webm', size: 1000, clientDuration: 30,
    language: 'en', style: 'own_words', hints: [], question: 'First car?', createdAt: serverTimestamp(), status: 'uploaded', ...extra,
  });
  it('a person keeps their own stories; nobody else can read or change them', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), 'users/alice/stories/mem_aaaaaa1'), data('{"title":"x"}')));
    await assertSucceeds(getDoc(doc(as('alice'), 'users/alice/stories/mem_aaaaaa1')));
    await assertFails(getDoc(doc(as('bob'), 'users/alice/stories/mem_aaaaaa1')));
    await assertFails(setDoc(doc(as('bob'), 'users/alice/stories/mem_aaaaaa1'), data()));
    await assertFails(getDoc(doc(as(null), 'users/alice/stories/mem_aaaaaa1')));
    await assertFails(setDoc(doc(as('alice'), 'users/alice/stories/mem_aaaaaa1'), { ...data(), owner: 'bob' }));
  });
  it('the app may only register an upload; the server writes everything after', async () => {
    await assertSucceeds(setDoc(doc(as('alice'), 'users/alice/recordings/rec_aaaaaa1'), rec('alice', 'rec_aaaaaa1')));
    await assertSucceeds(getDoc(doc(as('alice'), 'users/alice/recordings/rec_aaaaaa1')));
    // Not with a made-up status, transcript, someone else's file, or a huge size.
    await assertFails(setDoc(doc(as('alice'), 'users/alice/recordings/rec_aaaaaa2'), rec('alice', 'rec_aaaaaa2', { status: 'ready' })));
    await assertFails(setDoc(doc(as('alice'), 'users/alice/recordings/rec_aaaaaa3'), rec('alice', 'rec_aaaaaa3', { transcript: 'fake' })));
    await assertFails(setDoc(doc(as('alice'), 'users/alice/recordings/rec_aaaaaa4'), rec('alice', 'rec_aaaaaa4', { storagePath: 'users/bob/recordings/rec_aaaaaa4' })));
    await assertFails(setDoc(doc(as('alice'), 'users/alice/recordings/rec_aaaaaa5'), rec('alice', 'rec_aaaaaa5', { size: 999_999_999 })));
    // And never changed or deleted by the app afterwards.
    await assertFails(setDoc(doc(as('alice'), 'users/alice/recordings/rec_aaaaaa1'), { status: 'ready' }, { merge: true }));
    await assertFails(deleteDoc(doc(as('alice'), 'users/alice/recordings/rec_aaaaaa1')));
    await assertFails(getDoc(doc(as('bob'), 'users/alice/recordings/rec_aaaaaa1')));
    await assertFails(setDoc(doc(as('bob'), 'users/alice/recordings/rec_bbbbbb1'), rec('alice', 'rec_bbbbbb1')));
  });
  it('usage, jobs and limits are server-only', async () => {
    for (const p of ['usageLedger/x', 'usageDaily/alice_2026-11-23', 'jobs/x', 'rateLimits/alice_retry']) {
      await assertFails(getDoc(doc(as('alice'), p)));
      await assertFails(setDoc(doc(as('alice'), p), { seconds: 0 }));
    }
  });
});
