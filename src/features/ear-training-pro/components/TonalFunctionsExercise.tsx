import React, { useState, useCallback, useEffect } from 'react';
import { audioPlayer } from '../../ear-training/utils/audio-player';
import { useExerciseScore } from '../../../shared/hooks/useExerciseScore';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function midiName(midi: number): string {
  const oct = Math.floor(midi / 12) - 1;
  return `${NOTE_NAMES[midi % 12]}${oct}`;
}

interface TonalQuestion {
  tonicRoot: number;
  tonicLabel: string;
  functionLabel: string;
  notes: number[];
}

const TONIC_LABELS: Record<number, string> = {
  60: 'Do', 62: 'Re', 65: 'Fa', 67: 'Sol', 69: 'La',
};

function makeQuestion(): TonalQuestion {
  const roots = [60, 62, 65, 67, 69];
  const tonic = roots[Math.floor(Math.random() * roots.length)];
  const fns = [
    { label: 'Tonica (I)',          offsets: [0, 4, 7]   },
    { label: 'Dominante (V)',       offsets: [7, 11, 14] },
    { label: 'Sottodominante (IV)', offsets: [5, 9, 12]  },
  ];
  const fn = fns[Math.floor(Math.random() * fns.length)];
  return {
    tonicRoot: tonic,
    tonicLabel: TONIC_LABELS[tonic] ?? 'Do',
    functionLabel: fn.label,
    notes: fn.offsets.map(o => tonic + o),
  };
}

const ALL_FUNCTIONS = ['Tonica (I)', 'Dominante (V)', 'Sottodominante (IV)'];

export function TonalFunctionsExercise() {
  const [q, setQ]               = useState<TonalQuestion>(() => makeQuestion());
  const [selected, setSelected] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { score, setScore, streak, setStreak } = useExerciseScore('tonal-functions');

  useEffect(() => { play(); }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const play = useCallback(async () => {
    if (isPlaying) return;
    setIsPlaying(true);
    try {
      // Play tonic chord as context, then target chord
      const r = q.tonicRoot;
      await audioPlayer.playChord([midiName(r), midiName(r + 4), midiName(r + 7)]);
      await audioPlayer.delay(500);
      await audioPlayer.playChord(q.notes.map(midiName));
    } finally {
      setTimeout(() => setIsPlaying(false), 1200);
    }
  }, [q, isPlaying]);

  function handleAnswer(choice: string) {
    if (selected) return;
    setSelected(choice);
    const correct = choice === q.functionLabel;
    setScore((s: { correct: number; total: number }) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
    setStreak(correct ? (prev: number) => prev + 1 : () => 0);
    setTimeout(() => { setQ(makeQuestion()); setSelected(null); }, 1200);
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
          Tonalità di contesto: <strong style={{ color: '#c4b5fd' }}>{q.tonicLabel} maggiore</strong>
        </div>
        <div style={{ fontSize: 12, color: '#4b5563' }}>
          Ascolta il contesto, poi identifica la funzione dell'accordo target
        </div>
      </div>

      <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <button
          onClick={play}
          disabled={isPlaying}
          style={{
            padding: '10px 28px', background: isPlaying ? '#4b5563' : '#7c3aed',
            color: '#fff', border: 'none', borderRadius: 100,
            fontSize: 13, fontWeight: 700, cursor: isPlaying ? 'default' : 'pointer',
          }}
        >
          {isPlaying ? 'Suono…' : '▶ Riascolta'}
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ALL_FUNCTIONS.map(fn => {
          const isSelected = selected === fn;
          const isCorrect  = fn === q.functionLabel;
          const bg = !selected ? '#1c2128'
            : isSelected && isCorrect ? '#22c55e18'
            : isSelected ? '#ef444418'
            : isCorrect && !!selected ? '#22c55e18'
            : '#1c2128';
          const border = !selected ? '#30363d'
            : isCorrect ? '#22c55e50' : isSelected ? '#ef444450' : '#30363d';

          return (
            <button
              key={fn}
              onClick={() => handleAnswer(fn)}
              disabled={!!selected}
              style={{
                padding: '14px 16px', background: bg,
                border: `1px solid ${border}`, borderRadius: 10,
                color: '#e6edf3', fontSize: 14, fontWeight: 600,
                cursor: selected ? 'default' : 'pointer', textAlign: 'left',
              }}
            >
              {fn}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: '#4b5563' }}>
        {score.total > 0 && `${score.correct}/${score.total} corrette · streak: ${streak}`}
      </div>
    </div>
  );
}
