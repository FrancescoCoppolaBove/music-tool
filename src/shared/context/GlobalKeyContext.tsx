import React, { createContext, useContext, useState, useCallback } from 'react';
import { transposeNote } from '../utils/musicTheory';

export const CHROMATIC_KEYS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

/** Instrument transposition presets — semitones to add to concert pitch for written display */
export const INSTRUMENT_PRESETS = [
  { label: 'Concert', offset: 0  },
  { label: 'B♭',     offset: 2  },
  { label: 'E♭',     offset: 9  },
  { label: 'F',      offset: 7  },
] as const;

interface GlobalKeyContextValue {
  /** Concert pitch key selected by the user */
  globalKey: string;
  setGlobalKey: (key: string) => void;
  /** Semitones to add to convert concert → written pitch (0 = concert) */
  transposeOffset: number;
  /** Human-readable instrument label (e.g. "B♭") */
  instrumentLabel: string;
  setInstrument: (label: string) => void;
  /** Translate a concert-pitch note name to the player's written pitch */
  writeNote: (note: string) => string;
}

const GlobalKeyContext = createContext<GlobalKeyContextValue>({
  globalKey: 'C',
  setGlobalKey: () => {},
  transposeOffset: 0,
  instrumentLabel: 'Concert',
  setInstrument: () => {},
  writeNote: (n) => n,
});

export function GlobalKeyProvider({ children }: { children: React.ReactNode }) {
  const [globalKey, setGlobalKeyState] = useState<string>(
    () => localStorage.getItem('tonic_global_key') ?? 'C'
  );
  const [transposeOffset, setTransposeOffsetState] = useState<number>(
    () => parseInt(localStorage.getItem('tonic_transpose_offset') ?? '0', 10)
  );
  const [instrumentLabel, setInstrumentLabelState] = useState<string>(
    () => localStorage.getItem('tonic_instrument_key') ?? 'Concert'
  );

  function setGlobalKey(key: string) {
    setGlobalKeyState(key);
    localStorage.setItem('tonic_global_key', key);
  }

  function setInstrument(label: string) {
    const preset = INSTRUMENT_PRESETS.find(p => p.label === label) ?? INSTRUMENT_PRESETS[0];
    setInstrumentLabelState(preset.label);
    setTransposeOffsetState(preset.offset);
    localStorage.setItem('tonic_instrument_key', preset.label);
    localStorage.setItem('tonic_transpose_offset', String(preset.offset));
  }

  const writeNote = useCallback(
    (note: string) => transposeOffset === 0 ? note : transposeNote(note, transposeOffset),
    [transposeOffset]
  );

  return (
    <GlobalKeyContext.Provider value={{
      globalKey,
      setGlobalKey,
      transposeOffset,
      instrumentLabel,
      setInstrument,
      writeNote,
    }}>
      {children}
    </GlobalKeyContext.Provider>
  );
}

export function useGlobalKey() {
  return useContext(GlobalKeyContext);
}
