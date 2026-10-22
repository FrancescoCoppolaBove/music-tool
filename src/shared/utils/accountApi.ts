import { GoogleAuthProvider, reauthenticateWithPopup, signOut } from 'firebase/auth';
import { auth } from '../../firebase';

// Same convention as Score → iReal: VITE_API_URL in dev, relative on Netlify.
const API_URL = import.meta.env.VITE_API_URL || '';

async function callAccount(action: 'export' | 'delete'): Promise<Response> {
  const user = auth?.currentUser;
  if (!user) throw new Error('Not signed in');
  // Force-refresh so the token carries the latest auth_time after a re-auth.
  const token = await user.getIdToken(true);
  const res = await fetch(`${API_URL}/api/account/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: '{}',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error || 'Request failed');
  }
  return res;
}

/** GDPR export: downloads every piece of the user's data as a JSON file. */
export async function downloadMyData(): Promise<void> {
  const data = await (await callAccount('export')).json();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `tonic-data-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * GDPR erasure. Asks Google to confirm the identity first (the server only
 * accepts a sign-in from the last 5 minutes), then deletes everything and
 * clears the local copies on this device.
 */
export async function deleteMyAccount(): Promise<void> {
  const user = auth?.currentUser;
  if (!auth || !user) throw new Error('Not signed in');
  await reauthenticateWithPopup(user, new GoogleAuthProvider());
  await callAccount('delete');

  try {
    Object.keys(localStorage).filter(k => k.startsWith('tonic_')).forEach(k => localStorage.removeItem(k));
  } catch {
    // storage unavailable — nothing to clear
  }
  await signOut(auth).catch(() => {});
}
