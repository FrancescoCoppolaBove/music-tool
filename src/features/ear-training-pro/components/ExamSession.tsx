// src/features/ear-training-pro/components/ExamSession.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { audioPlayer } from '../../ear-training/utils/audio-player';
import { ExamQuestion, ExamAnswer, ExamSessionResult, EarModuleId, ExerciseLevel } from '../types';
import { ExamResults } from './ExamResults';

interface Props {
  moduleId: EarModuleId;
  level: ExerciseLevel;
  questions: ExamQuestion[];   // pre-generated, shuffled, length = 10
  onBack: () => void;
}

type Phase = 'question' | 'results';

export function ExamSession({ moduleId, level, questions, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('question');
  const [idx, setIdx]     = useState(0);
  const [answers, setAnswers] = useState<ExamAnswer[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const startTime = useRef(Date.now());
  const questionStart = useRef(Date.now());

  // Timer
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime.current) / 1000)), 1000);
    return () => clearInterval(id);
  }, []);

  const q = questions[idx];

  const play = useCallback(async () => {
    if (isPlaying || !q) return;
    setIsPlaying(true);
    try {
      // Cadences: notes array contains sentinel 999 separating two chords
      if (q.notes.includes(999)) {
        const sep    = q.notes.indexOf(999);
        const chord1 = midiToNoteNames(q.notes.slice(0, sep));
        const chord2 = midiToNoteNames(q.notes.slice(sep + 1));
        await audioPlayer.playChord(chord1);
        await audioPlayer.delay((q.gapMs ?? 700) + 500);
        await audioPlayer.playChord(chord2);
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

  // Auto-play on new question
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
    setAnswers(next);
    if (idx + 1 >= questions.length) {
      setPhase('results');
    } else {
      setIdx(i => i + 1);
    }
  }

  const result: ExamSessionResult = {
    moduleId, level,
    answers,
    score: answers.length ? Math.round(answers.filter(a => a.isCorrect).length / answers.length * 100) : 0,
    durationMs: Date.now() - startTime.current,
    completedAt: new Date().toISOString(),
  };

  if (phase === 'results') {
    return (
      <ExamResults
        result={result}
        onRetry={() => { setPhase('question'); setIdx(0); setAnswers([]); startTime.current = Date.now(); }}
        onBack={onBack}
      />
    );
  }

  const mins = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const secs = String(elapsed % 60).padStart(2, '0');

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: '#8b949e' }}>
          Domanda <strong style={{ color: '#e6edf3' }}>{idx + 1}</strong> di {questions.length}
        </div>
        <div style={{ fontSize: 13, color: '#f97316', fontVariantNumeric: 'tabular-nums' }}>
          ⏱ {mins}:{secs}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: '#21262d', borderRadius: 2, marginBottom: 24, overflow: 'hidden' }}>
        <div style={{ width: `${(idx / questions.length) * 100}%`, height: '100%', background: '#7c3aed', borderRadius: 2, transition: 'width .3s' }} />
      </div>

      {/* Play button */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <button
          onClick={play}
          disabled={isPlaying}
          style={{
            padding: '12px 32px', background: isPlaying ? '#4b5563' : '#7c3aed',
            color: '#fff', border: 'none', borderRadius: 100,
            fontSize: 14, fontWeight: 700, cursor: isPlaying ? 'default' : 'pointer',
          }}
        >
          {isPlaying ? '▶ Suono…' : '▶ Riascolta'}
        </button>
      </div>

      {/* Choices */}
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

// ─── helpers ────────────────────────────────────────────────────────────────
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function midiToNoteNames(midis: number[]): string[] {
  return midis.map(m => {
    const oct = Math.floor(m / 12) - 1;
    const pc  = m % 12;
    return `${NOTE_NAMES[pc]}${oct}`;
  });
}
