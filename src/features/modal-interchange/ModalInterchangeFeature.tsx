import { useState, useMemo } from 'react';
import { Scale, Chord, Note } from 'tonal';

const KEYS = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

const MODES = [
  { name: 'dorian',        label: 'Dorian',      color: '#06b6d4' },
  { name: 'phrygian',      label: 'Phrygian',    color: '#f59e0b' },
  { name: 'lydian',        label: 'Lydian',      color: '#10b981' },
  { name: 'mixolydian',    label: 'Mixolydian',  color: '#8b5cf6' },
  { name: 'aeolian',       label: 'Aeolian',     color: '#ef4444' },
  { name: 'locrian',       label: 'Locrian',     color: '#6b7280' },
  { name: 'harmonic minor', label: 'Harm. Minor', color: '#ec4899' },
  { name: 'melodic minor',  label: 'Mel. Minor',  color: '#f97316' },
];

// Well-known borrowed chord annotations — curated musical knowledge
const COMMON_BORROWED: Record<string, { from: string; description: string }> = {
  '♭VII_major_Mixolydian': { from: 'Mixolydian / Aeolian', description: '♭VII major — very common borrowed chord in rock/pop (e.g., Bb in C major)' },
  '♭VI_major_Aeolian':     { from: 'Aeolian / Phrygian',   description: '♭VI major — dark, cinematic color (e.g., Ab in C major)' },
  '♭III_major_Aeolian':    { from: 'Aeolian',              description: '♭III major — minor modal interchange (e.g., Eb in C major)' },
  'iv_minor_Aeolian':      { from: 'Aeolian / Dorian',     description: 'iv minor — substitutes IV major for a darker, sadder feel (e.g., Fm in C major)' },
  'II_major_Lydian':       { from: 'Lydian',               description: '♯IV (II of Lydian) — bright Lydian color chord' },
};

interface ModeChord {
  degree: number;
  root: string;
  symbol: string;
  notes: string[];
  isBorrowed: boolean;
}

function buildModeChords(root: string, modeName: string, homeKey: string): ModeChord[] {
  const scaleName = `${root} ${modeName}`;
  const scaleData = Scale.get(scaleName);
  if (scaleData.empty || scaleData.notes.length < 7) return [];

  const notes = scaleData.notes;

  // Get home key diatonic notes for "borrowed" detection
  const homeScaleData = Scale.get(`${homeKey} major`);
  const homeNoteSet = new Set(homeScaleData.notes.map(n => Note.pitchClass(n)));

  return notes.map((chordRoot, i) => {
    const third   = notes[(i + 2) % notes.length];
    const fifth   = notes[(i + 4) % notes.length];
    const seventh = notes[(i + 6) % notes.length];

    const chordNotes = [chordRoot, third, fifth, seventh];
    const detected = Chord.detect(chordNotes);
    const symbol = detected[0] ?? chordRoot;

    // A chord is "borrowed" if its root is NOT in the home key
    const isBorrowed = !homeNoteSet.has(Note.pitchClass(chordRoot));

    return { root: chordRoot, symbol, notes: chordNotes, isBorrowed, degree: i + 1 };
  });
}

