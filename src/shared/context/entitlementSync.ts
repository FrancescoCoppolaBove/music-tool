// Firestore side of EntitlementContext — loaded on demand after sign-in.
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firestore';
import type { Entitlement } from './entitlement';

export function subscribeEntitlement(uid: string, onData: (e: Entitlement | null) => void, onError: () => void): () => void {
  if (!db) { onData(null); return () => {}; }
  return onSnapshot(doc(db, 'entitlements', uid), snap => onData(snap.exists() ? (snap.data() as Entitlement) : null), onError);
}
