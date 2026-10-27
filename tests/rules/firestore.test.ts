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
