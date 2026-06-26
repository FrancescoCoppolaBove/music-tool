import React from 'react';
import type { ExamTemplate } from '../types';
import { EXAM_TEMPLATES } from '../data/templates';

interface Props {
  onSelect: (template: ExamTemplate) => void;
}

export function TemplateSelector({ onSelect }: Props) {
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: '#e6edf3', margin: '0 0 6px' }}>
        Prove d'Esame
      </h1>
      <p style={{ fontSize: 14, color: '#8b949e', margin: '0 0 28px' }}>
        Simulazioni d'esame AFAM. Nessun feedback durante la prova — i risultati appaiono alla fine.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {EXAM_TEMPLATES.map(t => (
          <div
            key={t.id}
            style={{
              background: '#161b22',
              border: '1px solid #30363d',
              borderRadius: 14,
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#e6edf3', marginBottom: 4 }}>{t.title}</div>
              <div style={{ fontSize: 13, color: '#8b949e', marginBottom: 8 }}>{t.description}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {t.sections.map(s => (
                  <span
                    key={s.moduleId}
                    style={{
                      fontSize: 11, padding: '2px 8px',
                      background: 'rgba(124,58,237,0.1)',
                      border: '1px solid rgba(124,58,237,0.3)',
                      borderRadius: 100,
                      color: '#c4b5fd',
                    }}
                  >
                    {s.label} L{s.level} ×{s.questionCount}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => onSelect(t)}
              style={{
                flexShrink: 0,
                padding: '10px 20px',
                background: '#7c3aed',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Inizia
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
