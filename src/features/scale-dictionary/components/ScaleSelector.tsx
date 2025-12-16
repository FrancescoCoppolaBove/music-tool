/**
 * SCALE SELECTOR COMPONENT - ENHANCED
 * Selezione scala con ricerca filtrata e root note con design moderno
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, ChevronDown, Music } from 'lucide-react';

interface ScaleSelectorProps {
  selectedScale: string;
  selectedRoot: string;
  scaleTypes: string[];
  onScaleChange: (scale: string) => void;
  onRootChange: (root: string) => void;
}

const ROOT_NOTES = ['C', 'C#/Db', 'D', 'D#/Eb', 'E', 'F', 'F#/Gb', 'G', 'G#/Ab', 'A', 'A#/Bb', 'B'];

export function ScaleSelector({ selectedScale, selectedRoot, scaleTypes, onScaleChange, onRootChange }: ScaleSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filtra scale types in base alla ricerca
  const filteredScales = useMemo(() => {
    if (!searchQuery.trim()) return scaleTypes;

    const query = searchQuery.toLowerCase();
    return scaleTypes.filter((scale) => scale.toLowerCase().includes(query));
  }, [scaleTypes, searchQuery]);

  // Chiudi dropdown quando si clicca fuori
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleScaleSelect = (scale: string) => {
    onScaleChange(scale);
    setIsDropdownOpen(false);
    setSearchQuery('');
  };

  return (
    <div className='scale-selector'>
      {/* Root Note Selector */}
      <div className='selector-group'>
        <label htmlFor='root-select' className='selector-label'>
          <Music size={14} />
          Root Note
        </label>
        <div className='root-notes-grid'>
          {ROOT_NOTES.map((root) => (
            <button
              key={root}
              onClick={() => onRootChange(root)}
              className={`root-note-button ${selectedRoot === root ? 'active' : ''}`}
              aria-label={`Select ${root} as root note`}
            >
              {root}
            </button>
          ))}
        </div>
      </div>

      {/* Scale Type Selector with Search */}
      <div className='selector-group'>
        <label className='selector-label'>
          <Search size={14} />
          Scale Type
        </label>

        <div className='custom-dropdown' ref={dropdownRef}>
          {/* Dropdown Trigger */}
          <button
            className='dropdown-trigger'
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-expanded={isDropdownOpen}
            aria-haspopup='listbox'
          >
            <span className='dropdown-trigger-text'>{selectedScale}</span>
            <ChevronDown size={20} className={`dropdown-icon ${isDropdownOpen ? 'open' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className='dropdown-menu'>
              {/* Search Input */}
              <div className='dropdown-search'>
                <Search size={16} className='search-icon' />
                <input
                  type='text'
                  placeholder='Search scales...'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='search-input'
                  autoFocus
                />
              </div>

              {/* Scale List */}
              <div className='dropdown-list' role='listbox'>
                {filteredScales.length > 0 ? (
                  filteredScales.map((scale) => (
                    <button
                      key={scale}
                      onClick={() => handleScaleSelect(scale)}
                      className={`dropdown-item ${selectedScale === scale ? 'selected' : ''}`}
                      role='option'
                      aria-selected={selectedScale === scale}
                    >
                      {scale}
                    </button>
                  ))
                ) : (
                  <div className='dropdown-empty'>No scales found for "{searchQuery}"</div>
                )}
              </div>

              {/* Results Count */}
              <div className='dropdown-footer'>
                {filteredScales.length} scale{filteredScales.length !== 1 ? 's' : ''} available
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
