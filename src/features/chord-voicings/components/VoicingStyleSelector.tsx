import { Music2, Layers, Sparkles, Circle, Boxes, Move, Maximize2 } from 'lucide-react';
import { VoicingStyle } from '../types/chord.types';

interface VoicingStyleSelectorProps {
  selectedStyle: VoicingStyle;
  onStyleChange: (style: VoicingStyle) => void;
}

interface StyleOption {
  value: VoicingStyle;
  label: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  icon: React.ComponentType<{ size?: number }>;
}

const VOICING_STYLES: StyleOption[] = [
  {
    value: 'basic',
    label: 'Triads',
    description: 'Basic 3-note triads and inversions (1-3-5)',
    difficulty: 'easy',
    icon: Music2,
  },
  {
    value: 'quadriads',
    label: 'Seventh Chords',
    description: '4-note chords (7ths, 6ths) with all inversions',
    difficulty: 'easy',
    icon: Layers,
  },
  {
    value: 'extensions',
    label: 'Extensions',
    description: 'Extended chords (9ths, 11ths, 13ths) with modern voicings',
    difficulty: 'medium',
    icon: Sparkles,
  },
  {
    value: 'shell',
    label: 'Shell',
    description: 'Essential tones only (root, 3rd, 7th)',
    difficulty: 'easy',
    icon: Circle,
  },
  {
    value: 'jazz-rootless',
    label: 'Jazz Rootless',
    description: 'Modern jazz voicings without root',
    difficulty: 'medium',
    icon: Boxes,
  },
  {
    value: 'drop-2',
    label: 'Drop-2',
    description: 'Second voice dropped an octave',
    difficulty: 'medium',
    icon: Move,
  },
  {
    value: 'drop-3',
    label: 'Drop-3',
    description: 'Third voice dropped an octave',
    difficulty: 'hard',
    icon: Maximize2,
  },
];

function getDifficultyLabel(difficulty: 'easy' | 'medium' | 'hard'): string {
  if (!difficulty) return 'Easy';

  const labels: Record<string, string> = {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Advanced',
  };

  return labels[difficulty] || 'Easy';
}

function getDifficultyClass(difficulty: 'easy' | 'medium' | 'hard'): string {
  if (!difficulty) return 'difficulty-easy';

  const classes: Record<string, string> = {
    easy: 'difficulty-easy',
    medium: 'difficulty-medium',
    hard: 'difficulty-hard',
  };

  return classes[difficulty] || 'difficulty-easy';
}

export function VoicingStyleSelector({ selectedStyle, onStyleChange }: VoicingStyleSelectorProps) {
  return (
    <div className='voicing-style-selector'>
      <label className='selector-label'>
        <Music2 size={18} className='selector-label-icon' />
        Voicing Style
      </label>

      <div className='style-options'>
        {VOICING_STYLES.map((style) => {
          const isActive = selectedStyle === style.value;
          const Icon = style.icon;

          return (
            <button
              key={style.value}
              type='button'
              onClick={() => onStyleChange(style.value)}
              className={`style-option ${isActive ? 'active' : ''}`}
              aria-pressed={isActive}
              aria-label={`Select ${style.label} voicing style`}
            >
              <div className='style-label'>
                <Icon size={20} className='style-icon' />
                {style.label}
              </div>

              <p className='style-description'>{style.description}</p>

              <div className='style-difficulty'>
                <span className={`difficulty-badge ${getDifficultyClass(style.difficulty)}`}>{getDifficultyLabel(style.difficulty)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
