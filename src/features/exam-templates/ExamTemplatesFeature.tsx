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

  function handleSelect(t: ExamTemplate) {
    setTemplate(t);
    setResult(null);
    setScreen('exam');
  }

  function handleDone(r: MultiSectionExamResult) {
    setResult(r);
    setScreen('results');
  }

  if (screen === 'exam' && template) {
    return (
      <MultiModuleExamSession
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
        onRetry={() => { setScreen('exam'); }}
        onBack={() => setScreen('selector')}
      />
    );
  }

  return <TemplateSelector onSelect={handleSelect} />;
}
