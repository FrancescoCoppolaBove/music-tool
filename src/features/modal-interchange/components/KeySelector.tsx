import { NoteName } from '@shared/types/music.types';
import { AVAILABLE_KEYS } from '../services/modalInterchangeData';

interface KeySelectorProps {
  selectedKey: NoteName;
  tonality: 'major' | 'minor';
  onKeyChange: (key: NoteName) => void;
  onTonalityChange: (tonality: 'major' | 'minor') => void;
}

export function KeySelector({ selectedKey, tonality, onKeyChange, onTonalityChange }: KeySelectorProps) {
  return (
    <div className='key-selector'>
      <div className='key-selector-group'>
        <label className='key-selector-label'>Key</label>
        <div className='key-buttons'>
          {AVAILABLE_KEYS.map((key) => (
            <button
              key={key}
              className={`key-button ${selectedKey === key ? 'active' : ''}`}
              onClick={() => onKeyChange(key)}
              aria-pressed={selectedKey === key}
            >
              {key}
            </button>
          ))}
        </div>
      </div>

      <div className='key-selector-group'>
        <label className='key-selector-label'>Tonality</label>
        <div className='tonality-toggle'>
          <button
            className={`tonality-button ${tonality === 'major' ? 'active' : ''}`}
            onClick={() => onTonalityChange('major')}
            aria-pressed={tonality === 'major'}
          >
            Major
          </button>
          <button
            className={`tonality-button ${tonality === 'minor' ? 'active' : ''}`}
            onClick={() => onTonalityChange('minor')}
            aria-pressed={tonality === 'minor'}
          >
            Minor
          </button>
        </div>
      </div>
    </div>
  );
}
