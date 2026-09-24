// src/features/melody-harmonizer/MelodyHarmonizerFeature.tsx

import { useState } from 'react';
import type { MelodyNote, Technique, ThreeHornSubTechnique, HarmonizationResult } from './types';
import { harmonize } from './harmonize';
import StepSequencer, { newNoteId } from './StepSequencer';
import VoiceGrid from './VoiceGrid';

const SUB_TECHNIQUES: { value: ThreeHornSubTechnique; label: string; desc: string }[] = [
  { value: 'spread',           label: 'Spread',          desc: 'Root basso + guide tones (3a/7a) — voicing largo' },
  { value: 'triads',           label: 'Triads',           desc: 'Root, 3a, 5a impilate sotto la lead' },
  { value: 'quartal',          label: 'Quartal',          desc: '4e giuste sotto la lead — suono moderno' },
  { value: 'open-fifths',      label: 'Open 5ths',        desc: 'Lead + 5a armonica + ottava bassa' },
  { value: 'incomplete-4part', label: 'Incomplete 4-part', desc: 'Forma Four-Way Close con solo 2 voci interne' },
];

const TECHNIQUE_DESC: Record<Technique, string> = {
  'four-way-close': '4 parti in moto parallelo, range ≤ 1 ottava — classico Berklee / big band.',
  '3-horn':         'Melodia + 2 voci. Seleziona la sub-tecnica per diversi colori armonici.',
};

export default function MelodyHarmonizerFeature() {
  const [notes,     setNotes]     = useState<MelodyNote[]>([]);
  const [technique, setTechnique] = useState<Technique>('four-way-close');
  const [sub,       setSub]       = useState<ThreeHornSubTechnique>('spread');
  const [result,    setResult]    = useState<HarmonizationResult | null>(null);
  const [error,     setError]     = useState<string | null>(null);

  const validNotes = notes.filter(n => n.note.trim() && n.chord.trim());

  function handleHarmonize() {
    if (validNotes.length === 0) {
      setError('Aggiungi almeno una nota con il suo accordo.');
      return;
    }
    try {
      setResult(harmonize(validNotes, technique, technique === '3-horn' ? sub : undefined));
      setError(null);
    } catch {
      setError('Errore nel calcolo. Verifica i nomi delle note e degli accordi (es. G, Bb, F# / Ebmaj7, Bbm7).');
    }
  }

  function handleTechnique(t: Technique) {
    setTechnique(t);
    setResult(null);
  }

  function handleSub(s: ThreeHornSubTechnique) {
    setSub(s);
    setResult(null);
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px', color: '#e2e8f0' }}>

      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>Melody Harmonizer</h1>
      <p style={{ color: '#94a3b8', marginBottom: 32, fontSize: 14 }}>
        Armonizza una melodia nota per nota — Four-Way Close e 3-Horn Writing
      </p>

      {/* Technique selector */}
      <section style={{ marginBottom: 20 }}>
        <div style={labelStyle}>Tecnica</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
          {(['four-way-close', '3-horn'] as Technique[]).map(t => (
            <button
              key={t}
              onClick={() => handleTechnique(t)}
              style={pillBtn(technique === t, '#1e3a5f', '#3b5998', '#60a5fa')}
            >
              {t === 'four-way-close' ? 'Four-Way Close' : '3-Horn Writing'}
            </button>
          ))}
        </div>
        <p style={{ color: '#475569', fontSize: 12, fontStyle: 'italic', margin: 0 }}>
          {TECHNIQUE_DESC[technique]}
        </p>
      </section>

      {/* Sub-technique (3-horn only) */}
      {technique === '3-horn' && (
        <section style={{ marginBottom: 20 }}>
          <div style={labelStyle}>Sub-tecnica</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SUB_TECHNIQUES.map(s => (
              <button
                key={s.value}
                onClick={() => handleSub(s.value)}
                title={s.desc}
                style={pillBtn(sub === s.value, '#2d1b69', '#5b21b6', '#c4b5fd')}
              >
                {s.label}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Step sequencer */}
      <section style={{ marginBottom: 20 }}>
        <div style={labelStyle}>Melodia</div>
        <StepSequencer notes={notes} onChange={n => { setNotes(n); setResult(null); }} />
      </section>

      {/* Quick-fill example (empty state helper) */}
      {notes.length === 0 && (
        <button
          onClick={() => setNotes([
            { id: newNoteId(), note: 'G',  chord: 'Ebmaj7' },
            { id: newNoteId(), note: 'F',  chord: 'Ebmaj7' },
            { id: newNoteId(), note: 'A',  chord: 'Bbm7'   },
            { id: newNoteId(), note: 'Eb', chord: 'Abmaj7' },
          ])}
          style={{ ...ghostBtn, marginBottom: 16 }}
        >
          Carica esempio (G F A Eb / Ebmaj7 → Bbm7 → Abmaj7)
        </button>
      )}

      {/* Harmonize */}
      <button
        onClick={handleHarmonize}
        disabled={validNotes.length === 0}
        style={{
          background: '#1e3a5f', border: '1px solid #3b5998',
          borderRadius: 8, color: '#60a5fa',
          padding: '10px 28px', cursor: 'pointer',
          fontSize: 15, fontWeight: 600, marginBottom: 20,
          opacity: validNotes.length === 0 ? 0.45 : 1,
        }}
      >
        Armonizza
      </button>

      {error && <div style={{ color: '#ef4444', fontSize: 13, marginBottom: 16 }}>{error}</div>}

      {/* Result */}
      {result && (
        <section>
          <div style={{ ...labelStyle, marginBottom: 12 }}>
            Risultato —{' '}
            {result.technique === 'four-way-close'
              ? 'Four-Way Close'
              : `3-Horn · ${result.subTechnique}`}
          </div>
          <VoiceGrid result={result} />
        </section>
      )}
    </div>
  );
}

// ─── Shared micro-styles ──────────────────────────────────────────────────────

function pillBtn(
  active: boolean,
  activeBg: string,
  activeBorder: string,
  activeColor: string,
): React.CSSProperties {
  return {
    background: active ? activeBg : '#1e293b',
    border: `1px solid ${active ? activeBorder : '#334155'}`,
    borderRadius: 8,
    color: active ? activeColor : '#94a3b8',
    padding: '7px 15px', cursor: 'pointer', fontSize: 13,
  };
}

const labelStyle: React.CSSProperties = {
  fontSize: 10, color: '#64748b',
  textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
};

const ghostBtn: React.CSSProperties = {
  background: 'none', border: '1px dashed #334155',
  borderRadius: 8, color: '#475569',
  padding: '6px 14px', cursor: 'pointer', fontSize: 12,
};
