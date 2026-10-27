// Firebase, loaded only when needed. The SDK is imported dynamically, so
// people who never sign in never download it.
//
// Configuration comes from build-time environment variables (VITE_FIREBASE_*),
// set as GitHub repository variables for the deploy, or in .env.local for
// development. When they are missing, accounts are simply turned off: the app
// works exactly as before, on this device only.
//
// VITE_FIREBASE_EMULATOR=1 points everything at the local Firebase emulators
// (tests and development).
import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

const env = import.meta.env;

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: env.VITE_FIREBASE_APP_ID as string | undefined,
};

export const useEmulator = env.VITE_FIREBASE_EMULATOR === '1';

/** Are accounts available in this build? */
export function cloudConfigured(): boolean {
  return useEmulator || !!(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

interface Cloud {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
}
let loading: Promise<Cloud> | null = null;

export function cloud(): Promise<Cloud> {
  if (!cloudConfigured()) return Promise.reject(new Error('accounts are not configured'));
  if (!loading) {
    loading = (async () => {
      const [{ initializeApp }, authMod, fsMod] = await Promise.all([import('firebase/app'), import('firebase/auth'), import('firebase/firestore')]);
      const app = initializeApp(
        useEmulator
          ? { apiKey: 'demo-key', authDomain: 'demo-hoot.firebaseapp.com', projectId: 'demo-hoot', appId: 'demo-app' }
          : (firebaseConfig as Required<typeof firebaseConfig>),
      );
      const auth = authMod.getAuth(app);
      // Stay signed in across visits (the default, made explicit).
      await authMod.setPersistence(auth, authMod.browserLocalPersistence).catch(() => {});
      // Offline-first: reads come from a local cache and writes queue until online.
      let db: Firestore;
      try {
        db = fsMod.initializeFirestore(app, { localCache: fsMod.persistentLocalCache({ tabManager: fsMod.persistentMultipleTabManager() }) });
      } catch {
        db = fsMod.getFirestore(app); // private mode etc.: memory cache
      }
      if (useEmulator) {
        authMod.connectAuthEmulator(auth, `http://${env.VITE_FIREBASE_EMULATOR_HOST ?? '127.0.0.1'}:9099`, { disableWarnings: true });
        fsMod.connectFirestoreEmulator(db, env.VITE_FIREBASE_EMULATOR_HOST ?? '127.0.0.1', 8080);
      }
      return { app, auth, db };
    })();
    loading.catch(() => {
      loading = null; // allow a retry later (e.g. after coming back online)
    });
  }
  return loading;
}
