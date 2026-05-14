export interface ScaleMatch {
  id: string;
  scaleName: string;       // e.g. "Dorian"
  scaleKey: string;        // key into SCALE_FORMULAS
  root: string;            // e.g. "D"
  category: string;        // e.g. "Modal"
  referenceScale: string[]; // all notes of the scale
  matchedNotes: string[];  // which input notes are in this scale
  missingNotes: string[];  // scale notes NOT in the input
  extraNotes: string[];    // input notes NOT in the scale (chromatic passing tones)
  matchScore: number;      // 0–100 percentage
  completeness: number;    // how many scale notes the input covers (0–100)
}
