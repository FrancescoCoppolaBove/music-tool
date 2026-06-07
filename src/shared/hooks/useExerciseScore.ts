import { useState, useEffect, useRef } from 'react';
import { useStats, type PracticeLog } from '../context/StatsContext';

export type { PracticeLog };

function todayKey(): string {
  return new Date().toISOString().split('T')[0];
}

export function computeStreak(log: PracticeLog): number {
  const hasActivity = (date: string) => {
    const day = log[date];
    if (!day) return false;
    return Object.values(day).some(s => s.total > 0);
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

interface Score { correct: number; total: number }

export function useExerciseScore(exerciseId: string) {
  const { stats, updateStats } = useStats();

  const [score, setScore] = useState<Score>({ correct: 0, total: 0 });
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreakState] = useState(
    () => stats.exerciseStats[exerciseId]?.bestStreak ?? 0,
  );

  // Keep bestStreak in sync when Firestore data arrives/updates
  useEffect(() => {
    const remote = stats.exerciseStats[exerciseId]?.bestStreak ?? 0;
    if (remote > bestStreak) setBestStreakState(remote);
  }, [stats.exerciseStats, exerciseId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Stable ref so effects don't need updateStats in their deps
  const updateStatsRef = useRef(updateStats);
  useEffect(() => { updateStatsRef.current = updateStats; }, [updateStats]);

  const prevScoreRef = useRef<Score>({ correct: 0, total: 0 });

  // Record daily activity when score increments
  useEffect(() => {
    const prev = prevScoreRef.current;
    if (score.total > prev.total) {
      const totalDiff = score.total - prev.total;
      const correctDiff = Math.max(0, score.correct - prev.correct);
      const today = todayKey();

      updateStatsRef.current(current => {
        const dayLog = current.practiceLog[today] ?? {};
        const existing = dayLog[exerciseId] ?? { correct: 0, total: 0 };
        return {
          ...current,
          practiceLog: {
            ...current.practiceLog,
            [today]: {
              ...dayLog,
              [exerciseId]: {
                correct: existing.correct + correctDiff,
                total: existing.total + totalDiff,
              },
            },
          },
        };
      });
    }
    prevScoreRef.current = score;
  }, [score, exerciseId]);

  function setBestStreak(newBest: number) {
    setBestStreakState(newBest);
    updateStatsRef.current(current => {
      const stored = current.exerciseStats[exerciseId]?.bestStreak ?? 0;
      if (newBest <= stored) return current;
      return {
        ...current,
        exerciseStats: {
          ...current.exerciseStats,
          [exerciseId]: { bestStreak: newBest },
        },
      };
    });
  }

  return { score, setScore, streak, setStreak, bestStreak, setBestStreak };
}
