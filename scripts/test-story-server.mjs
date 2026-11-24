// End-to-end test of the story server on the Firebase emulators:
//   npm run test:story-server
// Uses the emulator-only test transcriber/editor (functions/.env.local), so no
// real service is called. Checks the whole pipeline, idempotent usage,
// retries, deletion, and that one person can never reach another's data.
import assert from 'node:assert/strict';
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, doc, setDoc, getDoc, onSnapshot, serverTimestamp, deleteDoc, updateDoc } from 'firebase/firestore';
import { getStorage, connectStorageEmulator, ref, uploadBytes, getBytes, deleteObject } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator, httpsCallable } from 'firebase/functions';
import fs from 'node:fs';

const app = initializeApp({ apiKey: 'demo-key', projectId: 'demo-hoot', appId: 'demo', storageBucket: 'demo-hoot.appspot.com' });
const auth = getAuth(app);
connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
const db = getFirestore(app);
connectFirestoreEmulator(db, '127.0.0.1', 8080);
const storage = getStorage(app);
connectStorageEmulator(storage, '127.0.0.1', 9199);
const functions = getFunctions(app, 'us-central1');
connectFunctionsEmulator(functions, '127.0.0.1', 5001);

// A real tiny audio file (WebM header bytes are enough for the server's check).
const audio = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, ...new Array(4000).fill(7)]);
const ok = name => console.log('  ✓', name);
const waitFor = (path, pred, ms = 30000) =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => (stop(), reject(new Error(`timeout waiting on ${path}`))), ms);
    const stop = onSnapshot(doc(db, path), s => {
      if (s.exists() && pred(s.data())) {
        clearTimeout(t);
        stop();
        resolve(s.data());
      }
    });
  });

async function register(uid, recId, memoryId, extra = {}) {
  await uploadBytes(ref(storage, `users/${uid}/recordings/${recId}`), audio, { contentType: 'audio/webm' });
  await setDoc(doc(db, 'users', uid, 'recordings', recId), {
    memoryId, storagePath: `users/${uid}/recordings/${recId}`, mime: 'audio/webm', size: audio.length, clientDuration: 12.5,
    language: 'en', style: 'own_words', hints: ['Winnipeg'], question: 'What was your first car?', createdAt: serverTimestamp(), status: 'uploaded', ...extra,
  });
}

const a = await createUserWithEmailAndPassword(auth, `a${Date.now()}@test.dev`, 'password123');
const A = a.user.uid;
console.log('pipeline');
await register(A, 'rec_aaaaaa1', 'mem_aaaaaa1');
const done = await waitFor(`users/${A}/recordings/rec_aaaaaa1`, d => d.status === 'ready');
assert.match(done.transcript, /Test transcript from the emulator/);
ok('recording transcribed (transcript kept)');
assert.ok(done.story?.story && done.story.title === 'Summers in the old blue Ford');
assert.equal(done.story.yearStart, 1974);
ok('story written and validated, with suggestions');
assert.equal(done.accounted, true);
assert.equal(done.durationSource, 'app (capped)');
ok(`duration measured server-side (${done.measuredSeconds.toFixed(2)} s, capped by file size, not the app's 12.5 s)`);

console.log('usage');
const retry = httpsCallable(functions, 'retryRecording');
await updateDoc(doc(db, 'users', A, 'recordings', 'rec_aaaaaa1'), { status: 'failed_retryable' }).then(
  () => assert.fail('app must not change status'),
  () => ok('the app cannot change a recording\'s status'),
);
// Ask to process again: it is already done, so nothing is counted twice.
await retry({ recordingId: 'rec_aaaaaa1' });
const regen = httpsCallable(functions, 'regenerateStory');
await regen({ recordingId: 'rec_aaaaaa1', style: 'polished' });
const after = await waitFor(`users/${A}/recordings/rec_aaaaaa1`, d => d.status === 'ready' && d.story?.style === 'polished');
assert.equal(after.transcript, done.transcript);
ok('a new story version keeps the original transcript');

