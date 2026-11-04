import { useState, useEffect, useRef } from 'react';
import { useGlobalKey } from '@shared/context/GlobalKeyContext';
import { Chord } from 'tonal';
import { transposeNote } from '@shared/utils/musicTheory';
import { storageGet, storageSet } from '@shared/utils/storage';
import {
  CHORD_SCALE_DATA, FAMILY_LABELS, ROOTS, getChordScaleEntry, parseProgression,
  type ChordFamily, type ScaleInfo,
} from './chordScales';

interface SASession { mode: 'single' | 'progression'; root: string; quality: string; progressionText: string }
const SA_KEY = 'session_scaleAdvisor';

// ─── Color helpers ───────────────────────────────────────────────────────────

function getNoteColor(semitone: number, chordTones: number[], goodExtensions: number[], avoidNotes: number[]): string {
  if (semitone === 0) return '#f59e0b';
  if (chordTones.includes(semitone)) return '#a78bfa';
  if (avoidNotes.includes(semitone)) return '#ef4444';
  if (goodExtensions.includes(semitone)) return '#06b6d4';
  return '#6b7280';
}

function getIntervalName(semitone: number): string {
  const names: Record<number, string> = {
    0: 'R', 1: '♭9', 2: '9', 3: '♭3/♯9', 4: '3', 5: '11',
    6: '♯11/♭5', 7: '5', 8: '♭13/♯5', 9: '13/6', 10: '♭7', 11: '△7',
  };
  return names[semitone] ?? `+${semitone}`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ScaleNoteRow({ root, scale }: { root: string; scale: ScaleInfo }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
      {scale.intervals.map((semitone, i) => {
        const note = transposeNote(root, semitone);
        const color = getNoteColor(semitone, scale.chordTones, scale.goodExtensions, scale.avoidNotes);
        const intervalName = getIntervalName(semitone);
        return (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{
              width: 38, height: 38,
              borderRadius: '50%',
              background: `${color}20`,
              border: `2px solid ${color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color,
            }}>
              {note}
            </div>
            <div style={{ fontSize: 10, color: `${color}99`, fontFamily: 'monospace' }}>
              {intervalName}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ScaleCard({
  root,
  scale,
  isPrimary,
}: {
  root: string;
  scale: ScaleInfo;
  isPrimary: boolean;
}) {
  const relatedRoot = scale.trickSemitones !== undefined
    ? transposeNote(root, scale.trickSemitones)
    : null;

  return (
    <div style={{
      background: '#0d1117',
      border: `1px solid ${isPrimary ? '#7c3aed50' : '#30363d'}`,
      borderRadius: 10,
      padding: '14px 16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 6 }}>
        <div>
          <span style={{ fontSize: 15, fontWeight: 700, color: isPrimary ? '#c4b5fd' : '#8b949e' }}>
            {root} {scale.name}
          </span>
          {isPrimary && (
            <span style={{
              marginLeft: 8, fontSize: 10, background: '#7c3aed30', border: '1px solid #7c3aed',
              borderRadius: 20, padding: '2px 8px', color: '#a78bfa', fontWeight: 600,
            }}>
              PRIMARY
            </span>
          )}
        </div>
        <div style={{
          fontSize: 11, color: '#06b6d4', background: '#06b6d410',
          border: '1px solid #06b6d430', borderRadius: 6, padding: '3px 8px',
        }}>
          {scale.extensionLabel}
        </div>
      </div>

      <ScaleNoteRow root={root} scale={scale} />

      {relatedRoot && scale.trickScaleName && (
        <div style={{
          marginTop: 12, padding: '8px 12px',
          background: '#10b98110', border: '1px solid #10b98130',
          borderRadius: 8, fontSize: 12, color: '#6ee7b7',
        }}>
          💡 <strong>{relatedRoot} {scale.trickScaleName}</strong>{' '}
          ({scale.trickInterval}) — parent scale for memorisation
        </div>
      )}

      {scale.characteristicNote && (
        <div style={{
          marginTop: 8, fontSize: 11, color: '#a78bfa',
          fontFamily: "'DM Mono', monospace",
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{ color: '#7c3aed' }}>✦</span> {scale.characteristicNote}
        </div>
      )}

      {scale.avoidNotes.length > 0 && scale.modalContext && (
        <div style={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic', marginTop: 4 }}>
          Avoid note in tonal context — characteristic in modal use
        </div>
      )}

      <p style={{ marginTop: 10, marginBottom: 0, fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>
        {scale.description}
      </p>
    </div>
  );
}

function ChordScalePanel({ root, quality }: { root: string; quality: string }) {
  const entry = getChordScaleEntry(quality);
  if (!entry) return <div style={{ color: '#6b7280', fontSize: 13 }}>Chord quality not recognised.</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 11, color: '#6b7280' }}>
        {[
          { color: '#f59e0b', label: 'Root' },
          { color: '#a78bfa', label: 'Chord tones' },
          { color: '#06b6d4', label: 'Good extensions' },
          { color: '#ef4444', label: 'Avoid notes' },
          { color: '#6b7280', label: 'Passing tones' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
            {label}
          </div>
        ))}
      </div>

      {/* Primary scale */}
      <ScaleCard root={root} scale={entry.primary} isPrimary />

      {/* Alternatives */}
      {entry.alternatives.map((alt, i) => (
        <ScaleCard key={i} root={root} scale={alt} isPrimary={false} />
      ))}

      {/* Dominant context guide */}
      {['7', '9', '13'].includes(quality) && (
        <div style={{
          background: '#0d1117', border: '1px solid #21262d',
          borderRadius: 10, padding: 16, marginTop: 4,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
            Which dominant scale? — Berklee guide
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {([
              { label: 'V7 → major (diatonic)', scale: 'Mixolydian', detail: 'T9, S4, T13 — avoid the 11th; plain natural dominant', color: '#8b5cf6' },
              { label: 'V7 → minor (secondary dom)', scale: 'Mixolydian ♭9 ♭13', detail: 'T♭9, T♭13 — from Harmonic Minor of target', color: '#ec4899' },
              { label: 'subV7 (tritone sub → major)', scale: 'Lydian ♭7', detail: 'T9, T♯11, T13 — no avoid notes; resolves by half step', color: '#f97316' },
              { label: 'Non-resolving / blues / modal', scale: 'Mixolydian or Blues', detail: 'Treat as a tonic — any scale colour works', color: '#10b981' },
            ] as const).map(({ label, scale, detail, color }) => (
              <div key={label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 3, background: color, borderRadius: 2, alignSelf: 'stretch', flexShrink: 0 }} />
                <div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#e6edf3' }}>{label}</span>
                  <span style={{ fontSize: 12, color: '#a78bfa', marginLeft: 8, fontFamily: "'DM Mono', monospace" }}>{scale}</span>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Progression Card ────────────────────────────────────────────────────────

function ProgressionChordCard({
  symbol,
  root,
  quality,
  index,
}: {
  symbol: string;
  root: string;
  quality: string;
  index: number;
}) {
  const entry = getChordScaleEntry(quality);
  if (!entry) return null;
  const { primary } = entry;
  const relatedRoot = primary.trickSemitones !== undefined
    ? transposeNote(root, primary.trickSemitones)
    : null;

  return (
    <div style={{
      background: '#161b22',
      border: '1px solid #30363d',
      borderRadius: 10,
      padding: '14px 16px',
      minWidth: 220,
      flex: '1 1 220px',
    }}>
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 11, color: '#4b5563', fontFamily: 'monospace' }}>#{index + 1}</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#e6edf3' }}>{symbol}</span>
        </div>
        <div style={{
          fontSize: 11, color: '#c4b5fd', background: '#7c3aed20',
          border: '1px solid #7c3aed40', borderRadius: 6,
          padding: '2px 8px', display: 'inline-block',
        }}>
          {root} {primary.name}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
        {primary.intervals.map((semitone, i) => {
          const note = transposeNote(root, semitone);
          const color = getNoteColor(semitone, primary.chordTones, primary.goodExtensions, primary.avoidNotes);
          return (
            <div key={i} style={{
              width: 30, height: 30, borderRadius: '50%',
              background: `${color}20`, border: `1.5px solid ${color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, color,
            }}>
              {note}
            </div>
          );
        })}
      </div>

      <div style={{ fontSize: 10, color: '#06b6d4', marginBottom: 8 }}>
        {primary.extensionLabel}
      </div>

      {relatedRoot && primary.trickScaleName && (
        <div style={{
          fontSize: 11, color: '#6ee7b7',
          background: '#10b98110', border: '1px solid #10b98130',
          borderRadius: 6, padding: '5px 8px',
        }}>
          💡 {relatedRoot} {primary.trickScaleName}
        </div>
      )}
    </div>
  );
}

