import { useRef, useState, type KeyboardEvent } from 'react';
import type { Tab } from '@shared/types/navigation.types';
import { CARDS } from './cards';
import { EXERCISES } from './exercises';
import { GUIDE } from './guide';
import { useCopy } from './useCopy';
import ObliqueDeck from './components/ObliqueDeck';
import ConstraintGenerator from './components/ConstraintGenerator';
import ReferenceTransformer from './components/ReferenceTransformer';
import ExerciseList from './components/ExerciseList';
import CreativityGuide from './components/CreativityGuide';
import './creative-sparks.css';

const SECTIONS = [
  { id: 'cards', label: 'Carte oblique', hint: 'Una frase per sbloccarti' },
  { id: 'brief', label: 'Generatore di vincoli', hint: 'Un brief con regole da rispettare' },
  { id: 'reference', label: 'Dalla reference', hint: 'Prendi il principio, cambia la superficie' },
  { id: 'exercises', label: 'Esercizi', hint: 'Pratiche concrete da fare oggi' },
  { id: 'guide', label: 'Guida', hint: 'Come scrivere senza copiare' },
] as const;
type SectionId = typeof SECTIONS[number]['id'];

export default function CreativeSparksFeature({ onNavigate }: { onNavigate?: (tab: Tab) => void }) {
  const [section, setSection] = useState<SectionId>('cards');
  const { copy, status, manual } = useCopy();
  const tabsRef = useRef<HTMLDivElement>(null);

  function onTabsKey(event: KeyboardEvent) {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const index = SECTIONS.findIndex(s => s.id === section);
    const next = event.key === 'Home' ? 0
      : event.key === 'End' ? SECTIONS.length - 1
      : (index + (event.key === 'ArrowRight' ? 1 : -1) + SECTIONS.length) % SECTIONS.length;
    setSection(SECTIONS[next].id);
    tabsRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[next]?.focus();
  }

  const current = SECTIONS.find(s => s.id === section)!;

  return (
    <div className="csp">
      <header className="csp-hero">
        <div>
          <span className="csp-eyebrow">COMPOSIZIONE / IDEE ORIGINALI</span>
          <h1>Creative Sparks</h1>
          <p>Spunti, vincoli ed esercizi per avere idee tue, anche quando quello che ascolti ti resta in testa. Prendi i principi dalle reference, non le parti.</p>
        </div>
        <div className="csp-hero-facts">
          <span><b>{CARDS.length}</b> carte</span>
          <span><b>{EXERCISES.length}</b> esercizi</span>
          <span><b>{GUIDE.length}</b> capitoli</span>
        </div>
      </header>

      <div className="csp-tabs" role="tablist" aria-label="Sezioni di Creative Sparks" ref={tabsRef} onKeyDown={onTabsKey}>
        {SECTIONS.map(s => (
          <button
            type="button" role="tab" key={s.id} id={`csp-tab-${s.id}`}
            aria-selected={section === s.id} aria-controls="csp-panel" tabIndex={section === s.id ? 0 : -1}
            onClick={() => setSection(s.id)}
          >{s.label}</button>
        ))}
      </div>

      <div className="csp-feedback" role="status" aria-live="polite">{status}</div>
      {manual && <label className="csp-manual-copy">Testo da copiare<textarea readOnly value={manual} rows={6} onFocus={e => e.currentTarget.select()} /></label>}

      <section id="csp-panel" role="tabpanel" aria-labelledby={`csp-tab-${section}`} className="csp-content">
        <div className="csp-section-heading">
          <h2>{current.label}</h2>
          <p>{current.hint}</p>
        </div>
        {section === 'cards' && <ObliqueDeck />}
        {section === 'brief' && <ConstraintGenerator onCopy={text => void copy(text)} onNavigate={onNavigate} />}
        {section === 'reference' && <ReferenceTransformer onCopy={text => void copy(text)} />}
        {section === 'exercises' && <ExerciseList onNavigate={onNavigate} />}
        {section === 'guide' && <CreativityGuide />}
      </section>
    </div>
  );
}
