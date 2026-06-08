import React, { useState } from 'react';
import { ChordVoicing } from '../types/chord.types';
import { PianoKeyboard } from './PianoKeyboard';
import { Hand, Music2, Info } from 'lucide-react';
import { audioPlayer } from '../../ear-training/utils/audio-player';

interface VoicingResultsProps {
  voicings: ChordVoicing[];
  chordSymbol: string;
}

export const VoicingResults: React.FC<VoicingResultsProps> = ({ voicings, chordSymbol }) => {
  const [playingId, setPlayingId] = useState<string | null>(null);

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
              <div className='voicing-title' style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3>{voicing.label}</h3>
                  <span className={`difficulty-badge ${getDifficultyColor(voicing.difficulty)}`}>{voicing.difficulty}</span>
                </div>
                <button
                  onClick={async () => {
                    if (playingId === voicing.id) return;
                    setPlayingId(voicing.id);
                    await audioPlayer.preloadAllNotes();
                    const notes = voicing.specificNotes.map(n => `${n.note}${n.octave}`);
                    audioPlayer.playChord(notes);
                    await audioPlayer.delay(1200);
                    setPlayingId(null);
                  }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '4px 10px', borderRadius: 7, cursor: 'pointer',
                    border: '1px solid #7c3aed60', background: playingId === voicing.id ? '#7c3aed30' : '#7c3aed15',
                    color: playingId === voicing.id ? '#a855f7' : '#c4b5fd',
                    fontSize: 11, fontWeight: 700, fontFamily: 'DM Sans, sans-serif',
                    flexShrink: 0,
                  }}
                >
                  {playingId === voicing.id ? '♩♩♩' : '▶ Play'}
                </button>
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
