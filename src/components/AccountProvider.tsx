// Accounts in the UI: who is signed in, the sync status, and the actions the
// account screens call. Wrap the app once; read it with useAccount().
//
// When accounts aren't configured in this build (no Firebase settings),
// `available` is false and everything else is inert: the app works exactly
// as before, on this device only.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { User } from 'firebase/auth';
import { cloud, cloudConfigured } from '../lib/cloud/firebase';
import type { Account } from '../lib/cloud/auth';
import { SyncEngine, browserLocal, type SyncStatus } from '../lib/sync/engine';

export interface AccountApi {
  available: boolean; // accounts exist in this build
  ready: boolean; // we know whether someone is signed in
  account: Account | null;
  status: SyncStatus;
  lastSynced: number | null; // ms since epoch
  /** Increments whenever synced data changed on this device: remount screens on it. */
  dataVersion: number;
  /** What happened to this device's progress at the last sign-in. */
  linkResult: 'merged' | 'switched' | 'same' | null;
  signUp(email: string, password: string, username: string): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  signInWithGoogle(): Promise<void>;
  sendPasswordReset(email: string): Promise<void>;
  /** Sign out and remove personal progress from this device (it stays in the account). */
  signOut(): Promise<void>;
  /** Delete the account and everything stored in it. Password needed for email accounts. */
  deleteAccount(password?: string): Promise<void>;
  syncNow(): Promise<void>;
}

const noop = async () => {};
const Ctx = createContext<AccountApi>({
  available: false,
  ready: true,
  account: null,
  status: 'idle',
  lastSynced: null,
  dataVersion: 0,
  linkResult: null,
  signUp: noop,
  signIn: noop,
  signInWithGoogle: noop,
  sendPasswordReset: noop,
  signOut: noop,
  deleteAccount: noop,
  syncNow: noop,
});
export const useAccount = () => useContext(Ctx);

const AUTO_SYNC_MS = 30_000;
const CHANGE_DEBOUNCE_MS = 4_000;

