import * as Sentry from '@sentry/react';

/**
 * Error monitoring (Sentry). Enabled only when VITE_SENTRY_DSN is set.
 * Privacy: no cookies, headers, bodies or query strings (`dataCollection`), no
 * session replay, no performance tracing. Also enable "Prevent Storing of IP
 * Addresses" in the Sentry project settings. Users are identified only by their
 * Firebase uid, so a report can be matched to an account without the email.
 */
const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;

export const monitoringEnabled = Boolean(dsn);

export function initMonitoring(): void {
  if (!dsn) return;
  Sentry.init({
    dsn,
    environment: (import.meta.env.VITE_DEPLOY_CONTEXT as string | undefined) ?? import.meta.env.MODE,
    release: import.meta.env.VITE_RELEASE as string | undefined,
    // Sentry 11 collects all of these by default.
    dataCollection: { userInfo: false, cookies: false, httpHeaders: false, httpBodies: [], urlQueryParams: false },
    tracesSampleRate: 0,
    // Noise from browser extensions and aborted network calls.
    ignoreErrors: ['ResizeObserver loop limit exceeded', 'ResizeObserver loop completed with undelivered notifications', 'AbortError'],
    denyUrls: [/^chrome-extension:\/\//, /^moz-extension:\/\//, /^safari-web-extension:\/\//],
  });
}

export function reportError(error: unknown, context?: Record<string, unknown>): void {
  console.error(error);
  if (monitoringEnabled) Sentry.captureException(error, context ? { extra: context } : undefined);
}

export function setMonitoringUser(uid: string | null): void {
  if (monitoringEnabled) Sentry.setUser(uid ? { id: uid } : null);
}
