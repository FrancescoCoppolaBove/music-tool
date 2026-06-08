import { useState, useCallback, useEffect, useRef } from 'react';
import { useGlobalKey } from '@shared/context/GlobalKeyContext';
import { generateProgressions, getAvailableTechniques, type ProgressionFilter } from '../services/progressionGenerator';
import type { GeneratedProgression, HarmonyStyle, KeyMode, Technique } from '../types/progression.types';
import { storageGet, storageSet } from '@shared/utils/storage';

interface SessionState { key: string; mode: KeyMode; length: number; style: HarmonyStyle | 'both'; techniques: Technique[] }
const SESSION_KEY = 'session_chordProgression';

export function useChordProgression() {
  const { globalKey, writeNote } = useGlobalKey();

  // Restore last session on first mount; fall back to globalKey/defaults.
  const saved = useRef(storageGet<SessionState | null>(SESSION_KEY, null));

  const [key, setKey] = useState(() => saved.current?.key ?? writeNote(globalKey));
  useEffect(() => { setKey(writeNote(globalKey)); }, [globalKey, writeNote]);

  const [mode, setMode] = useState<KeyMode>(saved.current?.mode ?? 'major');
  const [length, setLength] = useState(saved.current?.length ?? 4);
  const [style, setStyle] = useState<HarmonyStyle | 'both'>(saved.current?.style ?? 'both');
  const [techniques, setTechniques] = useState<Technique[]>(saved.current?.techniques ?? []);
  const [results, setResults] = useState<GeneratedProgression[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const generate = useCallback(() => {
    const filter: ProgressionFilter = { key, mode, length, style, techniques };
    const r = generateProgressions(filter);
    setResults(r);
    setSelectedId(r[0]?.id ?? null);
  }, [key, mode, length, style, techniques]);

  // Auto-generate on mount
  useEffect(() => { generate(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist settings whenever they change (not results, which are deterministic)
  useEffect(() => {
    storageSet<SessionState>(SESSION_KEY, { key, mode, length, style, techniques });
  }, [key, mode, length, style, techniques]);

  function toggleTechnique(t: Technique) {
    setTechniques(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    );
  }

  const selected = results.find(r => r.id === selectedId) ?? results[0] ?? null;
  const availableTechniques = getAvailableTechniques();

  return {
    key, setKey,
    mode, setMode,
    length, setLength,
    style, setStyle,
    techniques, toggleTechnique,
    results, selectedId, setSelectedId, selected,
    generate,
    availableTechniques,
  };
}
