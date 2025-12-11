import React from 'react';
import { ChordVoicingsFeature } from './features/chord-voicings/ChordVoicingsFeature';
import { Music } from 'lucide-react';
import './App.css';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <Music size={32} />
            <h1>Piano Voicings Generator</h1>
          </div>
          <p className="tagline">
            Generate professional piano voicings for any chord
          </p>
        </div>
      </header>

      <main className="app-main">
        <ChordVoicingsFeature />
      </main>

      <footer className="app-footer">
        <p>
          Built with React + TypeScript • 
          <a href="https://github.com/yourusername/piano-voicings-generator" target="_blank" rel="noopener noreferrer">
            View on GitHub
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;