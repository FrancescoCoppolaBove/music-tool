/**
 * Grants (or revokes) the creator account: `owner: true` custom claim +
 * teacher role, so every tool, the teacher dashboard and unlimited AI are
 * available. Run once with the service-account env (.env or shell):
 *
 *   npx tsx scripts/grant-owner.ts you@example.com           # grant
 *   npx tsx scripts/grant-owner.ts you@example.com --revoke  # revoke
 *
 * Then sign out and back in (or wait up to 1 h) to refresh the ID token.
 */
import 'dotenv/config';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { adminApp } from '../netlify/lib/aiGuard';

const [email, flag] = process.argv.slice(2);
if (!email) {
  console.error('Usage: npx tsx scripts/grant-owner.ts <email> [--revoke]');
  process.exit(1);
}
const revoke = flag === '--revoke';

const app = adminApp();
if (!app) {
  console.error('Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY.');
  process.exit(1);
}

const auth = getAuth(app);
const user = await auth.getUserByEmail(email);
const claims = { ...(user.customClaims ?? {}) };
if (revoke) delete claims.owner;
else claims.owner = true;
await auth.setCustomUserClaims(user.uid, claims);

// The teacher dashboard and its Firestore rules key off users/{uid}.role.
await getFirestore(app).doc(`users/${user.uid}`).set({ role: revoke ? 'student' : 'teacher' }, { merge: true });

console.log(`${revoke ? 'Revoked' : 'Granted'} creator access for ${email} (uid ${user.uid}). Sign out and back in to apply.`);
