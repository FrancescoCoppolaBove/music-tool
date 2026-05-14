export type HarmonyStyle = 'classic' | 'modern';

export type Technique =
  | 'diatonic'
  | 'modal_interchange'
  | 'secondary_dominant'
  | 'tritone_sub'
  | 'backdoor'
  | 'chromatic'
  | 'quartal'
  | 'sus'
  | 'modulation';

export interface ProgressionChord {
  degree: string;          // Roman numeral e.g. "II" "bVII"
  quality: string;         // chord type key
  root?: string;           // resolved note name once key is known
  symbol?: string;         // full chord symbol e.g. "Dm7"
  technique?: Technique;   // harmony technique used
  techniqueLabel?: string; // human-readable technique name
  function: string;        // harmonic function: Tonic / Subdominant / Dominant / Color
  annotation?: string;     // e.g. "V/V", "SubV", "bVII borrowed from Mixolydian"
}

export interface ProgressionTemplate {
  id: string;
  name: string;
  chords: ProgressionChord[];
  style: HarmonyStyle;
  techniques: Technique[];
  description: string;
  artists: string[];          // inspired by
  feel: string;               // e.g. "Groovy jazz cadence", "Cinematic"
  lengths: number[];          // valid lengths for this pattern
}

export interface GeneratedProgression {
  id: string;
  template: ProgressionTemplate;
  key: string;
  chords: ResolvedChord[];    // with actual note names
  description: string;
}

export interface ResolvedChord {
  degree: string;
  symbol: string;
  root: string;
  quality: string;
  notes: string[];
  technique?: Technique;
  techniqueLabel?: string;
  function: string;
  annotation?: string;
}
