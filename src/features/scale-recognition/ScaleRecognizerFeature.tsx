/**
 * SCALE RECOGNIZER COMPONENT
 *
 * React component completo per il riconoscimento scale
 * Include:
 * - Input note interattivo
 * - Root note selection per maggiore accuratezza
 * - Visualizzazione risultati
 * - Atomic CSS styling
 */

import React, { useState, useCallback } from 'react';
import { recognizeScales, recognizeScalesWithRoot, ScaleRecognitionResult } from './services/scale-recognition';
import { Music, CheckCircle, Info, Target } from 'lucide-react';

// ============================================================================
// CONSTANTS
// ============================================================================

const CHROMATIC_NOTES = ['C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab', 'A', 'A#/Bb', 'B'];

const PRESET_EXAMPLES = [
  { name: 'C Major', notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'], root: 'C' },
  { name: 'D Dorian', notes: ['D', 'E', 'F', 'G', 'A', 'B', 'C'], root: 'D' },
  { name: 'C Blues', notes: ['C', 'Eb', 'F', 'Gb', 'G', 'Bb'], root: 'C' },
  { name: 'A Minor Pent', notes: ['A', 'C', 'D', 'E', 'G'], root: 'A' },
  { name: 'C Lydian', notes: ['C', 'D', 'E', 'F#', 'G', 'A', 'B'], root: 'C' },
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ScaleRecognizerFeature() {
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [rootNote, setRootNote] = useState<string | null>(null);
  const [useRootMode, setUseRootMode] = useState(false);
  const [result, setResult] = useState<ScaleRecognitionResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // ========================================
  // HANDLERS
  // ========================================

  const toggleNote = useCallback((note: string) => {
    setSelectedNotes((prev) => {
      if (prev.includes(note)) {
        return prev.filter((n) => n !== note);
      } else {
        return [...prev, note];
      }
    });
    setResult(null);
  }, []);

  const handleSetRoot = useCallback(
    (note: string) => {
      setRootNote(note === rootNote ? null : note);
    },
    [rootNote]
  );

  const handleRecognize = useCallback(() => {
    if (selectedNotes.length === 0) return;

    setIsAnalyzing(true);

    setTimeout(() => {
      let recognition;

      if (useRootMode && rootNote) {
        // Modalità con root specificata
        recognition = recognizeScalesWithRoot(selectedNotes, rootNote, 10);
      } else {
        // Modalità automatica
        recognition = recognizeScales(selectedNotes, 10);
      }

      setResult(recognition);
      setIsAnalyzing(false);
    }, 100);
  }, [selectedNotes, rootNote, useRootMode]);

  const handleClear = useCallback(() => {
    setSelectedNotes([]);
    setRootNote(null);
    setResult(null);
  }, []);

  const loadPreset = useCallback((preset: (typeof PRESET_EXAMPLES)[0]) => {
    setSelectedNotes(preset.notes);
    setRootNote(preset.root);
    setUseRootMode(true);
    setResult(null);
  }, []);

  const toggleRootMode = useCallback(() => {
    setUseRootMode((prev) => !prev);
    if (!useRootMode && selectedNotes.length > 0 && !rootNote) {
      // Auto-seleziona la prima nota come root
      setRootNote(selectedNotes[0]);
    }
  }, [useRootMode, selectedNotes, rootNote]);

  // ========================================
  // RENDER
  // ========================================

  return (
    <div className='scale-recognizer'>
      {/* Header */}
      <div className='card'>
        <div className='card-header'>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Music size={28} style={{ color: 'var(--primary)' }} />
            <div>
              <h2 className='card-title'>Scale Recognition Engine</h2>
              <p className='card-description'>Select notes and discover compatible scales</p>
            </div>
          </div>
        </div>

        <div className='card-content'>
          {/* Mode Toggle */}
          <div
            style={{
              marginBottom: 'var(--spacing-lg)',
              padding: 'var(--spacing-md)',
              background: 'var(--bg-tertiary, #334155)',
              borderRadius: 'var(--radius-md)',
              border: `2px solid ${useRootMode ? 'var(--primary, #3b82f6)' : 'var(--border, #475569)'}`,
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              <input
                type='checkbox'
                checked={useRootMode}
                onChange={toggleRootMode}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                }}
              />
              <Target size={20} style={{ color: useRootMode ? 'var(--primary)' : 'var(--text-muted)' }} />
              <span
                style={{
                  fontSize: 'var(--font-size-base)',
                  fontWeight: '600',
                  color: useRootMode ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}
              >
                Specify Root Note (More Accurate)
              </span>
            </label>
            {useRootMode && (
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--text-muted)',
                  marginTop: 'var(--spacing-xs)',
                  marginLeft: '46px',
                }}
              >
                Select the root/tonic note of the scale for better accuracy
              </p>
            )}
          </div>

          {/* Root Note Selector (solo se useRootMode è true) */}
          {useRootMode && (
            <div style={{ marginBottom: 'var(--spacing-xl)' }}>
              <h3
                style={{
                  fontSize: 'var(--font-size-lg)',
                  marginBottom: 'var(--spacing-md)',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-sm)',
                }}
              >
                <Target size={20} style={{ color: 'var(--primary)' }} />
                Root Note {rootNote && `(${rootNote})`}
              </h3>

              <div className='note-grid'>
                {CHROMATIC_NOTES.map((note) => (
                  <button
                    key={note}
                    onClick={() => handleSetRoot(note)}
                    className={`note-button ${note === rootNote ? 'note-button-root' : ''}`}
                    style={{
                      opacity: selectedNotes.includes(note) ? 1 : 0.4,
                      cursor: selectedNotes.includes(note) ? 'pointer' : 'not-allowed',
                    }}
                    disabled={!selectedNotes.includes(note)}
                  >
                    {note}
                    {note === rootNote && (
                      <span
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          fontSize: '10px',
                        }}
                      >
                        ★
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Note Selector */}
          <div className='note-selector-section'>
            <h3
              style={{
                fontSize: 'var(--font-size-lg)',
                marginBottom: 'var(--spacing-md)',
                color: 'var(--text-primary)',
              }}
            >
              Select Notes ({selectedNotes.length}/12)
            </h3>

            <div className='note-grid'>
              {CHROMATIC_NOTES.map((note) => (
                <button
                  key={note}
                  onClick={() => toggleNote(note)}
                  className={`note-button ${selectedNotes.includes(note) ? 'note-button-selected' : ''}`}
                >
                  {note}
                </button>
              ))}
            </div>
          </div>

          {/* Preset Examples */}
          <div style={{ marginTop: 'var(--spacing-xl)' }}>
            <h4
              style={{
                fontSize: 'var(--font-size-base)',
                marginBottom: 'var(--spacing-sm)',
                color: 'var(--text-secondary)',
              }}
            >
              Quick Examples:
            </h4>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--spacing-sm)',
              }}
            >
              {PRESET_EXAMPLES.map((preset) => (
                <button key={preset.name} onClick={() => loadPreset(preset)} className='btn btn-sm btn-outline'>
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: 'flex',
              gap: 'var(--spacing-md)',
              marginTop: 'var(--spacing-xl)',
            }}
          >
            <button
              onClick={handleRecognize}
              disabled={selectedNotes.length === 0 || isAnalyzing || (useRootMode && !rootNote)}
              className='btn btn-primary btn-lg'
              style={{ flex: 1 }}
            >
              {isAnalyzing ? (
                <>
                  <span
                    className='spinner'
                    style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid white',
                      borderTopColor: 'transparent',
                      borderRadius: '50%',
                    }}
                  />
                  Analyzing...
                </>
              ) : (
                <>{useRootMode && rootNote ? `Recognize from ${rootNote}` : 'Recognize Scales'}</>
              )}
            </button>

            <button onClick={handleClear} disabled={selectedNotes.length === 0} className='btn btn-ghost'>
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className='results-section' style={{ marginTop: 'var(--spacing-xl)' }}>
          {/* Summary Card */}
          <div className='card'>
            <div className='card-header'>
              <h3 className='card-title'>Analysis Summary</h3>
            </div>
            <div className='card-content'>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 'var(--spacing-md)',
                }}
              >
                <div className='stat-box'>
                  <div className='stat-label'>Input Notes</div>
                  <div className='stat-value'>{result.input_notes_normalized.join(', ')}</div>
                </div>

                <div className='stat-box'>
                  <div className='stat-label'>Candidates Found</div>
                  <div className='stat-value'>{result.candidates.length}</div>
                </div>

                <div className='stat-box'>
                  <div className='stat-label'>Execution Time</div>
                  <div className='stat-value'>{result.analysis_metadata.execution_time_ms.toFixed(2)}ms</div>
                </div>
              </div>
            </div>
          </div>

          {/* Top Match Highlight */}
          {result.top_guess && (
            <div className='card top-match-card'>
              <div className='card-header'>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <CheckCircle size={24} style={{ color: 'var(--success)' }} />
                  <div>
                    <h3 className='card-title'>Top Match</h3>
                    <p className='card-description'>Most probable scale</p>
                  </div>
                </div>
              </div>
              <div className='card-content'>
                <div
                  style={{
                    background: 'var(--bg-tertiary)',
                    padding: 'var(--spacing-lg)',
                    borderRadius: 'var(--radius-md)',
                    border: '2px solid var(--success)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 'var(--spacing-md)',
                    }}
                  >
                    <div>
                      <h4
                        style={{
                          fontSize: 'var(--font-size-2xl)',
                          color: 'var(--text-primary)',
                          marginBottom: 'var(--spacing-xs)',
                        }}
                      >
                        {result.top_guess.root} {result.top_guess.scale_name}
                      </h4>
                      {result.top_guess.mode_name && (
                        <p
                          style={{
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--text-muted)',
                          }}
                        >
                          Mode: {result.top_guess.mode_name}
                        </p>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: 'var(--font-size-3xl)',
                          fontWeight: 'var(--font-weight-bold)',
                          color: 'var(--success)',
                        }}
                      >
                        {result.top_guess.probability_percent}%
                      </div>
                      <div
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        Score: {result.top_guess.score_0_100}
                      </div>
                    </div>
                  </div>

                  <div className='match-details'>
                    <div className='match-detail-row'>
                      <span className='match-label'>Matched Notes:</span>
                      <span className='match-value match-value-success'>{result.top_guess.matched_notes.join(', ')}</span>
                    </div>

                    {result.top_guess.extra_notes.length > 0 && (
                      <div className='match-detail-row'>
                        <span className='match-label'>Extra Notes:</span>
                        <span className='match-value match-value-error'>{result.top_guess.extra_notes.join(', ')}</span>
                      </div>
                    )}

                    {result.top_guess.missing_scale_notes.length > 0 && (
                      <div className='match-detail-row'>
                        <span className='match-label'>Missing Notes:</span>
                        <span className='match-value match-value-muted'>{result.top_guess.missing_scale_notes.join(', ')}</span>
                      </div>
                    )}

                    <div
                      className='match-detail-row'
                      style={{
                        marginTop: 'var(--spacing-md)',
                        paddingTop: 'var(--spacing-md)',
                        borderTop: '1px solid var(--border)',
                      }}
                    >
                      <span className='match-label'>
                        <Info size={14} style={{ marginRight: '6px' }} />
                        Analysis:
                      </span>
                      <span className='match-value'>{result.top_guess.explanation}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All Candidates */}
          <div className='card'>
            <div className='card-header'>
              <h3 className='card-title'>All Candidates</h3>
              <p className='card-description'>Ranked by probability (top {result.candidates.length})</p>
            </div>
            <div className='card-content'>
              <div className='candidates-list'>
                {result.candidates.map((candidate, index) => (
                  <div key={index} className='candidate-item'>
                    <div className='candidate-header'>
                      <div className='candidate-rank'>#{index + 1}</div>
                      <div className='candidate-info'>
                        <div className='candidate-name'>
                          {candidate.root} {candidate.scale_name}
                        </div>
                        {candidate.mode_name && <div className='candidate-mode'>{candidate.mode_name}</div>}
                      </div>
                      <div className='candidate-score'>
                        <div className='candidate-probability'>{candidate.probability_percent}%</div>
                        <div className='candidate-score-value'>Score: {candidate.score_0_100}</div>
                      </div>
                    </div>

                    <div className='candidate-metrics'>
                      <div className='metric'>
                        <span className='metric-label'>Coverage</span>
                        <span className='metric-value'>{(candidate.coverage_ratio * 100).toFixed(0)}%</span>
                      </div>
                      <div className='metric'>
                        <span className='metric-label'>Purity</span>
                        <span className='metric-value'>{(candidate.purity_ratio * 100).toFixed(0)}%</span>
                      </div>
                      <div className='metric'>
                        <span className='metric-label'>Extra</span>
                        <span className='metric-value metric-value-error'>{candidate.extra_notes.length}</span>
                      </div>
                      <div className='metric'>
                        <span className='metric-label'>Missing</span>
                        <span className='metric-value metric-value-muted'>{candidate.missing_scale_notes.length}</span>
                      </div>
                    </div>

                    {/* Note della scala */}
                    <div
                      className='candidate-notes'
                      style={{
                        padding: '0.75rem 1rem',
                        background: 'var(--bg-secondary, #1e293b)',
                        borderRadius: 'var(--radius-sm, 0.375rem)',
                        marginBottom: 'var(--spacing-sm, 0.5rem)',
                        borderLeft: '3px solid var(--primary, #3b82f6)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 'var(--font-size-xs, 0.75rem)',
                          color: 'var(--text-muted, #94a3b8)',
                          marginBottom: '0.25rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          fontWeight: '500',
                        }}
                      >
                        Scale Notes:
                      </div>
                      <div
                        style={{
                          fontSize: 'var(--font-size-sm, 0.875rem)',
                          color: 'var(--text-primary, #f1f5f9)',
                          fontWeight: '600',
                          wordBreak: 'break-word',
                        }}
                      >
                        {candidate.matched_notes.concat(candidate.missing_scale_notes).join(', ')}
                      </div>
                    </div>

                    <div className='candidate-explanation'>{candidate.explanation}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
