/**
 * MODAL INFO PANEL - Nuovo componente per Scale Harmonization
 * Mostra classificazione modale, nota caratteristica, writing tips
 */

import React from 'react';
import { Info, AlertTriangle, CheckCircle, Music } from 'lucide-react';
import type { ScaleHarmonization, ChordDegree } from '../utils/scale-harmonization-data';

interface ModalInfoPanelProps {
  harmonization: ScaleHarmonization;
}

export function ModalInfoPanel({ harmonization }: ModalInfoPanelProps) {
  // Raggruppa accordi per tipo modale
  const tonicChords = harmonization.degrees.filter((d) => d.modalType === 'tonic');
  const cadencingChords = harmonization.degrees.filter((d) => d.modalType === 'cadencing');
  const conditionedChords = harmonization.degrees.filter((d) => d.modalType === 'conditioned');
  const movementChords = harmonization.degrees.filter((d) => d.modalType === 'movement');
  const avoidChords = harmonization.degrees.filter((d) => d.modalType === 'avoid');

  return (
    <div className='modal-info-panel'>
      {/* Nota Caratteristica */}
      {harmonization.characteristicNote && (
        <div className='characteristic-note-box'>
          <div className='char-note-header'>
            <Music size={20} />
            <span>Nota Caratteristica</span>
          </div>
          <div className='char-note-value'>{harmonization.characteristicNote}</div>
          <p className='char-note-description'>
            Questa nota differenzia {harmonization.modeName} dal modo di riferimento. Usala nella melodia per definire il colore modale!
          </p>
        </div>
      )}

      {/* Classificazione Accordi Modali */}
      <div className='modal-classification-section'>
        <h4 className='section-title'>📊 Classificazione Modale degli Accordi</h4>

        {/* Tonica */}
        <div className='chord-category tonic-category'>
          <div className='category-header'>
            <span className='category-icon'>🏠</span>
            <span className='category-name'>TONICA</span>
            <span className='category-count'>{tonicChords.length}</span>
          </div>
          <div className='category-chords'>
            {tonicChords.map((chord) => (
              <span key={chord.degree} className='chord-badge tonic-badge'>
                {chord.symbol}
              </span>
            ))}
          </div>
          <p className='category-tip'>Il centro del brano. Occupa 70-90% dello spazio!</p>
        </div>

        {/* Cadenzanti */}
        {cadencingChords.length > 0 && (
          <div className='chord-category cadencing-category'>
            <div className='category-header'>
              <span className='category-icon'>⭐</span>
              <span className='category-name'>CADENZANTI</span>
              <span className='category-count'>{cadencingChords.length}</span>
            </div>
            <div className='category-chords'>
              {cadencingChords.map((chord) => (
                <div key={chord.degree} className='chord-item'>
                  <span className='chord-badge cadencing-badge'>{chord.symbol}</span>
                  {chord.characteristicPosition && (
                    <span className='char-position'>(nota car. in {formatPosition(chord.characteristicPosition)})</span>
                  )}
                </div>
              ))}
            </div>
            <p className='category-tip'>✅ Contengono la nota caratteristica → Usa questi per cadenzare!</p>
          </div>
        )}

        {/* Condizionati */}
        {conditionedChords.length > 0 && (
          <div className='chord-category conditioned-category'>
            <div className='category-header'>
              <span className='category-icon'>⚠️</span>
              <span className='category-name'>CONDIZIONATI</span>
              <span className='category-count'>{conditionedChords.length}</span>
            </div>
            <div className='category-chords'>
              {conditionedChords.map((chord) => (
                <div key={chord.degree} className='chord-item'>
                  <span className='chord-badge conditioned-badge'>{chord.symbol}</span>
                  {chord.warning && (
                    <div className='chord-warning'>
                      <AlertTriangle size={14} />
                      <span>{chord.warning}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className='category-tip'>⚠️ Dominanti con tritono → Attenzione! NON farli risolvere tonalmente</p>
          </div>
        )}

        {/* Movimento */}
        {movementChords.length > 0 && (
          <div className='chord-category movement-category'>
            <div className='category-header'>
              <span className='category-icon'>🎨</span>
              <span className='category-name'>MOVIMENTO</span>
              <span className='category-count'>{movementChords.length}</span>
            </div>
            <div className='category-chords'>
              {movementChords.map((chord) => (
                <span key={chord.degree} className='chord-badge movement-badge'>
                  {chord.symbol}
                </span>
              ))}
            </div>
            <p className='category-tip'>Usali per collegare tonica e cadenzanti</p>
          </div>
        )}

        {/* Avoid */}
        {avoidChords.length > 0 && (
          <div className='chord-category avoid-category'>
            <div className='category-header'>
              <span className='category-icon'>🚫</span>
              <span className='category-name'>EVITA</span>
              <span className='category-count'>{avoidChords.length}</span>
            </div>
            <div className='category-chords'>
              {avoidChords.map((chord) => (
                <span key={chord.degree} className='chord-badge avoid-badge'>
                  {chord.symbol}
                </span>
              ))}
            </div>
            <p className='category-tip'>❌ Diminuiti/semi-diminuiti → instabili, evitali</p>
          </div>
        )}
      </div>

      {/* Modal Writing Tips */}
      {harmonization.modalWritingTips && (
        <div className='modal-writing-tips'>
          <h4 className='section-title'>💡 Come Scrivere un Brano Modale</h4>
          <div className='tips-list'>
            {harmonization.modalWritingTips.map((tip, idx) => (
              <div key={idx} className='tip-item'>
                <CheckCircle size={16} className='tip-icon' />
                <span>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rhythmic Harmony Tip */}
      {harmonization.rhythmicHarmonyTip && (
        <div className='rhythmic-harmony-box'>
          <h4 className='section-title'>🎵 Ritmo Armonico</h4>
          <p>{harmonization.rhythmicHarmonyTip}</p>
        </div>
      )}
    </div>
  );
}

function formatPosition(position: 'root' | '3rd' | '5th' | '7th'): string {
  const map = {
    root: 'fondamentale',
    '3rd': '3ª',
    '5th': '5ª',
    '7th': '7ª',
  };
  return map[position];
}
