import { useState } from 'react';
import type { Tab } from '@shared/types/navigation.types';
import { DIMENSIONS, INTENSITIES, type DimId, type IntensityId } from '../constraints';
import { briefToText, pickDifferent, rollBrief, type BriefItem } from '../logic';

const dimById = new Map(DIMENSIONS.map(d => [d.id, d]));
const ruleCount = (id: IntensityId) => INTENSITIES.find(i => i.id === id)!.rules;

interface Props {
  onCopy: (text: string) => void;
  onNavigate?: (tab: Tab) => void;
}

export default function ConstraintGenerator({ onCopy, onNavigate }: Props) {
  const [intensity, setIntensity] = useState<IntensityId>('medium');
  const [locked, setLocked] = useState<ReadonlySet<DimId>>(() => new Set());
  const [brief, setBrief] = useState<BriefItem[]>(() => rollBrief(DIMENSIONS, [], new Set(), ruleCount('medium'), Math.random));

  function roll(nextIntensity = intensity) {
    setBrief(prev => rollBrief(DIMENSIONS, prev, locked, ruleCount(nextIntensity), Math.random));
  }

  function changeIntensity(id: IntensityId) {
    setIntensity(id);
    roll(id);
  }

  function rerollOne(dim: DimId) {
    setBrief(prev => prev.map(i => i.dim === dim ? { dim, value: pickDifferent(dimById.get(dim)!.options, i.value, Math.random) } : i));
  }

  function toggleLock(dim: DimId) {
    setLocked(prev => {
      const next = new Set(prev);
      if (next.has(dim)) next.delete(dim); else next.add(dim);
      return next;
    });
  }

  const base = brief.filter(i => dimById.get(i.dim)!.kind === 'base');
  const rules = brief.filter(i => dimById.get(i.dim)!.kind === 'rule');

  function row(item: BriefItem) {
    const dim = dimById.get(item.dim)!;
    const isLocked = locked.has(item.dim);
    return (
      <li key={item.dim} className={`csp-brief-row ${isLocked ? 'is-locked' : ''}`}>
        <div>
          <span className="csp-brief-label">{dim.label}</span>
          <span className="csp-brief-value">{item.value}</span>
        </div>
        <div className="csp-brief-tools">
          <button type="button" aria-pressed={isLocked} onClick={() => toggleLock(item.dim)} aria-label={`${isLocked ? 'Sblocca' : 'Blocca'} ${dim.label}`} title={isLocked ? 'Sblocca: cambierà al prossimo lancio' : 'Blocca: resta uguale al prossimo lancio'}>{isLocked ? '🔒' : '🔓'}</button>
          <button type="button" onClick={() => rerollOne(item.dim)} disabled={isLocked} aria-label={`Cambia solo ${dim.label}`} title="Cambia solo questo">↻</button>
        </div>
      </li>
    );
  }

  return (
    <div className="csp-generator">
      <div className="csp-generator-bar">
        <fieldset className="csp-chips">
          <legend>Intensità</legend>
          {INTENSITIES.map(i => (
            <button type="button" key={i.id} aria-pressed={intensity === i.id} onClick={() => changeIntensity(i.id)}>{i.label} <span>{i.rules} regole</span></button>
          ))}
        </fieldset>
        <div className="csp-generator-actions">
          <button type="button" className="csp-primary" onClick={() => roll()}>Genera un nuovo brief</button>
          <button type="button" onClick={() => onCopy(briefToText(brief, DIMENSIONS))}>Copia</button>
        </div>
      </div>

      <div className="csp-brief" aria-live="polite">
        <section>
          <h3>La cornice</h3>
          <ul>{base.map(row)}</ul>
        </section>
        <section>
          <h3>Le regole del gioco</h3>
          <ul>{rules.map(row)}</ul>
        </section>
      </div>

      <div className="csp-note">
        <p><b>Come usarlo.</b> Rispetta il brief alla lettera finché non hai otto battute che ti convincono. Blocca 🔒 le voci che ti piacciono e rigenera le altre. Il vincolo serve a far nascere l’idea: quando il nucleo c’è, puoi infrangerlo.</p>
        {onNavigate && (
          <div className="csp-links">
            <span>Continua negli strumenti:</span>
            <button type="button" onClick={() => onNavigate('groove')}>Groove Kitchen →</button>
            <button type="button" onClick={() => onNavigate('progressions')}>Chord Progressions →</button>
            <button type="button" onClick={() => onNavigate('arrangement')}>Arrangement Blueprint →</button>
          </div>
        )}
      </div>
    </div>
  );
}
