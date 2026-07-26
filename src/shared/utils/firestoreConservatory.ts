import {
  doc, collection, getDoc, getDocs, setDoc, addDoc,
  query, where, orderBy, limit,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '../../firebase';
import type { UserProfile, ClassDoc, AssignmentDoc, SubmissionDoc } from '../types/conservatory.types';

function requireDb() {
  if (!db) throw new Error('Firebase not configured');
  return db;
}

// ─── UserProfile ─────────────────────────────────────────────────────────────

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(requireDb(), 'users', uid));
  if (!snap.exists()) return null;
  return { uid, ...(snap.data() as Omit<UserProfile, 'uid'>) };
}

export async function getOrCreateUserProfile(user: User): Promise<UserProfile> {
  const existing = await getUserProfile(user.uid);
  if (existing) return existing;

  const profile: Omit<UserProfile, 'uid'> = {
    displayName: user.displayName ?? user.email ?? 'Utente',
    email: user.email ?? '',
    role: 'student',
    createdAt: Date.now(),
  };
  await setDoc(doc(requireDb(), 'users', user.uid), profile);
  return { uid: user.uid, ...profile };
}

export async function getUserProfiles(uids: string[]): Promise<UserProfile[]> {
  if (!uids.length) return [];
  const batches: string[][] = [];
  for (let i = 0; i < uids.length; i += 30) batches.push(uids.slice(i, i + 30));

  const results: UserProfile[] = [];
  for (const batch of batches) {
    const q = query(collection(requireDb(), 'users'), where('__name__', 'in', batch));
    const snap = await getDocs(q);
    snap.docs.forEach(d => results.push({ uid: d.id, ...(d.data() as Omit<UserProfile, 'uid'>) }));
  }
  return results;
}

// ─── Classes ─────────────────────────────────────────────────────────────────

export async function getClassesByTeacher(teacherId: string): Promise<ClassDoc[]> {
  const q = query(collection(requireDb(), 'classes'), where('teacherId', '==', teacherId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<ClassDoc, 'id'>) }));
}

export async function createClass(data: Omit<ClassDoc, 'id'>): Promise<ClassDoc> {
  const ref = await addDoc(collection(requireDb(), 'classes'), data);
  return { id: ref.id, ...data };
}

// ─── Assignments ─────────────────────────────────────────────────────────────

export async function getAssignmentsByTeacher(teacherId: string): Promise<AssignmentDoc[]> {
  const q = query(
    collection(requireDb(), 'assignments'),
    where('teacherId', '==', teacherId),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<AssignmentDoc, 'id'>) }));
}

export async function createAssignment(data: Omit<AssignmentDoc, 'id'>): Promise<AssignmentDoc> {
  const ref = await addDoc(collection(requireDb(), 'assignments'), data);
  return { id: ref.id, ...data };
}

// ─── Submissions ─────────────────────────────────────────────────────────────

export async function addSubmission(data: Omit<SubmissionDoc, 'id'>): Promise<string> {
  const ref = await addDoc(collection(requireDb(), 'submissions'), data);
  return ref.id;
}

export async function getSubmissionsByUser(userId: string, limitN = 50): Promise<SubmissionDoc[]> {
  const q = query(
    collection(requireDb(), 'submissions'),
    where('userId', '==', userId),
    orderBy('completedAt', 'desc'),
    limit(limitN),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<SubmissionDoc, 'id'>) }));
}

export async function getSubmissionsByStudents(studentIds: string[]): Promise<SubmissionDoc[]> {
  if (!studentIds.length) return [];
  const batches: string[][] = [];
  for (let i = 0; i < studentIds.length; i += 30) batches.push(studentIds.slice(i, i + 30));

  const results: SubmissionDoc[] = [];
  for (const batch of batches) {
    const q = query(
      collection(requireDb(), 'submissions'),
      where('userId', 'in', batch),
      orderBy('completedAt', 'desc'),
    );
    const snap = await getDocs(q);
    snap.docs.forEach(d => results.push({ id: d.id, ...(d.data() as Omit<SubmissionDoc, 'id'>) }));
  }
  return results;
}
