import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from './AuthContext';

export interface Score { correct: number; total: number }
export interface PracticeLog { [date: string]: { [exerciseId: string]: Score } }
export interface ExerciseStats { [exerciseId: string]: { bestStreak: number } }
export interface UserStats { practiceLog: PracticeLog; exerciseStats: ExerciseStats }

interface StatsContextValue {
  stats: UserStats;
  statsLoading: boolean;
  updateStats: (updater: (current: UserStats) => UserStats) => void;
}

const EMPTY: UserStats = { practiceLog: {}, exerciseStats: {} };

const StatsContext = createContext<StatsContextValue>({
  stats: EMPTY,
  statsLoading: true,
  updateStats: () => {},
});

export function StatsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats>(EMPTY);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!user || !db) {
      setStats(EMPTY);
      setStatsLoading(false);
      return;
    }

    const ref = doc(db, 'users', user.uid, 'data', 'stats');
    setStatsLoading(true);

    // Fallback: if snapshot takes more than 8s (e.g. ad blocker), unblock the UI
    const timeout = setTimeout(() => setStatsLoading(false), 8000);

    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        clearTimeout(timeout);
        if (snap.exists()) {
          const data = snap.data();
          setStats({
            practiceLog: (data.practiceLog ?? {}) as PracticeLog,
            exerciseStats: (data.exerciseStats ?? {}) as ExerciseStats,
          });
        } else {
          setStats(EMPTY);
        }
        setStatsLoading(false);
      },
      () => { clearTimeout(timeout); setStatsLoading(false); },
    );

    return unsubscribe;
  }, [user]);

  const updateStats = useCallback((updater: (current: UserStats) => UserStats) => {
    if (!user || !db) return;
    const ref = doc(db, 'users', user.uid, 'data', 'stats');
    setStats(prev => {
      const next = updater(prev);
      setDoc(ref, { ...next, lastSeen: serverTimestamp() }).catch(() => {});
      return next;
    });
  }, [user]);

  return (
    <StatsContext.Provider value={{ stats, statsLoading, updateStats }}>
      {children}
    </StatsContext.Provider>
  );
}

export function useStats() {
  return useContext(StatsContext);
}
