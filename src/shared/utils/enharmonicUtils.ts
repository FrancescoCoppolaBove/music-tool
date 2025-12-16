/**
 * ENHARMONIC CORRECTION UTILITIES
 * Corregge la nomenclatura delle note per rispettare le regole musicali
 */

/**
 * Ottieni la lettera base di una nota (C, D, E, F, G, A, B)
 */
function getNoteLetter(note: string): string {
  const cleaned = note.replace(/[#b♯♭]/g, '').split('/')[0];
  return cleaned.charAt(0);
}

/**
 * Ottieni la prossima lettera nella sequenza musicale
 */
function getNextLetter(letter: string): string {
  const sequence = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const index = sequence.indexOf(letter);
  return sequence[(index + 1) % 7];
}

/**
 * Converti sharp in flat enharmonic equivalente
 */
function sharpToFlat(note: string): string {
  const sharpToFlatMap: Record<string, string> = {
    'C#': 'Db',
    'D#': 'Eb',
    'F#': 'Gb',
    'G#': 'Ab',
    'A#': 'Bb',
  };
  return sharpToFlatMap[note] || note;
}

/**
 * Converti flat in sharp enharmonic equivalente
 */
function flatToSharp(note: string): string {
  const flatToSharpMap: Record<string, string> = {
    Db: 'C#',
    Eb: 'D#',
    Gb: 'F#',
    Ab: 'G#',
    Bb: 'A#',
  };
  return flatToSharpMap[note] || note;
}

/**
 * Corregge la nomenclatura enarmonica di una scala
 * Regola: Ogni lettera (C, D, E, F, G, A, B) deve apparire una sola volta
 *
 * @param scaleNotes - Array di note (può contenere C#/Db format)
 * @param rootNote - Nota di partenza della scala
 * @returns Array di note con nomenclatura corretta
 */
export function correctEnharmonicSpelling(scaleNotes: string[], rootNote: string): string[] {
  // Rimuovi il formato slash e prendi solo la prima parte
  const cleanNotes = scaleNotes.map((note) => note.split('/')[0]);

  // Traccia quali lettere abbiamo già usato
  const usedLetters = new Set<string>();
  const correctedNotes: string[] = [];

  // Inizia dalla root
  let expectedLetter = getNoteLetter(rootNote);

  for (const note of cleanNotes) {
    const noteLetter = getNoteLetter(note);
    const isSharp = note.includes('#');
    const isFlat = note.includes('b');

    // Se la nota è naturale, usala così com'è
    if (!isSharp && !isFlat) {
      correctedNotes.push(note);
      usedLetters.add(noteLetter);
      expectedLetter = getNextLetter(noteLetter);
      continue;
    }

    // Se è alterata, verifica se la lettera è già stata usata
    if (usedLetters.has(noteLetter)) {
      // Lettera duplicata! Usa l'enharmonic equivalente
      const alternative = isSharp ? sharpToFlat(note) : flatToSharp(note);
      const alternativeLetter = getNoteLetter(alternative);

      if (!usedLetters.has(alternativeLetter)) {
        correctedNotes.push(alternative);
        usedLetters.add(alternativeLetter);
        expectedLetter = getNextLetter(alternativeLetter);
      } else {
        // Caso raro: entrambe le lettere sono usate (scala cromatica parziale)
        correctedNotes.push(note);
        usedLetters.add(noteLetter);
        expectedLetter = getNextLetter(noteLetter);
      }
    } else {
      // Lettera non ancora usata, verifica se dovremmo usare l'enharmonic
      // per rispettare la sequenza attesa
      if (noteLetter !== expectedLetter) {
        // La lettera non corrisponde alla sequenza attesa
        const alternative = isSharp ? sharpToFlat(note) : flatToSharp(note);
        const alternativeLetter = getNoteLetter(alternative);

        if (alternativeLetter === expectedLetter && !usedLetters.has(alternativeLetter)) {
          // L'enharmonic corrisponde alla sequenza attesa
          correctedNotes.push(alternative);
          usedLetters.add(alternativeLetter);
          expectedLetter = getNextLetter(alternativeLetter);
        } else {
          // Usa la nota originale
          correctedNotes.push(note);
          usedLetters.add(noteLetter);
          expectedLetter = getNextLetter(noteLetter);
        }
      } else {
        // La lettera corrisponde alla sequenza attesa
        correctedNotes.push(note);
        usedLetters.add(noteLetter);
        expectedLetter = getNextLetter(noteLetter);
      }
    }
  }

  return correctedNotes;
}

/**
 * Estende la scala per includere la root un'ottava sopra
 * Controlla se la root è già presente alla fine prima di aggiungerla
 *
 * @param scaleNotes - Note della scala
 * @param rootNote - Root note
 * @returns Array con scala + root ottava (se non già presente)
 */
export function extendScaleWithOctave(scaleNotes: string[], rootNote: string): string[] {
  if (scaleNotes.length === 0) return [rootNote];

  // Normalizza root per confronto
  const normalizedRoot = rootNote.split('/')[0];
  const lastNote = scaleNotes[scaleNotes.length - 1].split('/')[0];

  // Se l'ultima nota è già la root, non aggiungere
  if (lastNote === normalizedRoot) {
    return scaleNotes;
  }

  // Altrimenti, aggiungi la root alla fine
  return [...scaleNotes, rootNote];
}
