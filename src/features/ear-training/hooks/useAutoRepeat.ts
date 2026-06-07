import { useEffect, useRef } from 'react';
import { useEarTrainingSettings } from '../context/EarTrainingSettingsContext';

/**
 * Auto-repeat hook for ear training exercises.
 * Calls `play` every `repeatDelay` ms when autoRepeat is enabled and not yet answered.
 *
 * @param play      The function that plays the audio for this exercise
 * @param answered  Whether the user has answered correctly (stops repeating)
 * @param isPlaying Whether audio is currently playing (prevents overlapping)
 */
export function useAutoRepeat(
  play: () => void,
  answered: boolean,
  isPlaying: boolean,
) {
  const { autoRepeat, repeatDelay } = useEarTrainingSettings();
  const playRef = useRef(play);
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => { playRef.current = play; }, [play]);
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);

  useEffect(() => {
    if (!autoRepeat || answered) return;
    const timer = setInterval(() => {
      if (!isPlayingRef.current) playRef.current();
    }, repeatDelay);
    return () => clearInterval(timer);
  }, [autoRepeat, repeatDelay, answered]);
}
