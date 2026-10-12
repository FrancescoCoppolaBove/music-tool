import { useState } from 'react';
import { getDiatonicSeventhChords } from '../harmony-composition-lab/musicTheory';
const EMOTIONS = ['Joy', 'Nostalgia', 'Melancholy', 'Sensuality', 'Mystery', 'Tension', 'Serenity', 'Hope', 'Determination', 'Euphoria', 'Introspection', 'Suspension', 'Aggression', 'Tenderness', 'Solemnity', 'Vulnerability', 'Release', 'Contemplation', 'Movement'];
const EXPRESSIVE_PATHS = [
  { id: 'dorian-pocket', title: 'Dorian pocket', mode: 'dorian', emotions: ['Nostalgia', 'Sensuality', 'Determination', 'Introspection', 'Movement'], reason: 'The minor third and minor seventh set a minor frame, while the natural sixth can keep a vamp mobile and less closed than natural minor.', intervals: '1 · 2 · ♭3 · 4 · 5 · 6 · ♭7', degrees: [0, 3], register: 'Keep the bass in a stable low-mid register; let the natural 6th sit in the melody or upper chord voice.', groove: 'Try a relaxed 16th-note pocket around 90–105 BPM, leaving space between bass accents.', instruments: 'Rhodes or clean guitar for the vamp; bass and a restrained tenor line can emphasize the 6th.', avoid: 'Avoid crowding every beat with chord changes; the modal color needs time to register.' },
  { id: 'aeolian-lyric', title: 'Aeolian lyric', mode: 'minor', emotions: ['Melancholy', 'Nostalgia', 'Vulnerability', 'Tenderness', 'Contemplation'], reason: 'The minor third, flat sixth, and flat seventh create a consistent natural-minor palette. A descending line can foreground the flat sixth.', intervals: '1 · 2 · ♭3 · 4 · 5 · ♭6 · ♭7', degrees: [0, 5], register: 'Use a middle register for the melody, with a warm low tonic and room above it.', groove: 'Try a sparse half-time pulse or a gentle 6/8 sway; articulation changes the result as much as harmony.', instruments: 'Piano or Rhodes, soft bass, and voice or muted horn with sustained notes.', avoid: 'A strong leading tone can change the minor-key pull; include it deliberately when you want that directed cadence.' },
  { id: 'lydian-open', title: 'Lydian open color', mode: 'lydian', emotions: ['Hope', 'Joy', 'Serenity', 'Suspension', 'Euphoria'], reason: 'The raised fourth distinguishes Lydian from Ionian. Holding that pitch over a tonic major chord can keep the harmony open rather than forcing a cadence.', intervals: '1 · 2 · 3 · ♯4 · 5 · 6 · 7', degrees: [0, 1], register: 'Let the raised fourth live in the upper middle register, away from a dense low voicing.', groove: 'Try a spacious straight eighth groove, or a slow pulse with long chord durations.', instruments: 'Piano, guitar harmonics, or a sustained synth pad can expose the ♯4 clearly.', avoid: 'A prominent perfect fourth in the melody or voicing can obscure the defining ♯4; choose the clash intentionally.' },
  { id: 'phrygian-edge', title: 'Phrygian edge', mode: 'phrygian', emotions: ['Mystery', 'Tension', 'Aggression', 'Solemnity'], reason: 'The semitone above the tonic (♭2) is the defining color. Repeating it against a tonic pedal makes the modal tension audible.', intervals: '1 · ♭2 · ♭3 · 4 · 5 · ♭6 · ♭7', degrees: [0, 1], register: 'Keep the tonic pedal low and place the ♭2 in a clear upper voice.', groove: 'Try a measured ostinato with a strong downbeat and short rests around the ♭2.', instruments: 'Low piano or bass pedal with a focused guitar, voice, or horn motif.', avoid: 'Do not treat the ♭2 as an error to resolve automatically; its duration and placement define the effect.' },
  { id: 'mixolydian-release', title: 'Mixolydian release', mode: 'mixolydian', emotions: ['Release', 'Joy', 'Determination', 'Euphoria', 'Movement'], reason: 'The flat seventh gives the tonic a dominant quality without requiring a conventional V–I cadence. A tonic/flat-VII exchange keeps the center clear.', intervals: '1 · 2 · 3 · 4 · 5 · 6 · ♭7', degrees: [0, 6], register: 'Use a broad midrange chord and let the bass state the tonic plainly.', groove: 'Try a syncopated funk pattern or a buoyant shuffle; short chord stabs make the flat seventh pop.', instruments: 'Guitar or Rhodes stabs, bass riff, and a compact horn answer.', avoid: 'Repeated leading-tone motion can pull the ear toward major-key functional harmony; use it only when that pull is wanted.' },
];
const styles: React.CSSProperties = {
  background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: 18,
};
const buttonStyle: React.CSSProperties = {
  background: '#21262d', color: '#e6edf3', border: '1px solid #30363d', borderRadius: 8,
  padding: '8px 12px', cursor: 'pointer', font: 'inherit',
};

