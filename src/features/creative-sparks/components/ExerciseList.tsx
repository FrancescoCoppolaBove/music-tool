import { useState } from 'react';
import type { Tab } from '@shared/types/navigation.types';
import { storageGet, storageSet } from '@shared/utils/storage';
import { EXERCISES, EXERCISE_AREAS, type ExerciseArea } from '../exercises';

const DONE_KEY = 'creative_sparks_exercises_v1';
const AREAS = Object.keys(EXERCISE_AREAS) as ExerciseArea[];
const ids = new Set(EXERCISES.map(e => e.id));

export default function ExerciseList({ onNavigate }: { onNavigate?: (tab: Tab) => void }) {
  const [area, setArea] = useState<ExerciseArea | 'all'>('all');
  const [done, setDone] = useState<string[]>(() => {
    const saved = storageGet<unknown>(DONE_KEY, []);
    return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string' && ids.has(id)) : [];
  });

  const list = area === 'all' ? EXERCISES : EXERCISES.filter(e => e.area === area);

  function toggleDone(id: string) {
    const next = done.includes(id) ? done.filter(d => d !== id) : [...done, id];
    setDone(next);
    storageSet(DONE_KEY, next);
  }

  return (
    <div className="csp-exercises">
      <div className="csp-generator-bar">
        <fieldset className="csp-chips">
          <legend>Area</legend>
          <button type="button" aria-pressed={area === 'all'} onClick={() => setArea('all')}>Tutti <span>{EXERCISES.length}</span></button>
          {AREAS.map(a => <button type="button" key={a} aria-pressed={area === a} onClick={() => setArea(a)}>{EXERCISE_AREAS[a]}</button>)}
        </fieldset>
        <span className="csp-muted">Completati: {done.length}/{EXERCISES.length} · salvati su questo dispositivo</span>
      </div>

      <div className="csp-exercise-grid">
        {list.map(ex => {
          const isDone = done.includes(ex.id);
          return (
            <article key={ex.id} className={`csp-exercise ${isDone ? 'is-done' : ''}`}>
              <div className="csp-exercise-top">
                <span className="csp-eyebrow">{EXERCISE_AREAS[ex.area]}</span>
                <span className="csp-duration">{ex.duration}</span>
              </div>
              <h3>{ex.title}</h3>
              <p className="csp-goal">{ex.goal}</p>
              <ol className="csp-steps">{ex.steps.map(s => <li key={s}>{s}</li>)}</ol>
              {ex.source && <p className="csp-credit">{ex.source}</p>}
              <div className="csp-exercise-actions">
                <label className="csp-done"><input type="checkbox" checked={isDone} onChange={() => toggleDone(ex.id)} />Fatto</label>
                {ex.tool && onNavigate && <button type="button" className="csp-text-button" onClick={() => onNavigate(ex.tool!.tab)}>{ex.tool.label} →</button>}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