export default function ModalInterchangeFeature() {
  const [selectedKey, setSelectedKey] = useState('C');
  const [selectedModes, setSelectedModes] = useState<string[]>(['aeolian', 'dorian', 'mixolydian']);
  const [showAll, setShowAll] = useState(false);
  const [focusedChord, setFocusedChord] = useState<{ symbol: string; mode: string; desc?: string } | null>(null);

  const homeChords = useMemo(
    () => buildModeChords(selectedKey, 'major', selectedKey),
    [selectedKey]
  );

  const homeSymbols = useMemo(() => new Set(homeChords.map(c => c.symbol)), [homeChords]);

  const modeData = useMemo(() => {
    const sources = showAll ? MODES : MODES.filter(m => selectedModes.includes(m.name));
    return sources.map(mode => ({
      mode,
      chords: buildModeChords(selectedKey, mode.name, selectedKey),
    }));
  }, [selectedKey, selectedModes, showAll]);

  function toggleMode(name: string) {
    setSelectedModes(prev => prev.includes(name) ? prev.filter(m => m !== name) : [...prev, name]);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, color: '#e6edf3' }}>Modal Interchange</h2>
        <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
          Borrow chords from parallel modes to add color and tension. Highlighted chords (glowing border) don't naturally occur in your home major key.
        </p>
      </div>

      {/* Controls */}
      <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Key */}
        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 6 }}>Home Key (Major)</label>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {KEYS.map(k => (
              <button key={k} onClick={() => setSelectedKey(k)} style={{
                padding: '5px 10px',
                background: selectedKey === k ? '#1d4ed820' : '#0d1117',
                border: `1px solid ${selectedKey === k ? '#3b82f6' : '#30363d'}`,
                borderRadius: 6, color: selectedKey === k ? '#93c5fd' : '#6b7280',
                fontSize: 12, cursor: 'pointer', fontWeight: selectedKey === k ? 700 : 400, fontFamily: 'monospace',
              }}>{k}</button>
            ))}
          </div>
        </div>

        {/* Mode filter */}
        {!showAll && (
          <div>
            <label style={{ display: 'block', fontSize: 12, color: '#8b949e', marginBottom: 6 }}>Show modes</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {MODES.map(mode => {
                const isOn = selectedModes.includes(mode.name);
                return (
                  <button key={mode.name} onClick={() => toggleMode(mode.name)} style={{
                    padding: '4px 10px',
                    background: isOn ? `${mode.color}20` : 'none',
                    border: `1px solid ${isOn ? mode.color : '#30363d'}`,
                    borderRadius: 5, color: isOn ? mode.color : '#6b7280',
                    fontSize: 12, cursor: 'pointer',
                  }}>{mode.label}</button>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowAll(!showAll)} style={{
            padding: '6px 14px',
            background: showAll ? '#1c2128' : 'none',
            border: `1px solid ${showAll ? '#7c3aed' : '#30363d'}`,
            borderRadius: 6, color: showAll ? '#c4b5fd' : '#6b7280',
            fontSize: 12, cursor: 'pointer',
          }}>
            {showAll ? '✓ Show all modes' : 'Show all modes'}
          </button>
        </div>
      </div>

      {/* Home key chords */}
      <div style={{ background: '#161b22', border: '1px solid #10b981', borderRadius: 10, padding: '14px 16px' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#10b981', marginBottom: 10 }}>
          🏠 {selectedKey} Major (home key) — diatonic chords
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {homeChords.map((c, i) => (
            <div key={i} style={{
              padding: '6px 12px', background: '#0d1117', border: '1px solid #10b98140',
              borderRadius: 6, textAlign: 'center',
            }}>
              <div style={{ fontSize: 10, color: '#10b981' }}>
                {['I','II','III','IV','V','VI','VII'][i]}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'monospace', color: '#e6edf3' }}>
                {c.symbol}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Focused chord tooltip — always rendered to prevent layout shift */}
      <div style={{
        background: '#1c2128',
        border: '1px solid #7c3aed',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 13,
        color: '#c4b5fd',
        opacity: focusedChord ? 1 : 0,
        transition: 'opacity 0.15s',
        pointerEvents: 'none',
      }}>
        <strong>{focusedChord?.symbol ?? '—'}</strong>
        {focusedChord && <> from <em>{focusedChord.mode}</em></>}
        <div style={{ fontSize: 12, color: '#8b949e', marginTop: 4 }}>
          {focusedChord?.desc ?? ' '}
        </div>
      </div>

      {/* Modal interchange table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {modeData.map(({ mode, chords }) => {
          const borrowedChords = chords.filter(c => !homeSymbols.has(c.symbol));
          if (chords.length === 0) return null;
          return (
            <div key={mode.name} style={{
              background: '#0d1117', border: `1px solid ${mode.color}30`,
              borderRadius: 10, padding: '12px 14px',
            }}>
              {/* Mode header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', background: mode.color, flexShrink: 0,
                }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: mode.color }}>{selectedKey} {mode.label}</span>
                {borrowedChords.length > 0 && (
                  <span style={{
                    fontSize: 11, padding: '1px 7px', background: `${mode.color}20`,
                    border: `1px solid ${mode.color}`, borderRadius: 10, color: mode.color,
                  }}>
                    {borrowedChords.length} borrowed chord{borrowedChords.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>

              {/* Chords */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {chords.map((chord, i) => {
                  const isBorrowed = !homeSymbols.has(chord.symbol);
                  return (
                    <button
                      key={i}
                      onMouseEnter={() => setFocusedChord({
                        symbol: chord.symbol,
                        mode: mode.label,
                        desc: isBorrowed ? `Borrowed from ${mode.label} — not in ${selectedKey} major` : `Also in ${selectedKey} major`,
                      })}
                      onMouseLeave={() => setFocusedChord(null)}
                      onClick={() => setFocusedChord(prev =>
                        prev?.symbol === chord.symbol ? null : {
                          symbol: chord.symbol,
                          mode: mode.label,
                          desc: isBorrowed ? `Borrowed from ${mode.label} — not in ${selectedKey} major` : `Also in ${selectedKey} major`,
                        }
                      )}
                      style={{
                        padding: '8px 12px', borderRadius: 8, cursor: 'pointer', textAlign: 'center',
                        background: isBorrowed ? `${mode.color}15` : '#161b22',
                        border: `1px solid ${isBorrowed ? mode.color : '#30363d'}`,
                        boxShadow: isBorrowed ? `0 0 8px ${mode.color}25` : 'none',
                        transition: 'all 0.1s',
                      }}
                    >
                      <div style={{ fontSize: 10, color: isBorrowed ? mode.color : '#4b5563' }}>
                        {['I','II','III','IV','V','VI','VII'][i] ?? String(i + 1)}
                      </div>
                      <div style={{
                        fontSize: 15, fontWeight: 700, fontFamily: 'monospace',
                        color: isBorrowed ? '#e6edf3' : '#6b7280',
                      }}>
                        {chord.symbol}
                      </div>
                      {isBorrowed && (
                        <div style={{ fontSize: 9, color: mode.color, marginTop: 2 }}>borrowed</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Common borrowed chords guide */}
      <details style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 10, padding: '14px 16px' }}>
        <summary style={{ cursor: 'pointer', fontSize: 13, color: '#8b949e', fontWeight: 600, listStyle: 'none' }}>
          📖 Most Common Borrowed Chords Guide
        </summary>
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[
            { chord: '♭VII (e.g., B♭ in C)', from: 'Mixolydian / Aeolian', use: 'Rock power move. The chord before I. Used by The Beatles, Led Zeppelin.' },
            { chord: '♭VI (e.g., A♭ in C)', from: 'Aeolian', use: 'Cinematic, dark-epic feel. Common in film scores and modern pop ballads.' },
            { chord: '♭III (e.g., E♭ in C)', from: 'Aeolian', use: 'Adds minor modal colour. Common in jazz and indie rock.' },
            { chord: 'iv minor (e.g., Fm in C)', from: 'Aeolian / Dorian', use: 'The saddest borrowed chord. iv–I is a signature of gospel and soul.' },
            { chord: '♭II (e.g., D♭ in C)', from: 'Phrygian', use: 'Neapolitan chord. Dramatic tension before V or I. Common in classical and flamenco.' },
            { chord: 'II major (e.g., D in C)', from: 'Lydian', use: 'Lydian color. Bright, floating feel. Jacob Collier, Joe Hisaishi.' },
          ].map(({ chord, from, use }, i) => (
            <div key={i} style={{
              background: '#0d1117', border: '1px solid #21262d', borderRadius: 8, padding: '10px 12px',
              display: 'flex', gap: 12, flexWrap: 'wrap',
            }}>
              <div style={{ minWidth: 120, flexShrink: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#e6edf3', fontFamily: 'monospace' }}>{chord}</div>
                <div style={{ fontSize: 11, color: '#7c3aed' }}>from {from}</div>
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', flex: 1 }}>{use}</div>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
