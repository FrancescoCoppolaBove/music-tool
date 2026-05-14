/**
 * ADVANCED MODAL ANALYSIS PANEL
 * Visualizza analisi modale completa: borrowed chords, secondary dominants, harmonic journey
 */

import React, { useState } from 'react';
import { Music, Sparkles, GitBranch, TrendingUp, Lightbulb, ChevronDown, ChevronUp, Info } from 'lucide-react';
import type { AdvancedModalAnalysis, ChordAnalysisDetail } from './utils/advanced-modal-analysis';

interface AdvancedModalAnalysisPanelProps {
  analysis: AdvancedModalAnalysis;
}

export function AdvancedModalAnalysisPanel({ analysis }: AdvancedModalAnalysisPanelProps) {
  const [showJourney, setShowJourney] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(true);
  const [showBorrowed, setShowBorrowed] = useState(true);
  const [showDominants, setShowDominants] = useState(true);

  if (!analysis.isModal) {
    return (
      <div className='advanced-modal-not-modal'>
        <Info size={20} />
        <p>Questa progressione è tonale. L'analisi modale avanzata è disponibile solo per progressioni modali.</p>
      </div>
    );
  }

  const { modalCenter, baseMode, modalInterchange, dominantAnalysis, chordBreakdown, harmonicJourney, summary } = analysis;

  return (
    <div className='advanced-modal-panel'>
      {/* Header con Badge & Info */}
      <div className='advanced-modal-header'>
        <div className='modal-center-badge'>
          <Music size={20} />
          <div className='modal-center-info'>
            <span className='modal-center-label'>Modal Center</span>
            <span className='modal-center-value'>
              {modalCenter} {baseMode}
            </span>
          </div>
        </div>

        {/* Summary Stats */}
        <div className='summary-stats'>
          <div className='stat-item'>
            <span className='stat-label'>Diatonic</span>
            <span className='stat-value'>{summary.diatonicCount}</span>
          </div>
          <div className='stat-item'>
            <span className='stat-label'>Borrowed</span>
            <span className='stat-value stat-borrowed'>{summary.borrowedCount}</span>
          </div>
          <div className='stat-item'>
            <span className='stat-label'>Sec. Dom.</span>
            <span className='stat-value stat-dominant'>{summary.secondaryDominantCount}</span>
          </div>
          <div className='stat-item'>
            <span className='stat-label'>SubV7</span>
            <span className='stat-value stat-tritone'>{summary.tritoneSubCount}</span>
          </div>
        </div>

        {/* Writing Quality */}
        <div className={`writing-quality-badge quality-${summary.modalWritingQuality}`}>
          <Sparkles size={16} />
          <span>{formatQuality(summary.modalWritingQuality)}</span>
        </div>
      </div>

      {/* Harmonic Journey */}
      <div className='analysis-section'>
        <div className='section-header' onClick={() => setShowJourney(!showJourney)}>
          <div className='section-title'>
            <TrendingUp size={20} />
            <h4>Harmonic Journey</h4>
          </div>
          <button className='section-toggle'>{showJourney ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</button>
        </div>

        {showJourney && (
          <div className='section-content'>
            <div className='harmonic-journey'>
              {harmonicJourney.map((step, idx) => (
                <div key={idx} className={`journey-step emotion-${step.emotion}`}>
                  <div className='step-number'>{step.step}</div>
                  <div className='step-content'>
                    <div className='step-description'>{step.description}</div>
                    <div className='step-chords'>
                      {step.chords.map((chord, cIdx) => (
                        <span key={cIdx} className='step-chord'>
                          {chord}
                        </span>
                      ))}
                    </div>
                  </div>
                  {idx < harmonicJourney.length - 1 && <div className='journey-arrow'>→</div>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chord-by-Chord Breakdown */}
      <div className='analysis-section'>
        <div className='section-header' onClick={() => setShowBreakdown(!showBreakdown)}>
          <div className='section-title'>
            <Music size={20} />
            <h4>Chord-by-Chord Analysis</h4>
          </div>
          <button className='section-toggle'>{showBreakdown ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</button>
        </div>

        {showBreakdown && (
          <div className='section-content'>
            <div className='chord-breakdown-grid'>
              {chordBreakdown.map((detail) => (
                <div key={detail.index} className={`chord-detail-card classification-${detail.classification}`}>
                  <div className='chord-detail-header'>
                    <span className='chord-number'>{detail.index + 1}</span>
                    <span className='chord-symbol-large'>{detail.symbol}</span>
                    <span className={`classification-badge badge-${detail.classification}`}>
                      {formatClassification(detail.classification)}
                    </span>
                  </div>

                  <div className='chord-detail-body'>
                    {/* Diatonic Info */}
                    {detail.classification === 'diatonic' && (
                      <div className='detail-info'>
                        <div className='info-row'>
                          <span className='info-label'>Degree:</span>
                          <span className='info-value degree-badge'>{detail.degree}</span>
                        </div>
                        <div className='info-row'>
                          <span className='info-label'>Function:</span>
                          <span className='info-value'>{detail.function}</span>
                        </div>
                      </div>
                    )}

                    {/* Borrowed Info */}
                    {detail.classification === 'borrowed' && (
                      <div className='detail-info borrowed-info'>
                        <div className='info-row'>
                          <span className='info-label'>Borrowed from:</span>
                          <span className='info-value borrowed-mode'>{detail.borrowedFrom}</span>
                        </div>
                        <div className='info-row'>
                          <span className='info-label'>Degree:</span>
                          <span className='info-value degree-badge'>{detail.borrowedDegree}</span>
                        </div>
                        {detail.scaleSource && (
                          <div className='info-row'>
                            <span className='info-label'>Scale:</span>
                            <span className='info-value scale-source'>{detail.scaleSource}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Secondary Dominant Info */}
                    {(detail.classification === 'secondary-dominant' || detail.classification === 'tritone-sub') && (
                      <div className='detail-info dominant-info'>
                        <div className='info-row'>
                          <span className='info-label'>Function:</span>
                          <span className='info-value dominant-function'>{detail.dominantFunction}</span>
                        </div>
                        <div className='info-row'>
                          <span className='info-label'>Target:</span>
                          <span className='info-value dominant-target'>{detail.dominantTarget}</span>
                        </div>
                        {detail.extensions.length > 0 && (
                          <div className='info-row'>
                            <span className='info-label'>Alterations:</span>
                            <div className='alterations-list'>
                              {detail.extensions.map((ext, idx) => (
                                <span key={idx} className='alteration-badge'>
                                  {ext}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Color & Effect */}
                    {detail.color && detail.color !== 'Natural voicing' && (
                      <div className='chord-color'>
                        <Sparkles size={14} />
                        <span>{detail.color}</span>
                      </div>
                    )}

                    <div className='chord-effect'>{detail.effect}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Borrowed Chords Summary */}
      {modalInterchange.borrowedChords.length > 0 && (
        <div className='analysis-section'>
          <div className='section-header' onClick={() => setShowBorrowed(!showBorrowed)}>
            <div className='section-title'>
              <GitBranch size={20} />
              <h4>Modal Interchange ({modalInterchange.borrowedChords.length})</h4>
            </div>
            <button className='section-toggle'>{showBorrowed ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</button>
          </div>

          {showBorrowed && (
            <div className='section-content'>
              <div className='borrowed-chords-list'>
                {modalInterchange.borrowedChords.map((borrowed, idx) => (
                  <div key={idx} className='borrowed-chord-item'>
                    <div className='borrowed-chord-header'>
                      <span className='borrowed-symbol'>{borrowed.chordSymbol}</span>
                      <span className='borrowed-arrow'>←</span>
                      <span className='borrowed-source'>
                        {borrowed.degree} from {borrowed.sourceMode}
                      </span>
                    </div>
                    <div className='borrowed-effect'>{borrowed.effect}</div>
                    {borrowed.color !== 'Natural voicing' && (
                      <div className='borrowed-color'>
                        <Sparkles size={12} />
                        {borrowed.color}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Secondary Dominants Summary */}
      {(dominantAnalysis.secondaryDominants.length > 0 || dominantAnalysis.tritoneSubstitutions.length > 0) && (
        <div className='analysis-section'>
          <div className='section-header' onClick={() => setShowDominants(!showDominants)}>
            <div className='section-title'>
              <Lightbulb size={20} />
              <h4>Dominants & Subs ({dominantAnalysis.secondaryDominants.length + dominantAnalysis.tritoneSubstitutions.length})</h4>
            </div>
            <button className='section-toggle'>{showDominants ? <ChevronUp size={20} /> : <ChevronDown size={20} />}</button>
          </div>

          {showDominants && (
            <div className='section-content'>
              {/* Secondary Dominants */}
              {dominantAnalysis.secondaryDominants.length > 0 && (
                <div className='dominants-section'>
                  <h5 className='subsection-title'>Secondary Dominants</h5>
                  <div className='dominants-list'>
                    {dominantAnalysis.secondaryDominants.map((dom, idx) => (
                      <div key={idx} className='dominant-item'>
                        <div className='dominant-progression'>
                          <span className='dominant-chord'>{dom.dominantSymbol}</span>
                          <span className='dominant-arrow'>→</span>
                          <span className='dominant-target'>{dom.targetSymbol}</span>
                        </div>
                        <div className='dominant-function-badge'>{dom.function}</div>
                        {dom.alterations.length > 0 && (
                          <div className='dominant-alterations'>
                            {dom.alterations.map((alt, aIdx) => (
                              <span key={aIdx} className='alteration-tag'>
                                {alt}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className='dominant-effect'>{dom.effect}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tritone Subs */}
              {dominantAnalysis.tritoneSubstitutions.length > 0 && (
                <div className='dominants-section'>
                  <h5 className='subsection-title'>Tritone Substitutions</h5>
                  <div className='dominants-list'>
                    {dominantAnalysis.tritoneSubstitutions.map((sub, idx) => (
                      <div key={idx} className='dominant-item tritone-sub-item'>
                        <div className='dominant-progression'>
                          <span className='dominant-chord tritone-sub-chord'>{sub.dominantSymbol}</span>
                          <span className='dominant-arrow'>→</span>
                          <span className='dominant-target'>{sub.targetSymbol}</span>
                        </div>
                        <div className='dominant-function-badge tritone-badge'>{sub.function}</div>
                        <div className='dominant-effect'>{sub.effect}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===================================
// HELPER FUNCTIONS
// ===================================

function formatQuality(quality: string): string {
  const map: Record<string, string> = {
    excellent: 'Excellent Writing',
    good: 'Good Writing',
    fair: 'Fair Writing',
    poor: 'Needs Work',
  };
  return map[quality] || quality;
}

function formatClassification(classification: string): string {
  const map: Record<string, string> = {
    diatonic: 'Diatonic',
    borrowed: 'Borrowed',
    'secondary-dominant': 'Sec. Dom.',
    'tritone-sub': 'SubV7',
    chromatic: 'Chromatic',
  };
  return map[classification] || classification;
}
