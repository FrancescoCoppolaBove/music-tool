import { useEffect, useRef, useState } from 'react';
import { Note, Scale, ScaleType } from 'tonal';
import { audioPlayer } from '@shared/utils/chordAudio';

export default function ScaleComparison({ tonic, name }: { tonic: string; name: string }) {
  const [other, setOther] = useState('dorian');
  const [playing, setPlaying] = useState(false);
  const player = useRef<{ stop: () => void } | null>(null);
  const left = Scale.get(`${tonic} ${name}`).notes;
  const right = Scale.get(`${tonic} ${other}`).notes;
  const removed = left.filter(note => !right.some(n => Note.chroma(n) === Note.chroma(note)));
  const added = right.filter(note => !left.some(n => Note.chroma(n) === Note.chroma(note)));
  useEffect(() => () => player.current?.stop(), []);
  useEffect(() => { player.current?.stop(); }, [tonic, name, other]);
  function play(notes: string[]) {
    player.current?.stop();
    let previous = -1;
    const pitches = [...notes, notes[0]].filter(Boolean).map(note => {
      let octave = 4;
      while ((Note.midi(`${note}${octave}`) ?? 0) <= previous) octave++;
      previous = Note.midi(`${note}${octave}`) ?? previous;
      return `${note}${octave}`;
    });
    setPlaying(true); player.current = audioPlayer.playPhrase(pitches, 0.5, () => setPlaying(false));
  }
  return <details style={{ marginTop: 14, color: '#e6edf3' }}>
    <summary style={{ cursor: 'pointer' }}>Compare and listen at the same tonic</summary>
    <label>Compare with <select value={other} onChange={e => setOther(e.target.value)}>{ScaleType.all().filter(s => !s.empty).map(scale => <option key={scale.name} value={scale.name}>{scale.name}</option>)}</select></label>
    <p>{tonic} {name}: {left.join(' · ')} <button onClick={() => play(left)}>▶ Hear selected scale</button></p>
    <p>{tonic} {other}: {right.join(' · ')} <button onClick={() => play(right)}>▶ Hear comparison</button></p>
    <p>Notes removed: {removed.join(', ') || 'none'} · Notes added: {added.join(', ') || 'none'}</p>
    <button disabled={!playing} onClick={() => player.current?.stop()}>Stop</button>
  </details>;
}
