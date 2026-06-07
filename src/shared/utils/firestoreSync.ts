import { doc, getDoc, setDoc, collection, getDocs, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import type { PracticeLog } from '../hooks/useExerciseScore';

export interface ExerciseStats { [exerciseId: string]: { bestStreak: number } }

export interface UserStats {
  practiceLog: PracticeLog;
  exerciseStats: ExerciseStats;
}

export interface Song {
  id?: string;
  title: string;
  key: string;
  style: string;
  notes: string;
  tags: string[];
  createdAt?: number;
  updatedAt?: number;
}

// ─── Stats sync ───────────────────────────────────────────────────────────────

export async function loadUserStats(uid: string): Promise<UserStats | null> {
  try {
    const ref = doc(db, 'users', uid, 'data', 'stats');
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const data = snap.data();
    return {
      practiceLog: (data.practiceLog as PracticeLog) ?? {},
      exerciseStats: (data.exerciseStats as ExerciseStats) ?? {},
    };
  } catch {
    return null;
  }
}

export async function saveUserStats(uid: string, stats: UserStats): Promise<void> {
  try {
    const ref = doc(db, 'users', uid, 'data', 'stats');
    await setDoc(ref, { ...stats, lastSeen: serverTimestamp() }, { merge: true });
  } catch {
    // fail silently — localStorage remains source of truth
  }
}

// Merge local + remote: union of all dates, max bestStreak per exercise
export function mergeStats(local: UserStats, remote: UserStats): UserStats {
  // Merge practice log: union of all dates/exercises, sum correct and total
  const merged: PracticeLog = { ...remote.practiceLog };
  for (const [date, exercises] of Object.entries(local.practiceLog)) {
    if (!merged[date]) {
      merged[date] = exercises;
    } else {
      for (const [exId, score] of Object.entries(exercises)) {
        const rem = merged[date][exId];
        if (!rem) {
          merged[date][exId] = score;
        } else {
          // Local and remote may overlap (same session recorded twice) — take max
          merged[date][exId] = {
            correct: Math.max(rem.correct, score.correct),
            total: Math.max(rem.total, score.total),
          };
        }
      }
    }
  }

  // Merge exercise stats: take max bestStreak
  const mergedExerciseStats: ExerciseStats = { ...remote.exerciseStats };
  for (const [exId, stat] of Object.entries(local.exerciseStats)) {
    const remStat = mergedExerciseStats[exId];
    mergedExerciseStats[exId] = {
      bestStreak: Math.max(stat.bestStreak, remStat?.bestStreak ?? 0),
    };
  }

  return { practiceLog: merged, exerciseStats: mergedExerciseStats };
}

// ─── Debounced sync helper ────────────────────────────────────────────────────

let syncTimer: ReturnType<typeof setTimeout> | null = null;

export function scheduleSyncStats(uid: string, stats: UserStats, delayMs = 2000) {
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => saveUserStats(uid, stats), delayMs);
}

// ─── Song Library ─────────────────────────────────────────────────────────────

function songsRef(uid: string) {
  return collection(db, 'users', uid, 'songs');
}

export async function loadSongs(uid: string): Promise<Song[]> {
  try {
    const snap = await getDocs(songsRef(uid));
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Song, 'id'>) }));
  } catch {
    return [];
  }
}

export async function addSong(uid: string, song: Omit<Song, 'id'>): Promise<Song> {
  const ref = await addDoc(songsRef(uid), { ...song, createdAt: Date.now(), updatedAt: Date.now() });
  return { id: ref.id, ...song };
}

export async function updateSong(uid: string, songId: string, updates: Partial<Song>): Promise<void> {
  try {
    await updateDoc(doc(db, 'users', uid, 'songs', songId), { ...updates, updatedAt: Date.now() });
  } catch {
    // fail silently
  }
}

export async function deleteSong(uid: string, songId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'users', uid, 'songs', songId));
  } catch {
    // fail silently
  }
}
