import { useState } from 'react';

/** Clipboard copy with a manual fallback (select-and-copy textarea) when the API is unavailable. */
export function useCopy() {
  const [status, setStatus] = useState('');
  const [manual, setManual] = useState('');

  async function copy(text: string) {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      setManual('');
      setStatus('Copiato negli appunti.');
    } catch {
      setManual(text);
      setStatus('Seleziona il testo qui sotto e copialo manualmente.');
    }
  }

  return { copy, status, manual };
}
