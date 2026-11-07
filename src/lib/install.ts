// "Put Hoot on your phone": a gentle guide, shown on the welcome screen after
// 3 days of use, to install Hoot like an app. Browsers that support it get a
// one-tap Install button; iPhones get the two Safari steps.
import { readUsage } from './supportNudge';
import { dayKey } from './activity';

const KEY = 'hoot.installAsk';
type State = { done?: boolean; until?: string };

function read(): State {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') as State;
  } catch {
    return {};
  }
}
function write(s: State) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* fine */
  }
}

export type Platform = 'ios' | 'android' | 'desktop';
export function platform(ua = navigator.userAgent): Platform {
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && typeof document !== 'undefined' && 'ontouchend' in document)) return 'ios';
  if (/Android/.test(ua)) return 'android';
  return 'desktop';
}
export function isInstalled(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;
}

/** Pure: show the guide? */
export function shouldOfferInstall(days: number, state: State, today: string, installed: boolean): boolean {
  return !installed && days >= 3 && !state.done && !(state.until && today < state.until);
}
export function offerInstall(now = new Date()): boolean {
  return shouldOfferInstall(readUsage().days.length, read(), dayKey(now), isInstalled());
}
export function installLater(now = new Date()) {
  const d = new Date(now);
  d.setDate(d.getDate() + 30);
  write({ ...read(), until: dayKey(d) });
}
export function installDone() {
  write({ ...read(), done: true });
}

// Chrome/Edge/Android offer a real install prompt; keep it for our button.
interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
let deferred: BIPEvent | null = null;
const listeners = new Set<() => void>();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferred = e as BIPEvent;
    listeners.forEach(f => f());
  });
  window.addEventListener('appinstalled', () => installDone());
}
export const canPromptInstall = () => deferred !== null;
export function onInstallReady(f: () => void) {
  listeners.add(f);
  return () => listeners.delete(f);
}
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  await deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  if (outcome === 'accepted') installDone();
  return outcome === 'accepted';
}
