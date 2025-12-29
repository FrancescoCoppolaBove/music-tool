/**
 * CIRCLE OF FIFTHS FEATURE
 * Interactive circle with key information and relationships
 */

import React, { useState } from 'react';
import { Music, Info, Zap, TrendingUp, BookOpen } from 'lucide-react';
import {
  CIRCLE_ORDER,
  MINOR_CIRCLE_ORDER,
  MAJOR_KEYS,
  MINOR_KEYS,
  getKeyInfo,
  getNeighbors,
  type KeyInfo,
} from '../circle-of-fifth/utils/circle-of-fifths-data';
import { KeySignaturesTrainer } from '../circle-of-fifth/components/KeySignatureTrainer';

type TabView = 'circle' | 'trainer';

export function CircleOfFifthsFeature() {
  const [selectedKey, setSelectedKey] = useState<string>('C');
  const [mode, setMode] = useState<'major' | 'minor'>('major');
  const [highlightRelations, setHighlightRelations] = useState(true);
  const [activeTab, setActiveTab] = useState<TabView>('circle');

  const currentKeyInfo = getKeyInfo(selectedKey, mode);
  const neighbors = getNeighbors(selectedKey);

  return (
    <div className='circle-of-fifths-feature'>
      {/* Header with Tabs */}
      <div className='card'>
        <div className='card-header'>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Music size={28} style={{ color: 'var(--primary)' }} />
            <div>
              <h2 className='card-title'>Circle of Fifths</h2>
              <p className='card-description'>Interactive key relationships and trainer</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className='circle-tabs'>
          <button onClick={() => setActiveTab('circle')} className={`tab-button ${activeTab === 'circle' ? 'active' : ''}`}>
            <Music size={18} />
            <span>Interactive Circle</span>
          </button>
          <button onClick={() => setActiveTab('trainer')} className={`tab-button ${activeTab === 'trainer' ? 'active' : ''}`}>
            <BookOpen size={18} />
            <span>Key Signatures Trainer</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'circle' && (
        <>
          {/* Controls */}
          <div className='card'>
            <div className='card-content'>
              <div className='circle-controls'>
                <div className='control-group'>
                  <label className='control-label'>Mode</label>
                  <div className='mode-toggle'>
                    <button onClick={() => setMode('major')} className={`toggle-button ${mode === 'major' ? 'active' : ''}`}>
                      Major
                    </button>
                    <button onClick={() => setMode('minor')} className={`toggle-button ${mode === 'minor' ? 'active' : ''}`}>
                      Minor
                    </button>
                  </div>
                </div>

                <div className='control-group'>
                  <label className='control-label'>
                    <input type='checkbox' checked={highlightRelations} onChange={(e) => setHighlightRelations(e.target.checked)} />
                    Highlight relationships
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Circle Layout */}
          <div className='circle-layout'>
            <div className='card circle-container'>
              <CircleSVG
                selectedKey={selectedKey}
                onKeySelect={setSelectedKey}
                mode={mode}
                highlightRelations={highlightRelations}
                neighbors={neighbors}
              />
            </div>

            {currentKeyInfo && (
              <div className='card key-details-panel'>
                <div className='card-header'>
                  <h3 className='card-title'>
                    {currentKeyInfo.key} {mode === 'major' ? 'Major' : 'Minor'}
                  </h3>
                </div>

                <div className='card-content'>
                  {/* Key Signature */}
                  <div className='detail-section'>
                    <div className='detail-header'>
                      <Info size={18} />
                      <span>Key Signature</span>
                    </div>
                    <div className='key-signature'>
                      {currentKeyInfo.accidentals === 0 ? (
                        <span className='natural-badge'>No sharps or flats</span>
                      ) : (
                        <span className={`accidental-badge ${currentKeyInfo.accidentalType}`}>
                          {Math.abs(currentKeyInfo.accidentals)} {currentKeyInfo.accidentalType}
                          {Math.abs(currentKeyInfo.accidentals) > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Scale Notes */}
                  <div className='detail-section'>
                    <div className='detail-header'>
                      <Music size={18} />
                      <span>Scale Notes</span>
                    </div>
                    <div className='scale-notes'>
                      {currentKeyInfo.notes.map((note, idx) => (
                        <span key={idx} className='note-badge'>
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Relative Key */}
                  <div className='detail-section'>
                    <div className='detail-header'>
                      <TrendingUp size={18} />
                      <span>Relative {mode === 'major' ? 'Minor' : 'Major'}</span>
                    </div>
                    <div className='relative-key'>
                      <button
                        className='relative-key-button'
                        onClick={() => {
                          const relativeKey = mode === 'major' ? currentKeyInfo.relativeMinor : currentKeyInfo.relativeMajor;
                          if (relativeKey) {
                            setSelectedKey(relativeKey.replace('m', ''));
                            setMode(mode === 'major' ? 'minor' : 'major');
                          }
                        }}
                      >
                        {mode === 'major' ? currentKeyInfo.relativeMinor : currentKeyInfo.relativeMajor}
                      </button>
                    </div>
                  </div>

                  {/* Relationships */}
                  <div className='detail-section'>
                    <div className='detail-header'>
                      <Zap size={18} />
                      <span>Key Relationships</span>
                    </div>
                    <div className='relationships'>
                      <div className='relationship-item'>
                        <span className='relationship-label'>Subdominant (IV):</span>
                        <button className='relationship-button subdominant' onClick={() => setSelectedKey(neighbors.subdominant)}>
                          {neighbors.subdominant}
                        </button>
                      </div>
                      <div className='relationship-item'>
                        <span className='relationship-label'>Dominant (V):</span>
                        <button className='relationship-button dominant' onClick={() => setSelectedKey(neighbors.dominant)}>
                          {neighbors.dominant}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Diatonic Chords */}
                  <div className='detail-section'>
                    <div className='detail-header'>
                      <Music size={18} />
                      <span>Diatonic Chords</span>
                    </div>
                    <div className='diatonic-chords'>
                      {currentKeyInfo.diatonicChords.map((chord, idx) => (
                        <div key={idx} className='chord-item'>
                          <span className='chord-degree'>{chord.degree}</span>
                          <span className='chord-symbol'>{chord.symbol}</span>
                          <span className='chord-quality'>{chord.quality}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'trainer' && <KeySignaturesTrainer />}
    </div>
  );
}

// ===================================
// CIRCLE SVG COMPONENT
// ===================================

interface CircleSVGProps {
  selectedKey: string;
  onKeySelect: (key: string) => void;
  mode: 'major' | 'minor';
  highlightRelations: boolean;
  neighbors: { subdominant: string; dominant: string };
}

function CircleSVG({ selectedKey, onKeySelect, mode, highlightRelations, neighbors }: CircleSVGProps) {
  const centerX = 250;
  const centerY = 250;
  const outerRadius = 180;
  const innerRadius = 120;
  const textRadius = 150;

  // Use correct circle order for mode
  const circleOrder = mode === 'major' ? CIRCLE_ORDER : MINOR_CIRCLE_ORDER;
  const keyData = mode === 'major' ? MAJOR_KEYS : MINOR_KEYS;

  // Calculate position for each key
  const getKeyPosition = (index: number) => {
    // Start at 12 o'clock and go clockwise
    const angle = (index * 30 - 90) * (Math.PI / 180); // 30° per key, start at top
    return {
      x: centerX + textRadius * Math.cos(angle),
      y: centerY + textRadius * Math.sin(angle),
    };
  };

  // Create path for outer ring segment
  const createSegmentPath = (index: number) => {
    const startAngle = (index * 30 - 90 - 15) * (Math.PI / 180);
    const endAngle = (index * 30 - 90 + 15) * (Math.PI / 180);

    const x1 = centerX + outerRadius * Math.cos(startAngle);
    const y1 = centerY + outerRadius * Math.sin(startAngle);
    const x2 = centerX + outerRadius * Math.cos(endAngle);
    const y2 = centerY + outerRadius * Math.sin(endAngle);
    const x3 = centerX + innerRadius * Math.cos(endAngle);
    const y3 = centerY + innerRadius * Math.sin(endAngle);
    const x4 = centerX + innerRadius * Math.cos(startAngle);
    const y4 = centerY + innerRadius * Math.sin(startAngle);

    return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 0 0 ${x4} ${y4} Z`;
  };

  // Determine segment color/style
  const getSegmentClass = (key: string) => {
    const displayKey = mode === 'major' ? key : key.replace('m', '');
    const selectedDisplayKey = mode === 'major' ? selectedKey : selectedKey + 'm';

    if (key === selectedDisplayKey) return 'selected';
    if (highlightRelations) {
      const dominantKey = mode === 'major' ? neighbors.dominant : neighbors.dominant + 'm';
      const subdominantKey = mode === 'major' ? neighbors.subdominant : neighbors.subdominant + 'm';

      if (key === dominantKey) return 'dominant';
      if (key === subdominantKey) return 'subdominant';
    }
    return 'default';
  };

  return (
    <svg viewBox='0 0 500 500' className='circle-svg'>
      {/* Background circle */}
      <circle cx={centerX} cy={centerY} r={outerRadius} fill='var(--bg-secondary)' />

      {/* Key segments */}
      {circleOrder.map((key, index) => (
        <g key={key}>
          <path
            d={createSegmentPath(index)}
            className={`key-segment ${getSegmentClass(key)}`}
            onClick={() => onKeySelect(mode === 'major' ? key : key.replace('m', ''))}
            style={{ cursor: 'pointer' }}
          />
        </g>
      ))}

      {/* Center circle */}
      <circle cx={centerX} cy={centerY} r={innerRadius} fill='var(--bg-primary)' />

      {/* Key labels */}
      {circleOrder.map((key, index) => {
        const pos = getKeyPosition(index);
        const displayKey = mode === 'major' ? key : key.replace('m', '');
        const keyInfo = keyData[key];
        const isSelected = mode === 'major' ? key === selectedKey : key === selectedKey + 'm';

        return (
          <g key={`label-${key}`}>
            <text
              x={pos.x}
              y={pos.y}
              textAnchor='middle'
              dominantBaseline='middle'
              className={`key-label ${isSelected ? 'selected' : ''}`}
              onClick={() => onKeySelect(displayKey)}
              style={{ cursor: 'pointer', fontSize: isSelected ? '20px' : '16px', fontWeight: isSelected ? 'bold' : 'normal' }}
            >
              {mode === 'major' ? key : key}
            </text>
            {/* Accidentals count */}
            <text
              x={pos.x}
              y={pos.y + 18}
              textAnchor='middle'
              className='accidental-count'
              style={{ fontSize: '11px', fill: 'var(--text-tertiary)' }}
            >
              {keyInfo.accidentals === 0 ? '♮' : Math.abs(keyInfo.accidentals) + (keyInfo.accidentalType === 'sharp' ? '♯' : '♭')}
            </text>
          </g>
        );
      })}

      {/* Center text */}
      <text x={centerX} y={centerY - 10} textAnchor='middle' className='center-label' style={{ fontSize: '24px', fontWeight: 'bold' }}>
        {mode === 'major' ? selectedKey : selectedKey + 'm'}
      </text>
      <text
        x={centerX}
        y={centerY + 15}
        textAnchor='middle'
        className='center-sublabel'
        style={{ fontSize: '14px', fill: 'var(--text-secondary)' }}
      >
        {mode === 'major' ? 'Major' : 'Minor'}
      </text>
    </svg>
  );
}
