import React, { createContext, useContext, useState } from 'react';
import { storageGet, storageSet } from '@shared/utils/storage';

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
  const [autoRepeat, setAutoRepeatState] = useState<boolean>(() =>
    storageGet<boolean>('ear_autoRepeat', false)
  );
  const [repeatDelay, setRepeatDelayState] = useState<RepeatDelay>(() =>
    storageGet<RepeatDelay>('ear_repeatDelay', 5000)
  );

  function setAutoRepeat(v: boolean) {
    setAutoRepeatState(v);
    storageSet('ear_autoRepeat', v);
  }

  function setRepeatDelay(v: RepeatDelay) {
    setRepeatDelayState(v);
    storageSet('ear_repeatDelay', v);
  }

  return (
    <EarTrainingSettingsContext.Provider value={{ autoRepeat, setAutoRepeat, repeatDelay, setRepeatDelay }}>
      {children}
    </EarTrainingSettingsContext.Provider>
  );
}

export function useEarTrainingSettings() {
  return useContext(EarTrainingSettingsContext);
}
