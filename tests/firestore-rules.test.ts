// Run with: npm run test:rules (starts the Firestore emulator around this file).
import { readFileSync } from 'node:fs';
import { after, before, beforeEach, test } from 'node:test';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where, addDoc } from 'firebase/firestore';

let env: RulesTestEnvironment;

const student = { displayName: 'Ada', email: 'ada@example.com', role: 'student', createdAt: 1 };
const submission = (userId: string) => ({
  userId, moduleId: 'intervals', score: 80, answers: [], completedAt: 1, durationMs: 1000,
});

before(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-tonic',
    firestore: { rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
  });
});

after(async () => { await env.cleanup(); });

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async ctx => {
    const db = ctx.firestore();
    await setDoc(doc(db, 'users/teacher1'), { ...student, displayName: 'Prof', role: 'teacher' });
    await setDoc(doc(db, 'users/alice'), student);
    await setDoc(doc(db, 'users/bob'), student);
    await setDoc(doc(db, 'classes/c1'), { teacherId: 'teacher1', name: 'Solfeggio', studentIds: ['alice'], createdAt: 1 });
    await setDoc(doc(db, 'assignments/a1'), { classId: 'c1', teacherId: 'teacher1', title: 'T', createdAt: 1 });
    await setDoc(doc(db, 'submissions/s1'), submission('alice'));
    await setDoc(doc(db, 'aiUsage/alice'), { day: '2026-01-01', buddy: 1 });
  });
});

const as = (uid: string) => env.authenticatedContext(uid).firestore();
const anon = () => env.unauthenticatedContext().firestore();

// ─── users ────────────────────────────────────────────────────────────────────

test('a new user can self-register only as a student', async () => {
  await assertSucceeds(setDoc(doc(as('carol'), 'users/carol'), { ...student, termsVersion: '2026-10', termsAcceptedAt: 1 }));
  await assertFails(setDoc(doc(as('dave'), 'users/dave'), { ...student, role: 'teacher' }));
  await assertFails(setDoc(doc(as('erin'), 'users/erin'), { ...student, plan: 'pro' }));
});

test('a user cannot create or edit someone else’s profile', async () => {
  await assertFails(setDoc(doc(as('carol'), 'users/zed'), student));
  await assertFails(updateDoc(doc(as('bob'), 'users/alice'), { displayName: 'hacked' }));
});

test('a user cannot promote themselves or grant a plan', async () => {
  await assertFails(updateDoc(doc(as('alice'), 'users/alice'), { role: 'teacher' }));
  await assertFails(updateDoc(doc(as('alice'), 'users/alice'), { plan: 'pro' }));
  await assertSucceeds(updateDoc(doc(as('alice'), 'users/alice'), { displayName: 'Ada L.' }));
});

test('profiles are private, except to teachers', async () => {
  await assertSucceeds(getDoc(doc(as('alice'), 'users/alice')));
  await assertFails(getDoc(doc(as('bob'), 'users/alice')));
  await assertFails(getDoc(doc(anon(), 'users/alice')));
  await assertSucceeds(getDocs(query(collection(as('teacher1'), 'users'), where('__name__', 'in', ['alice', 'bob']))));
});

test('private subcollections are owner-only', async () => {
  await assertSucceeds(setDoc(doc(as('alice'), 'users/alice/data/stats'), { streak: 3 }));
  await assertSucceeds(addDoc(collection(as('alice'), 'users/alice/songs'), { title: 'Song' }));
  await assertFails(getDoc(doc(as('bob'), 'users/alice/data/stats')));
  await assertFails(getDocs(collection(as('teacher1'), 'users/alice/songs')));
});

// ─── classes & assignments ────────────────────────────────────────────────────

test('only teachers create classes, for themselves', async () => {
  await assertSucceeds(addDoc(collection(as('teacher1'), 'classes'), { teacherId: 'teacher1', name: 'X', studentIds: [], createdAt: 1 }));
  await assertFails(addDoc(collection(as('alice'), 'classes'), { teacherId: 'alice', name: 'X', studentIds: [], createdAt: 1 }));
  await assertFails(addDoc(collection(as('teacher1'), 'classes'), { teacherId: 'other', name: 'X', studentIds: [], createdAt: 1 }));
});

test('class visibility: owner teacher and enrolled students', async () => {
  await assertSucceeds(getDocs(query(collection(as('teacher1'), 'classes'), where('teacherId', '==', 'teacher1'))));
  await assertSucceeds(getDoc(doc(as('alice'), 'classes/c1')));
  await assertFails(getDoc(doc(as('bob'), 'classes/c1')));
});

test('assignments: teacher of the class creates, enrolled students read', async () => {
  await assertSucceeds(addDoc(collection(as('teacher1'), 'assignments'), { classId: 'c1', teacherId: 'teacher1', title: 'N', createdAt: 2 }));
  await assertFails(addDoc(collection(as('alice'), 'assignments'), { classId: 'c1', teacherId: 'alice', title: 'N', createdAt: 2 }));
  await assertSucceeds(getDocs(query(collection(as('teacher1'), 'assignments'), where('teacherId', '==', 'teacher1'))));
  await assertSucceeds(getDoc(doc(as('alice'), 'assignments/a1')));
  await assertFails(getDoc(doc(as('bob'), 'assignments/a1')));
});

// ─── submissions ──────────────────────────────────────────────────────────────

test('submissions: create own only, immutable, private', async () => {
  await assertSucceeds(addDoc(collection(as('bob'), 'submissions'), submission('bob')));
  await assertFails(addDoc(collection(as('bob'), 'submissions'), submission('alice')));
  await assertFails(addDoc(collection(as('bob'), 'submissions'), { ...submission('bob'), score: 1000 }));
  await assertFails(updateDoc(doc(as('alice'), 'submissions/s1'), { score: 100 }));
  await assertSucceeds(getDocs(query(collection(as('alice'), 'submissions'), where('userId', '==', 'alice'))));
  await assertFails(getDoc(doc(as('bob'), 'submissions/s1')));
  await assertSucceeds(getDocs(query(collection(as('teacher1'), 'submissions'), where('userId', 'in', ['alice']))));
});

// ─── server-only ──────────────────────────────────────────────────────────────

test('AI quota counters are not readable or writable by clients', async () => {
  await assertFails(getDoc(doc(as('alice'), 'aiUsage/alice')));
  await assertFails(setDoc(doc(as('alice'), 'aiUsage/alice'), { day: '2026-01-01', buddy: 0 }));
});

test('unknown collections are closed', async () => {
  await assertFails(setDoc(doc(as('alice'), 'anything/x'), { a: 1 }));
});
