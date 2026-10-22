import { auth } from '../../firebase';

// Same convention as Score → iReal: VITE_API_URL in dev, relative on Netlify.
const API_URL = import.meta.env.VITE_API_URL || '';
const PADDLE_SCRIPT = 'https://cdn.paddle.com/paddle/v2/paddle.js';

interface PaddleEvent { name?: string }
interface PaddleGlobal {
  Environment: { set(env: string): void };
  Initialize(opts: { token: string; eventCallback?: (e: PaddleEvent) => void }): void;
  Checkout: { open(opts: { transactionId: string; customer?: { email: string }; settings?: Record<string, unknown> }): void };
}
declare global {
  interface Window { Paddle?: PaddleGlobal }
}

const listeners = new Set<(e: PaddleEvent) => void>();
let paddlePromise: Promise<PaddleGlobal> | null = null;

/** Paddle.js is ~100 KB: injected only when someone actually starts a checkout. */
function loadPaddle(): Promise<PaddleGlobal> {
  paddlePromise ??= new Promise<PaddleGlobal>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = PADDLE_SCRIPT;
    script.async = true;
    script.onload = () => {
      const paddle = window.Paddle;
      if (!paddle) return reject(new Error('Paddle failed to load'));
      if (import.meta.env.VITE_PADDLE_ENV !== 'production') paddle.Environment.set('sandbox');
      paddle.Initialize({
        token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN as string,
        eventCallback: e => listeners.forEach(l => l(e)),
      });
      resolve(paddle);
    };
    script.onerror = () => { paddlePromise = null; reject(new Error('Could not reach the payment provider. Check your connection or ad blocker.')); };
    document.head.appendChild(script);
  });
  return paddlePromise;
}

export function onPaddleEvent(listener: (e: PaddleEvent) => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

async function callBilling<T>(action: 'checkout' | 'portal', body: unknown = {}): Promise<T> {
  const user = auth?.currentUser;
  if (!user) throw new Error('Sign in to subscribe');
  const res = await fetch(`${API_URL}/api/billing/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({})) as T & { error?: string };
  if (!res.ok) throw new Error(json.error || 'Billing request failed');
  return json;
}

/** Opens Paddle Checkout (overlay) for a server-created transaction tied to this account. */
export async function startCheckout(interval: 'monthly' | 'yearly'): Promise<void> {
  const [paddle, { transactionId }] = await Promise.all([
    loadPaddle(),
    callBilling<{ transactionId: string }>('checkout', { interval }),
  ]);
  const email = auth?.currentUser?.email;
  paddle.Checkout.open({
    transactionId,
    ...(email ? { customer: { email } } : {}),
    settings: { displayMode: 'overlay', theme: 'dark', locale: navigator.language.startsWith('it') ? 'it' : 'en' },
  });
}

/** Paddle customer portal: payment method, plan switch, cancellation, invoices. */
export async function openBillingPortal(): Promise<void> {
  const { url } = await callBilling<{ url: string }>('portal');
  window.location.assign(url);
}