// ─── Pentatonic Superimposition ──────────────────────────────────────────────

const MINOR_PENT_INTERVALS = [0, 3, 5, 7, 10];
const MAJOR_PENT_INTERVALS = [0, 2, 4, 7, 9];

interface PentatonicEntry {
  label: string;
  rootSemitones: number;
  type: 'minor' | 'major';
  color: string;
  tip: string;
}

const PENT_MAP: Record<string, PentatonicEntry[]> = {
  maj: [
    { label: 'Major pent on root', rootSemitones: 0, type: 'major', color: 'R, 9, 3, 5, 6 — no 4th, no 7th. Nothing can clash.', tip: 'Pop, country, gospel default' },
    { label: 'Major pent on 5th', rootSemitones: 7, type: 'major', color: 'Upper structure — 5, 13, △7, 9, 3. Adds a maj7 sheen.', tip: 'V pentatonic over I: brighter than the root pent' },
  ],
  maj7: [
    { label: 'Minor pent on 3rd', rootSemitones: 4, type: 'minor', color: 'Upper structure — 3, 5, 13, △7, 9. No root, no 4th: clash-free.', tip: 'Classic iii-over-I substitution on maj7' },
    { label: 'Minor pent on 7th', rootSemitones: 11, type: 'minor', color: 'Lydian — △7, 9, 3, ♯11, 13. Floating, modern.', tip: 'Same notes as the II major pent: full Lydian palette' },
    { label: 'Major pent on root', rootSemitones: 0, type: 'major', color: 'Ionian — 1, 2, 3, 5, 6. Clean, open.', tip: 'Safe classical approach, Kenny Burrell' },
  ],
  maj9: [
    { label: 'Minor pent on 3rd', rootSemitones: 4, type: 'minor', color: 'Upper structure — 3, 5, 13, △7, 9. The maj9 voicing as a line.', tip: 'Every note is a chord tone or extension' },
    { label: 'Minor pent on 7th', rootSemitones: 11, type: 'minor', color: 'Lydian — △7, 9, 3, ♯11, 13.', tip: 'Adds the ♯11 on top of the maj9' },
    { label: 'Major pent on root', rootSemitones: 0, type: 'major', color: 'R, 9, 3, 5, 6 — the 9 is already in the chord.', tip: 'Safe, singable' },
  ],
  'maj7#11': [
    { label: 'Minor pent on 7th', rootSemitones: 11, type: 'minor', color: 'Core Lydian — △7, 9, 3, ♯11, 13.', tip: 'Jacob Collier, Snarky Puppy on Lydian vamps' },
    { label: 'Major pent on 5th', rootSemitones: 7, type: 'major', color: '5, 13, △7, 9, 3 — leaves the ♯11 to the voicing.', tip: 'Safe Lydian line; the chord supplies the ♯11' },
  ],
  maj6: [
    { label: 'Major pent on root', rootSemitones: 0, type: 'major', color: 'Perfect — 1, 2, 3, 5, 6. All chord tones.', tip: 'No tension, complete harmonic alignment' },
    { label: 'Major pent on 2nd', rootSemitones: 2, type: 'major', color: 'Lydian — 9, 3, ♯11, 13, △7. Bright extensions.', tip: 'Colours a 6th chord with Lydian extensions' },
  ],
  add9: [
    { label: 'Major pent on root', rootSemitones: 0, type: 'major', color: 'Natural — 1, 2, 3, 5, 6. Clean and open.', tip: 'All basic chord tones covered' },
    { label: 'Minor pent on 3rd', rootSemitones: 4, type: 'minor', color: 'Upper structure — 3, 5, 13, △7, 9. Adds a maj9 colour.', tip: 'Brighter, maj9-like line over an add9' },
  ],
  m: [
    { label: 'Minor pent on root', rootSemitones: 0, type: 'minor', color: 'R, ♭3, 4, 5, ♭7 — fits every minor mode.', tip: 'Safe when the mode is unclear' },
    { label: 'Major pent on 4th', rootSemitones: 5, type: 'major', color: 'Dorian — 11, 5, 13, R, 9. Warm natural 6th.', tip: 'Turns a plain minor chord Dorian' },
  ],
  m7: [
    { label: 'Minor pent on root', rootSemitones: 0, type: 'minor', color: 'Natural minor — home sound, safe.', tip: 'Classic blues-jazz, Wes Montgomery' },
    { label: 'Major pent on 4th', rootSemitones: 5, type: 'major', color: 'Dorian — 11, 5, 13, R, 9. Warm, funky natural 6th.', tip: 'Snarky Puppy dorian vamps, Herbie Hancock' },
    { label: 'Minor pent on 5th', rootSemitones: 7, type: 'minor', color: 'Upper extensions — 5, ♭7, 1, 9, 11. Airy.', tip: 'Suspended, floating — Yussef Dayes style' },
  ],
  m9: [
    { label: 'Minor pent on 5th', rootSemitones: 7, type: 'minor', color: 'Upper minor — 5, ♭7, R, 9, 11. Puts the 9 in the line.', tip: 'The m9/m11 voicing played as a melody' },
    { label: 'Major pent on 4th', rootSemitones: 5, type: 'major', color: 'Dorian — 11, 5, 13, R, 9. Full Dorian colour.', tip: 'Herbie Hancock dorian approach over m9' },
  ],
  m6: [
    { label: 'Major pent on 4th', rootSemitones: 5, type: 'major', color: 'Dorian — 11, 5, 6, R, 9. No ♭7, so the 6th rings clean.', tip: 'The Dorian sound — essential for Dm6 (Miles Davis)' },
    { label: 'Minor pent on root', rootSemitones: 0, type: 'minor', color: 'R, ♭3, 4, 5, ♭7 — the ♭7 rubs against the 6th: pass through it.', tip: 'Blues-inflected minor sound' },
  ],
  '7': [
    { label: 'Minor pent on 2nd', rootSemitones: 2, type: 'minor', color: 'Mixolydian extensions — 9, 11, 13. Clean.', tip: 'Classic dominant jazz sound, no clash' },
    { label: 'Minor pent on 5th', rootSemitones: 7, type: 'minor', color: 'Suspended dominant — 5, b7, 1, 9, 11.', tip: 'Funky suspended feel — Vulfpeck, The Meters' },
    { label: 'Major pent on b3', rootSemitones: 3, type: 'major', color: 'Bluesy — ♯9, 11, 5, ♭7, R. Gritty tension.', tip: 'Blues-rock over dominant, BB King' },
    { label: 'Major pent on b7', rootSemitones: 10, type: 'major', color: 'IV pentatonic = IV over V. Soul gospel.', tip: 'Gospel/soul dominant colour, Stevie Wonder' },
  ],
  '9': [
    { label: 'Minor pent on 2nd', rootSemitones: 2, type: 'minor', color: 'Dominant 9 extensions — 9, 11, 5, 13, R.', tip: 'Complete Mixolydian pentatonic colour' },
    { label: 'Minor pent on 5th', rootSemitones: 7, type: 'minor', color: 'Suspended dominant feel — 5, ♭7, R, 9, 11.', tip: 'Funky sus over 9 chord — Ghost Note style' },
  ],
  '7alt': [
    { label: 'Major pent on b5', rootSemitones: 6, type: 'major', color: 'Altered — ♯11, ♭13, ♭7, ♭9, ♯9. Every tension, no natural notes.', tip: 'Same notes as the ♭3 minor pent: the standard altered pentatonic' },
  ],
  m7b5: [
    { label: 'Minor pent on b3', rootSemitones: 3, type: 'minor', color: 'Locrian — ♭3, ♭5, ♭13, ♭7, ♭9. Every chord tone but the root.', tip: 'Dark half-dim sound (same notes as the ♭5 major pent)' },
    { label: 'Minor pent on 4th', rootSemitones: 5, type: 'minor', color: '11, ♭13, ♭7, R, ♭3 — no 2nd of either kind, fits Locrian and Locrian ♯2.', tip: 'Safe line on the iiø of a minor ii–V–i' },
  ],
  sus4: [
    { label: 'Major pent on b7', rootSemitones: 10, type: 'major', color: 'Open, floating — ♭7, R, 9, 4, 5. No 3rd at all.', tip: 'Modal, ambient — ECM Records sound' },
    { label: 'Major pent on 4th', rootSemitones: 5, type: 'major', color: 'Quartal feel — 4, 5, 6, 1, 2.', tip: 'McCoy Tyner quartal voicing colour' },
  ],
  '7sus4': [
    { label: 'Minor pent on 5th', rootSemitones: 7, type: 'minor', color: 'Sus palette — 5, ♭7, R, 9, 4. Every note fits.', tip: 'The quintessential sus line (= ♭VII major pent)' },
    { label: 'Major pent on 4th', rootSemitones: 5, type: 'major', color: 'IV over V = float chord — 4, 5, 13, R, 9. Lush, suspended.', tip: 'IVmaj7/V bass = Snarky Puppy float chord' },
  ],
};

