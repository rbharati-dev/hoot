// Signing in: email + password, or Google. Every failure is turned into one
// of a few plain reasons the UI can explain in the person's language.
import type { User } from 'firebase/auth';
import { cloud } from './firebase';
import { claimUsername, normalizeUsername, releaseUsername } from './remote';

export interface Account {
  uid: string;
  email: string | null;
  name: string | null; // username, or the Google display name
  provider: 'password' | 'google' | 'other';
  emailVerified: boolean;
}

export type AuthProblem =
  | 'invalid-email'
  | 'weak-password'
  | 'email-in-use'
  | 'wrong-password' // also "no such account": never reveal which
  | 'username-taken'
  | 'username-invalid'
  | 'too-many-attempts'
  | 'offline'
  | 'popup-closed'
  | 'popup-blocked'
  | 'needs-recent-login'
  | 'account-exists-other-method'
  | 'unavailable'
  | 'unknown';

export class AuthError extends Error {
  problem: AuthProblem;
  constructor(problem: AuthProblem) {
    super(problem);
    this.problem = problem;
  }
}

/** Map Firebase error codes to the reasons shown to people. */
export function problemOf(e: unknown): AuthProblem {
  if (e instanceof AuthError) return e.problem;
  const code = (e as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-email':
    case 'auth/missing-email':
      return 'invalid-email';
    case 'auth/weak-password':
    case 'auth/missing-password':
      return 'weak-password';
    case 'auth/email-already-in-use':
      return 'email-in-use';
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'wrong-password';
    case 'auth/too-many-requests':
      return 'too-many-attempts';
    case 'auth/network-request-failed':
      return 'offline';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
    case 'auth/user-cancelled':
      return 'popup-closed';
    case 'auth/popup-blocked':
      return 'popup-blocked';
    case 'auth/requires-recent-login':
      return 'needs-recent-login';
    case 'auth/account-exists-with-different-credential':
      return 'account-exists-other-method';
    case 'auth/operation-not-allowed':
    case 'auth/configuration-not-found':
      return 'unavailable';
    default:
      return 'unknown';
  }
}

const wrap = async <T,>(f: () => Promise<T>): Promise<T> => {
  try {
    return await f();
  } catch (e) {
    throw new AuthError(problemOf(e));
  }
};

export function toAccount(u: User, username?: string | null): Account {
  const provider = u.providerData.some(p => p.providerId === 'google.com') ? 'google' : u.providerData.some(p => p.providerId === 'password') ? 'password' : 'other';
  return { uid: u.uid, email: u.email, name: username ?? u.displayName ?? null, provider, emailVerified: u.emailVerified };
}

/** Passwords: at least 8 characters (long and simple beats short and fiddly). */
export const MIN_PASSWORD = 8;
export const passwordOk = (p: string) => p.length >= MIN_PASSWORD;
export const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());

export async function signUp(email: string, password: string, username: string): Promise<Account> {
  if (!emailOk(email)) throw new AuthError('invalid-email');
  if (!passwordOk(password)) throw new AuthError('weak-password');
  if (!normalizeUsername(username)) throw new AuthError('username-invalid');
  const { auth } = await cloud();
  const { createUserWithEmailAndPassword, updateProfile, deleteUser } = await import('firebase/auth');
  const cred = await wrap(() => createUserWithEmailAndPassword(auth, email.trim(), password));
  const claimed = await claimUsername(cred.user.uid, username).catch(() => 'unknown' as const);
  if (claimed !== 'ok') {
    // Don't leave a half-made account behind.
    await deleteUser(cred.user).catch(() => {});
    throw new AuthError(claimed === 'taken' ? 'username-taken' : claimed === 'invalid' ? 'username-invalid' : 'unknown');
  }
  await updateProfile(cred.user, { displayName: normalizeUsername(username) }).catch(() => {});
  return toAccount(cred.user, normalizeUsername(username));
}

export async function signIn(email: string, password: string): Promise<Account> {
  if (!emailOk(email)) throw new AuthError('invalid-email');
  if (!password) throw new AuthError('wrong-password');
  const { auth } = await cloud();
  const { signInWithEmailAndPassword } = await import('firebase/auth');
  const cred = await wrap(() => signInWithEmailAndPassword(auth, email.trim(), password));
  return toAccount(cred.user);
}

/** Google sign-in: a popup, or a full-page redirect where popups are blocked. */
export async function signInWithGoogle(): Promise<Account | null> {
  const { auth } = await cloud();
  const { GoogleAuthProvider, signInWithPopup, signInWithRedirect } = await import('firebase/auth');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    const cred = await signInWithPopup(auth, provider);
    return toAccount(cred.user);
  } catch (e) {
    const p = problemOf(e);
    if (p === 'popup-blocked') {
      await wrap(() => signInWithRedirect(auth, provider));
      return null; // the page navigates away
    }
    throw new AuthError(p);
  }
}

/** Always succeeds from the person's point of view (never reveals whether the email has an account). */
export async function sendPasswordReset(email: string): Promise<void> {
  if (!emailOk(email)) throw new AuthError('invalid-email');
  const { auth } = await cloud();
  const { sendPasswordResetEmail } = await import('firebase/auth');
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (e) {
    const p = problemOf(e);
    if (p === 'offline' || p === 'too-many-attempts' || p === 'invalid-email') throw new AuthError(p);
    // user-not-found etc.: say nothing different
  }
}

export async function signOutNow(): Promise<void> {
  const { auth } = await cloud();
  const { signOut } = await import('firebase/auth');
  await signOut(auth);
}

/**
 * Permanently delete the account: its stored progress, its username and the
 * sign-in. Firebase asks for a recent sign-in first; pass the password for
 * email accounts (Google accounts confirm in a popup).
 */
export async function deleteAccount(deleteData: (uid: string) => Promise<void>, password?: string): Promise<void> {
  const { auth } = await cloud();
  const { deleteUser, EmailAuthProvider, GoogleAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup } = await import('firebase/auth');
  const u = auth.currentUser;
  if (!u) throw new AuthError('unknown');
  await wrap(async () => {
    if (u.providerData.some(p => p.providerId === 'password')) {
      if (!password) throw new AuthError('needs-recent-login');
      await reauthenticateWithCredential(u, EmailAuthProvider.credential(u.email ?? '', password));
    } else {
      await reauthenticateWithPopup(u, new GoogleAuthProvider());
    }
  });
  await releaseUsername(u.uid); // before the user record that names it is deleted
  await deleteData(u.uid);
  await wrap(() => deleteUser(u));
}

/** Watch who is signed in (fires once at start, then on every change). */
export async function watchUser(cb: (u: User | null) => void): Promise<() => void> {
  const { auth } = await cloud();
  const { onAuthStateChanged, getRedirectResult } = await import('firebase/auth');
  getRedirectResult(auth).catch(() => {}); // completes a Google redirect sign-in
  return onAuthStateChanged(auth, cb);
}
