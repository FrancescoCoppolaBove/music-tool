import React from 'react';
import { Music } from 'lucide-react';

interface ChordInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}

export const ChordInput: React.FC<ChordInputProps> = ({
  value,
  onChange,
  onSubmit,
  disabled = false,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSubmit();
    }
  };

  return (
    <div className="chord-input-container">
      <div className="input-wrapper">
        <Music className="input-icon" size={20} />
        <input
          type="text"
          className="chord-input"
          placeholder="e.g. Cmaj7, F#m7b5, Bb13#11/G"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoFocus
        />
      </div>
      
      <div className="input-hints">
        <span className="hint">💡 Try: C, Cmaj7, Dm7, F#m7b5, Bb7#11, C7/E</span>
      </div>
    </div>
  );
};