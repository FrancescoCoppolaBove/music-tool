/**
 * GDPR account rights — data export (art. 15/20) and erasure (art. 17).
 * Shared by the Netlify function `account` and the Express dev server.
 *
 * Runs with the Admin SDK because it must reach data the client cannot:
 * the AI quota counters, other users' class rosters, and the Auth record.
 */
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Timestamp, type DocumentReference, type Firestore, type QuerySnapshot } from 'firebase-admin/firestore';
import { adminApp, GuardError, type Caller } from './aiGuard';
import { cancelSubscriptionForDeletion } from './billing';

/** Deletion needs a sign-in from the last few minutes (stolen sessions can't erase accounts). */
const RECENT_LOGIN_SECONDS = 5 * 60;

function db(): Firestore {
  const app = adminApp();
  if (!app) throw new GuardError(503, 'not_configured', 'Account service is not configured');
  return getFirestore(app);
}

function requireRealUser(caller: Caller): void {
  if (caller.anonymousDev) {
    throw new GuardError(400, 'auth_required', 'Account actions need a real signed-in user');
  }
}

// ─── Export ───────────────────────────────────────────────────────────────────

/** Firestore values → plain JSON (Timestamps become ISO strings). */
function toJson(value: unknown): unknown {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (Array.isArray(value)) return value.map(toJson);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, toJson(v)]));
  }
  return value;
}

/** A document plus all its subcollections, recursively. */
async function dumpDoc(ref: DocumentReference): Promise<Record<string, unknown> | null> {
  const snap = await ref.get();
  const out: Record<string, unknown> = snap.exists ? { ...(toJson(snap.data()) as object) } : {};
  for (const sub of await ref.listCollections()) {
    const docs = await sub.listDocuments();
    const entries = await Promise.all(docs.map(async d => [d.id, await dumpDoc(d)] as const));
    out[`[${sub.id}]`] = Object.fromEntries(entries.filter(([, v]) => v !== null));
  }
  return snap.exists || Object.keys(out).length ? out : null;
}

export async function exportUserData(caller: Caller): Promise<Record<string, unknown>> {
  requireRealUser(caller);
  const firestore = db();
  const uid = caller.uid;

  const [profile, submissions, usage, ownClasses, enrolledClasses, assignments, entitlement] = await Promise.all([
    dumpDoc(firestore.doc(`users/${uid}`)),
    firestore.collection('submissions').where('userId', '==', uid).get(),
    firestore.doc(`aiUsage/${uid}`).get(),
    firestore.collection('classes').where('teacherId', '==', uid).get(),
    firestore.collection('classes').where('studentIds', 'array-contains', uid).get(),
    firestore.collection('assignments').where('teacherId', '==', uid).get(),
    firestore.doc(`entitlements/${uid}`).get(),
  ]);
  const authUser = await getAuth(adminApp()!).getUser(uid);

  const docs = (q: QuerySnapshot) => q.docs.map(d => ({ id: d.id, ...(toJson(d.data()) as object) }));

  return {
    exportedAt: new Date().toISOString(),
    account: {
      uid,
      email: authUser.email ?? null,
      displayName: authUser.displayName ?? null,
      createdAt: authUser.metadata.creationTime,
      lastSignInAt: authUser.metadata.lastSignInTime,
      providers: authUser.providerData.map(p => p.providerId),
    },
    profile,
    examSubmissions: docs(submissions),
    aiUsageToday: usage.exists ? toJson(usage.data()) : null,
    classesAsTeacher: docs(ownClasses),
    classesAsStudent: enrolledClasses.docs.map(d => ({ id: d.id, name: d.get('name') })),
    assignmentsAsTeacher: docs(assignments),
    subscription: entitlement.exists ? toJson(entitlement.data()) : null,
  };
}

// ─── Erasure ──────────────────────────────────────────────────────────────────

export async function deleteUserAccount(caller: Caller): Promise<void> {
  requireRealUser(caller);
  if (Date.now() / 1000 - caller.authTime > RECENT_LOGIN_SECONDS) {
    throw new GuardError(401, 'recent_login_required', 'Please sign in again to confirm account deletion');
  }

  const firestore = db();
  const uid = caller.uid;

  // First: stop billing. If Paddle is unreachable we abort before deleting
  // anything, so a deleted user can never keep being charged.
  await cancelSubscriptionForDeletion(uid);

  const writer = firestore.bulkWriter();

  const [submissions, ownClasses, enrolledClasses, assignments] = await Promise.all([
    firestore.collection('submissions').where('userId', '==', uid).get(),
    firestore.collection('classes').where('teacherId', '==', uid).get(),
    firestore.collection('classes').where('studentIds', 'array-contains', uid).get(),
    firestore.collection('assignments').where('teacherId', '==', uid).get(),
  ]);

  submissions.docs.forEach(d => writer.delete(d.ref));
  ownClasses.docs.forEach(d => writer.delete(d.ref));
  assignments.docs.forEach(d => writer.delete(d.ref));
  // Leave other teachers' classes intact, just drop this student from the roster.
  enrolledClasses.docs
    .filter(d => d.get('teacherId') !== uid)
    .forEach(d => writer.update(d.ref, { studentIds: FieldValue.arrayRemove(uid) }));
  writer.delete(firestore.doc(`aiUsage/${uid}`));
  await writer.close();

  // Profile + every subcollection (songs, data/stats, data/daily, data/profile…).
  await firestore.recursiveDelete(firestore.doc(`users/${uid}`));

  // Last: once the Auth user is gone the client can no longer retry.
  await getAuth(adminApp()!).deleteUser(uid);
}
