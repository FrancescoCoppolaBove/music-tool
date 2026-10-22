/**
 * Legal documents are hosted on Iubenda (Privacy, Cookie, Terms).
 * Paste the URLs from the Iubenda dashboard into the VITE_* env vars.
 */
export const LEGAL_LINKS = {
  privacy: import.meta.env.VITE_PRIVACY_POLICY_URL as string | undefined,
  cookies: import.meta.env.VITE_COOKIE_POLICY_URL as string | undefined,
  terms:   import.meta.env.VITE_TERMS_URL as string | undefined,
};

/** Italian digital-consent age (D.Lgs. 101/2018, art. 2-quinquies). */
export const MIN_AGE = 14;

/** Bump when the Terms change materially; stored on the profile at sign-up. */
export const TERMS_VERSION = '2026-10';

if (import.meta.env.PROD && Object.values(LEGAL_LINKS).some(v => !v)) {
  console.warn('[tonic] Missing legal links: set VITE_PRIVACY_POLICY_URL, VITE_COOKIE_POLICY_URL, VITE_TERMS_URL.');
}