export default function AccountProvider({ children }: { children: ReactNode }) {
  const available = cloudConfigured();
  const [ready, setReady] = useState(!available);
  const [account, setAccount] = useState<Account | null>(null);
  const [status, setStatus] = useState<SyncStatus>('idle');
  const [lastSynced, setLastSynced] = useState<number | null>(() => Number(browserLocal.get('hoot.sync.last')) || null);
  const [dataVersion, setDataVersion] = useState(0);
  const [linkResult, setLinkResult] = useState<AccountApi['linkResult']>(null);
  const engine = useRef<SyncEngine | null>(null);
  const uidRef = useRef<string | null>(null);
  // While an account is being created, the sign-in event is held back: the
  // username may still be refused, and the half-made account is then deleted.
  // Attaching this device to it in the meantime would make the next sign-in
  // look like "someone else's progress" and wipe this device's progress.
  const signingUp = useRef(false);
  const heldUser = useRef<User | null>(null);
  const adopt = useRef<((u: User, name?: string | null) => Promise<void>) | null>(null);

  const getEngine = useCallback(async () => {
    if (!engine.current) {
      const { firestoreRemote } = await import('../lib/cloud/remote');
      engine.current = new SyncEngine(firestoreRemote, browserLocal);
    }
    return engine.current;
  }, []);

  const runSync = useCallback(async () => {
    const uid = uidRef.current;
    if (!uid) return;
    const e = await getEngine();
    if (!navigator.onLine) {
      setStatus('offline');
      return;
    }
    setStatus('syncing');
    try {
      const r = await e.sync(uid);
      if (r.changedLocally.length) setDataVersion(v => v + 1);
      setLastSynced(Date.now());
      setStatus('idle');
    } catch (err) {
      console.warn('sync failed', err);
      setStatus(navigator.onLine ? 'error' : 'offline');
    }
  }, [getEngine]);

  // Follow the signed-in user.
  useEffect(() => {
    if (!available) return;
    let stop: (() => void) | undefined;
    let alive = true;
    (async () => {
      const [{ watchUser, toAccount }, { usernameOf }] = await Promise.all([import('../lib/cloud/auth'), import('../lib/cloud/remote')]);
      const adoptUser = async (u: User, knownName?: string | null) => {
        if (uidRef.current === u.uid) return; // already attached (a late duplicate event)
        const name = knownName ?? (await usernameOf(u.uid).catch(() => null));
        if (!alive) return;
        const e = await getEngine();
        const link = e.attach(u.uid);
        uidRef.current = u.uid;
        setLinkResult(link);
        setAccount(toAccount(u, name));
        setReady(true);
        if (link === 'switched') setDataVersion(v => v + 1);
        await runSync();
      };
      adopt.current = adoptUser;
      stop = await watchUser(async u => {
        if (!alive) return;
        if (!u) {
          uidRef.current = null;
          setAccount(null);
          setReady(true);
          return;
        }
        if (signingUp.current) {
          heldUser.current = u;
          return;
        }
        await adoptUser(u);
      });
    })().catch(err => {
      console.warn('accounts unavailable', err);
      setReady(true);
    });
    return () => {
      alive = false;
      stop?.();
    };
  }, [available, getEngine, runSync]);

  // Keep syncing while signed in: periodically if something changed, when the
  // app comes back to the foreground, when the network returns, and on close.
  useEffect(() => {
    if (!account) return;
    let debounce: number | undefined;
    const maybe = async () => {
      const e = await getEngine();
      if (e.dirty().length) {
        window.clearTimeout(debounce);
        debounce = window.setTimeout(runSync, CHANGE_DEBOUNCE_MS);
      }
    };
    const tick = window.setInterval(maybe, AUTO_SYNC_MS / 3);
    const full = window.setInterval(runSync, AUTO_SYNC_MS * 10); // pick up other devices' changes
    const onVisible = () => document.visibilityState === 'visible' && runSync();
    const onHide = () => document.visibilityState === 'hidden' && runSync();
    window.addEventListener('online', runSync);
    document.addEventListener('visibilitychange', onVisible);
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', runSync);
    return () => {
      window.clearInterval(tick);
      window.clearInterval(full);
      window.clearTimeout(debounce);
      window.removeEventListener('online', runSync);
      document.removeEventListener('visibilitychange', onVisible);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', runSync);
    };
  }, [account, getEngine, runSync]);

  const api = useMemo<AccountApi>(
    () => ({
      available,
      ready,
      account,
      status,
      lastSynced,
      dataVersion,
      linkResult,
      async signUp(email, password, username) {
        const a = await import('../lib/cloud/auth');
        signingUp.current = true;
        heldUser.current = null;
        let acc: Account;
        try {
          acc = await a.signUp(email, password, username);
        } catch (err) {
          heldUser.current = null;
          throw err;
        } finally {
          signingUp.current = false;
        }
        const u = heldUser.current ?? (await cloud()).auth.currentUser;
        heldUser.current = null;
        if (u) await adopt.current?.(u, acc.name);
      },
      async signIn(email, password) {
        const a = await import('../lib/cloud/auth');
        await a.signIn(email, password);
      },
      async signInWithGoogle() {
        const a = await import('../lib/cloud/auth');
        await a.signInWithGoogle();
      },
      async sendPasswordReset(email) {
        const a = await import('../lib/cloud/auth');
        await a.sendPasswordReset(email);
      },
      async signOut() {
        await runSync(); // save the latest first
        const a = await import('../lib/cloud/auth');
        await a.signOutNow();
        (await getEngine()).detach();
        uidRef.current = null;
        setAccount(null);
        setLinkResult(null);
        setDataVersion(v => v + 1);
      },
      async deleteAccount(password) {
        const a = await import('../lib/cloud/auth');
        const e = await getEngine();
        await a.deleteAccount(uid => e.deleteRemote(uid), password);
        e.detach();
        uidRef.current = null;
        setAccount(null);
        setDataVersion(v => v + 1);
      },
      syncNow: runSync,
    }),
    [available, ready, account, status, lastSynced, dataVersion, linkResult, runSync, getEngine],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
