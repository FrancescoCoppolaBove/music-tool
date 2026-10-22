import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { app } from './firebase';

/**
 * Firestore instance. Kept out of `firebase.ts` on purpose: only lazily loaded
 * code imports this module, so the Firestore SDK (~130 KB gzipped) is not part
 * of the first load — the login screen never downloads it.
 */
export const db = app ? getFirestore(app) : null;

if (db && import.meta.env.VITE_USE_EMULATORS === 'true') connectFirestoreEmulator(db, '127.0.0.1', 8080);
