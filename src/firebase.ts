import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

const required = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
];

const missing = required.filter(k => !import.meta.env[k]);

/**
 * Firebase is OPTIONAL. When the config is absent (e.g. local dev without a
 * populated .env), the app boots in "local mode": login and cloud sync are
 * disabled, but every offline tool still works. With config present, behaviour
 * is unchanged. `firebaseEnabled` lets the rest of the app branch cleanly.
 */
export const firebaseEnabled = missing.length === 0;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (firebaseEnabled) {
  const firebaseConfig = {
    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY as string,
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
    appId:             import.meta.env.VITE_FIREBASE_APP_ID as string,
    measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string | undefined,
  };

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  isSupported().then(yes => { if (yes && app) getAnalytics(app); }).catch(() => {});
} else {
  console.warn(
    `[tonic] Firebase not configured (missing: ${missing.join(', ')}). ` +
    `Running in local mode — login and cloud sync are disabled. ` +
    `Copy .env.example to .env and fill the VITE_FIREBASE_* keys to enable them.`,
  );
}

export { app, auth, db };
