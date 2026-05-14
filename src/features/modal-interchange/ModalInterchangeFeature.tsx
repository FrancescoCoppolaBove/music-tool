import { useState, useMemo } from 'react';
import { noteToSemitone, semitoneToNote, notePreferFlat, getScaleNotes } from '@shared/utils/musicTheory';

const KEYS = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

// The 7 diatonic modes (same root)
const PARALLEL_MODES = [
  { id: 'major',      name: 'Ionian (Major)',       intervals: [0,2,4,5,7,9,11],  color: '#10b981' },
  { id: 'dorian',     name: 'Dorian',               intervals: [0,2,3,5,7,9,10],  color: '#3b82f6' },
  { id: 'phrygian',   name: 'Phrygian',             intervals: [0,1,3,5,7,8,10],  color: '#8b5cf6' },
  { id: 'lydian',     name: 'Lydian',               intervals: [0,2,4,6,7,9,11],  color: '#f59e0b' },
  { id: 'mixolydian', name: 'Mixolydian',           intervals: [0,2,4,5,7,9,10],  color: '#f97316' },
  { id: 'aeolian',    name: 'Aeolian (Nat. Minor)', intervals: [0,2,3,5,7,8,10],  color: '#06b6d4' },
  { id: 'locrian',    name: 'Locrian',              intervals: [0,1,3,5,6,8,10],  color: '#ec4899' },
];

// Additional commonly borrowed sources
const EXTRA_SOURCES = [
  { id: 'harmonicMinor', name: 'Harmonic Minor',    intervals: [0,2,3,5,7,8,11],  color: '#84cc16' },
  { id: 'melodicMinor',  name: 'Melodic Minor',     intervals: [0,2,3,5,7,9,11],  color: '#6366f1' },
  { id: 'majorPenta',    name: 'Major Pentatonic',  intervals: [0,2,4,7,9],        color: '#ef4444' },
  { id: 'minorPenta',    name: 'Minor Pentatonic',  intervals: [0,3,5,7,10],       color: '#a855f7' },
];

const ALL_SOURCES = [...PARALLEL_MODES, ...EXTRA_SOURCES];

// Well-known borrowed chord annotations
const COMMON_BORROWED: Record<string, { from: string; description: string }> = {
  '♭VII_major_Mixolydian': { from: 'Mixolydian / Aeolian', description: '♭VII major — very common borrowed chord in rock/pop (e.g., Bb in C major)' },
  '♭VI_major_Aeolian':     { from: 'Aeolian / Phrygian',   description: '♭VI major — dark, cinematic color (e.g., Ab in C major)' },
  '♭III_major_Aeolian':    { from: 'Aeolian',              description: '♭III major — minor modal interchange (e.g., Eb in C major)' },
  'iv_minor_Aeolian':      { from: 'Aeolian / Dorian',     description: 'iv minor — substitutes IV major for a darker, sadder feel (e.g., Fm in C major)' },
  'II_major_Lydian':       { from: 'Lydian',               description: '♯IV (II of Lydian) — bright Lydian color chord' },
};

function detectTriadQuality(t3: number, t5: number) {
  if (t3 === 4 && t5 === 7)  return { q: 'maj', minor: false };
  if (t3 === 3 && t5 === 7)  return { q: 'm', minor: true };
  if (t3 === 3 && t5 === 6)  return { q: 'dim', minor: true };
  if (t3 === 4 && t5 === 8)  return { q: 'aug', minor: false };
  return { q: 'maj', minor: false };
}

function detect7thQuality(t3: number, t5: number, t7: number) {
  if (t3 === 4 && t5 === 7 && t7 === 11) return 'maj7';
  if (t3 === 4 && t5 === 7 && t7 === 10) return '7';
  if (t3 === 3 && t5 === 7 && t7 === 10) return 'm7';
  if (t3 === 3 && t5 === 7 && t7 === 11) return 'mMaj7';
  if (t3 === 3 && t5 === 6 && t7 === 10) return 'm7b5';
  if (t3 === 3 && t5 === 6 && t7 === 9)  return 'dim7';
  if (t3 === 4 && t5 === 8 && t7 === 11) return 'augMaj7';
  if (t3 === 4 && t5 === 8 && t7 === 10) return '7#5';
  return 'maj7';
}

interface ModeChord {
  degreeNum: number;
  root: string;
  quality: string;
  symbol: string;
  notes: string[];
  isBorrowed: boolean;  // Not in Ionian (home major scale)
}

