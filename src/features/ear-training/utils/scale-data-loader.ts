/**
 * SCALE DATA LOADER - FIXED
 * Carica le scale da scale_data.json per ear training
 */

import scaleDataJson from '../../scale-recognition/data/scale_data.json';

export interface ScaleData {
  scale_name: string;
  root: string;
  notes: string;
  interval_pattern: string;
}

// Mappatura nomi scale per ear training
const SCALE_NAME_MAPPING: Record<string, string> = {
  // Simple scales
  'Major (Ionian)': 'Major',
  'Ionian (Major)': 'Major',
  'Natural Minor (Aeolian)': 'Natural Minor',
  'Aeolian (Natural Minor)': 'Natural Minor',
  'Harmonic Minor': 'Harmonic Minor',
  
  // Modes
  'Dorian': 'Dorian',
  'Phrygian': 'Phrygian',
  'Lydian': 'Lydian',
  'Mixolydian': 'Mixolydian',
  'Aeolian': 'Aeolian',
  'Locrian': 'Locrian',
  
  // Other scales
  'Melodic Minor (Ascending)': 'Melodic Minor',
  'Melodic Minor': 'Melodic Minor',
  'Major Pentatonic': 'Major Pentatonic',
  'Minor Pentatonic': 'Minor Pentatonic',
  'Major Blues': 'Blues',
  'Minor Blues': 'Blues',
  'Whole Tone': 'Whole Tone',
  'Chromatic': 'Chromatic',
};

// Categorie per difficulty
const SCALE_CATEGORIES: Record<string, 'simple' | 'modes' | 'other'> = {
  'Major': 'simple',
  'Natural Minor': 'simple',
  'Harmonic Minor': 'simple',
  
  'Dorian': 'modes',
  'Phrygian': 'modes',
  'Lydian': 'modes',
  'Mixolydian': 'modes',
  'Aeolian': 'modes',
  'Locrian': 'modes',
  
  'Melodic Minor': 'other',
  'Major Pentatonic': 'other',
  'Minor Pentatonic': 'other',
  'Blues': 'other',
  'Whole Tone': 'other',
  'Chromatic': 'other',
};

/**
 * Normalizza il nome della scala
 */
function normalizeScaleName(scaleName: string): string {
  return SCALE_NAME_MAPPING[scaleName] || scaleName;
}

/**
 * Converte nota da formato JSON (es: "C#/Db") a formato audio (es: "C#2")
 */
function convertNoteToAudioFormat(note: string, octave: number = 2): string {
  // Rimuovi alternative enharmonic (prendi prima opzione)
  const cleanNote = note.split('/')[0].trim();
  return `${cleanNote}${octave}`;
}

/**
 * Ottiene tutte le scale disponibili per ear training
 */
export function getAvailableScales(): Array<{
  name: string;
  category: 'simple' | 'modes' | 'other';
  roots: string[];
}> {
  const scalesMap = new Map<string, Set<string>>();
  
  // Processa tutte le scale
  (scaleDataJson as ScaleData[]).forEach(scale => {
    const normalizedName = normalizeScaleName(scale.scale_name);
    
    // Solo scale che abbiamo mappato
    if (SCALE_CATEGORIES[normalizedName]) {
      if (!scalesMap.has(normalizedName)) {
        scalesMap.set(normalizedName, new Set());
      }
      scalesMap.get(normalizedName)!.add(scale.root);
    }
  });
  
  // Converti in array
  return Array.from(scalesMap.entries()).map(([name, roots]) => ({
    name,
    category: SCALE_CATEGORIES[name],
    roots: Array.from(roots),
  }));
}

/**
 * Ottiene una scala specifica dal database
 */
export function getScale(scaleName: string, root: string): ScaleData | null {
  const scales = scaleDataJson as ScaleData[];
  
  // Cerca per nome esatto o nome normalizzato
  const found = scales.find(scale => {
    const normalized = normalizeScaleName(scale.scale_name);
    return normalized === scaleName && scale.root === root;
  });
  
  if (found) return found;
  
  // Prova con nome originale
  return scales.find(scale => 
    scale.scale_name === scaleName && scale.root === root
  ) || null;
}

/**
 * Converte scale data in formato per audio player (con ottave)
 * FIXED: Gestisce correttamente il cambio di ottava
 */
export function convertScaleToAudioNotes(scale: ScaleData, startOctave: number = 2): string[] {
  const noteNames = scale.notes.split(' ').map(note => note.trim());
  const result: string[] = [];
  let currentOctave = startOctave;
  
  // Ordine cromatico per calcolare quando cambia ottava
  const chromaticOrder = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];
  
  for (let i = 0; i < noteNames.length; i++) {
    const currentNoteName = noteNames[i].split('/')[0].trim();
    
    // Se non è la prima nota, controlla se dobbiamo cambiare ottava
    if (i > 0) {
      const prevNoteName = noteNames[i - 1].split('/')[0].trim();
      
      // Trova posizione nella scala cromatica
      const prevIndex = chromaticOrder.indexOf(prevNoteName);
      const currIndex = chromaticOrder.indexOf(currentNoteName);
      
      // Se la nota attuale ha indice minore o uguale alla precedente, potremmo essere nell'ottava successiva
      // Caso speciale: se precedente è B e corrente è C, sicuramente cambia ottava
      if (prevIndex !== -1 && currIndex !== -1) {
        if (currIndex <= prevIndex && !(prevNoteName === 'B' && currentNoteName === 'C')) {
          // Se indice minore, cambia ottava
          currentOctave++;
        } else if (prevNoteName === 'B' && currentNoteName === 'C') {
          // B → C sempre cambia ottava
          currentOctave++;
        }
      }
    }
    
    result.push(convertNoteToAudioFormat(noteNames[i], currentOctave));
  }
  
  console.log('🎵 Scale notes converted:', noteNames, '→', result);
  return result;
}

/**
 * Genera una scala random per ear training
 */
export function generateRandomScaleFromData(
  difficulty: 'simple' | 'all',
  previousScale?: { name: string; root: string }
): {
  scaleName: string;
  root: string;
  notes: string[];
  originalData: ScaleData;
} | null {
  const availableScales = getAvailableScales();
  
  // Filtra per difficulty
  const filtered = difficulty === 'simple'
    ? availableScales.filter(s => s.category === 'simple')
    : availableScales;
  
  if (filtered.length === 0) {
    console.error('❌ No scales available for difficulty:', difficulty);
    return null;
  }
  
  // Scegli scala diversa dalla precedente
  let selectedScale;
  if (previousScale && filtered.length > 1) {
    do {
      selectedScale = filtered[Math.floor(Math.random() * filtered.length)];
    } while (selectedScale.name === previousScale.name);
  } else {
    selectedScale = filtered[Math.floor(Math.random() * filtered.length)];
  }
  
  // Scegli root random
  const root = selectedScale.roots[Math.floor(Math.random() * selectedScale.roots.length)];
  
  console.log('🎼 Selected scale:', selectedScale.name, 'root:', root);
  
  // Ottieni dati scala
  const scaleData = getScale(selectedScale.name, root);
  if (!scaleData) {
    console.error('❌ Scale data not found:', selectedScale.name, root);
    return null;
  }
  
  console.log('📝 Original notes:', scaleData.notes);
  
  // Converti in note audio
  const audioNotes = convertScaleToAudioNotes(scaleData);
  
  return {
    scaleName: selectedScale.name,
    root,
    notes: audioNotes,
    originalData: scaleData,
  };
}