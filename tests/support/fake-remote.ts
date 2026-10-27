// Test-only stand-in for src/lib/cloud/remote.ts, used by the emulator build
// (vite.emulator.config.ts). Firestore's emulator can't be downloaded in some
// environments, but the account screens need a place to keep usernames and
// synced progress. This one keeps both in the browser's localStorage (shared
// by every tab of one Playwright context, like a real backend would be).
//
// Switches for tests (set in localStorage before the app loads):
//   fake.fail = '1'   every read/write of progress fails (shows the "problem" state)
import type { RemoteStore } from '../../src/lib/sync/engine';
// The real username rules, so tests exercise them rather than a copy.
// @ts-expect-error the ?real suffix keeps the plugin from swapping this import
import { normalizeUsername as realNormalize } from '../../src/lib/cloud/remote.ts?real';

export const normalizeUsername: (name: string) => string | null = realNormalize;

interface Db {
  data: Record<string, Record<string, string>>; // uid -> key -> json
  usernames: Record<string, string>; // name -> uid
  names: Record<string, string>; // uid -> name
}
const KEY = 'fake.db';
const load = (): Db => {
  try {
    return { data: {}, usernames: {}, names: {}, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return { data: {}, usernames: {}, names: {} };
  }
};
const save = (db: Db) => localStorage.setItem(KEY, JSON.stringify(db));
const failing = () => localStorage.getItem('fake.fail') === '1';
const pause = () => new Promise(r => setTimeout(r, 30));

export const firestoreRemote: RemoteStore = {
  async readAll(uid) {
    await pause();
    if (failing()) throw new Error('fake: backend unavailable');
    const out: Record<string, unknown> = {};
    for (const [k, json] of Object.entries(load().data[uid] ?? {})) out[k] = JSON.parse(json);
    return out;
  },
  async update(uid, key, merge) {
    await pause();
    if (failing()) throw new Error('fake: backend unavailable');
    const db = load();
    const cur = db.data[uid]?.[key];
    const next = merge(cur === undefined ? undefined : JSON.parse(cur));
    (db.data[uid] ??= {})[key] = JSON.stringify(next);
    save(db);
    return next;
  },
  async deleteAll(uid) {
    await pause();
    const db = load();
    delete db.data[uid];
    save(db);
  },
};

export async function claimUsername(uid: string, name: string): Promise<'ok' | 'taken' | 'invalid'> {
  const n = normalizeUsername(name);
  if (!n) return 'invalid';
  await pause();
  const db = load();
  if (db.usernames[n] && db.usernames[n] !== uid) return 'taken';
  db.usernames[n] = uid;
  db.names[uid] = n;
  save(db);
  return 'ok';
}

export async function usernameOf(uid: string): Promise<string | null> {
  await pause();
  return load().names[uid] ?? null;
}

export async function releaseUsername(uid: string) {
  const db = load();
  const n = db.names[uid];
  if (n) delete db.usernames[n];
  delete db.names[uid];
  save(db);
}
