// Run with: npm run test:account (Firestore + Auth emulators).
import { before, test } from 'node:test';
import assert from 'node:assert/strict';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { adminApp, GuardError } from '../netlify/lib/aiGuard';
import { deleteUserAccount, exportUserData } from '../netlify/lib/account';

const app = adminApp()!;
const db = getFirestore(app);
const auth = getAuth(app);
const now = () => Math.floor(Date.now() / 1000);

interface Exported {
  account: { email: string };
  profile: { displayName: string; '[data]': { stats: { streak: number } }; '[songs]': { s1: { title: string } } };
  examSubmissions: unknown[];
  aiUsageToday: { buddy: number };
  classesAsTeacher: unknown[];
  classesAsStudent: { id: string }[];
}

async function seed(uid: string) {
  await auth.createUser({ uid, email: `${uid}@example.com`, displayName: uid }).catch(() => {});
  await db.doc(`users/${uid}`).set({ displayName: uid, email: `${uid}@example.com`, role: 'teacher', createdAt: 1 });
  await db.doc(`users/${uid}/data/stats`).set({ streak: 4 });
  await db.doc(`users/${uid}/songs/s1`).set({ title: 'Song' });
  await db.doc(`submissions/${uid}-sub`).set({ userId: uid, score: 90 });
  await db.doc(`aiUsage/${uid}`).set({ day: '2026-10-22', buddy: 3 });
  await db.doc(`classes/${uid}-class`).set({ teacherId: uid, name: 'Mine', studentIds: ['other'] });
  await db.doc(`assignments/${uid}-asg`).set({ teacherId: uid, classId: `${uid}-class` });
  await db.doc('classes/foreign').set({ teacherId: 'someoneElse', name: 'Theirs', studentIds: [uid, 'other'] });
}

before(async () => { assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'run via npm run test:account'); });

test('export returns profile, subcollections, submissions, quota and classes', async () => {
  await seed('exp');
  const data = await exportUserData({ uid: 'exp', authTime: now(), anonymousDev: false }) as unknown as Exported;
  assert.equal(data.account.email, 'exp@example.com');
  assert.equal(data.profile.displayName, 'exp');
  assert.equal(data.profile['[data]'].stats.streak, 4);
  assert.equal(data.profile['[songs]'].s1.title, 'Song');
  assert.equal(data.examSubmissions.length, 1);
  assert.equal(data.aiUsageToday.buddy, 3);
  assert.equal(data.classesAsTeacher.length, 1);
  assert.deepEqual(data.classesAsStudent.map(c => c.id), ['foreign']);
});

test('delete requires a recent sign-in', async () => {
  await seed('stale');
  await assert.rejects(
    deleteUserAccount({ uid: 'stale', authTime: now() - 3600, anonymousDev: false }),
    (e: unknown) => e instanceof GuardError && e.code === 'recent_login_required',
  );
  assert.ok((await db.doc('users/stale').get()).exists);
});

test('delete erases all user data and the auth record, keeps other classes', async () => {
  await seed('del');
  await deleteUserAccount({ uid: 'del', authTime: now(), anonymousDev: false });

  for (const path of ['users/del', 'users/del/data/stats', 'users/del/songs/s1', 'submissions/del-sub',
    'aiUsage/del', 'classes/del-class', 'assignments/del-asg']) {
    assert.equal((await db.doc(path).get()).exists, false, `${path} should be gone`);
  }
  const foreign = await db.doc('classes/foreign').get();
  assert.ok(foreign.exists);
  assert.deepEqual(foreign.get('studentIds'), ['other']);
  await assert.rejects(auth.getUser('del'));
});

test('dev bypass caller cannot use account actions', async () => {
  await assert.rejects(exportUserData({ uid: 'local-dev', authTime: 0, anonymousDev: true }));
});
