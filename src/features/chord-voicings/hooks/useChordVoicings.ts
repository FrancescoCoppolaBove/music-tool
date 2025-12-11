import { useState, useCallback } from 'react';
import { parseChordSymbol } from '../services/chordParser';
import { generateVoicings } from '../services/voicingGenerator';
import type { ParsedChord } from '../types/chord.types';
import type { ChordVoicing, VoicingStyle } from '../types/chord.types';

interface UseChordVoicingsResult {
  chordSymbol: string;
  setChordSymbol: (symbol: string) => void;
  selectedStyle: VoicingStyle;
  setSelectedStyle: (style: VoicingStyle) => void;
  voicings: ChordVoicing[];
  parsedChord: ParsedChord | null;
  error: string | null;
  isLoading: boolean;
  generateVoicingsForChord: () => void;
}

export function useChordVoicings(): UseChordVoicingsResult {
  const [chordSymbol, setChordSymbol] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<VoicingStyle>('basic');
  const [voicings, setVoicings] = useState<ChordVoicing[]>([]);
  const [parsedChord, setParsedChord] = useState<ParsedChord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateVoicingsForChord = useCallback(() => {
    if (!chordSymbol.trim()) {
      setError('Please enter a chord symbol');
      setVoicings([]);
      setParsedChord(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Parse chord
      const parsed = parseChordSymbol(chordSymbol);
      
      if (!parsed) {
        setError(
          `Sorry, I couldn't understand "${chordSymbol}". Try something like Cmaj7, F#m7b5, or Bb13#11/G.`
        );
        setVoicings([]);
        setParsedChord(null);
        setIsLoading(false);
        return;
      }

      setParsedChord(parsed);

      // Generate voicings
      const generatedVoicings = generateVoicings(parsed, {
        style: selectedStyle,
      });

      setVoicings(generatedVoicings);
      setError(null);
    } catch (err) {
      console.error('Error generating voicings:', err);
      setError('An error occurred while generating voicings. Please try again.');
      setVoicings([]);
      setParsedChord(null);
    } finally {
      setIsLoading(false);
    }
  }, [chordSymbol, selectedStyle]);

  return {
    chordSymbol,
    setChordSymbol,
    selectedStyle,
    setSelectedStyle,
    voicings,
    parsedChord,
    error,
    isLoading,
    generateVoicingsForChord,
  };
}