import React, { useState } from 'react';
import { TemplateSelector } from './components/TemplateSelector';
import { MultiModuleExamSession } from './components/MultiModuleExamSession';
import { ExamTemplateResults } from './components/ExamTemplateResults';
import type { ExamTemplate, MultiSectionExamResult } from './types';

type Screen = 'selector' | 'exam' | 'results';

export default function ExamTemplatesFeature() {
  const [screen, setScreen] = useState<Screen>('selector');
  const [template, setTemplate] = useState<ExamTemplate | null>(null);
  const [result, setResult] = useState<MultiSectionExamResult | null>(null);
  // Incremented on every retry to force a full remount of MultiModuleExamSession,
  // resetting its internal sectionIdx / completedSections / startTime state.
  const [retryCount, setRetryCount] = useState(0);

  function handleSelect(t: ExamTemplate) {
    setTemplate(t);
    setResult(null);
    setRetryCount(0);
    setScreen('exam');
  }

  function handleDone(r: MultiSectionExamResult) {
    setResult(r);
    setScreen('results');
  }

  function handleRetry() {
    setRetryCount(c => c + 1);
    setScreen('exam');
  }

  if (screen === 'exam' && template) {
    return (
      <MultiModuleExamSession
        key={retryCount}
        template={template}
        onDone={handleDone}
        onBack={() => setScreen('selector')}
      />
    );
  }

  if (screen === 'results' && result) {
    return (
      <ExamTemplateResults
        result={result}
        onRetry={handleRetry}
        onBack={() => setScreen('selector')}
      />
    );
  }

  return <TemplateSelector onSelect={handleSelect} />;
}
