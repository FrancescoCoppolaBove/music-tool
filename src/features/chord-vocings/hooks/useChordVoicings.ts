import { useState, useCallback } from 'react';
import { parseChord } from '../services/chordParser';
import { generateVoicings } from '../services/voicingGenerator';
import type { ParsedChord, Voicing, VoicingStyle } from '../types/chord.types';

const ALL_STYLES: VoicingStyle[] = ['closed', 'drop2', 'drop3', 'shell', 'rootless', 'open', 'quartal', 'spread', 'upperStructure'];

interface UseChordVoicingsReturn {
  inputValue: string;
  setInputValue: (v: string) => void;
  parsedChord: ParsedChord | null;
  voicings: Voicing[];
  activeStyles: VoicingStyle[];
  setActiveStyles: (s: VoicingStyle[]) => void;
  error: string;
  submit: () => void;
}

export function useChordVoicings(): UseChordVoicingsReturn {
  const [inputValue, setInputValue] = useState('Cmaj7');
  const [parsedChord, setParsedChord] = useState<ParsedChord | null>(null);
  const [voicings, setVoicings] = useState<Voicing[]>([]);
  const [activeStyles, setActiveStyles] = useState<VoicingStyle[]>([...ALL_STYLES]);
  const [error, setError] = useState('');

  const submit = useCallback(() => {
    const chord = parseChord(inputValue);
    if (!chord) {
      setError('Could not parse chord. Try: Cmaj7, Dm7, G7b9, F#m7b5...');
      return;
    }
    setError('');
    setParsedChord(chord);
    setVoicings(generateVoicings(chord));
  }, [inputValue]);

  return { inputValue, setInputValue, parsedChord, voicings, activeStyles, setActiveStyles, error, submit };
}
