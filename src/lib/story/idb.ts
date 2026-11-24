// A very small IndexedDB wrapper (no library). Three stores:
//   kv      — the story state (one JSON value)
//   chunks  — audio pieces saved every second while recording, so nothing is
//             lost if the tab closes or the phone sleeps
//   files   — finished audio recordings and photos, by id
const DB = 'hoot-story';
const VERSION = 1;

let opening: Promise<IDBDatabase> | null = null;
function open(): Promise<IDBDatabase> {
  if (opening) return opening;
  opening = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('no-indexeddb'));
    const req = indexedDB.open(DB, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      if (!db.objectStoreNames.contains('files')) db.createObjectStore('files');
      if (!db.objectStoreNames.contains('chunks')) {
        const s = db.createObjectStore('chunks', { autoIncrement: true });
        s.createIndex('rec', 'rec');
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      opening = null;
      reject(req.error);
    };
  });
  return opening;
}

function run<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T> | void): Promise<T> {
  return open().then(
    db =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, mode);
        const req = fn(tx.objectStore(store));
        tx.oncomplete = () => resolve(req ? (req.result as T) : (undefined as T));
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error ?? new Error('aborted'));
      }),
  );
}

export const kvGet = <T>(key: string) => run<T | undefined>('kv', 'readonly', s => s.get(key));
export const kvSet = (key: string, value: unknown) => run('kv', 'readwrite', s => s.put(value, key));

export const fileGet = (id: string) => run<Blob | undefined>('files', 'readonly', s => s.get(id));
export const filePut = (id: string, blob: Blob) => run('files', 'readwrite', s => s.put(blob, id));
export const fileDelete = (id: string) => run('files', 'readwrite', s => s.delete(id));
export const fileKeys = () => run<IDBValidKey[]>('files', 'readonly', s => s.getAllKeys());

/** One piece of a recording in progress. */
export interface Chunk {
  rec: string;
  memoryId: string;
  mime: string;
  seq: number;
  at: number;
  blob: Blob;
  /** Seconds recorded so far when this piece was saved. */
  elapsed: number;
}
export const chunkAdd = (c: Chunk) => run('chunks', 'readwrite', s => s.add(c));
export async function chunksFor(rec: string): Promise<Chunk[]> {
  const all = await run<Chunk[]>('chunks', 'readonly', s => s.index('rec').getAll(rec));
  return all.sort((a, b) => a.seq - b.seq);
}
export async function chunkRecs(): Promise<string[]> {
  const keys = await run<IDBValidKey[]>('chunks', 'readonly', s => s.index('rec').getAllKeys());
  if (!keys.length) return [];
  const all = await run<Chunk[]>('chunks', 'readonly', s => s.getAll());
  return [...new Set(all.map(c => c.rec))];
}
export async function chunksDelete(rec: string) {
  const db = await open();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('chunks', 'readwrite');
    const idx = tx.objectStore('chunks').index('rec');
    const req = idx.openKeyCursor(IDBKeyRange.only(rec));
    req.onsuccess = () => {
      const c = req.result;
      if (c) {
        tx.objectStore('chunks').delete(c.primaryKey);
        c.continue();
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Ask the browser to keep this site's data even when space runs low. */
export async function askPersistence() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist();
  } catch {
    /* not supported */
  }
}
