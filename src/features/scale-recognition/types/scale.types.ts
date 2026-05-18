export interface ScaleMatch {
  id: string;
  scaleName: string;        // e.g. "Dorian"
  scaleKey: string;         // Tonal scale type name
  root: string;             // e.g. "D"
  category: string;         // e.g. "Modal"
  referenceScale: string[]; // all notes of the scale (from Tonal)
  matchedNotes: string[];   // which input notes are in this scale
  missingNotes: string[];   // scale notes NOT in the input
  extraNotes: string[];     // input notes NOT in the scale (chromatic passing tones)
  matchScore: number;       // 0–100 percentage of input notes that fit the scale
  completeness: number;     // 0–100 percentage of scale notes covered by input
  intervalPattern: string;  // e.g. "W-W-H-W-W-W-H"
  sharps: number;           // number of sharp notes in the scale
  flats: number;            // number of flat notes in the scale
}
