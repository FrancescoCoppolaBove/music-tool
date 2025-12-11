import React from 'react';
import { VoicingStyle } from '../types/chord.types';
import { getAvailableStyles } from '../services/voicingGenerator';

interface VoicingStyleSelectorProps {
  selectedStyle: VoicingStyle;
  onStyleChange: (style: VoicingStyle) => void;
  disabled?: boolean;
}

export const VoicingStyleSelector: React.FC<VoicingStyleSelectorProps> = ({
  selectedStyle,
  onStyleChange,
  disabled = false,
}) => {
  const styles = getAvailableStyles();

  return (
    <div className="voicing-style-selector">
      <label className="selector-label">Voicing Style:</label>
      
      <div className="style-options">
        {styles.map((style) => (
          <button
            key={style.value}
            className={`style-option ${selectedStyle === style.value ? 'active' : ''}`}
            onClick={() => onStyleChange(style.value)}
            disabled={disabled}
            title={style.description}
          >
            <span className="style-label">{style.label}</span>
            <span className="style-description">{style.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
};