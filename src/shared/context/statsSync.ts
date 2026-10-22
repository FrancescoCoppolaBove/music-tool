// Firestore side of StatsContext — loaded on demand after sign-in.
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firestore';
import type { ExerciseStats, PracticeLog, UserStats } from './StatsContext';

export function subscribeStats(uid: string, onData: (s: UserStats | null) => void, onError: () => void): () => void {
  if (!db) { onData(null); return () => {}; }
  return onSnapshot(
    doc(db, 'users', uid, 'data', 'stats'),
    snap => {
      if (!snap.exists()) return onData(null);
      const data = snap.data();
      onData({
        practiceLog: (data.practiceLog ?? {}) as PracticeLog,
        exerciseStats: (data.exerciseStats ?? {}) as ExerciseStats,
      });
    },
    onError,
  );
}

export function saveStats(uid: string, stats: UserStats): Promise<void> {
  if (!db) return Promise.resolve();
  return setDoc(doc(db, 'users', uid, 'data', 'stats'), { ...stats, lastSeen: serverTimestamp() });
}
