import { noteToSemitone, semitoneToNote, getChordNotes } from '@shared/utils/musicTheory';
import { makeChord, contextFor, type KeyContext } from './transformEngine';
import type { ResolvedChord } from '../types/progression.types';

export interface CycleStep {
  key: string;
  label: string;
  chords: ResolvedChord[];
}

export interface ModulationCycleResult {
  id: string;
  name: string;
  description: string;
  steps: CycleStep[];
}

export interface CycleDef {
  id: string;
  name: string;
  description: string;
  source: string;
  defaultCycles: number;
  maxCycles: number;
  generate(startKey: string, cycles: number): ModulationCycleResult;
}

function keyName(sem: number, ctx: KeyContext): string {
  const s = ((sem % 12) + 12) % 12;
  return semitoneToNote(s, ctx.preferFlat || [1, 3, 6, 8, 10].includes(s));
}

function slashChord(upperSem: number, upperQuality: string, bassSem: number, ctx: KeyContext): ResolvedChord {
  const upper = keyName(upperSem, ctx);
  const bass = keyName(bassSem, ctx);
  const suffix = upperQuality === 'maj' ? '' : upperQuality;
  return {
    degree: '',
    symbol: `${upper}${suffix}/${bass}`,
    root: bass,
    quality: upperQuality,
    notes: [bass, ...getChordNotes(upper, upperQuality)],
    function: 'Color',
  };
}

