/**
 * MAIN APP COMPONENT - iOS AUDIO FIX
 * Entry point dell'applicazione con audio unlock corretto per iOS
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './shared/components/Header/Header';
import { ChordVoicingsFeature } from './features/chord-voicings/ChordVoicingsFeature';
import { ScaleRecognizerFeature } from './features/scale-recognition/ScaleRecognizerFeature';
import { ScaleDictionaryFeature } from './features/scale-dictionary/ScaleDictionaryFeature';
import { EarTrainingFeature } from './features/ear-training/EarTrainingFeature';
import { FEATURES, getActiveFeatures } from './config/features';
import { audioPlayer } from './features/ear-training/utils/audio-player';
import type { FeatureId } from './config/features';
import './App.css';

function App() {
  const [activeFeature, setActiveFeature] = useState<FeatureId>('voicings');
  const [audioReady, setAudioReady] = useState(false);

  // Filtra solo feature attive per la navigazione
  const activeFeatures = useMemo(() => getActiveFeatures(), []);

  // ✅ Inizializza audio SOLO dopo user gesture (iOS fix)
  const initializeAudio = async () => {
    if (audioReady) return;

    console.log('🎧 User gesture detected - initializing audio...');

    try {
      // 1. Prima inizializza AudioContext con user gesture
      await audioPlayer.initAudioContext();

      // 2. POI preload notes (opzionale, può essere fatto dopo)
      await audioPlayer.preloadAllNotes();

      setAudioReady(true);
      console.log('✅ Audio ready for iOS!');
    } catch (err) {
      console.error('❌ Audio initialization failed:', err);
    }
  };

  // Render del contenuto in base alla feature attiva
  const renderFeatureContent = () => {
    switch (activeFeature) {
      case 'voicings':
        return <ChordVoicingsFeature />;

      case 'scale-recognition':
        return <ScaleRecognizerFeature />;

      case 'scale-dictionary':
        return <ScaleDictionaryFeature />;

      case 'ear-training':
        return <EarTrainingFeature />;

      case 'circle-fifths':
        return (
          <div className='coming-soon-placeholder'>
            <h2>Circle of Fifths</h2>
            <p>Coming soon! This feature is under development.</p>
          </div>
        );

      case 'chord-builder':
        return (
          <div className='coming-soon-placeholder'>
            <h2>Chord Builder</h2>
            <p>Coming soon! This feature is under development.</p>
          </div>
        );

      default:
        return (
          <div className='error-placeholder'>
            <h2>Feature Not Found</h2>
            <p>The requested feature could not be loaded.</p>
          </div>
        );
    }
  };

  return (
    <div className='app' onClick={initializeAudio} onTouchStart={initializeAudio}>
      <Header features={FEATURES} activeFeature={activeFeature} onFeatureChange={setActiveFeature} />

      <main className='app-main'>{renderFeatureContent()}</main>

      <footer className='app-footer'>
        <div className='footer-content'>
          <p>Music Theory Pro • Built with React + TypeScript</p>
          <p className='footer-links'>
            <a href='#' onClick={(e) => e.preventDefault()}>
              About
            </a>
            {' • '}
            <a href='#' onClick={(e) => e.preventDefault()}>
              GitHub
            </a>
            {' • '}
            <a href='#' onClick={(e) => e.preventDefault()}>
              Feedback
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
