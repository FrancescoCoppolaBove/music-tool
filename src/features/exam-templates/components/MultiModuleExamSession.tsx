import React, { useState, useMemo } from 'react';
import { generateQuestions } from '../../ear-training-pro/data/index';
import { SectionExamSession } from './SectionExamSession';
import type { ExamTemplate, SectionResult, MultiSectionExamResult } from '../types';
import type { ExamAnswer } from '../../ear-training-pro/types';

interface Props {
  template: ExamTemplate;
  onDone: (result: MultiSectionExamResult) => void;
  onBack: () => void;
}

type Phase = 'intro' | 'running' | 'interstitial';

export function MultiModuleExamSession({ template, onDone, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [sectionIdx, setSectionIdx] = useState(0);
  const [completedSections, setCompletedSections] = useState<SectionResult[]>([]);
  const [startTime] = useState(Date.now());

  const currentSection = template.sections[sectionIdx];
  const questions = useMemo(
    () => generateQuestions(currentSection.moduleId, currentSection.level, currentSection.questionCount),
    [currentSection.moduleId, currentSection.level, currentSection.questionCount],
  );

  function handleSectionDone(answers: ExamAnswer[]) {
    const correct = answers.filter(a => a.isCorrect).length;
    const score = answers.length ? Math.round((correct / answers.length) * 100) : 0;
    const result: SectionResult = {
      moduleId: currentSection.moduleId,
      level: currentSection.level,
      label: currentSection.label,
      answers,
      score,
    };
    const updated = [...completedSections, result];
    setCompletedSections(updated);

    if (sectionIdx + 1 >= template.sections.length) {
      const totalScore = Math.round(updated.reduce((acc, s) => acc + s.score, 0) / updated.length);
      onDone({
        templateId: template.id,
        sections: updated,
        totalScore,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      });
    } else {
      setPhase('interstitial');
    }
  }

  function handleNextSection() {
    setSectionIdx(i => i + 1);
    setPhase('running');
  }

  if (phase === 'intro') {
    return (
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '40px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 16 }}>📝</div>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: '#e6edf3', margin: '0 0 12px' }}>
          {template.title}
        </h2>
        <p style={{ fontSize: 14, color: '#8b949e', margin: '0 0 8px' }}>{template.description}</p>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 32px' }}>
          {template.sections.length} sezioni · ~{template.totalDurationMinutes} minuti<br />
          Nessun feedback durante la prova.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={onBack}
            style={{
              padding: '12px 24px', background: 'none',
              border: '1px solid #30363d', borderRadius: 8,
              color: '#8b949e', fontSize: 14, cursor: 'pointer',
            }}
          >
            Annulla
          </button>
          <button
            onClick={() => setPhase('running')}
            style={{
              padding: '12px 28px', background: '#7c3aed',
              border: 'none', borderRadius: 8,
              color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Inizia prova
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'interstitial') {
    const nextSection = template.sections[sectionIdx + 1];
    return (
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '40px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 16 }}>✓</div>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: '#e6edf3', margin: '0 0 8px' }}>
          Sezione completata!
        </h2>
        <p style={{ fontSize: 14, color: '#8b949e', margin: '0 0 28px' }}>
          Prossima sezione: <strong style={{ color: '#c4b5fd' }}>{nextSection.label}</strong>
          {' '}— {nextSection.questionCount} domande, livello {nextSection.level}
        </p>
        <button
          onClick={handleNextSection}
          style={{
            padding: '12px 28px', background: '#7c3aed',
            border: 'none', borderRadius: 8,
            color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Continua →
        </button>
      </div>
    );
  }

  return (
    <SectionExamSession
      questions={questions}
      sectionLabel={currentSection.label}
      sectionIndex={sectionIdx}
      totalSections={template.sections.length}
      onDone={handleSectionDone}
    />
  );
}
