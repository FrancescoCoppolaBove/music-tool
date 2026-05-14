/**
 * MODAL ANALYSIS PANEL - Nuovo pannello per Composition Assistant
 * Mostra se la progressione è modale, stabilità, warnings, suggestions
 */

import React from 'react';
import { AlertTriangle, CheckCircle, Info, TrendingUp, Lightbulb } from 'lucide-react';
import type { ModalAnalysis } from '../utils/modal-analysis';

interface ModalAnalysisPanelProps {
  modalAnalysis: ModalAnalysis;
}

export function ModalAnalysisPanel({ modalAnalysis }: ModalAnalysisPanelProps) {
  const { isModal, modalStability, tonicChord, tonicPercentage, warnings, suggestions } = modalAnalysis;

  return (
    <div className='modal-analysis-panel'>
      {/* Header con Badge */}
      <div className='modal-analysis-header'>
        <div className='modal-badge-container'>
          {isModal ? (
            <div className='modal-badge modal-badge-true'>
              <CheckCircle size={18} />
              <span>MODALE</span>
            </div>
          ) : (
            <div className='modal-badge modal-badge-false'>
              <Info size={18} />
              <span>TONALE</span>
            </div>
          )}
        </div>

        {/* Modal Stability Score */}
        {isModal && (
          <div className='stability-score-container'>
            <div className='stability-label'>
              <TrendingUp size={16} />
              <span>Stabilità Modale</span>
            </div>
            <div className='stability-bar'>
              <div className={`stability-fill ${getStabilityClass(modalStability)}`} style={{ width: `${modalStability}%` }} />
            </div>
            <div className='stability-value'>{modalStability}%</div>
            <p className='stability-description'>{getStabilityDescription(modalStability)}</p>
          </div>
        )}
      </div>

      {/* Tonic Info */}
      {tonicChord && tonicPercentage !== undefined && (
        <div className='tonic-info-box'>
          <div className='tonic-info-header'>
            <span className='tonic-icon'>🏠</span>
            <span className='tonic-label'>Accordo Tonico</span>
          </div>
          <div className='tonic-chord'>{tonicChord.original}</div>
          <div className='tonic-percentage'>
            <div className='percentage-bar-container'>
              <div className='percentage-label'>Presenza: {tonicPercentage}%</div>
              <div className='percentage-bar'>
                <div
                  className={`percentage-fill ${getTonicPercentageClass(tonicPercentage, isModal)}`}
                  style={{ width: `${tonicPercentage}%` }}
                />
              </div>
            </div>
            <p className='percentage-tip'>
              {isModal
                ? `In musica modale la tonica dovrebbe occupare 70-90% del brano.`
                : `In musica tonale la tonica può occupare 10-30% del brano.`}
            </p>
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className='modal-warnings-section'>
          <h4 className='section-title'>
            <AlertTriangle size={20} />
            <span>Attenzione</span>
          </h4>
          <div className='warnings-list'>
            {warnings.map((warning, idx) => (
              <div key={idx} className={`warning-item warning-${warning.severity}`}>
                <div className='warning-icon'>
                  {warning.severity === 'high' && '🔴'}
                  {warning.severity === 'medium' && '🟡'}
                  {warning.severity === 'low' && '🟢'}
                </div>
                <div className='warning-content'>
                  <div className='warning-type'>{formatWarningType(warning.type)}</div>
                  <div className='warning-message'>{warning.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className='modal-suggestions-section'>
          <h4 className='section-title'>
            <Lightbulb size={20} />
            <span>Suggerimenti per Migliorare</span>
          </h4>
          <div className='suggestions-list'>
            {suggestions.map((suggestion, idx) => (
              <div key={idx} className='suggestion-item'>
                <div className='suggestion-icon'>💡</div>
                <div className='suggestion-content'>
                  <div className='suggestion-message'>{suggestion.message}</div>
                  {suggestion.example && (
                    <div className='suggestion-example'>
                      <span className='example-label'>Esempio:</span>
                      <code>{suggestion.example}</code>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Writing Guide (se è modale) */}
      {isModal && (
        <div className='modal-writing-guide'>
          <h4 className='section-title'>📖 Guida Scrittura Modale</h4>
          <div className='guide-tips'>
            <div className='guide-tip'>
              <CheckCircle size={16} className='tip-icon-success' />
              <span>Usa 1 tonica + 2-3 accordi cadenzanti (con nota caratteristica)</span>
            </div>
            <div className='guide-tip'>
              <CheckCircle size={16} className='tip-icon-success' />
              <span>La tonica occupa 70-90% del brano</span>
            </div>
            <div className='guide-tip'>
              <CheckCircle size={16} className='tip-icon-success' />
              <span>Accordi cadenzanti vanno sui tempi DEBOLI → spingono verso tonica sul tempo FORTE</span>
            </div>
            <div className='guide-tip'>
              <AlertTriangle size={16} className='tip-icon-warning' />
              <span>Evita tritoni che risolvono tonalmente (fanno crollare la modalità!)</span>
            </div>
            <div className='guide-tip'>
              <Lightbulb size={16} className='tip-icon-idea' />
              <span>Prova il PEDAL POINT: basso fisso sulla tonica, accordi sopra che si muovono</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===================================
// Helper Functions
// ===================================

function getStabilityClass(stability: number): string {
  if (stability >= 80) return 'stability-excellent';
  if (stability >= 60) return 'stability-good';
  if (stability >= 40) return 'stability-fair';
  return 'stability-weak';
}

function getStabilityDescription(stability: number): string {
  if (stability >= 80) return '✅ Eccellente! La modalità è molto stabile.';
  if (stability >= 60) return '👍 Buona stabilità modale.';
  if (stability >= 40) return '⚠️ Modalità debole - rischio di cadere nel tonale.';
  return '❌ La progressione sta scivolando verso il tonale.';
}

function getTonicPercentageClass(percentage: number, isModal: boolean): string {
  if (isModal) {
    // Per modale: 70-90% è ideale
    if (percentage >= 70 && percentage <= 90) return 'percentage-perfect';
    if (percentage >= 50) return 'percentage-good';
    return 'percentage-low';
  } else {
    // Per tonale: 10-30% è normale
    if (percentage >= 10 && percentage <= 30) return 'percentage-perfect';
    return 'percentage-normal';
  }
}

function formatWarningType(type: string): string {
  const types: Record<string, string> = {
    tritone: 'Tritono Pericoloso',
    'tonal-pull': 'Cadenza Tonale',
    'too-many-chords': 'Troppi Accordi',
    'weak-tonic': 'Tonica Debole',
  };
  return types[type] || type;
}

// ===================================
// CSS Snippet per i nuovi stili
// ===================================

/*
.modal-analysis-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modal-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 24px;
  font-weight: 700;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.modal-badge-true {
  background-color: rgba(16, 185, 129, 0.2);
  color: #10b981;
  border: 2px solid #10b981;
}

.modal-badge-false {
  background-color: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  border: 2px solid #3b82f6;
}

.stability-bar {
  height: 12px;
  background-color: var(--bg-secondary);
  border-radius: 6px;
  overflow: hidden;
  margin: 0.5rem 0;
}

.stability-excellent { background: linear-gradient(90deg, #10b981, #059669); }
.stability-good { background: linear-gradient(90deg, #3b82f6, #2563eb); }
.stability-fair { background: linear-gradient(90deg, #fbbf24, #f59e0b); }
.stability-weak { background: linear-gradient(90deg, #ef4444, #dc2626); }

.warning-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 0.75rem;
}

.warning-high {
  background-color: rgba(239, 68, 68, 0.1);
  border-left: 4px solid #ef4444;
}

.warning-medium {
  background-color: rgba(251, 191, 36, 0.1);
  border-left: 4px solid #fbbf24;
}

.warning-low {
  background-color: rgba(16, 185, 129, 0.1);
  border-left: 4px solid #10b981;
}

.suggestion-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background-color: rgba(59, 130, 246, 0.05);
  border-left: 4px solid #3b82f6;
  border-radius: 8px;
  margin-bottom: 0.75rem;
}

.suggestion-example {
  margin-top: 0.5rem;
  padding: 0.75rem;
  background-color: var(--bg-secondary);
  border-radius: 4px;
}

.suggestion-example code {
  font-family: 'Monaco', 'Consolas', monospace;
  color: var(--primary);
}
*/
