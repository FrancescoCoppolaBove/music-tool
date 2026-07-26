import { useMemo, useRef, useState, useEffect } from 'react';
import { MODULATION_CYCLES, generateCycle } from '../services/modulationCycles';
import { playChordSequence, type SequenceHandle } from '@shared/utils/chordAudio';

const KEYS = ['C', 'C#', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export default function ModulationCycles() {
  const [cycleId, setCycleId] = useState(MODULATION_CYCLES[0].id);
  const [startKey, setStartKey] = useState('C');
  const def = MODULATION_CYCLES.find(c => c.id === cycleId)!;
  const [cycles, setCycles] = useState(def.defaultCycles);
  const [playingFlatIndex, setPlayingFlatIndex] = useState<number | null>(null);
  const [bpm, setBpm] = useState(100);
  const handleRef = useRef<SequenceHandle | null>(null);

  const result = useMemo(
    () => generateCycle(cycleId, startKey, cycles),
    [cycleId, startKey, cycles],
  );

  useEffect(() => () => handleRef.current?.stop(), []);
  useEffect(() => { handleRef.current?.stop(); }, [cycleId, startKey, cycles]);

  const flatChords = useMemo(
    () => (result ? result.steps.flatMap(s => s.chords) : []),
    [result],
  );

  const isPlaying = playingFlatIndex !== null;

  function togglePlay() {
    if (isPlaying) {
      handleRef.current?.stop();
      return;
    }
    handleRef.current = playChordSequence(
      flatChords,
      bpm,
      i => setPlayingFlatIndex(i),
      () => setPlayingFlatIndex(null),
    );
  }

  function selectCycle(id: string) {
    setCycleId(id);
    const d = MODULATION_CYCLES.find(c => c.id === id)!;
    setCycles(d.defaultCycles);
  }

  const stepOffsets = useMemo(() => {
    if (!result) return [] as number[];
    const offsets: number[] = [];
    let acc = 0;
    for (const step of result.steps) {
      offsets.push(acc);
      acc += step.chords.length;
    }
    return offsets;
  }, [result]);

  return (
    <details open style={{
      background: '#161b22', border: '1px solid #30363d', borderRadius: 10,
      padding: '14px 16px',
    }}>
      <summary style={{ cursor: 'pointer', fontSize: 13, color: '#8b949e', fontWeight: 600, listStyleType: 'none' }}>
        🔄 Cicli di Modulazione — sequenze che attraversano le tonalità
      </summary>

      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Selettore ciclo */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {MODULATION_CYCLES.map(c => {
            const isOn = c.id === cycleId;
            return (
              <button
                key={c.id}
                onClick={() => selectCycle(c.id)}
                title={c.description}
                style={{
                  padding: '6px 14px',
                  background: isOn ? '#7c3aed30' : '#0d1117',
                  border: `1px solid ${isOn ? '#7c3aed' : '#30363d'}`,
                  borderRadius: 20,
                  color: isOn ? '#c4b5fd' : '#6b7280',
                  fontSize: 13, cursor: 'pointer', fontWeight: isOn ? 700 : 400,
                }}
              >
                {c.name}
              </button>
            );
          })}
        </div>

        {/* Descrizione + fonte */}
        <div style={{ fontSize: 12, color: '#8b949e' }}>
          {def.description}
          <span style={{ color: '#4b5563' }}> — {def.source}</span>
        </div>

        {/* Controlli */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontSize: 12, color: '#8b949e', display: 'flex', alignItems: 'center', gap: 6 }}>
            Parti da
            <select
              value={startKey}
              onChange={e => setStartKey(e.target.value)}
              style={{
                padding: '5px 10px', background: '#0d1117', border: '1px solid #30363d',
                borderRadius: 6, color: '#e6edf3', fontSize: 13,
              }}
            >
              {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </label>
          <label style={{ fontSize: 12, color: '#8b949e', display: 'flex', alignItems: 'center', gap: 6 }}>
            Cicli
            <input
              type="number" min={1} max={def.maxCycles} value={cycles}
              onChange={e => setCycles(Number(e.target.value) || def.defaultCycles)}
              style={{
                width: 54, padding: '5px 8px', background: '#0d1117',
                border: '1px solid #30363d', borderRadius: 6, color: '#e6edf3', fontSize: 13,
              }}
            />
          </label>
          <button
            onClick={togglePlay}
            style={{
              padding: '5px 16px', fontSize: 13, cursor: 'pointer', fontWeight: 700,
              background: isPlaying ? '#dc2626' : '#10b98130',
              border: `1px solid ${isPlaying ? '#ef4444' : '#10b981'}`,
              borderRadius: 6, color: isPlaying ? '#fff' : '#6ee7b7',
            }}
          >
            {isPlaying ? '⏹ Stop' : '▶ Play'}
          </button>
          <label style={{ fontSize: 11, color: '#6b7280', display: 'flex', alignItems: 'center', gap: 4 }}>
            BPM
            <input
              type="number" min={40} max={200} value={bpm}
              onChange={e => setBpm(Number(e.target.value) || 100)}
              style={{
                width: 54, padding: '3px 6px', background: '#0d1117',
                border: '1px solid #30363d', borderRadius: 4, color: '#e6edf3', fontSize: 12,
              }}
            />
          </label>
        </div>

        {/* Step */}
        {result && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {result.steps.map((step, si) => {
              const stepOffset = stepOffsets[si];
              return (
                <div key={si} style={{
                  background: '#0d1117', border: '1px solid #21262d', borderRadius: 8,
                  padding: '10px 12px', minWidth: 120,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#c4b5fd', marginBottom: 6 }}>
                    {step.key}
                    <span style={{ color: '#4b5563', fontWeight: 400 }}> · {step.label}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {step.chords.map((c, ci) => {
                      const playing = playingFlatIndex === stepOffset + ci;
                      return (
                        <span key={ci} style={{
                          fontFamily: 'monospace', fontSize: 14, fontWeight: 600,
                          padding: '3px 8px', borderRadius: 5,
                          background: playing ? '#10b98130' : '#161b22',
                          border: `1px solid ${playing ? '#10b981' : '#30363d'}`,
                          color: playing ? '#6ee7b7' : '#e6edf3',
                        }}>
                          {c.symbol}
                        </span>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </details>
  );
}
