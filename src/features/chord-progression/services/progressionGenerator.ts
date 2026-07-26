import {
  noteToSemitone,
  semitoneToNote,
  notePreferFlat,
  getChordNotes,
  DEGREE_SEMITONE,
  MODAL_QUALITY_MAPS,
} from '@shared/utils/musicTheory';
import type {
  ProgressionChord,
  GeneratedProgression,
  ResolvedChord,
  HarmonyStyle,
  KeyMode,
  Technique,
} from '../types/progression.types';
import { TEMPLATES } from './templates';
import { applyTransforms, TRANSFORM_TECHNIQUE_IDS } from './transformEngine';

// ─── Resolution ──────────────────────────────────────────────────────────────

function resolveDegree(key: string, degree: string, qualityKey: string, mode: KeyMode = 'major'): { root: string; quality: string; symbol: string; notes: string[] } {
  const keySemitone = noteToSemitone(key);
  const degreeSemitones = DEGREE_SEMITONE[degree];
  if (degreeSemitones === undefined) {
    return { root: key, quality: 'maj7', symbol: `${key}maj7`, notes: [] };
  }

  const resolvedSemitone = (keySemitone + degreeSemitones + 12) % 12;
  const preferFlat = notePreferFlat(key) || [1, 3, 6, 8, 10].includes(resolvedSemitone);
  const root = semitoneToNote(resolvedSemitone, preferFlat);

  // Resolve 'diatonic' quality using the correct modal quality map
  let quality = qualityKey;
  if (qualityKey === 'diatonic') {
    const qualityMap = MODAL_QUALITY_MAPS[mode] ?? MODAL_QUALITY_MAPS['major'];
    const tonicDefault = ['minor', 'dorian', 'phrygian', 'phrygian_dominant'].includes(mode) ? 'm7'
      : ['lydian', 'mixolydian', 'lydian_dominant'].includes(mode) ? (mode === 'lydian' ? 'maj7' : '7')
      : 'maj7';
    quality = qualityMap[degree] ?? tonicDefault;
  }

  const qualitySuffix = quality === 'maj' ? '' : quality;
  const symbol = `${root}${qualitySuffix}`;
  const notes = getChordNotes(root, quality);

  return { root, quality, symbol, notes };
}

