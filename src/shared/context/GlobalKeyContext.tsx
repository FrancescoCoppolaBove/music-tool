import React, { createContext, useContext, useState } from 'react';

export const CHROMATIC_KEYS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

// Migrate any stale C# value saved before the Db rename
const LEGACY_KEY_MAP: Record<string, string> = { 'C#': 'Db' };

interface GlobalKeyContextValue {
  globalKey: string;
  setGlobalKey: (key: string) => void;
}

const GlobalKeyContext = createContext<GlobalKeyContextValue>({
  globalKey: 'C',
  setGlobalKey: () => {},
});

export function GlobalKeyProvider({ children }: { children: React.ReactNode }) {
  const [globalKey, setGlobalKeyState] = useState<string>(() => {
    const saved = localStorage.getItem('tonic_global_key') ?? 'C';
    return LEGACY_KEY_MAP[saved] ?? saved;
  });

  function setGlobalKey(key: string) {
    setGlobalKeyState(key);
    localStorage.setItem('tonic_global_key', key);
  }

  return (
    <GlobalKeyContext.Provider value={{ globalKey, setGlobalKey }}>
      {children}
    </GlobalKeyContext.Provider>
  );
}

export function useGlobalKey() {
  return useContext(GlobalKeyContext);
}
