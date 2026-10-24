import { useState } from 'react';
import { DISTANCE_CHECKS, ELEMENTS, KEEP_LIMIT, type ElementId } from '../transform';
import { pickDifferent } from '../logic';

const randomMoves = (prev: Partial<Record<ElementId, string>> = {}) =>
  Object.fromEntries(ELEMENTS.map(e => [e.id, pickDifferent(e.moves, prev[e.id], Math.random)])) as Record<ElementId, string>;

export default function ReferenceTransformer({ onCopy }: { onCopy: (text: string) => void }) {
  const [reference, setReference] = useState('');
  const [keep, setKeep] = useState<ElementId[]>([]);
  const [moves, setMoves] = useState(() => randomMoves());
  const [checks, setChecks] = useState<boolean[]>(() => DISTANCE_CHECKS.map(() => false));

  const kept = ELEMENTS.filter(e => keep.includes(e.id));
  const transformed = ELEMENTS.filter(e => !keep.includes(e.id));
  const refName = reference.trim() || 'la reference';
  const passed = checks.filter(Boolean).length;

  function toggleKeep(id: ElementId) {
    setKeep(prev => prev.includes(id) ? prev.filter(k => k !== id) : prev.length < KEEP_LIMIT ? [...prev, id] : prev);
  }

  function planText() {
    return [
      `Dalla reference al mio brano — ${refName}`,
      '',
      'Tengo (come principio, non come parte):',
      ...kept.map(e => `• ${e.label}: ${e.principle.join(' ')}`),
      '',
      'Trasformo:',
      ...transformed.map(e => `• ${e.label}: ${moves[e.id]}`),
      '',
      'Test di distanza:',
      ...DISTANCE_CHECKS.map((c, i) => `[${checks[i] ? 'x' : ' '}] ${c}`),
    ].join('\n');
  }

  return (
    <div className="csp-transformer">
      <section className="csp-panel">
        <span className="csp-step">01</span>
        <div>
          <h3>Cosa ti piace della reference?</h3>
          <p className="csp-muted">Scegli al massimo {KEEP_LIMIT} elementi da tenere. Tutto il resto verrà trasformato: è la regola che separa l’influenza dalla copia.</p>
          <label className="csp-field">Reference (facoltativo)
            <input type="text" value={reference} maxLength={120} onChange={e => setReference(e.target.value)} placeholder="Es. il brano che stai ascoltando in loop" />
          </label>
          <fieldset className="csp-chips">
            <legend>Elementi da tenere · {keep.length}/{KEEP_LIMIT}</legend>
            {ELEMENTS.map(e => {
              const on = keep.includes(e.id);
              return <button type="button" key={e.id} aria-pressed={on} disabled={!on && keep.length >= KEEP_LIMIT} onClick={() => toggleKeep(e.id)}>{e.label}</button>;
            })}
          </fieldset>
          {keep.includes('melodia') && <p className="csp-warning" role="note">L’hook è la parte più riconoscibile di un brano. Tienine al massimo il contorno o il ritmo, mai le note.</p>}
        </div>
      </section>

      <section className="csp-panel">
        <span className="csp-step">02</span>
        <div>
          <h3>Estrai il principio, a parole</h3>
          {kept.length === 0
            ? <p className="csp-muted">Seleziona almeno un elemento qui sopra. Ascolta {refName} una volta, senza strumento in mano, e rispondi per iscritto.</p>
            : <>
                <p className="csp-muted">Ascolta {refName} una volta, senza strumento in mano, e rispondi per iscritto. Non usare nomi di note o accordi.</p>
                {kept.map(e => (
                  <div key={e.id} className="csp-principle">
                    <h4>{e.label}</h4>
                    <ul>{e.principle.map(q => <li key={q}>{q}</li>)}</ul>
                  </div>
                ))}
              </>}
        </div>
      </section>

      <section className="csp-panel">
        <span className="csp-step">03</span>
        <div>
          <div className="csp-panel-head">
            <h3>Chiudi la reference e trasforma il resto</h3>
            <button type="button" onClick={() => setMoves(randomMoves(moves))}>↻ Altre mosse</button>
          </div>
          <ul className="csp-moves">
            {transformed.map(e => <li key={e.id}><b>{e.label}</b><span>{moves[e.id]}</span></li>)}
          </ul>
        </div>
      </section>

      <section className="csp-panel">
        <span className="csp-step">04</span>
        <div>
          <h3>Test di distanza <span className="csp-count">{passed}/{DISTANCE_CHECKS.length}</span></h3>
          <p className="csp-muted">Fallo il giorno dopo, a orecchie fresche. Spunta solo ciò che è vero senza riserve.</p>
          <ul className="csp-checks">
            {DISTANCE_CHECKS.map((c, i) => (
              <li key={c}>
                <label><input type="checkbox" checked={checks[i]} onChange={() => setChecks(prev => prev.map((v, j) => j === i ? !v : v))} />{c}</label>
              </li>
            ))}
          </ul>
          <p className="csp-result" aria-live="polite">
            {passed === DISTANCE_CHECKS.length ? 'Ottimo: hai preso dei principi, il brano è tuo.'
              : passed >= 4 ? 'Ci sei quasi: lavora sui punti non spuntati.'
              : 'Sei ancora vicino alla reference: cambia almeno un altro parametro e rifai il test domani.'}
          </p>
        </div>
      </section>

      <div className="csp-generator-actions">
        <button type="button" className="csp-primary" onClick={() => onCopy(planText())}>Copia il piano</button>
      </div>
    </div>
  );
}
