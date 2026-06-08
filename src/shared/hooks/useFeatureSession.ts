import { useEffect, useRef, useCallback } from 'react';
import { storageGet, storageSet } from '../utils/storage';

/**
 * Persist and restore a feature's UI session state in localStorage.
 *
 * Usage:
 *   const { save, load } = useFeatureSession<MyState>('chordProgression');
 *   // on mount: const saved = load();
 *   // on state change: save(state);
 *
 * The state is saved under the key `tonic_session_<featureId>`.
 * A null return from `load()` means no saved session exists.
 */
export function useFeatureSession<T>(featureId: string) {
  const key = `session_${featureId}`;

  const load = useCallback((): T | null => {
    return storageGet<T | null>(key, null);
  }, [key]);

  const save = useCallback((state: T) => {
    storageSet(key, state);
  }, [key]);

  const clear = useCallback(() => {
    try { localStorage.removeItem(`tonic_${key}`); } catch { /* ignore */ }
  }, [key]);

  return { load, save, clear };
}