export const MODULATION_CYCLES: CycleDef[] = [
  {
    id: 'dominant-chain',
    name: 'Catena di dominanti',
    description: 'Ogni dominante risolve una quarta sopra sul dominante successivo. Il ciclo delle quinte in versione infinita.',
    source: 'Anthropology (Parker) — bridge',
    defaultCycles: 12, maxCycles: 12,
    generate(startKey, cycles) {
      const ctx = contextFor(startKey, 'major');
      const steps: CycleStep[] = [];
      let sem = ctx.keySemitone;
      for (let i = 0; i < cycles; i++) {
        steps.push({
          key: keyName(sem, ctx),
          label: `${keyName(sem, ctx)}7 → ${keyName(sem + 5, ctx)}`,
          chords: [makeChord(sem, '7', ctx, { function: 'Dominant' })],
        });
        sem += 5;
      }
      return { id: this.id, name: this.name, description: this.description, steps };
    },
  },
  {
    id: 'augmented-climb',
    name: 'Salita aumentata',
    description: 'I → I aug → I6 → I7: la quinta sale cromaticamente fino a formare il dominante, che risolve una quarta sopra.',
    source: 'Drill 2 — chain of dominants, versione ascendente',
    defaultCycles: 6, maxCycles: 12,
    generate(startKey, cycles) {
      const ctx = contextFor(startKey, 'major');
      const steps: CycleStep[] = [];
      let sem = ctx.keySemitone;
      for (let i = 0; i < cycles; i++) {
        steps.push({
          key: keyName(sem, ctx),
          label: `salita in ${keyName(sem, ctx)} → ${keyName(sem + 5, ctx)}`,
          chords: [
            makeChord(sem, 'maj', ctx, { function: 'Tonic' }),
            makeChord(sem, 'aug', ctx, { function: 'Color' }),
            makeChord(sem, '6', ctx, { function: 'Tonic' }),
            makeChord(sem, '7', ctx, { function: 'Dominant' }),
          ],
        });
        sem += 5;
      }
      return { id: this.id, name: this.name, description: this.description, steps };
    },
  },
  {
    id: 'french-6th-descent',
    name: 'Discesa French 6th',
    description: 'I → Imaj7 → I7 → I7♭5: il 7♭5 (sesta francese) risolve un semitono sotto. Discesa cromatica epica, alla Mozart.',
    source: 'Drill 3 — the epic french 6th descent',
    defaultCycles: 6, maxCycles: 12,
    generate(startKey, cycles) {
      const ctx = contextFor(startKey, 'major');
      const steps: CycleStep[] = [];
      let sem = ctx.keySemitone;
      for (let i = 0; i < cycles; i++) {
        steps.push({
          key: keyName(sem, ctx),
          label: `${keyName(sem, ctx)} → ${keyName(sem - 1, ctx)}`,
          chords: [
            makeChord(sem, 'maj', ctx, { function: 'Tonic' }),
            makeChord(sem, 'maj7', ctx, { function: 'Tonic' }),
            makeChord(sem, '7', ctx, { function: 'Dominant' }),
            makeChord(sem, '7b5', ctx, { function: 'Dominant' }),
          ],
        });
        sem -= 1;
      }
      return { id: this.id, name: this.name, description: this.description, steps };
    },
  },
  {
    id: 'minor-one-equals-four',
    name: 'Minore 1 = 4',
    description: 'Il minore di arrivo diventa il iv della nuova tonalità: iv → V7 → i, salendo per quinte.',
    source: 'Drill 4 — minor I=IV V arpeggio (Chopin op.28 n.4)',
    defaultCycles: 12, maxCycles: 12,
    generate(startKey, cycles) {
      const ctx = contextFor(startKey, 'minor');
      const steps: CycleStep[] = [];
      let sem = ctx.keySemitone;
      for (let i = 0; i < cycles; i++) {
        const newTonic = sem + 7;
        steps.push({
          key: `${keyName(newTonic, ctx)}m`,
          label: `iv–V7–i in ${keyName(newTonic, ctx)}m`,
          chords: [
            makeChord(sem, 'm7', ctx, { degree: 'iv', function: 'Subdominant' }),
            makeChord(sem + 2, '7', ctx, { degree: 'V', function: 'Dominant' }),
            makeChord(newTonic, 'm', ctx, { degree: 'i', function: 'Tonic' }),
          ],
        });
        sem = newTonic;
      }
      return { id: this.id, name: this.name, description: this.description, steps };
    },
  },
  {
    id: 'beethoven-one-equals-two',
    name: 'Beethoven 1 = 2',
    description: 'ii–V–I dove il I diventa il nuovo ii: discesa per toni interi. Sinfonia n.7, Allegretto (e "Four" di Miles).',
    source: 'Drill 5 — Beethoven I=II V I',
    defaultCycles: 6, maxCycles: 6,
    generate(startKey, cycles) {
      const ctx = contextFor(startKey, 'major');
      const steps: CycleStep[] = [];
      let two = ctx.keySemitone;
      for (let i = 0; i < cycles; i++) {
        const tonic = two - 2;
        steps.push({
          key: keyName(tonic, ctx),
          label: `ii–V–I in ${keyName(tonic, ctx)}`,
          chords: [
            makeChord(two, 'm7', ctx, { degree: 'ii', function: 'Subdominant' }),
            makeChord(two + 5, '7', ctx, { degree: 'V', function: 'Dominant' }),
            makeChord(tonic, 'maj', ctx, { degree: 'I', function: 'Tonic' }),
          ],
        });
        two = tonic;
      }
      return { id: this.id, name: this.name, description: this.description, steps };
    },
  },
  {
    id: 'michelle-descent',
    name: 'Discesa Michelle',
    description: 'Basso cromatico discendente dal minore, poi il V7sus risolve sul minore costruito sulla sua terza: si scende di un semitono a ogni giro.',
    source: 'Michelle (Beatles), resa infinita',
    defaultCycles: 6, maxCycles: 12,
    generate(startKey, cycles) {
      const ctx = contextFor(startKey, 'minor');
      const steps: CycleStep[] = [];
      let sem = ctx.keySemitone;
      for (let i = 0; i < cycles; i++) {
        steps.push({
          key: `${keyName(sem, ctx)}m`,
          label: `discesa in ${keyName(sem, ctx)}m → ${keyName(sem - 1, ctx)}m`,
          chords: [
            makeChord(sem, 'm', ctx, { degree: 'i', function: 'Tonic' }),
            makeChord(sem - 1, 'aug', ctx, { function: 'Color' }),
            slashChord(sem + 3, 'maj', sem - 2, ctx),
            makeChord(sem - 3, 'm7b5', ctx, { function: 'Subdominant' }),
            makeChord(sem - 4, 'maj7', ctx, { degree: 'VI', function: 'Subdominant' }),
            makeChord(sem - 5, '7sus4', ctx, { degree: 'V', function: 'Dominant' }),
            makeChord(sem - 5, '7', ctx, { degree: 'V', function: 'Dominant' }),
          ],
        });
        sem -= 1;
      }
      return { id: this.id, name: this.name, description: this.description, steps };
    },
  },
  {
    id: 'satie-thirds',
    name: 'Satie per terze',
    description: 'Da un maggiore: dominante un semitono sotto → risolve al minore una terza sopra. Dal minore: dominante un tono sotto → maggiore una terza sopra.',
    source: "Drill 7 — Satie's fast track to heaven",
    defaultCycles: 8, maxCycles: 24,
    generate(startKey, cycles) {
      const ctx = contextFor(startKey, 'major');
      const steps: CycleStep[] = [];
      let sem = ctx.keySemitone;
      let isMajor = true;
      for (let i = 0; i < cycles; i++) {
        const domSem = isMajor ? sem - 1 : sem - 2;
        const nextSem = domSem + 5;
        const nextIsMajor: boolean = !isMajor;
        steps.push({
          key: isMajor ? keyName(sem, ctx) : `${keyName(sem, ctx)}m`,
          label: `${keyName(sem, ctx)}${isMajor ? '' : 'm'} → ${keyName(nextSem, ctx)}${nextIsMajor ? '' : 'm'}`,
          chords: [
            makeChord(sem, isMajor ? 'maj' : 'm', ctx, { function: 'Tonic' }),
            makeChord(domSem, '7', ctx, { function: 'Dominant' }),
          ],
        });
        sem = nextSem;
        isMajor = nextIsMajor;
      }
      steps.push({
        key: isMajor ? keyName(sem, ctx) : `${keyName(sem, ctx)}m`,
        label: 'arrivo',
        chords: [makeChord(sem, isMajor ? 'maj' : 'm', ctx, { function: 'Tonic' })],
      });
      return { id: this.id, name: this.name, description: this.description, steps };
    },
  },
  {
    id: 'crimson-steps',
    name: 'Crimson a gradini',
    description: 'I → ♭VII → V7/ii → ii, e il ii diventa il nuovo I maggiore: salita per toni interi con sospensioni surreali.',
    source: 'Drill 8 — The Court of the Crimson King',
    defaultCycles: 6, maxCycles: 6,
    generate(startKey, cycles) {
      const ctx = contextFor(startKey, 'major');
      const steps: CycleStep[] = [];
      let sem = ctx.keySemitone;
      for (let i = 0; i < cycles; i++) {
        steps.push({
          key: keyName(sem, ctx),
          label: `${keyName(sem, ctx)} → ${keyName(sem + 2, ctx)}`,
          chords: [
            makeChord(sem, 'maj', ctx, { degree: 'I', function: 'Tonic' }),
            makeChord(sem - 2, 'maj', ctx, { degree: 'bVII', function: 'Subdominant' }),
            makeChord(sem - 3, '7', ctx, { degree: 'VI7', function: 'Dominant', annotation: 'V7/ii' }),
            makeChord(sem + 2, 'm', ctx, { degree: 'ii', function: 'Tonic', annotation: 'ii = nuovo I' }),
          ],
        });
        sem += 2;
      }
      return { id: this.id, name: this.name, description: this.description, steps };
    },
  },
  {
    id: 'ascending-thirds-251',
    name: '2–5–1 per terze ascendenti',
    description: 'ii–V–I maggiore e minore alternati, modulando ogni volta sulla terza dell\'accordo di arrivo. Il "goat" dei drill di modulazione.',
    source: 'Drill 9 — Maxence (Michel Legrand)',
    defaultCycles: 8, maxCycles: 24,
    generate(startKey, cycles) {
      const ctx = contextFor(startKey, 'major');
      const steps: CycleStep[] = [];
      let sem = ctx.keySemitone;
      let isMajor = true;
      for (let i = 0; i < cycles; i++) {
        if (isMajor) {
          steps.push({
            key: keyName(sem, ctx),
            label: `ii–V–I in ${keyName(sem, ctx)}`,
            chords: [
              makeChord(sem + 2, 'm7', ctx, { degree: 'ii', function: 'Subdominant' }),
              makeChord(sem + 7, '7', ctx, { degree: 'V', function: 'Dominant' }),
              makeChord(sem, 'maj7', ctx, { degree: 'I', function: 'Tonic' }),
            ],
          });
          sem += 4;
        } else {
          steps.push({
            key: `${keyName(sem, ctx)}m`,
            label: `iiø–V–i in ${keyName(sem, ctx)}m`,
            chords: [
              makeChord(sem + 2, 'm7b5', ctx, { degree: 'iiø', function: 'Subdominant' }),
              makeChord(sem + 7, '7', ctx, { degree: 'V', function: 'Dominant' }),
              makeChord(sem, 'm7', ctx, { degree: 'i', function: 'Tonic' }),
            ],
          });
          sem += 3;
        }
        isMajor = !isMajor;
      }
      return { id: this.id, name: this.name, description: this.description, steps };
    },
  },
];

export function generateCycle(cycleId: string, startKey: string, cycles: number): ModulationCycleResult | null {
  const def = MODULATION_CYCLES.find(c => c.id === cycleId);
  if (!def || noteToSemitone(startKey) < 0) return null;
  const n = Math.max(1, Math.min(cycles, def.maxCycles));
  return def.generate(startKey, n);
}