function PentatonicColorsSection({ root, quality }: { root: string; quality: string }) {
  const entries = PENT_MAP[quality];
  if (!entries || entries.length === 0) return null;

  return (
    <details style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '14px 16px' }}>
      <summary style={{ cursor: 'pointer', fontSize: 13, color: '#8b949e', fontWeight: 600, listStyle: 'none' }}>
        🎸 Pentatonic Colors — superimposition guide
      </summary>
      <p style={{ margin: '10px 0', fontSize: 12, color: '#6b7280', lineHeight: 1.5 }}>
        Each pentatonic scale, played over {root}{quality}, produces a distinct harmonic colour.
        All notes shown in the current root ({root}).
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map((entry, i) => {
          const pentRoot = transposeNote(root, entry.rootSemitones);
          const intervals = entry.type === 'minor' ? MINOR_PENT_INTERVALS : MAJOR_PENT_INTERVALS;
          const notes = intervals.map(s => transposeNote(pentRoot, s)).join('  ');
          const pentLabel = `${pentRoot} ${entry.type} pentatonic`;
          return (
            <div key={i} style={{
              background: '#0d1117', border: '1px solid #21262d',
              borderRadius: 8, padding: '10px 12px',
              display: 'grid', gridTemplateColumns: '180px 1fr', gap: 12, alignItems: 'start',
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#c4b5fd', marginBottom: 4 }}>{pentLabel}</div>
                <div style={{ fontSize: 12, color: '#6b7280', fontFamily: 'monospace', letterSpacing: 2 }}>{notes}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#e6edf3', marginBottom: 4 }}>{entry.color}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>💡 {entry.tip}</div>
              </div>
            </div>
          );
        })}
      </div>
    </details>
  );
}

