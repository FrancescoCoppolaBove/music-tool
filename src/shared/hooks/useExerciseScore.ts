import { useState, useEffect, useRef } from 'react';
import { storageGet, storageSet } from '../utils/storage';
import { scheduleSyncStats } from '../utils/firestoreSync';
import { auth } from '../../firebase';

interface Score { correct: number; total: number }
interface StoredStats { bestStreak: number }
export interface PracticeLog { [date: string]: { [exerciseId: string]: Score } }

function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

export function computeStreak(log: PracticeLog): number {
  const hasActivity = (date: string) => {
    const day = log[date];
    if (!day) return false;
    return Object.values(day).some((s: Score) => s.total > 0);
  };

  const today = todayKey();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const start = hasActivity(today) ? today : hasActivity(yesterday) ? yesterday : null;
  if (!start) return 0;

  let streak = 0;
  let cursor = start;
  while (hasActivity(cursor)) {
    streak++;
    const d = new Date(cursor + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    cursor = d.toISOString().split('T')[0];
    if (streak > 3650) break;
  }
  return streak;
}

export function getPracticeLog(): PracticeLog {
  return storageGet<PracticeLog>('practice_log', {});
}

export function getPracticeStreak(): number {
  return computeStreak(getPracticeLog());
}

function getAllExerciseStats(): Record<string, { bestStreak: number }> {
  const ids = ['perfect-pitch', 'intervals', 'chords', 'scales', 'progressions', 'degrees', 'melodic', 'intervals-context', 'rhythm', 'bpm'];
  const result: Record<string, { bestStreak: number }> = {};
  for (const id of ids) {
    result[id] = storageGet<{ bestStreak: number }>(`exercise_${id}`, { bestStreak: 0 });
  }
  return result;
}

export function useExerciseScore(exerciseId: string) {
  const statsKey = `exercise_${exerciseId}`;
  const initial = storageGet<StoredStats>(statsKey, { bestStreak: 0 });

  const [score, setScore] = useState<Score>({ correct: 0, total: 0 });
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState<number>(initial.bestStreak);

  const prevScoreRef = useRef<Score>({ correct: 0, total: 0 });

  // Persist bestStreak locally + trigger Firestore sync
  useEffect(() => {
    const saved = storageGet<StoredStats>(statsKey, { bestStreak: 0 });
    if (bestStreak > saved.bestStreak) {
      storageSet<StoredStats>(statsKey, { bestStreak });
      triggerSync();
    }
  }, [bestStreak, statsKey]);

  // Record daily practice activity when score increments + trigger Firestore sync
  useEffect(() => {
    const prev = prevScoreRef.current;
    if (score.total > prev.total) {
      const totalDiff = score.total - prev.total;
      const correctDiff = Math.max(0, score.correct - prev.correct);

      const log = storageGet<PracticeLog>('practice_log', {});
      const today = todayKey();
      if (!log[today]) log[today] = {};
      if (!log[today][exerciseId]) log[today][exerciseId] = { correct: 0, total: 0 };
      log[today][exerciseId].total += totalDiff;
      log[today][exerciseId].correct += correctDiff;
      storageSet('practice_log', log);

      triggerSync();
    }
    prevScoreRef.current = score;
  }, [score, exerciseId]);

  return { score, setScore, streak, setStreak, bestStreak, setBestStreak };
}

function triggerSync() {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  const practiceLog = getPracticeLog();
  const exerciseStats = getAllExerciseStats();
  scheduleSyncStats(uid, { practiceLog, exerciseStats });
}