function resolveChord(key: string, chord: ProgressionChord, mode: KeyMode = 'major'): ResolvedChord {
  const { root, quality, symbol, notes } = resolveDegree(key, chord.degree, chord.quality, mode);
  return {
    degree: chord.degree,
    symbol,
    root,
    quality,
    notes,
    technique: chord.technique,
    techniqueLabel: chord.techniqueLabel,
    function: chord.function,
    annotation: chord.annotation,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface ProgressionFilter {
  key: string;
  mode: KeyMode;
  length: number;
  style: HarmonyStyle | 'both';
  techniques: Technique[];
  spice: number;
  seed: number;
}

export function getAvailableTechniques(): { id: Technique; label: string; description: string }[] {
  return [
    { id: 'diatonic',          label: 'Diatonic',              description: 'Chords native to the major key — no borrowed notes.' },
    { id: 'modal_interchange', label: 'Modal Interchange',     description: 'Borrow chords from parallel modes (especially natural minor / Dorian).' },
    { id: 'secondary_dominant',label: 'Secondary Dominant',    description: 'V7 of a non-tonic chord (e.g. A7 → Dm, E7 → Am, D7 → G).' },
    { id: 'tritone_sub',       label: 'SubV / Tritone Sub',    description: 'Replace V7 with ♭II7 — tritone substitution. Creates chromatic bass motion.' },
    { id: 'altered_dominant',  label: 'Altered Dominant',      description: 'V7alt (7♭9♯9♯11♭13) — maximum tension before resolution. Super Locrian color.' },
    { id: 'backdoor',          label: 'Backdoor II–V',         description: '♭VII7 → ♭VI–♭VII approaching tonic from below (back-door cadence).' },
    { id: 'chromatic',         label: 'Cromatico / Dim Vamp',  description: 'Chromatic passing chords and mediant motion (e.g. I → ♯Idim → IIm).' },
    { id: 'dim_pedal',         label: 'Dim Pedal / Vamp',      description: 'Diminished seventh chord as pedal or passing chord — creates ambiguous tension.' },
    { id: 'quartal',           label: 'Quartal Harmony',       description: 'Chords built in stacked 4ths — ambiguous, open, modal sound.' },
    { id: 'sus',               label: 'SUS Chords',            description: 'Suspended 2nd and 4th chords — avoids the 3rd, creates floating tension.' },
    { id: 'modulation',        label: 'Modulazione',           description: 'Pivot chord or direct modulation to a new key within the progression.' },
    { id: 'float_chord',       label: 'Float Chord (IVmaj7/V)', description: 'Jeff Schneider: IVmaj7 over V bass = V13sus. Suspended dominant without tritone tension — neo-soul and R&B staple.' },
    { id: 'minor_to_major',    label: 'Minor-to-Major Trick',  description: 'Jeff Schneider: vim7 → VI7 → passing dim7 half-step below target → destination. Gospel-R&B chromatic approach.' },
    { id: 'blues',             label: 'Blues',                  description: 'Forma blues: accordi settima di dominante su I7, IV7 e V7. 12-bar, 8-bar, jazz blues, minor blues — la radice di jazz, rock e soul.' },
    { id: 'gospel',            label: 'Gospel',                 description: 'Armonia gospel: cadenza plagale IV→I, catene di dominanti secondari, bII°7 cromatico. Il suono di Kirk Franklin, Aretha, Sam Cooke.' },
    { id: 'bossa_nova',        label: 'Bossa Nova',             description: 'Armonia brasiliana Jobim: Imaj9→bIImaj7 (scivolata cromatica), ii–V lussureggianti con tensioni 9, 11, 13. "Ipanema", "Wave", "Corcovado".' },
    { id: 'flamenco',          label: 'Flamenco / Andalusiano', description: 'Cadenza andalusa i→bVII→bVI→V7, vamp frigio im→bII7, ciclo spagnolo. Il suono flamenco/phrygian dominant di Paco de Lucía.' },
    { id: 'color',             label: 'Color / Estensioni',     description: 'Arricchisce le qualità: maj7→maj9/6-9, m7→m9/m11, V7→13. Colore senza cambiare funzione.' },
  ];
}

export function generateProgressions(filter: ProgressionFilter): GeneratedProgression[] {
  const { key, mode, length, style, techniques, spice, seed } = filter;

  if (noteToSemitone(key) < 0) return [];

  const templateFilterTechniques = techniques.filter(t => !TRANSFORM_TECHNIQUE_IDS.includes(t));

  const results: GeneratedProgression[] = [];
  let id = 0;

  for (const template of TEMPLATES) {
    if (!template.lengths.includes(length)) continue;

    const templateMode = template.mode ?? 'major';
    if (templateMode !== 'both' && templateMode !== mode) continue;

    if (style !== 'both' && template.style !== style) continue;

    if (templateFilterTechniques.length > 0) {
      const hasOverlap = template.techniques.some(t => templateFilterTechniques.includes(t));
      if (!hasOverlap) continue;
    }

    const baseChords = template.chords.map(c => resolveChord(key, c, mode));
    const { chords, applied } = applyTransforms(baseChords, key, mode, {
      spice,
      allowed: techniques,
      seed: seed + id,
    });

    results.push({
      id: String(id++),
      template,
      key,
      chords,
      baseChords,
      seed,
      appliedTransforms: applied,
      description: template.description,
    });
  }

  return results;
}

export function regenerateProgression(
  prog: GeneratedProgression,
  mode: KeyMode,
  techniques: Technique[],
  spice: number,
  newSeed: number,
): GeneratedProgression {
  const { chords, applied } = applyTransforms(prog.baseChords, prog.key, mode, {
    spice,
    allowed: techniques,
    seed: newSeed,
  });
  return { ...prog, chords, seed: newSeed, appliedTransforms: applied };
}

export function getAllLengths(): number[] {
  const lengths = new Set<number>();
  TEMPLATES.forEach(t => t.lengths.forEach(l => lengths.add(l)));
  return Array.from(lengths).sort((a, b) => a - b);
}
