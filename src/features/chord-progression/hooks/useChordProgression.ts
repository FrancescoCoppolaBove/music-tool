import { useState, useCallback, useEffect } from 'react';
import { generateProgressions, getAvailableTechniques, type ProgressionFilter } from '../services/progressionGenerator';
import type { GeneratedProgression, HarmonyStyle, Technique } from '../types/progression.types';

export function useChordProgression() {
  const [key, setKey] = useState('C');
  const [length, setLength] = useState(4);
  const [style, setStyle] = useState<HarmonyStyle | 'both'>('both');
  const [techniques, setTechniques] = useState<Technique[]>([]);
  const [results, setResults] = useState<GeneratedProgression[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const generate = useCallback(() => {
    const filter: ProgressionFilter = { key, length, style, techniques };
    const r = generateProgressions(filter);
    setResults(r);
    setSelectedId(r[0]?.id ?? null);
  }, [key, length, style, techniques]);

  // Auto-generate on mount
  useEffect(() => { generate(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function toggleTechnique(t: Technique) {
    setTechniques(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    );
  }

  const selected = results.find(r => r.id === selectedId) ?? results[0] ?? null;
  const availableTechniques = getAvailableTechniques();

  return {
    key, setKey,
    length, setLength,
    style, setStyle,
    techniques, toggleTechnique,
    results, selectedId, setSelectedId, selected,
    generate,
    availableTechniques,
  };
}
