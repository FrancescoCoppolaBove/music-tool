import React, { useState } from 'react';
import { SetticlavioExercise } from '../types';
import { CStaff } from './CStaff';

export function NoteQuiz({
  exercise,
  onAnswer,
}: {
  exercise: SetticlavioExercise;
  onAnswer: (correct: boolean) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);

  function handleChoice(choice: string) {
    if (selected) return;
    setSelected(choice);
    setTimeout(() => onAnswer(choice === exercise.correct), 900);
  }

  const clefLabel = exercise.clef === 'contralto' ? 'Chiave di contralto' : 'Chiave di tenore';

  return (
    <div style={{ maxWidth: 420, margin: '0 auto', padding: '20px 16px' }}>
      <div style={{ fontSize: 12, color: '#6b7280', textAlign: 'center', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.06em' }}>
        {clefLabel} · Livello {exercise.level}
      </div>

      <div style={{ background: '#1c2128', border: '1px solid #30363d', borderRadius: 12, padding: '16px 10px', marginBottom: 20 }}>
        <CStaff clef={exercise.clef} notePosition={exercise.staffPosition} />
      </div>

      <p style={{ fontSize: 13, color: '#8b949e', textAlign: 'center', marginBottom: 14 }}>
        Come si chiama questa nota?
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {exercise.choices.map(choice => {
          const isSelected = selected === choice;
          const isCorrect  = choice === exercise.correct;
          const bg = !selected ? '#1c2128'
            : isSelected && isCorrect ? '#22c55e22'
            : isSelected ? '#ef444422'
            : isCorrect && !!selected ? '#22c55e22'
            : '#1c2128';
          const border = !selected ? '#30363d'
            : isCorrect ? '#22c55e60' : isSelected ? '#ef444460' : '#30363d';

          return (
            <button
              key={choice}
              onClick={() => handleChoice(choice)}
              disabled={!!selected}
              style={{
                padding: '14px', background: bg, border: `1px solid ${border}`,
                borderRadius: 10, color: '#e6edf3', fontSize: 15, fontWeight: 700,
                cursor: selected ? 'default' : 'pointer',
              }}
            >
              {choice}
            </button>
          );
        })}
      </div>
    </div>
  );
}
