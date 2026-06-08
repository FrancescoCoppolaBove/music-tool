/**
 * COMPOSITION ASSISTANT FEATURE - MAIN COMPONENT
 * Hybrid: 70% deterministic logic + 30% AI generative
 */

import React, { useState, useMemo } from 'react';
import { Music, Lightbulb, GitBranch, Sparkles, Play, ChevronDown, ChevronUp } from 'lucide-react';
import { Chord } from 'tonal';
import { audioPlayer } from '../ear-training/utils/audio-player';
import { analyzeProgression, parseChord, type ProgressionAnalysis } from './utils/chord-analysis';
import { getScaleMatches, type ChordScaleAnalysis } from './utils/scale-matching';
import { getAllPassingChords, type PassingChordSuggestion } from './utils/passing-chord-logic';
// ✅ ADVANCED: Import advanced modal analysis
import { analyzeAdvancedModal, type AdvancedModalAnalysis } from './utils/advanced-modal-analysis';
import { AdvancedModalAnalysisPanel } from './AdvancedModalAnalysisPanel';
import './styles/composition-assistant.css';
import './styles/advanced-modal-analysis.css';

export function CompositionAssistantFeature() {
  const [chordInput, setChordInput] = useState<string>('Cmaj7 Am7 Dm7 G7');
  const [analysis, setAnalysis] = useState<ProgressionAnalysis | null>(null);
  // ✅ ADVANCED: State for advanced modal analysis
  const [advancedModalAnalysis, setAdvancedModalAnalysis] = useState<AdvancedModalAnalysis | null>(null);

  // Accordion states (mobile)
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [showScales, setShowScales] = useState(false);
  const [showPassing, setShowPassing] = useState(false);
  const [showAI, setShowAI] = useState(false);

  // Analyze progression when input changes
  const handleAnalyze = () => {
    const chordSymbols = chordInput
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (chordSymbols.length === 0) {
      setAnalysis(null);
      setAdvancedModalAnalysis(null);
      return;
    }

    const result = analyzeProgression(chordSymbols);
    setAnalysis(result);

    // ✅ ADVANCED: Analyze modal characteristics with full breakdown
    const advancedResult = analyzeAdvancedModal(result);
    setAdvancedModalAnalysis(advancedResult);
  };

  // Get scale suggestions for each chord
  const scaleAnalyses = useMemo(() => {
    if (!analysis || analysis.chords.length === 0) return [];

    return analysis.chords.map((ca) => ({
      chord: ca.chord,
      scales: getScaleMatches(ca.chord),
    }));
  }, [analysis]);

  // Get passing chord suggestions
  const passingChordSuggestions = useMemo(() => {
    if (!analysis || analysis.chords.length < 2) return [];

    const suggestions: Array<{
      from: string;
      to: string;
      options: PassingChordSuggestion[];
    }> = [];

    for (let i = 0; i < analysis.chords.length - 1; i++) {
      const fromChord = analysis.chords[i].chord;
      const toChord = analysis.chords[i + 1].chord;

      const options = getAllPassingChords(fromChord, toChord, analysis.key, analysis.mode);

      suggestions.push({
        from: fromChord.original,
        to: toChord.original,
        options: options.slice(0, 5), // Top 5 suggestions
      });
    }

    return suggestions;
  }, [analysis]);

  return (
    <div className='composition-assistant-feature'>
      {/* Header */}
      <div className='card'>
        <div className='card-header'>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Music size={28} style={{ color: 'var(--primary)' }} />
            <div>
              <h2 className='card-title'>Composition Assistant</h2>
              <p className='card-description'>Analyze chord progressions • Get scale suggestions • Generate passing chords</p>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className='card-content'>
          <div className='progression-input-section'>
            <label className='input-label'>
              Enter Chord Progression
              <span className='input-hint'>Example: Cmaj7 Am7 Dm7 G7</span>
            </label>

            <div className='input-group'>
              <input
                type='text'
                className='chord-input'
                value={chordInput}
                onChange={(e) => setChordInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                placeholder='Cmaj7 Am7 Dm7 G7'
              />
              <button className='analyze-button' onClick={handleAnalyze}>
                <Sparkles size={18} />
                <span>Analyze</span>
              </button>
            </div>

            {/* Quick presets */}
            <div className='preset-chips'>
              <span className='preset-label'>Quick presets:</span>
              <button className='preset-chip' onClick={() => setChordInput('Cmaj7 Am7 Dm7 G7')}>
                I - vi - ii - V
              </button>
              <button className='preset-chip' onClick={() => setChordInput('Dm7 G7 Cmaj7')}>
                ii - V - I
              </button>
              <button className='preset-chip' onClick={() => setChordInput('C F G C')}>
                I - IV - V - I
              </button>
              <button className='preset-chip' onClick={() => setChordInput('Am F C G')}>
                vi - IV - I - V
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Analysis Results */}
      {analysis && analysis.chords.length > 0 && (
        <>
          {/* Harmonic Analysis */}
          <div className='card'>
            <div className='card-header accordion-header' onClick={() => setShowAnalysis(!showAnalysis)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <GitBranch size={24} style={{ color: 'var(--primary)' }} />
                <h3 className='card-title'>Harmonic Analysis</h3>
              </div>
              <button className='accordion-toggle'>{showAnalysis ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</button>
            </div>

            {showAnalysis && (
              <div className='card-content'>
                {/* Key Detection */}
                {analysis.key && (
                  <div className='key-detection-box'>
                    <div className='key-info'>
                      <span className='key-label'>Detected Key:</span>
                      <span className='key-value'>
                        {analysis.key} {analysis.mode}
                      </span>
                      <span className='confidence-badge'>{analysis.keyConfidence}% confidence</span>
                    </div>

                    {analysis.cadenceType && analysis.cadenceType !== 'none' && (
                      <div className='cadence-info'>
                        <span className='cadence-label'>Cadence:</span>
                        <span className='cadence-value'>{formatCadenceType(analysis.cadenceType)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Chord Analysis Table */}
                <div className='chord-analysis-grid'>
                  {analysis.chords.map((ca, idx) => (
                    <div key={idx} className='chord-analysis-card'>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between' }}>
                        <div className='chord-symbol'>{ca.chord.original}</div>
                        <button
                          onClick={async () => {
                            const notes = Chord.get(ca.chord.original).notes;
                            if (notes.length > 0) {
                              await audioPlayer.preloadAllNotes();
                              audioPlayer.playChord(notes.map(n => `${n}3`));
                            }
                          }}
                          title={`Play ${ca.chord.original}`}
                          style={{
                            width: 22, height: 22, borderRadius: '50%',
                            background: '#1c2128', border: '1px solid #30363d',
                            cursor: 'pointer', fontSize: 9, color: '#6b7280',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: 0, flexShrink: 0,
                          }}
                        >▶</button>
                      </div>

                      {ca.romanNumeral && <div className='roman-numeral'>{ca.romanNumeral}</div>}

                      {ca.function && <div className={`function-badge function-${ca.function}`}>{formatFunction(ca.function)}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ✅ ADVANCED - Modal Analysis */}
          {advancedModalAnalysis && (
            <div className='card'>
              <div className='card-header'>
                <h3 className='card-title'>🎼 Advanced Modal Analysis</h3>
              </div>
              <div className='card-content'>
                <AdvancedModalAnalysisPanel analysis={advancedModalAnalysis} />
              </div>
            </div>
          )}

          {/* Scale Suggestions */}
          <div className='card'>
            <div className='card-header accordion-header' onClick={() => setShowScales(!showScales)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Lightbulb size={24} style={{ color: 'var(--primary)' }} />
                <h3 className='card-title'>Scale Suggestions</h3>
              </div>
              <button className='accordion-toggle'>{showScales ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</button>
            </div>

            {showScales && (
              <div className='card-content'>
                <div className='scales-grid'>
                  {scaleAnalyses.map((sa, idx) => (
                    <div key={idx} className='scale-suggestion-card'>
                      <div className='scale-card-header'>
                        <span className='chord-name'>{sa.chord.original}</span>
                      </div>

                      <div className='scale-options'>
                        {sa.scales.slice(0, 3).map((scale, sIdx) => (
                          <div key={sIdx} className={`scale-option scale-${scale.priority}`}>
                            <div className='scale-name-row'>
                              <span className='scale-name'>{scale.scaleName}</span>
                              <span className='priority-badge'>{scale.priority}</span>
                            </div>
                            <div className='scale-notes'>{scale.notes.join(' - ')}</div>
                            <div className='scale-description'>{scale.characteristic}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Passing Chords */}
          <div className='card'>
            <div className='card-header accordion-header' onClick={() => setShowPassing(!showPassing)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <GitBranch size={24} style={{ color: 'var(--primary)' }} />
                <h3 className='card-title'>Passing Chord Suggestions</h3>
              </div>
              <button className='accordion-toggle'>{showPassing ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</button>
            </div>

            {showPassing && (
              <div className='card-content'>
                <div className='passing-chords-section'>
                  {passingChordSuggestions.map((ps, idx) => (
                    <div key={idx} className='passing-chord-group'>
                      <div className='transition-header'>
                        <span className='from-chord'>{ps.from}</span>
                        <span className='arrow'>→</span>
                        <span className='to-chord'>{ps.to}</span>
                      </div>

                      <div className='passing-options'>
                        {ps.options.map((option, oIdx) => (
                          <div key={oIdx} className='passing-option'>
                            <div className='passing-chord-symbol'>{option.chord.original}</div>
                            <div className='passing-type-badge'>{option.type}</div>
                            <div className='passing-description'>{option.description}</div>
                            <div className='jazziness-bar'>
                              <span className='jazziness-label'>Jazz level:</span>
                              <div className='jazziness-track'>
                                <div className='jazziness-fill' style={{ width: `${option.jazziness * 10}%` }} />
                              </div>
                              <span className='jazziness-value'>{option.jazziness}/10</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Suggestions (Placeholder) */}
          <div className='card'>
            <div className='card-header accordion-header' onClick={() => setShowAI(!showAI)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Sparkles size={24} style={{ color: 'var(--primary)' }} />
                <h3 className='card-title'>AI Creative Suggestions</h3>
              </div>
              <button className='accordion-toggle'>{showAI ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</button>
            </div>

            {showAI && (
              <div className='card-content'>
                <div className='ai-placeholder'>
                  <Sparkles size={48} style={{ color: 'var(--primary)', opacity: 0.3 }} />
                  <h4>AI Suggestions Coming Soon</h4>
                  <p>This section will use Claude API to provide:</p>
                  <ul>
                    <li>Genre-specific variations of your progression</li>
                    <li>Stylistic analysis (jazz, rock, classical, etc.)</li>
                    <li>Progression completion suggestions</li>
                    <li>Voice leading improvements</li>
                    <li>Creative reharmonization ideas</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Empty State */}
      {!analysis && (
        <div className='empty-state'>
          <Music size={64} style={{ color: 'var(--text-tertiary)', opacity: 0.3 }} />
          <h3>Enter a chord progression to get started</h3>
          <p>Type chord symbols separated by spaces or commas, then click Analyze</p>
        </div>
      )}
    </div>
  );
}

// ===================================
// HELPER FUNCTIONS
// ===================================

function formatCadenceType(cadence: string): string {
  const names: Record<string, string> = {
    authentic: 'Authentic Cadence (V → I)',
    plagal: 'Plagal Cadence (IV → I)',
    deceptive: 'Deceptive Cadence (V → vi)',
    half: 'Half Cadence (→ V)',
  };
  return names[cadence] || cadence;
}

function formatFunction(func: string): string {
  const names: Record<string, string> = {
    tonic: 'Tonic',
    subdominant: 'Subdominant',
    dominant: 'Dominant',
    modal: 'Modal',
    chromatic: 'Chromatic',
  };
  return names[func] || func;
}
