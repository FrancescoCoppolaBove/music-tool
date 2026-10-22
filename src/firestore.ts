import { getFirestore } from 'firebase/firestore';
import { app } from './firebase';

/**
 * Firestore instance. Kept out of `firebase.ts` on purpose: only lazily loaded
 * code imports this module, so the Firestore SDK (~130 KB gzipped) is not part
 * of the first load — the login screen never downloads it.
 */
export const db = app ? getFirestore(app) : null;
