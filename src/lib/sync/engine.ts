// The sync engine: keeps this device's progress and the person's account in
// step, safely, offline-tolerant, without ever losing progress.
//
// How it works
// - For every synced key we remember the BASE: the value both sides last
//   agreed on. A sync reads the account copy, three-way merges
//   (base, local, remote) with the key's rule, writes the result to BOTH
//   sides, and makes it the new base. Writes to the account go through a
//   transaction, so two devices syncing at once can't overwrite each other.
// - A sync runs on sign-in, when the app comes back to the foreground, a few
//   seconds after anything changes, and before the page closes.
// - The device remembers whose data it holds (`hoot.sync.owner`). Guest data
//   (no owner) is merged into the account on first sign-in; data belonging
//   to a DIFFERENT account is never merged into someone else's.
//
// Storage is behind two small interfaces so the engine can be tested with
// in-memory fakes; the Firestore implementation lives in cloud/remote.ts.
import { SYNC_KEYS, type SyncKey } from './keys';

export interface RemoteStore {
  /** Read every synced key for this user (missing keys are absent). */
  readAll(uid: string): Promise<Record<string, unknown>>;
  /**
   * Atomically: read the current account value of `key`, compute the merged
   * value with `merge(remote)`, write it, and return it.
   */
  update(uid: string, key: string, merge: (remote: unknown) => unknown): Promise<unknown>;
  /** Delete everything stored for this user (account deletion). */
  deleteAll(uid: string): Promise<void>;
}

export interface LocalStore {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export const OWNER_KEY = 'hoot.sync.owner';
export const BASE_KEY = 'hoot.sync.base';
export const LAST_KEY = 'hoot.sync.last';

const parse = (s: string | null): unknown => {
  if (s == null) return undefined;
  try {
    return JSON.parse(s);
  } catch {
    return undefined;
  }
};

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'error';

export interface SyncResult {
  changedLocally: string[]; // keys this device received from the account
  pushed: string[]; // keys whose account copy changed
}

/** Max size of one stored value; Firestore documents are capped at ~1 MiB. */
export const MAX_VALUE_BYTES = 900_000;

export class SyncEngine {
  private keys: SyncKey[];
  private remote: RemoteStore;
  private local: LocalStore;
  private running: Promise<SyncResult> | null = null;
  private again = false;

  constructor(remote: RemoteStore, local: LocalStore, keys: SyncKey[] = SYNC_KEYS) {
    this.remote = remote;
    this.local = local;
    this.keys = keys;
  }

  owner(): string | null {
    return this.local.get(OWNER_KEY);
  }

  private bases(): Record<string, unknown> {
    const v = parse(this.local.get(BASE_KEY));
    return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
  }

  /** Values as they are on this device right now (only keys that exist). */
  snapshot(): Record<string, string> {
    const out: Record<string, string> = {};
    for (const k of this.keys) {
      const v = this.local.get(k.key);
      if (v != null) out[k.key] = v;
    }
    return out;
  }

  /**
   * Keys that differ from their base, i.e. changed on this device since the
   * last sync. Cheap: used to decide whether a sync is needed.
   */
  dirty(): string[] {
    const bases = this.bases();
    return this.keys.filter(k => {
      const v = this.local.get(k.key);
      return v != null && JSON.stringify(parse(v)) !== JSON.stringify(bases[k.key]);
    }).map(k => k.key);
  }

  /**
   * Link this device to an account. Returns 'merged' when this device's
   * guest progress was added to the account, 'switched' when the device held
   * another account's data (cleared first), 'same' otherwise.
   */
  attach(uid: string): 'merged' | 'switched' | 'same' {
    const owner = this.owner();
    if (owner === uid) return 'same';
    if (owner && owner !== uid) {
      // Someone else's progress: never merge it into this account.
      this.clearPersonal();
      this.local.set(OWNER_KEY, uid);
      return 'switched';
    }
    // Guest data: an empty base makes the first sync a union of both sides.
    this.local.remove(BASE_KEY);
    this.local.set(OWNER_KEY, uid);
    return 'merged';
  }

  /** Sync now. Concurrent calls share one run, plus one follow-up if needed. */
  sync(uid: string): Promise<SyncResult> {
    if (this.running) {
      this.again = true;
      return this.running;
    }
    this.running = this.run(uid).finally(() => {
      this.running = null;
      if (this.again) {
        this.again = false;
        void this.sync(uid);
      }
    });
    return this.running;
  }

  private async run(uid: string): Promise<SyncResult> {
    if (this.owner() !== uid) throw new Error('sync: device is not attached to this account');
    const remoteAll = await this.remote.readAll(uid);
    const bases = this.bases();
    const changedLocally: string[] = [];
    const pushed: string[] = [];

    for (const k of this.keys) {
      const localRaw = this.local.get(k.key);
      const local = parse(localRaw);
      const base = bases[k.key];
      const remote = remoteAll[k.key];
      if (local === undefined && remote === undefined) continue;

      const merged = k.rule.merge(base, local, remote);
      if (merged === undefined) continue;
      const mergedJson = JSON.stringify(merged);
      if (mergedJson.length > MAX_VALUE_BYTES) {
        // Too big to store in one document: keep it on the device, skip the account copy.
        console.warn(`sync: ${k.key} is too large to sync (${mergedJson.length} bytes)`);
        continue;
      }

      // Write to the account only if it differs; merge again inside the
      // transaction in case another device wrote in the meantime.
      let final: unknown = merged;
      if (JSON.stringify(remote) !== mergedJson) {
        final = await this.remote.update(uid, k.key, current => k.rule.merge(base, local, current));
        pushed.push(k.key);
      }
      const finalJson = JSON.stringify(final);
      if (finalJson !== (localRaw == null ? undefined : JSON.stringify(local))) {
        this.local.set(k.key, finalJson);
        changedLocally.push(k.key);
      }
      bases[k.key] = final;
    }
    this.local.set(BASE_KEY, JSON.stringify(bases));
    this.local.set(LAST_KEY, String(Date.now()));
    return { changedLocally, pushed };
  }

  /** Sign out: forget the link and remove personal progress from this device. */
  detach() {
    this.clearPersonal();
    this.local.remove(OWNER_KEY);
    this.local.remove(BASE_KEY);
    this.local.remove(LAST_KEY);
  }

  private clearPersonal() {
    for (const k of this.keys) if (k.personal) this.local.remove(k.key);
    this.local.remove(BASE_KEY);
  }

  /** Delete the account's stored progress (before deleting the sign-in itself). */
  async deleteRemote(uid: string) {
    await this.remote.deleteAll(uid);
  }
}

/** localStorage, tolerant of private mode and full storage. */
export const browserLocal: LocalStore = {
  get(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* storage full or blocked: the account copy still has it */
    }
  },
  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};
