// The morning email sign-up. Each subscription is a Firestore document whose
// id is a long random token: only the person (and their emails' links) know it,
// so only they can confirm or cancel it. Written over REST (no SDK needed).
// Firestore rules (firestore.rules → subscribers) allow exactly these writes.
const env = import.meta.env;
const PROJECT = env.VITE_FIREBASE_PROJECT_ID as string | undefined;
const KEY = env.VITE_FIREBASE_API_KEY as string | undefined;
const DOCS = () => `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;
export const emailAvailable = () => !!PROJECT && !!KEY;

export type Freq = 'daily' | 'weekly';
const LOCAL = 'hoot.email';
export interface LocalSub {
  token: string;
  email: string;
  freq: Freq;
}

export const validEmail = (e: string) => /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/.test(e.trim());
function newToken() {
  const a = new Uint8Array(18);
  crypto.getRandomValues(a);
  return Array.from(a, b => b.toString(16).padStart(2, '0')).join('');
}
export function mySub(): LocalSub | null {
  try {
    return JSON.parse(localStorage.getItem(LOCAL) || 'null');
  } catch {
    return null;
  }
}
function remember(s: LocalSub | null) {
  try {
    if (s) localStorage.setItem(LOCAL, JSON.stringify(s));
    else localStorage.removeItem(LOCAL);
  } catch {
    /* fine */
  }
}

export async function subscribe(email: string, freq: Freq, lang: string): Promise<boolean> {
  if (!emailAvailable() || !validEmail(email)) return false;
  const token = newToken();
  const fields = {
    email: { stringValue: email.trim().toLowerCase() },
    lang: { stringValue: lang },
    freq: { stringValue: freq },
    confirmed: { booleanValue: false },
  };
  // One write: create the document and stamp "created" with the server's clock.
  const body = {
    writes: [
      {
        update: { name: `projects/${PROJECT}/databases/(default)/documents/subscribers/${token}`, fields },
        currentDocument: { exists: false },
        updateTransforms: [{ fieldPath: 'created', setToServerValue: 'REQUEST_TIME' }],
      },
    ],
  };
  const r = await fetch(`${DOCS()}:commit?key=${KEY}`, { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }).catch(() => null);
  if (!r?.ok) return false;
  remember({ token, email: email.trim(), freq });
  return true;
}

/** From the link in the confirmation email. */
export async function confirm(token: string): Promise<boolean> {
  if (!emailAvailable() || !/^[0-9a-f]{36}$/.test(token)) return false;
  const r = await fetch(`${DOCS()}/subscribers/${token}?updateMask.fieldPaths=confirmed&currentDocument.exists=true&key=${KEY}`, {
    method: 'PATCH',
    body: JSON.stringify({ fields: { confirmed: { booleanValue: true } } }),
    headers: { 'content-type': 'application/json' },
  }).catch(() => null);
  return !!r?.ok;
}

/** From the unsubscribe link (or the button in Settings). */
export async function unsubscribe(token: string): Promise<boolean> {
  if (!emailAvailable() || !/^[0-9a-f]{36}$/.test(token)) return false;
  const r = await fetch(`${DOCS()}/subscribers/${token}?key=${KEY}`, { method: 'DELETE' }).catch(() => null);
  if (mySub()?.token === token) remember(null);
  return !!r?.ok;
}
