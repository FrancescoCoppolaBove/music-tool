import { createContext, useContext } from 'react';

/** Mirror of netlify/lib/billing.ts `Entitlement` (written by the Paddle webhook). */
export interface Entitlement {
  plan: 'free' | 'pro';
  status: string;
  currentPeriodEnd: string | null;
  cancelAt: string | null;
}

export interface EntitlementValue {
  isPro: boolean;
  /** The app's creator (`owner` custom claim): everything unlocked, never billed. */
  isOwner: boolean;
  /** null when there is no subscription document (or billing is off). */
  entitlement: Entitlement | null;
  loading: boolean;
}

// Without billing (local mode, pre-launch) everything is unlocked.
export const UNLOCKED: EntitlementValue = { isPro: true, isOwner: false, entitlement: null, loading: false };

export const EntitlementContext = createContext<EntitlementValue>(UNLOCKED);

export function useEntitlement(): EntitlementValue {
  return useContext(EntitlementContext);
}
