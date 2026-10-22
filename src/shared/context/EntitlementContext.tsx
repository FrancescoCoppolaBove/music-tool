import React, { useEffect, useState } from 'react';
import { firebaseEnabled } from '../../firebase';
import { billingEnabled } from '../../config/plans';
import { useAuth } from './AuthContext';
import { EntitlementContext, UNLOCKED, type Entitlement } from './entitlement';

// Firestore is loaded on demand (see src/firestore.ts).
const loadSync = () => import('./entitlementSync');

interface Snapshot { uid: string; entitlement: Entitlement | null }

/** Live view of `entitlements/{uid}`, so Pro unlocks the moment the webhook lands. */
export function EntitlementProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const uid = billingEnabled && firebaseEnabled ? user?.uid ?? null : null;
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  useEffect(() => {
    if (!uid) return;
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;
    // On errors fall back to Free: never unlock Pro by accident.
    const fail = () => setSnapshot({ uid, entitlement: null });

    loadSync().then(({ subscribeEntitlement }) => {
      if (cancelled) return;
      unsubscribe = subscribeEntitlement(uid, entitlement => setSnapshot({ uid, entitlement }), fail);
    }).catch(fail);

    return () => { cancelled = true; unsubscribe?.(); };
  }, [uid]);

  // Derived, so switching accounts never shows the previous user's plan.
  const value = !uid
    ? UNLOCKED
    : snapshot?.uid !== uid
      ? { isPro: false, entitlement: null, loading: true }
      : { isPro: snapshot.entitlement?.plan === 'pro', entitlement: snapshot.entitlement, loading: false };

  return <EntitlementContext.Provider value={value}>{children}</EntitlementContext.Provider>;
}