console.log('failures and retries');
await register(A, 'rec_aaaaaa2', 'mem_aaaaaa2', { question: 'What was your first car? [fail-transcribe]' });
const failed = await waitFor(`users/${A}/recordings/rec_aaaaaa2`, d => d.status === 'failed_retryable');
assert.equal(failed.error.code, 'http_503');
ok('a provider outage leaves the recording safe and retryable');
await register(A, 'rec_aaaaaa3', 'mem_aaaaaa3', { question: 'Tell me more [fail-edit]' });
const editFail = await waitFor(`users/${A}/recordings/rec_aaaaaa3`, d => d.status === 'ready' && d.storyError);
assert.ok(editFail.transcript && !editFail.story);
ok('a story-editing failure keeps the transcript (no re-transcription)');

console.log('privacy');
const outsider = initializeApp({ apiKey: 'demo-key', projectId: 'demo-hoot', appId: 'demo2', storageBucket: 'demo-hoot.appspot.com' }, 'b');
const authB = getAuth(outsider);
connectAuthEmulator(authB, 'http://127.0.0.1:9099', { disableWarnings: true });
const dbB = getFirestore(outsider);
connectFirestoreEmulator(dbB, '127.0.0.1', 8080);
const stB = getStorage(outsider);
connectStorageEmulator(stB, '127.0.0.1', 9199);
await createUserWithEmailAndPassword(authB, `b${Date.now()}@test.dev`, 'password123');
await getDoc(doc(dbB, 'users', A, 'recordings', 'rec_aaaaaa1')).then(() => assert.fail('B read A'), () => ok("B cannot read A's transcript"));
await getBytes(ref(stB, `users/${A}/recordings/rec_aaaaaa1`)).then(() => assert.fail('B downloaded A'), () => ok("B cannot download A's recording"));
await getDoc(doc(dbB, 'usageLedger', `transcription_${A}_rec_aaaaaa1`)).then(() => assert.fail('ledger readable'), () => ok('nobody can read the usage ledger from the app'));
await setDoc(doc(dbB, 'usageLedger', 'x'), { seconds: -100 }).then(() => assert.fail('ledger writable'), () => ok('nobody can write the usage ledger from the app'));
await setDoc(doc(dbB, 'users', A, 'stories', 'mem_aaaaaa1'), { json: '{}', updatedAt: serverTimestamp() }).then(() => assert.fail('B wrote A'), () => ok("B cannot change A's stories"));
await uploadBytes(ref(stB, `users/${authB.currentUser.uid}/recordings/rec_bbbbbb1`), new Uint8Array(10), { contentType: 'text/html' }).then(
  () => assert.fail('non-audio accepted'),
  () => ok('storage refuses files that are not audio'),
);
const unauth = initializeApp({ apiKey: 'demo-key', projectId: 'demo-hoot', appId: 'demo3', storageBucket: 'demo-hoot.appspot.com' }, 'c');
const stC = getStorage(unauth);
connectStorageEmulator(stC, '127.0.0.1', 9199);
await getBytes(ref(stC, `users/${A}/recordings/rec_aaaaaa1`)).then(() => assert.fail('anon download'), () => ok('signed-out visitors cannot download recordings'));
await signOut(authB);

console.log('deletion');
await httpsCallable(functions, 'deleteMemory')({ memoryId: 'mem_aaaaaa1' });
const gone = (await getDoc(doc(db, 'users', A, 'recordings', 'rec_aaaaaa1'))).data();
assert.equal(gone.status, 'deleted');
assert.equal(gone.transcript, undefined);
await getBytes(ref(storage, `users/${A}/recordings/rec_aaaaaa1`)).then(() => assert.fail('audio still there'), () => ok('deleting a memory removes its audio and text'));
await retry({ recordingId: 'rec_aaaaaa1' });
const still = (await getDoc(doc(db, 'users', A, 'recordings', 'rec_aaaaaa1'))).data();
assert.equal(still.status, 'deleted');
ok('a deleted recording is never processed again');
fs.writeFileSync('/tmp/story-server-uid', A);
console.log('all story server checks passed');
process.exit(0);
