import React from 'react';
import { ChordVoicing } from '../types/chord.types';
import { PianoKeyboard } from './PianoKeyboard';
import { Hand, Music2, Info } from 'lucide-react';

interface VoicingResultsProps {
  voicings: ChordVoicing[];
  chordSymbol: string;
}

export const VoicingResults: React.FC<VoicingResultsProps> = ({ voicings, chordSymbol }) => {
  if (voicings.length === 0) {
    return null;
  }

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'easy':
        return 'difficulty-easy';
      case 'medium':
        return 'difficulty-medium';
      case 'hard':
        return 'difficulty-hard';
      default:
        return '';
    }
  };

  return (
    <div className='voicing-results'>
      <div className='results-header'>
        <h2>
          <Music2 size={24} />
          Voicings for <span className='chord-symbol'>{chordSymbol}</span>
        </h2>
        <p className='results-count'>
          {voicings.length} voicing{voicings.length !== 1 ? 's' : ''} generated
        </p>
      </div>

      <div className='voicings-grid'>
        {voicings.map((voicing) => (
          <div key={voicing.id} className='voicing-card'>
            <div className='voicing-header'>
              <div className='voicing-title'>
                <h3>{voicing.label}</h3>
                <span className={`difficulty-badge ${getDifficultyColor(voicing.difficulty)}`}>{voicing.difficulty}</span>
              </div>
              <p className='voicing-description'>
                <Info size={14} />
                {voicing.description}
              </p>
            </div>

            <div className='voicing-content'>
              {/* Left Hand */}
              <div className='hand-section left-hand'>
                <div className='hand-header'>
                  <Hand size={16} className='hand-icon left' />
                  <span className='hand-label'>Left Hand</span>
                </div>
                <div className='notes-list'>
                  {voicing.leftHand.notes.map((note, idx) => (
                    <div key={`lh-${idx}`} className='note-item'>
                      <span className='note-name'>{note}</span>
                      <span className='note-octave'>{voicing.leftHand.octaves[idx]}</span>
                      <span className='note-midi'>MIDI {voicing.leftHand.midiNumbers[idx]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Hand */}
              <div className='hand-section right-hand'>
                <div className='hand-header'>
                  <Hand size={16} className='hand-icon right' />
                  <span className='hand-label'>Right Hand</span>
                </div>
                <div className='notes-list'>
                  {voicing.rightHand.notes.map((note, idx) => (
                    <div key={`rh-${idx}`} className='note-item'>
                      <span className='note-name'>{note}</span>
                      <span className='note-octave'>{voicing.rightHand.octaves[idx]}</span>
                      <span className='note-midi'>MIDI {voicing.rightHand.midiNumbers[idx]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Piano Visualization */}
            <div className='voicing-keyboard'>
              <PianoKeyboard
                specificNotes={voicing.specificNotes}
                leftHandNotes={voicing.leftHand.notes}
                rightHandNotes={voicing.rightHand.notes}
                compact
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
