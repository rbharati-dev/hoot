// Privacy-friendly usage counts and error reports.
//
// Counts: only daily totals per event ("game.solved.sudoku": 41 on 2026-11-07),
// never who did it — no ids, no cookies, nothing about the person. Events are
// batched and sent once a minute (and when the page is hidden).
// Errors: a short technical note (message, where, browser) so we can fix
// things; never names, emails or anything the person wrote. At most 5 per visit.
//
// Both go straight to Firestore's REST API (so the app doesn't need the
// Firestore SDK for everyone). Firestore rules only allow these exact shapes.
// Off in local builds and automated tests.
const env = import.meta.env;
const PROJECT = env.VITE_FIREBASE_PROJECT_ID as string | undefined;
const KEY = env.VITE_FIREBASE_API_KEY as string | undefined;
const enabled = () => !!PROJECT && !!KEY && env.VITE_FIREBASE_EMULATOR !== '1' && typeof navigator !== 'undefined' && !navigator.webdriver;
const BASE = () => `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

const day = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/** Event names: lowercase words joined by dots, e.g. "share.memory". */
export const cleanEvent = (e: string) => e.toLowerCase().replace(/[^a-z0-9.]+/g, '_').slice(0, 60);

let pending: Record<string, number> = {};
let timer: number | undefined;

export function count(event: string) {
  if (!enabled()) return;
  const e = cleanEvent(event);
  if (!/^[a-z][a-z0-9_.]{1,59}$/.test(e)) return;
  pending[e] = Math.min((pending[e] ?? 0) + 1, 50);
  if (timer === undefined) timer = window.setTimeout(flush, 60_000);
}

export function flush() {
  window.clearTimeout(timer);
  timer = undefined;
  const batch = pending;
  pending = {};
  const events = Object.entries(batch);
  if (!events.length || !enabled()) return;
  const d = day();
  const body = JSON.stringify({
    writes: events.map(([e, n]) => ({
      transform: {
        document: `projects/${PROJECT}/databases/(default)/documents/stats/${d}/events/${e}`,
        fieldTransforms: [{ fieldPath: 'n', increment: { integerValue: String(n) } }],
      },
    })),
  });
  const url = `${BASE()}:commit?key=${KEY}`;
  // keepalive lets the request finish while the page is closing.
  fetch(url, { method: 'POST', body, keepalive: true, headers: { 'content-type': 'application/json' } }).catch(() => {});
}

/** Once per device per day: "this device opened Hoot today" (an anonymous daily-visitor count). */
export function countDailyVisit() {
  if (!enabled()) return;
  try {
    const d = day();
    if (localStorage.getItem('hoot.countedDay') === d) return;
    localStorage.setItem('hoot.countedDay', d);
  } catch {
    return;
  }
  count('visit.day');
}

let reported = 0;
const seen = new Set<string>();
export function reportError(err: unknown, where: string) {
  if (!enabled() || reported >= 5) return;
  const msg = (err instanceof Error ? `${err.name}: ${err.message}` : String(err)).slice(0, 300);
  // Never send what someone typed: strip anything that looks like an email.
  const safe = msg.replace(/[^\s@]+@[^\s@]+/g, '[email]');
  if (seen.has(safe)) return;
  seen.add(safe);
  reported++;
  const stack = err instanceof Error && err.stack ? err.stack.split('\n').slice(0, 4).join(' | ').slice(0, 500) : '';
  const fields = {
    msg: { stringValue: safe },
    where: { stringValue: where.slice(0, 100) },
    stack: { stringValue: stack.replace(/https?:\/\/[^/\s]+/g, '') },
    ua: { stringValue: navigator.userAgent.slice(0, 150) },
    day: { stringValue: day() },
  };
  fetch(`${BASE()}/errors?key=${KEY}`, { method: 'POST', body: JSON.stringify({ fields }), keepalive: true, headers: { 'content-type': 'application/json' } }).catch(() => {});
}

/** Start: count today's visit, catch uncaught errors, send counts when hidden. */
export function startTelemetry() {
  if (!enabled()) return;
  countDailyVisit();
  window.addEventListener('error', e => reportError(e.error ?? e.message, `window:${location.hash || location.pathname}`));
  window.addEventListener('unhandledrejection', e => reportError(e.reason, 'promise'));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
}
