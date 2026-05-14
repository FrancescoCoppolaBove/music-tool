import { useState, useCallback } from 'react';
import { parseNoteInput, recognizeScales } from '../services/scaleRecognizer';
import type { ScaleMatch } from '../types/scale.types';

interface UseScaleRecognitionReturn {
  noteInput: string;
  setNoteInput: (v: string) => void;
  rootNote: string;
  setRootNote: (v: string) => void;
  results: ScaleMatch[];
  parsedNotes: string[];
  error: string;
  analyze: () => void;
  clear: () => void;
}

export function useScaleRecognition(): UseScaleRecognitionReturn {
  const [noteInput, setNoteInput] = useState('');
  const [rootNote, setRootNote] = useState('');
  const [results, setResults] = useState<ScaleMatch[]>([]);
  const [parsedNotes, setParsedNotes] = useState<string[]>([]);
  const [error, setError] = useState('');

  const analyze = useCallback(() => {
    const notes = parseNoteInput(noteInput);
    if (notes.length < 2) {
      setError('Please enter at least 2 note names (e.g. C D E G A)');
      return;
    }
    setError('');
    setParsedNotes(notes);
    const matches = recognizeScales(notes, rootNote || undefined, 100);
    setResults(matches);
  }, [noteInput, rootNote]);

  const clear = useCallback(() => {
    setNoteInput('');
    setRootNote('');
    setResults([]);
    setParsedNotes([]);
    setError('');
  }, []);

  return { noteInput, setNoteInput, rootNote, setRootNote, results, parsedNotes, error, analyze, clear };
}
