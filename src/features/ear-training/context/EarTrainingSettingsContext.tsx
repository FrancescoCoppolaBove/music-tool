import React, { createContext, useContext, useState } from 'react';

export type RepeatDelay = 3000 | 5000 | 8000;

interface EarTrainingSettings {
  autoRepeat: boolean;
  setAutoRepeat: (v: boolean) => void;
  repeatDelay: RepeatDelay;
  setRepeatDelay: (v: RepeatDelay) => void;
}

const EarTrainingSettingsContext = createContext<EarTrainingSettings>({
  autoRepeat: false,
  setAutoRepeat: () => {},
  repeatDelay: 5000,
  setRepeatDelay: () => {},
});

export function EarTrainingSettingsProvider({ children }: { children: React.ReactNode }) {
  const [autoRepeat, setAutoRepeat] = useState(false);
  const [repeatDelay, setRepeatDelay] = useState<RepeatDelay>(5000);

  return (
    <EarTrainingSettingsContext.Provider value={{ autoRepeat, setAutoRepeat, repeatDelay, setRepeatDelay }}>
      {children}
    </EarTrainingSettingsContext.Provider>
  );
}

export function useEarTrainingSettings() {
  return useContext(EarTrainingSettingsContext);
}