export default function ExpressiveDirections({ tonic, onChoose }: { tonic: string; onChoose: (mode: string, chords: string[], title: string) => void }) {
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const expressivePaths = EXPRESSIVE_PATHS.filter(path => !selectedEmotions.length || path.emotions.some(emotion => selectedEmotions.includes(emotion)));
  return (
      <section style={{ ...styles, display: 'grid', gap: 14 }}>
        <div><h2 style={{ margin: '0 0 4px', fontSize: 18 }}>Emotional harmony map</h2>
          <p style={{ margin: 0, color: '#8b949e', fontSize: 12 }}>Choose one or more expressive directions. These are compositional starting points, not universal or scientifically fixed meanings for keys or modes.</p></div>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }} aria-label="Select expressive directions">
          {EMOTIONS.map(emotion => { const selected = selectedEmotions.includes(emotion); return <button key={emotion} type="button" aria-pressed={selected} onClick={() => setSelectedEmotions(current => selected ? current.filter(item => item !== emotion) : [...current, emotion])} style={{ ...buttonStyle, borderColor: selected ? '#a78bfa' : '#30363d', background: selected ? '#2b2142' : '#0d1117' }}>{emotion}</button>; })}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 10 }}>
          {expressivePaths.map(path => {
            const suggestedChords = getDiatonicSeventhChords(tonic, path.mode);
            const vamp = path.degrees.map(degree => suggestedChords[degree]).filter(Boolean);
            return <article key={path.id} style={{ background: '#0d1117', border: '1px solid #30363d', borderRadius: 9, padding: 13, display: 'grid', gap: 8 }}>
              <div><h3 style={{ margin: 0, fontSize: 15 }}>{path.title}</h3><div style={{ color: '#a78bfa', fontSize: 11, marginTop: 4 }}>{path.emotions.filter(emotion => !selectedEmotions.length || selectedEmotions.includes(emotion)).join(' · ')}</div></div>
              <div style={{ color: '#cbd5e1', fontSize: 12, lineHeight: 1.5 }}>{path.reason}</div>
              <div style={{ fontSize: 12 }}><strong>Color tones: </strong><span style={{ color: '#c4b5fd', fontFamily: 'monospace' }}>{path.intervals}</span></div>
              <div style={{ fontSize: 12 }}><strong>Try: </strong><span style={{ color: '#c4b5fd', fontFamily: 'monospace' }}>{vamp.length ? vamp.join(' → ') : `${tonic} ${path.mode}`}</span></div>
              <div style={{ color: '#8b949e', fontSize: 12, lineHeight: 1.5 }}><strong>Register: </strong>{path.register}</div>
              <div style={{ color: '#8b949e', fontSize: 12, lineHeight: 1.5 }}><strong>Ensemble: </strong>{path.instruments}</div>
              <div style={{ color: '#8b949e', fontSize: 12, lineHeight: 1.5 }}><strong>Watch for: </strong>{path.avoid}</div>
              <button type="button" style={{ ...buttonStyle, justifySelf: 'start', borderColor: '#7c3aed' }} onClick={() => onChoose(path.mode, vamp, path.title)}>Use as starting point</button>
            </article>;
          })}
          {!expressivePaths.length && <div style={{ color: '#8b949e', fontSize: 13 }}>No curated direction matches that combination yet. Clear a selection to browse all starting points.</div>}
        </div>
      </section>

);
}