// ─── Main Feature ────────────────────────────────────────────────────────────

type Mode = 'single' | 'progression';

const CHORD_FAMILIES = Object.keys(FAMILY_LABELS) as ChordFamily[];

export default function ScaleAdvisorFeature() {
  const { globalKey } = useGlobalKey();

  const saved = useRef(storageGet<SASession | null>(SA_KEY, null));

  const [mode, setMode] = useState<Mode>(saved.current?.mode ?? 'single');
  const [root, setRoot] = useState(saved.current?.root ?? globalKey);

  useEffect(() => { setRoot(globalKey); }, [globalKey]);
  const [quality, setQuality] = useState(saved.current?.quality ?? 'maj7');
  const [progressionText, setProgressionText] = useState(saved.current?.progressionText ?? 'Dm7 G7 Cmaj7');

  // Persist settings on change
  useEffect(() => {
    storageSet<SASession>(SA_KEY, { mode, root, quality, progressionText });
  }, [mode, root, quality, progressionText]);

  const selectedEntry = getChordScaleEntry(quality);

  const [parsedChords, setParsedChords] = useState<Array<{ root: string; quality: string; symbol: string }>>([]);
  const [parseError, setParseError] = useState('');

  function handleAnalyze() {
    const chords = parseProgression(progressionText);
    if (chords.length === 0) {
      setParseError('No chords recognised. Try: Dm7 G7 Cmaj7 or Cm7b5 F7alt Bbmaj7');
      setParsedChords([]);
    } else {
      setParseError('');
      setParsedChords(chords);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, color: '#e6edf3' }}>Scale Advisor</h2>
        <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
          Find the right scale for any chord — based on the chord-scale theory of modern jazz.
          Every chord and its scale share the same notes; the extensions determine the harmonic colour.
        </p>
      </div>

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 6 }}>
        {(['single', 'progression'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              padding: '8px 20px',
              background: mode === m ? '#7c3aed20' : '#161b22',
              border: `1px solid ${mode === m ? '#7c3aed' : '#30363d'}`,
              borderRadius: 8, cursor: 'pointer',
              color: mode === m ? '#c4b5fd' : '#6b7280',
              fontSize: 13, fontWeight: mode === m ? 600 : 400,
            }}
          >
            {m === 'single' ? '🎵 Single Chord' : '🎼 Progression'}
          </button>
        ))}
      </div>

      {mode === 'single' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Controls */}
          <div style={{
            background: '#161b22', border: '1px solid #30363d',
            borderRadius: 10, padding: '16px',
            display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start',
          }}>
            {/* Root selector */}
            <div style={{ flex: '1 1 140px' }}>
              <label style={{ display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 6 }}>
                Root Note
              </label>
              <select
                value={root}
                onChange={e => setRoot(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px',
                  background: '#0d1117', border: '1px solid #30363d',
                  borderRadius: 8, color: '#e6edf3', fontSize: 15, outline: 'none',
                }}
              >
                {ROOTS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* Quality selector */}
            <div style={{ flex: '1 1 100%' }}>
              <label style={{ display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 6 }}>
                Chord Type
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {CHORD_FAMILIES.map(family => (
                  <div key={family}>
                    <div style={{ fontSize: 10, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
                      {FAMILY_LABELS[family]}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {CHORD_SCALE_DATA.filter(e => e.family === family).map(e => (
                        <button
                          key={e.quality}
                          onClick={() => setQuality(e.quality)}
                          aria-pressed={quality === e.quality}
                          title={e.label}
                          style={{
                            padding: '6px 12px',
                            background: quality === e.quality ? '#1d4ed820' : '#0d1117',
                            border: `1px solid ${quality === e.quality ? '#3b82f6' : '#30363d'}`,
                            borderRadius: 8, cursor: 'pointer',
                            color: quality === e.quality ? '#93c5fd' : '#8b949e',
                            fontSize: 13, fontWeight: quality === e.quality ? 700 : 400,
                          }}
                        >
                          <span style={{ fontFamily: 'monospace' }}>{e.quality}</span>
                          <span style={{ fontSize: 11, color: '#4b5563', marginLeft: 6 }}>{e.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Result */}
          <div style={{
            background: '#161b22', border: '1px solid #30363d',
            borderRadius: 10, padding: '16px',
          }}>
            <div style={{ marginBottom: 16 }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#e6edf3' }}>
                {Chord.get(`${root}${quality}`).symbol || `${root}${quality}`}
              </span>
              <span style={{ marginLeft: 10, fontSize: 14, color: '#6b7280' }}>
                {selectedEntry?.label}
              </span>
              {selectedEntry && (
                <span style={{ marginLeft: 8, fontSize: 12, color: '#4b5563' }}>
                  — {selectedEntry.alternatives.length + 1} scales available
                </span>
              )}
              {selectedEntry?.summary && (
                <div style={{ marginTop: 6, fontSize: 12, color: '#8b949e', lineHeight: 1.5 }}>
                  {selectedEntry.summary}
                </div>
              )}
            </div>
            <ChordScalePanel root={root} quality={quality} />
          </div>
        </div>
      ) : (
        /* Progression mode */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{
            background: '#161b22', border: '1px solid #30363d',
            borderRadius: 10, padding: '16px',
          }}>
            <label style={{ display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 6 }}>
              Enter the progression (e.g. Dm7 G7 Cmaj7 · Cm7b5 F7alt Bbmaj7)
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                value={progressionText}
                onChange={e => setProgressionText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                placeholder="Dm7 G7 Cmaj7"
                style={{
                  flex: 1, padding: '10px 14px',
                  background: '#0d1117', border: '1px solid #30363d',
                  borderRadius: 8, color: '#e6edf3', fontSize: 15, outline: 'none',
                  fontFamily: 'monospace',
                }}
              />
              <button
                onClick={handleAnalyze}
                style={{
                  padding: '10px 24px', background: '#7c3aed', border: 'none',
                  borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}
              >
                Analyze
              </button>
            </div>

            {/* Quick examples */}
            <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: '#4b5563' }}>Examples:</span>
              {[
                'Dm7 G7 Cmaj7',
                'Cm7b5 F7alt Bbmaj7',
                'Dm7 G7alt Cmaj7 A7alt',
                'Fmaj7 Em7b5 A7alt Dm7',
                'Cmaj7 Am7 Dm7 G7',
              ].map(ex => (
                <button
                  key={ex}
                  onClick={() => { setProgressionText(ex); setParsedChords([]); setParseError(''); }}
                  style={{
                    fontSize: 11, padding: '2px 8px',
                    background: 'none', border: '1px solid #30363d',
                    borderRadius: 4, color: '#8b949e', cursor: 'pointer',
                    fontFamily: 'monospace',
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>

            {parseError && (
              <div style={{ marginTop: 10, color: '#ef4444', fontSize: 12 }}>{parseError}</div>
            )}
          </div>

          {parsedChords.length > 0 && (
            <>
              {/* Legend */}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 11, color: '#6b7280' }}>
                {[
                  { color: '#f59e0b', label: 'Root' },
                  { color: '#a78bfa', label: 'Chord tones' },
                  { color: '#06b6d4', label: 'Good extensions' },
                  { color: '#ef4444', label: 'Avoid notes' },
                  { color: '#6b7280', label: 'Passing tones' },
                ].map(({ color, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
                    {label}
                  </div>
                ))}
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {parsedChords.map((chord, i) => (
                  <ProgressionChordCard key={i} index={i} {...chord} />
                ))}
              </div>

              {/* Detailed breakdown */}
              <details style={{
                background: '#161b22', border: '1px solid #30363d',
                borderRadius: 10, padding: '14px 16px',
              }}>
                <summary style={{ cursor: 'pointer', fontSize: 13, color: '#8b949e', fontWeight: 600, listStyle: 'none' }}>
                  🔍 Full scale breakdown for each chord
                </summary>
                <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {parsedChords.map((chord, i) => (
                    <div key={i}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#e6edf3', marginBottom: 10 }}>
                        #{i + 1} — {chord.symbol}
                      </div>
                      <ChordScalePanel root={chord.root} quality={chord.quality} />
                    </div>
                  ))}
                </div>
              </details>
            </>
          )}
        </div>
      )}

      {/* Theory box */}
      <details style={{
        background: '#161b22', border: '1px solid #30363d',
        borderRadius: 10, padding: '14px 16px',
      }}>
        <summary style={{ cursor: 'pointer', fontSize: 13, color: '#8b949e', fontWeight: 600, listStyle: 'none' }}>
          📖 Chord-Scale Theory: how it works
        </summary>
        <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
          {[
            {
              title: 'Fixed vs Floating Extensions',
              text: 'Chords with fixed extensions (maj7, m7, unaltered 7) have predictable 9, 11, 13 from the scale. Altered dominants (7alt) have floating extensions — b9/♯9 and b13/♯11 are interchangeable depending on context.',
            },
            {
              title: 'The Melodic Minor Family',
              text: 'Melodic Minor is the "mother" of several important scales: play it from the P5 above for Lydian Dominant (on V7), from the b2 above for Altered (on 7alt), from the min. 3rd above for Locrian ♯2 (on ø), from the maj. 6th above for Lydian Augmented (on maj7♯5).',
            },
            {
              title: 'Guide Tones',
              text: 'The 3rd and 7th of every chord are the "guide tones." Moving them by step between adjacent chords creates smooth voice leading — the foundation of jazz harmony.',
            },
            {
              title: 'Dorian vs Aeolian vs Phrygian',
              text: 'All three work on m7. Dorian (nat. 6th) = warm, jazz-funk. Aeolian (b6) = darker, rock/pop. Phrygian (b2 + b6) = darkest, Spanish/film. The choice changes the emotional weight of the chord.',
            },
            {
              title: 'Avoid Notes',
              text: '"Avoid notes" are not forbidden — they are notes to avoid sustaining directly against a chord tone. Used as passing notes, grace notes, or brief touches they add colour without creating clashes.',
            },
            {
              title: 'Whole Tone vs Altered',
              text: 'Both work on 7alt chords, but differently. Altered gives b9, ♯9, ♯11, b13 — maximum tension. Whole Tone gives natural 9, ♯11, b13 — softer, more impressionistic. Debussy vs Coltrane.',
            },
          ].map(({ title, text }) => (
            <div key={title} style={{
              background: '#0d1117', border: '1px solid #30363d',
              borderRadius: 8, padding: '10px 12px',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3', marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.6 }}>{text}</div>
            </div>
          ))}
        </div>
      </details>

      {/* Pentatonic Colors — only in single mode */}
      {mode === 'single' && (
        <PentatonicColorsSection root={root} quality={quality} />
      )}
    </div>
  );
}
