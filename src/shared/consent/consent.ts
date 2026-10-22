/**
 * Cookie / tracking consent (GDPR + Garante Privacy guidelines).
 *
 * Only non-essential tracking needs consent: today that is Firebase Analytics.
 * Technical storage (login session, preferences, progress) does not.
 * The choice is stored locally with a version: bump CONSENT_VERSION when the
 * set of trackers changes so everyone is asked again.
 */
const KEY = 'tonic_consent';
export const CONSENT_VERSION = 1;

export interface ConsentRecord {
  version: number;
  analytics: boolean;
  decidedAt: string;
}

type Listener = (c: ConsentRecord | null) => void;
const listeners = new Set<Listener>();

export function getConsent(): ConsentRecord | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as ConsentRecord;
    return c.version === CONSENT_VERSION ? c : null;
  } catch {
    return null;
  }
}

export function setConsent(analytics: boolean): void {
  const record: ConsentRecord = { version: CONSENT_VERSION, analytics, decidedAt: new Date().toISOString() };
  try {
    localStorage.setItem(KEY, JSON.stringify(record));
  } catch {
    // storage unavailable — the choice lasts for this page load only
  }
  listeners.forEach(l => l(record));
}

export function onConsentChange(listener: Listener): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

// "Cookie preferences" link → reopens the banner.
const OPEN_EVENT = 'tonic:open-consent';

export function openConsentPreferences(): void {
  window.dispatchEvent(new Event(OPEN_EVENT));
}

export function onOpenConsentPreferences(handler: () => void): () => void {
  window.addEventListener(OPEN_EVENT, handler);
  return () => window.removeEventListener(OPEN_EVENT, handler);
}
