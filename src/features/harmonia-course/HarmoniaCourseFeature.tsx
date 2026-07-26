import { useState } from 'react';
import type { Tab } from '@shared/types/navigation.types';
import type { Level, Subsection } from './data/types';
import HarmoniaDashboard from './HarmoniaDashboard';
import LessonView from './LessonView';

interface Props {
  onNavigate: (tab: Tab) => void;
}

interface ActiveLesson {
  level: Level;
  subsection: Subsection;
}

export default function HarmoniaCourseFeature({ onNavigate }: Props) {
  const [activeLesson, setActiveLesson] = useState<ActiveLesson | null>(null);

  function handleSelectLesson(level: Level, subsectionIdx: number) {
    const subsection = level.subsections[subsectionIdx];
    if (subsection) setActiveLesson({ level, subsection });
  }

  function handleBack() {
    setActiveLesson(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (activeLesson) {
    return (
      <LessonView
        level={activeLesson.level}
        subsection={activeLesson.subsection}
        onBack={handleBack}
        onNavigate={tab => onNavigate(tab as Tab)}
      />
    );
  }

  return <HarmoniaDashboard onSelectLesson={handleSelectLesson} />;
}
