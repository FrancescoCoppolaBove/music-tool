import React, { useEffect, useState } from 'react';
import { firebaseEnabled } from '../../firebase';
import { billingEnabled } from '../../config/plans';
import { useAuth } from './AuthContext';
import { EntitlementContext, UNLOCKED, type Entitlement } from './entitlement';

// Firestore is loaded on demand (see src/firestore.ts).
const loadSync = () => import('./entitlementSync');

interface Snapshot { uid: string; entitlement: Entitlement | null }
interface Claims { uid: string; owner: boolean }

/** Live view of `entitlements/{uid}`, so Pro unlocks the moment the webhook lands. */
export function EntitlementProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const uid = billingEnabled && firebaseEnabled ? user?.uid ?? null : null;
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [claims, setClaims] = useState<Claims | null>(null);

  // Creator account: `owner` custom claim in the (Google-signed) ID token.
  useEffect(() => {
    if (!uid || !user) return;
    user.getIdTokenResult()
      .then(r => setClaims({ uid, owner: r.claims.owner === true }))
      .catch(() => setClaims({ uid, owner: false }));
  }, [uid, user]);

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
    : claims?.uid === uid && claims.owner
      ? { isPro: true, isOwner: true, entitlement: null, loading: false }
      : snapshot?.uid !== uid || claims?.uid !== uid
        ? { isPro: false, isOwner: false, entitlement: null, loading: true }
        : { isPro: snapshot.entitlement?.plan === 'pro', isOwner: false, entitlement: snapshot.entitlement, loading: false };

  return <EntitlementContext.Provider value={value}>{children}</EntitlementContext.Provider>;
}
