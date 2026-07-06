import { useState } from 'react';
import type { Level, Subsection } from './data/types';
import { getCompletedLessons, markLessonComplete, markLessonIncomplete } from './data/types';

type LessonTab = 'teoria' | 'esempi' | 'esercizi' | 'strumenti';

interface Props {
  level: Level;
  subsection: Subsection;
  onBack: () => void;
  onNavigate: (tab: string) => void;
}

function renderContent(text: string) {
  if (!text || text.startsWith('//')) return (
    <p style={{ color: '#4b5563', fontStyle: 'italic' }}>Contenuto in arrivo — Piano 2.</p>
  );
  return text.split('\n\n').map((para, i) => {
    const parts = para.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return (
      <p key={i} style={{ marginBottom: '1em', lineHeight: 1.85 }}>
        {parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**'))
            return <strong key={j}>{part.slice(2, -2)}</strong>;
          if (part.startsWith('`') && part.endsWith('`'))
            return (
              <code key={j} style={{
                background: 'rgba(124,58,237,0.12)', color: '#c4b5fd',
                padding: '1px 7px', borderRadius: 4,
                fontFamily: 'monospace', fontSize: '0.9em',
              }}>{part.slice(1, -1)}</code>
            );
          return part;
        })}
      </p>
    );
  });
}

export default function LessonView({ level, subsection, onBack, onNavigate }: Props) {
  const [activeTab, setActiveTab] = useState<LessonTab>('teoria');
  const [completed, setCompleted] = useState(() => getCompletedLessons().has(subsection.id));

  function toggleComplete() {
    if (completed) {
      markLessonIncomplete(subsection.id);
    } else {
      markLessonComplete(subsection.id);
    }
    setCompleted(c => !c);
  }

  const tabs: { id: LessonTab; label: string; badge?: number }[] = [
    { id: 'teoria',    label: 'Teoria' },
    { id: 'esempi',    label: 'Esempi' },
    { id: 'esercizi',  label: 'Esercizi', badge: subsection.esercizi.length || undefined },
    { id: 'strumenti', label: 'Strumenti', badge: subsection.tools.length || undefined },
  ];

  return (
    <div style={{ maxWidth: 780, margin: '0 auto' }}>
      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#6b7280', fontSize: 13, marginBottom: 20, padding: 0,
        }}
      >
        ← Tutti i livelli
      </button>

      {/* Header */}
      <div style={{
        background: '#161b22', border: '1px solid #30363d', borderRadius: 16,
        overflow: 'hidden', marginBottom: 0,
      }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #21262d' }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#7c3aed',
            letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6,
          }}>
            Livello {level.id} · {level.title}
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e6edf3', margin: 0 }}>
            {subsection.id} — {subsection.title}
          </h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {subsection.topics.map(t => (
              <span key={t} style={{
                background: '#1c2128', border: '1px solid #30363d',
                borderRadius: 6, padding: '2px 8px', fontSize: 11, color: '#8b949e',
              }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', borderBottom: '1px solid #21262d',
          background: '#161b22', overflowX: 'auto',
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 20px', background: 'none', border: 'none',
                borderBottom: `2px solid ${activeTab === tab.id ? '#7c3aed' : 'transparent'}`,
                color: activeTab === tab.id ? '#c4b5fd' : '#6b7280',
                fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400,
                cursor: 'pointer', whiteSpace: 'nowrap',
                display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: "'DM Sans', sans-serif",
                transition: 'color .15s',
              }}
            >
              {tab.label}
              {tab.badge ? (
                <span style={{
                  background: '#7c3aed', color: '#fff',
                  fontSize: 10, padding: '1px 5px', borderRadius: 10,
                }}>{tab.badge}</span>
              ) : null}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          {/* Complete toggle */}
          <button
            onClick={toggleComplete}
            style={{
              margin: '8px 16px',
              padding: '5px 14px',
              background: completed ? 'rgba(16,185,129,.15)' : 'rgba(124,58,237,.08)',
              border: `1px solid ${completed ? 'rgba(16,185,129,.4)' : 'rgba(124,58,237,.3)'}`,
              borderRadius: 8, cursor: 'pointer',
              color: completed ? '#10b981' : '#8b949e',
              fontSize: 11, fontWeight: 600,
              fontFamily: "'DM Sans', sans-serif",
              whiteSpace: 'nowrap',
            }}
          >
            {completed ? '✓ Completato' : 'Segna come completato'}
          </button>
        </div>

        {/* Tab content */}
        <div style={{ padding: '24px', fontSize: 14, color: '#e6edf3', minHeight: 300 }}>
          {activeTab === 'teoria' && (
            <div>{renderContent(subsection.teoria)}</div>
          )}

          {activeTab === 'esempi' && (
            <div>
              {subsection.esempi
                ? renderContent(subsection.esempi)
                : <p style={{ color: '#4b5563', fontStyle: 'italic' }}>Esempi in arrivo — Piano 2.</p>
              }
            </div>
          )}

          {activeTab === 'esercizi' && (
            <div>
              {subsection.esercizi.length === 0
                ? <p style={{ color: '#4b5563', fontStyle: 'italic' }}>Esercizi in arrivo — Piano 2.</p>
                : (
                  <ol style={{ paddingLeft: 20 }}>
                    {subsection.esercizi.map((e, i) => (
                      <li key={i} style={{ marginBottom: 12, lineHeight: 1.7 }}>{e}</li>
                    ))}
                  </ol>
                )
              }
            </div>
          )}

          {activeTab === 'strumenti' && (
            <div>
              {subsection.tools.length === 0
                ? <p style={{ color: '#4b5563' }}>Nessuno strumento collegato per questo argomento.</p>
                : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
                      {subsection.tools.length} strument{subsection.tools.length === 1 ? 'o collegato' : 'i collegati'} a questo argomento:
                    </p>
                    {subsection.tools.map(tool => (
                      <div key={tool.tabId} style={{
                        background: '#1c2128', border: '1px solid #30363d', borderRadius: 12,
                        padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14,
                      }}>
                        <span style={{ fontSize: 24, flexShrink: 0 }}>{tool.icon}</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3' }}>{tool.label}</div>
                          {tool.desc && (
                            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{tool.desc}</div>
                          )}
                        </div>
                        <button
                          onClick={() => onNavigate(tool.tabId)}
                          style={{
                            background: '#7c3aed', color: '#fff',
                            border: 'none', borderRadius: 8,
                            padding: '7px 16px', fontSize: 12, fontWeight: 600,
                            cursor: 'pointer', whiteSpace: 'nowrap',
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          Apri →
                        </button>
                      </div>
                    ))}
                  </div>
                )
              }
              {/* Obiettivo */}
              {subsection.obiettivo && (
                <div style={{
                  marginTop: 24, padding: '12px 16px',
                  background: 'rgba(16,185,129,.08)',
                  border: '1px solid rgba(16,185,129,.25)',
                  borderRadius: 10, fontSize: 13, color: '#10b981',
                }}>
                  <strong style={{ display: 'block', marginBottom: 4 }}>Obiettivo</strong>
                  {subsection.obiettivo}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Obiettivo box (always visible on teoria tab) */}
      {activeTab === 'teoria' && subsection.obiettivo && (
        <div style={{
          marginTop: 16, padding: '12px 18px',
          background: 'rgba(16,185,129,.08)',
          border: '1px solid rgba(16,185,129,.25)',
          borderRadius: 10, fontSize: 13, color: '#10b981',
        }}>
          <strong>Obiettivo:</strong> {subsection.obiettivo}
        </div>
      )}
    </div>
  );
}
