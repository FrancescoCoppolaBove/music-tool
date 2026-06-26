import React, { useEffect, useRef } from 'react';
import type { MultiSectionExamResult } from '../types';
import { useAuth } from '../../../shared/context/AuthContext';
import { addSubmission } from '../../../shared/utils/firestoreConservatory';
import { firebaseEnabled } from '../../../firebase';

interface Props {
  result: MultiSectionExamResult;
  onRetry: () => void;
  onBack: () => void;
}

function scoreColor(s: number): string {
  if (s >= 80) return '#10b981';
  if (s >= 60) return '#f59e0b';
  return '#ef4444';
}

export function ExamTemplateResults({ result, onRetry, onBack }: Props) {
  const { user } = useAuth();
  const saved = useRef(false);

  useEffect(() => {
    if (saved.current || !firebaseEnabled || !user) return;
    saved.current = true;

    const allAnswers = result.sections.flatMap(s =>
      s.answers.map(a => ({
        questionId: a.questionId,
        given: a.given,
        correct: a.correct,
        isCorrect: a.isCorrect,
        timeMs: a.timeMs,
      })),
    );

    addSubmission({
      userId: user.uid,
      moduleId: `exam-template:${result.templateId}`,
      score: result.totalScore,
      answers: allAnswers,
      completedAt: new Date(result.completedAt).getTime(),
      durationMs: result.durationMs,
    }).catch(() => {});
  }, []);

  const mins = Math.floor(result.durationMs / 60000);
  const secs = Math.floor((result.durationMs % 60000) / 1000);

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 64, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: scoreColor(result.totalScore) }}>
          {result.totalScore}%
        </div>
        <div style={{ fontSize: 14, color: '#8b949e', marginTop: 4 }}>
          Durata: {mins}m {String(secs).padStart(2, '0')}s
        </div>
        {!firebaseEnabled && (
          <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 8 }}>
            Firebase non configurato — risultato non salvato
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
        {result.sections.map((s, i) => {
          const correct = s.answers.filter(a => a.isCorrect).length;
          return (
            <div
              key={i}
              style={{
                background: '#161b22',
                border: '1px solid #30363d',
                borderRadius: 12,
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3' }}>{s.label}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  Livello {s.level} · {correct}/{s.answers.length} corrette
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: scoreColor(s.score) }}>
                {s.score}%
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button
          onClick={onBack}
          style={{
            padding: '12px 24px', background: 'none',
            border: '1px solid #30363d', borderRadius: 8,
            color: '#8b949e', fontSize: 14, cursor: 'pointer',
          }}
        >
          Menu
        </button>
        <button
          onClick={onRetry}
          style={{
            padding: '12px 24px', background: '#7c3aed',
            border: 'none', borderRadius: 8,
            color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Riprova
        </button>
      </div>
    </div>
  );
}
