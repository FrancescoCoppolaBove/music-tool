import { auth } from '../../firebase';

/**
 * POSTs JSON to an AI endpoint with the signed-in user's Firebase ID token.
 * The server rejects unauthenticated calls (401) and over-quota calls (429)
 * with a user-facing `error` message in the JSON body.
 */
export async function aiFetch(url: string, body: unknown): Promise<Response> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = await auth?.currentUser?.getIdToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
}