function buildModeChords(key: string, modeIntervals: number[], homeIntervals: number[]): ModeChord[] {
  const n = modeIntervals.length;
  if (n < 5) return [];
  const ks = noteToSemitone(key);
  const pf = notePreferFlat(key);

  // Semitone sets for home key
  const homeSet = new Set(homeIntervals.map(i => (ks + i) % 12));

  return modeIntervals.map((degInt, di) => {
    const degRootSem = (ks + degInt) % 12;
    const degRoot = semitoneToNote(degRootSem, pf);

    const thirdInt = n >= 3 ? modeIntervals[(di + 2) % n] : modeIntervals[(di + 1) % n];
    const fifthInt = n >= 5 ? modeIntervals[(di + 4) % n] : modeIntervals[(di + 2) % n];
    const seventhInt = n >= 7 ? modeIntervals[(di + 6) % n] : null;

    const t3 = ((thirdInt - degInt) + 120) % 12;
    const t5 = ((fifthInt - degInt) + 120) % 12;

    let quality: string;
    if (seventhInt !== null) {
      const t7 = ((seventhInt - degInt) + 120) % 12;
      quality = detect7thQuality(t3, t5, t7);
    } else {
      quality = detectTriadQuality(t3, t5).q;
    }

    const symbol = `${degRoot}${quality === 'maj' ? '' : quality}`;
    const noteInts = seventhInt !== null
      ? [0, t3, t5, ((seventhInt - degInt) + 120) % 12]
      : [0, t3, t5];
    const notes = noteInts.map(i => semitoneToNote((degRootSem + i) % 12, pf));

    // Is this chord "borrowed"? Root not in home key OR chord quality differs from home
    const isBorrowed = !homeSet.has(degRootSem);

    return { degreeNum: di + 1, root: degRoot, quality, symbol, notes, isBorrowed };
  });
}

const HOME_MODE = PARALLEL_MODES[0]; // Ionian = home

export default function ModalInterchangeFeature() {
  const [selectedKey, setSelectedKey] = useState('C');
  const [selectedModes, setSelectedModes] = useState<string[]>(['aeolian', 'dorian', 'mixolydian']);
  const [showAll, setShowAll] = useState(false);
  const [focusedChord, setFocusedChord] = useState<{ symbol: string; mode: string; desc?: string } | null>(null);

  const homeChords = useMemo(
    () => buildModeChords(selectedKey, HOME_MODE.intervals, HOME_MODE.intervals),
    [selectedKey]
  );

  const homeSymbols = useMemo(() => new Set(homeChords.map(c => c.symbol)), [homeChords]);

  const modeData = useMemo(() => {
    const sources = showAll ? ALL_SOURCES : ALL_SOURCES.filter(m => m.id !== 'major' && selectedModes.includes(m.id));
    return sources.map(mode => ({
      mode,
      chords: buildModeChords(selectedKey, mode.intervals, HOME_MODE.intervals),
      notes: getScaleNotes(selectedKey, mode.id),
    }));
  }, [selectedKey, selectedModes, showAll]);

  function toggleMode(id: string) {
    setSelectedModes(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
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
              {ALL_SOURCES.filter(m => m.id !== 'major').map(mode => {
                const isOn = selectedModes.includes(mode.id);
                return (
                  <button key={mode.id} onClick={() => toggleMode(mode.id)} style={{
                    padding: '4px 10px',
                    background: isOn ? `${mode.color}20` : 'none',
                    border: `1px solid ${isOn ? mode.color : '#30363d'}`,
                    borderRadius: 5, color: isOn ? mode.color : '#6b7280',
                    fontSize: 12, cursor: 'pointer',
                  }}>{mode.name}</button>
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

      {/* Focused chord tooltip */}
      {focusedChord && (
        <div style={{
          background: '#1c2128', border: '1px solid #7c3aed', borderRadius: 8,
          padding: '10px 14px', fontSize: 13, color: '#c4b5fd',
        }}>
          <strong>{focusedChord.symbol}</strong> from <em>{focusedChord.mode}</em>
          {focusedChord.desc && <div style={{ fontSize: 12, color: '#8b949e', marginTop: 4 }}>{focusedChord.desc}</div>}
        </div>
      )}

      {/* Modal interchange table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {modeData.map(({ mode, chords }) => {
          const borrowedChords = chords.filter(c => !homeSymbols.has(c.symbol));
          if (chords.length === 0) return null;
          return (
            <div key={mode.id} style={{
              background: '#0d1117', border: `1px solid ${mode.color}30`,
              borderRadius: 10, padding: '12px 14px',
            }}>
              {/* Mode header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%', background: mode.color, flexShrink: 0,
                }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: mode.color }}>{selectedKey} {mode.name}</span>
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
                        mode: mode.name,
                        desc: isBorrowed ? `Borrowed from ${mode.name} — not in ${selectedKey} major` : `Also in ${selectedKey} major`,
                      })}
                      onMouseLeave={() => setFocusedChord(null)}
                      onClick={() => setFocusedChord(prev =>
                        prev?.symbol === chord.symbol ? null : {
                          symbol: chord.symbol,
                          mode: mode.name,
                          desc: isBorrowed ? `Borrowed from ${mode.name} — not in ${selectedKey} major` : `Also in ${selectedKey} major`,
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
