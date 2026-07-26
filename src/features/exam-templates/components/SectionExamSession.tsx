import React, { useState, useEffect, useCallback, useRef } from 'react';
import { audioPlayer } from '../../ear-training/utils/audio-player';
import type { ExamQuestion, ExamAnswer } from '../../ear-training-pro/types';

interface Props {
  questions: ExamQuestion[];
  sectionLabel: string;
  sectionIndex: number;
  totalSections: number;
  onDone: (answers: ExamAnswer[]) => void;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function midiToNoteNames(midis: number[]): string[] {
  return midis.map(m => `${NOTE_NAMES[m % 12]}${Math.floor(m / 12) - 1}`);
}

export function SectionExamSession({ questions, sectionLabel, sectionIndex, totalSections, onDone }: Props) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<ExamAnswer[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const questionStart = useRef(Date.now());

  const q = questions[idx];

  const play = useCallback(async () => {
    if (isPlaying || !q) return;
    setIsPlaying(true);
    try {
      if (q.notes.includes(999)) {
        const sep = q.notes.indexOf(999);
        await audioPlayer.playChord(midiToNoteNames(q.notes.slice(0, sep)));
        await audioPlayer.delay((q.gapMs ?? 700) + 500);
        await audioPlayer.playChord(midiToNoteNames(q.notes.slice(sep + 1)));
      } else if (q.playMode === 'sequential') {
        await audioPlayer.playSequence(midiToNoteNames(q.notes), q.gapMs ?? 600, 0.8);
      } else {
        await audioPlayer.playChord(midiToNoteNames(q.notes));
      }
    } finally {
      await audioPlayer.delay(1500);
      setIsPlaying(false);
    }
  }, [q, isPlaying]);

  useEffect(() => {
    questionStart.current = Date.now();
    play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  function handleAnswer(choice: string) {
    const ans: ExamAnswer = {
      questionId: q.id,
      given: choice,
      correct: q.correct,
      isCorrect: choice === q.correct,
      timeMs: Date.now() - questionStart.current,
    };
    const next = [...answers, ans];
    if (idx + 1 >= questions.length) {
      onDone(next);
    } else {
      setAnswers(next);
      setIdx(i => i + 1);
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
          Sezione {sectionIndex + 1} di {totalSections}
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#c4b5fd' }}>{sectionLabel}</div>
      </div>

      <div style={{ height: 4, background: '#21262d', borderRadius: 2, marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ width: `${(idx / questions.length) * 100}%`, height: '100%', background: '#7c3aed', borderRadius: 2, transition: 'width .3s' }} />
      </div>

      <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 20, textAlign: 'center' }}>
        Domanda {idx + 1} / {questions.length}
      </div>

      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <button
          onClick={play}
          disabled={isPlaying}
          style={{
            padding: '12px 32px',
            background: isPlaying ? '#4b5563' : '#7c3aed',
            color: '#fff', border: 'none', borderRadius: 100,
            fontSize: 14, fontWeight: 700, cursor: isPlaying ? 'default' : 'pointer',
          }}
        >
          {isPlaying ? '▶ Suono…' : '▶ Riascolta'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {q.choices.map(c => (
          <button
            key={c}
            onClick={() => handleAnswer(c)}
            style={{
              padding: '14px 10px', background: '#1c2128',
              border: '1px solid #30363d', borderRadius: 10,
              color: '#e6edf3', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', textAlign: 'center',
            }}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
