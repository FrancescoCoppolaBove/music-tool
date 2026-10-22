import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { firebaseEnabled } from '../../firebase';
import { useAuth } from './AuthContext';

// Firestore is loaded on demand (see src/firestore.ts).
const loadSync = () => import('./statsSync');

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
    if (!user || !firebaseEnabled) {
      setStats(EMPTY);
      setStatsLoading(false);
      return;
    }

    setStatsLoading(true);

    // Fallback: if snapshot takes more than 8s (e.g. ad blocker), unblock the UI
    const timeout = setTimeout(() => setStatsLoading(false), 8000);
    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    loadSync().then(({ subscribeStats }) => {
      if (cancelled) return;
      unsubscribe = subscribeStats(
        user.uid,
        data => {
          clearTimeout(timeout);
          setStats(data ?? EMPTY);
          setStatsLoading(false);
        },
        () => { clearTimeout(timeout); setStatsLoading(false); },
      );
    }).catch(() => { clearTimeout(timeout); setStatsLoading(false); });

    return () => {
      cancelled = true;
      clearTimeout(timeout);
      unsubscribe?.();
    };
  }, [user]);

  const updateStats = useCallback((updater: (current: UserStats) => UserStats) => {
    if (!user || !firebaseEnabled) return;
    setStats(prev => {
      const next = updater(prev);
      loadSync().then(({ saveStats }) => saveStats(user.uid, next)).catch(() => {});
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
