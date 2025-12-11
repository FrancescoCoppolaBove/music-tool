import React from 'react';
import { ChordInput } from './components/ChordInput';
import { VoicingStyleSelector } from './components/VoicingStyleSelector';
import { VoicingResults } from './components/VoicingResults';
import { useChordVoicings } from './hooks/useChordVoicings';
import { Loader2, AlertCircle, Music2, Sparkles } from 'lucide-react';

export const ChordVoicingsFeature: React.FC = () => {
  const {
    chordSymbol,
    setChordSymbol,
    selectedStyle,
    setSelectedStyle,
    voicings,
    error,
    isLoading,
    generateVoicingsForChord,
  } = useChordVoicings();

  return (
    <div className="chord-voicings-feature">
      <div className="feature-container">
        {/* Input Section */}
        <div className="input-section">
          <ChordInput
            value={chordSymbol}
            onChange={setChordSymbol}
            onSubmit={generateVoicingsForChord}
            disabled={isLoading}
          />

          <VoicingStyleSelector
            selectedStyle={selectedStyle}
            onStyleChange={setSelectedStyle}
            disabled={isLoading}
          />

          {/* Generate Button - usando classi atomiche */}
          <button
            className="btn btn-gradient btn-lg btn-full"
            onClick={generateVoicingsForChord}
            disabled={isLoading || !chordSymbol.trim()}
            type="button"
          >
            {isLoading ? (
              <>
                <Loader2 className="spinner" size={20} />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Generate Voicings
              </>
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <AlertCircle size={20} className="error-icon" />
            <span>{error}</span>
          </div>
        )}

        {/* Results */}
        {!error && voicings.length > 0 && (
          <VoicingResults voicings={voicings} chordSymbol={chordSymbol} />
        )}

        {/* Empty State */}
        {!error && !isLoading && voicings.length === 0 && chordSymbol.trim() === '' && (
          <div className="empty-state">
            <Music2 size={48} className="empty-icon" />
            <h3>Enter a chord to get started</h3>
            <p>Try entering chords like Cmaj7, Dm7, F#m7b5, or Bb13#11/G</p>
          </div>
        )}
      </div>
    </div>
  );
};