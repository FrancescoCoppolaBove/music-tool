import { useState } from 'react';
import { Music, BookOpen, Sparkles, TrendingUp } from 'lucide-react';
import { NoteName } from '@shared/types/music.types';
import { KeySelector } from './KeySelector';
import { ModeTable } from './ModeTable';

import { CommonProgressions } from './CommonProgressions';
import { generateModalInterchangeTable, getBorrowedChords } from '../services/modalInterchangeData';
import { BorrowedChordHighlighter } from './BorrowChordHighlighter';

type TabView = 'table' | 'borrowed' | 'progressions' | 'guide';

export function ModalInterchangeView() {
  const [selectedKey, setSelectedKey] = useState<NoteName>('C');
  const [tonality, setTonality] = useState<'major' | 'minor'>('major');
  const [activeTab, setActiveTab] = useState<TabView>('table');

  const table = generateModalInterchangeTable(selectedKey, tonality);
  const borrowedChords = getBorrowedChords(table);

  return (
    <div className='modal-interchange-container'>
      {/* Header */}
      <header className='mi-header'>
        <div className='mi-header-content'>
          <div className='mi-header-icon'>
            <Sparkles size={32} />
          </div>
          <div className='mi-header-text'>
            <h1>Modal Interchange</h1>
            <p>Explore borrowed chords from parallel modes to enrich your compositions</p>
          </div>
        </div>
      </header>

      {/* Key Selector */}
      <KeySelector selectedKey={selectedKey} tonality={tonality} onKeyChange={setSelectedKey} onTonalityChange={setTonality} />

      {/* Tabs */}
      <div className='mi-tabs'>
        <button className={`mi-tab ${activeTab === 'table' ? 'active' : ''}`} onClick={() => setActiveTab('table')}>
          <Music size={18} />
          Mode Table
        </button>

        <button className={`mi-tab ${activeTab === 'borrowed' ? 'active' : ''}`} onClick={() => setActiveTab('borrowed')}>
          <TrendingUp size={18} />
          Borrowed Chords ({borrowedChords.length})
        </button>

        <button className={`mi-tab ${activeTab === 'progressions' ? 'active' : ''}`} onClick={() => setActiveTab('progressions')}>
          <Music size={18} />
          Common Progressions
        </button>

        <button className={`mi-tab ${activeTab === 'guide' ? 'active' : ''}`} onClick={() => setActiveTab('guide')}>
          <BookOpen size={18} />
          Quick Guide
        </button>
      </div>

      {/* Tab Content */}
      <div className='mi-content'>
        {activeTab === 'table' && <ModeTable table={table} />}
        {activeTab === 'borrowed' && <BorrowedChordHighlighter borrowedChords={borrowedChords} tonality={tonality} />}
        {activeTab === 'progressions' && <CommonProgressions selectedKey={selectedKey} tonality={tonality} />}
        {activeTab === 'guide' && <QuickGuide />}
      </div>
    </div>
  );
}

// Quick Guide Component
function QuickGuide() {
  return (
    <div className='mi-guide'>
      <section className='guide-section'>
        <h2>What is Modal Interchange?</h2>
        <p>
          Modal interchange (also called <strong>modal mixture</strong> or <strong>borrowed chords</strong>) is a compositional technique
          where you "borrow" chords from parallel modes while maintaining the same tonal center.
        </p>
        <p className='guide-example'>
          <strong>Example:</strong> In C major, you can use chords from C minor (Aeolian), C Dorian, C Phrygian, etc., without changing the
          key.
        </p>
      </section>

      <section className='guide-section'>
        <h2>Why Use It?</h2>
        <ul>
          <li>
            <strong>Add Color:</strong> Escape predictable diatonic harmony
          </li>
          <li>
            <strong>Create Emotion:</strong> Shift between bright and dark moods
          </li>
          <li>
            <strong>Sound Professional:</strong> Used in jazz, pop, rock, film scores
          </li>
          <li>
            <strong>Maintain Cohesion:</strong> No modulation needed - same tonic!
          </li>
        </ul>
      </section>

      <section className='guide-section'>
        <h2>Most Common Borrowed Chords (in Major)</h2>
        <div className='borrowed-list'>
          <div className='borrowed-item'>
            <span className='borrowed-numeral'>iv</span>
            <span className='borrowed-desc'>Minor subdominant - emotional, gospel (Creep - Radiohead)</span>
          </div>
          <div className='borrowed-item'>
            <span className='borrowed-numeral'>♭VI</span>
            <span className='borrowed-desc'>Flat six - cinematic, Beatles-esque</span>
          </div>
          <div className='borrowed-item'>
            <span className='borrowed-numeral'>♭VII</span>
            <span className='borrowed-desc'>Flat seven - rock descent, bluesy</span>
          </div>
          <div className='borrowed-item'>
            <span className='borrowed-numeral'>♭III</span>
            <span className='borrowed-desc'>Flat three - dramatic, nostalgic</span>
          </div>
          <div className='borrowed-item'>
            <span className='borrowed-numeral'>♭II</span>
            <span className='borrowed-desc'>Neapolitan - exotic, Spanish flavor</span>
          </div>
        </div>
      </section>

      <section className='guide-section'>
        <h2>How to Use</h2>
        <ol>
          <li>Start with a diatonic progression (I-vi-IV-V)</li>
          <li>Choose one chord to substitute with a borrowed version</li>
          <li>Listen to the emotional change</li>
          <li>Resolve back to diatonic chords for stability</li>
        </ol>
        <p className='guide-tip'>
          <strong>💡 Tip:</strong> Use borrowed chords as "spice" not the main ingredient. Too many can sound directionless!
        </p>
      </section>

      <section className='guide-section'>
        <h2>Famous Examples</h2>
        <ul>
          <li>
            <strong>Creep - Radiohead:</strong> I - III - IV - iv (that iv creates the melancholy)
          </li>
          <li>
            <strong>Space Oddity - Bowie:</strong> Uses iv in climax ("papers want to know...")
          </li>
          <li>
            <strong>Sir Duke - Stevie Wonder:</strong> Rich modal interchange throughout
          </li>
          <li>
            <strong>God Put a Smile - Coldplay:</strong> I - ♭VI - ♭III - ♭VII progression
          </li>
        </ul>
      </section>
    </div>
  );
}
