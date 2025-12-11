import React from 'react';
import { Music2, Zap, Grid3x3, Grid2x2, Layers } from 'lucide-react';
import { VoicingStyle } from '../types/chord.types';
import { getAvailableStyles } from '../services/voicingGenerator';

interface VoicingStyleSelectorProps {
  selectedStyle: VoicingStyle;
  onStyleChange: (style: VoicingStyle) => void;
  disabled?: boolean;
}

// Mappa icone per ogni stile
const STYLE_ICONS: Record<VoicingStyle, React.ReactNode> = {
  'basic': <Music2 size={18} />,
  'jazz-rootless': <Zap size={18} />,
  'drop-2': <Grid3x3 size={18} />,
  'drop-3': <Grid2x2 size={18} />,
  'shell': <Layers size={18} />,
  'spread': <Music2 size={18} />,
  'close': <Music2 size={18} />,
  'ai-generated': <Zap size={18} />,
};

// Mappa difficoltà per ogni stile
const STYLE_DIFFICULTY: Record<VoicingStyle, 'easy' | 'medium' | 'hard'> = {
  'basic': 'easy',
  'jazz-rootless': 'medium',
  'drop-2': 'medium',
  'drop-3': 'hard',
  'shell': 'easy',
  'spread': 'medium',
  'close': 'easy',
  'ai-generated': 'medium',
};

export const VoicingStyleSelector: React.FC<VoicingStyleSelectorProps> = ({
  selectedStyle,
  onStyleChange,
  disabled = false,
}) => {
  const styles = getAvailableStyles();

  const getDifficultyLabel = (style: VoicingStyle): string => {
    const difficulty = STYLE_DIFFICULTY[style];
    return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  };

  return (
    <div className="voicing-style-selector">
      <label className="selector-label">
        <Music2 size={16} className="selector-label-icon" />
        Voicing Style:
      </label>
      
      <div className="style-options">
        {styles.map((style) => (
          <button
            key={style.value}
            className={`style-option ${selectedStyle === style.value ? 'active' : ''}`}
            onClick={() => onStyleChange(style.value)}
            disabled={disabled}
            title={style.description}
            type="button"
          >
            <div className="style-label">
              <span className="style-icon">
                {STYLE_ICONS[style.value]}
              </span>
              {style.label}
            </div>
            
            <p className="style-description">
              {style.description}
            </p>

            <div className="style-difficulty">
              <span className={`difficulty-badge difficulty-${STYLE_DIFFICULTY[style.value]}`}>
                {getDifficultyLabel(style.value)}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};