import React, { useRef, useState, useCallback } from 'react';
import { audioPlayer } from '../../ear-training/utils/audio-player';
import { SolfeggioExercise, NoteEvaluation } from '../types';
import { MicEvaluator, MicEvaluatorHandle } from './MicEvaluator';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function midiToAudioName(midi: number): string {
  return `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

type Phase = 'idle' | 'playing-model' | 'waiting' | 'recording' | 'done';

export function ExercisePlayer({
  exercise,
  onResult,
}: {
  exercise: SolfeggioExercise;
  onResult: (evals: NoteEvaluation[]) => void;
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const micRef = useRef<MicEvaluatorHandle>(null);

  const playModel = useCallback(async () => {
    setPhase('playing-model');
    const names = exercise.notes.map(n => midiToAudioName(n.midi));
    await audioPlayer.playSequence(names, 600, 0.8);
    setPhase('waiting');
  }, [exercise]);

  async function handleSing() {
    setPhase('recording');
    micRef.current?.start(exercise.notes, evals => {
      setPhase('done');
      onResult(evals);
    });
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 16px', textAlign: 'center' }}>
      <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>{exercise.category} · {exercise.level}</div>
      <h3 style={{ fontSize: 18, color: '#e6edf3', marginBottom: 20 }}>{exercise.title}</h3>

      {/* Note pills */}
      <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 24 }}>
        {exercise.notes.map((note, i) => (
          <div
            key={i}
            style={{
              width: 40, height: 40, borderRadius: '50%',
              background: '#21262d', border: '1px solid #30363d',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 600, color: '#8b949e',
            }}
          >
            {note.label}
          </div>
        ))}
      </div>

      {phase === 'idle' && (
        <button
          onClick={playModel}
          style={{ padding: '12px 32px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 100, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
        >
          ▶ Ascolta modello
        </button>
      )}

      {phase === 'playing-model' && (
        <div style={{ fontSize: 13, color: '#8b949e' }}>Suono in corso…</div>
      )}

      {phase === 'waiting' && (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={playModel}
            style={{ padding: '10px 20px', background: '#21262d', color: '#e6edf3', border: '1px solid #30363d', borderRadius: 100, fontSize: 13, cursor: 'pointer' }}
          >
            ▶ Riascolta
          </button>
          <button
            onClick={handleSing}
            style={{ padding: '10px 24px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 100, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
          >
            🎤 Canta
          </button>
        </div>
      )}

      {phase === 'recording' && <MicEvaluator ref={micRef} />}
    </div>
  );
}
