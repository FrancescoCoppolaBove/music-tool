/**
 * HEADER COMPONENT
 * Header principale dell'applicazione con logo e navigazione
 */

import React from 'react';
import { Music, Github } from 'lucide-react';
import { Navigation } from './Navigation';
import type { Feature, FeatureId } from '../../config/features';

interface HeaderProps {
  features: Feature[];
  activeFeature: FeatureId;
  onFeatureChange: (featureId: FeatureId) => void;
}

export function Header({ features, activeFeature, onFeatureChange }: HeaderProps) {
  return (
    <header className='app-header'>
      <div className='header-container'>
        {/* Logo & Brand */}
        <div className='header-brand'>
          <div className='header-logo'>
            <Music size={32} strokeWidth={2.5} />
          </div>
          <div className='header-title'>
            <h1>Music Theory Pro</h1>
            <p className='header-subtitle'>Tools for Musicians</p>
          </div>
        </div>

        {/* Navigation */}
        <Navigation features={features} activeFeature={activeFeature} onFeatureChange={onFeatureChange} />

        {/* Actions */}
        <div className='header-actions'>
          <a
            href='https://github.com/yourusername/music-theory-pro'
            target='_blank'
            rel='noopener noreferrer'
            className='header-action-btn'
            aria-label='View on GitHub'
          >
            <Github size={20} />
          </a>
        </div>
      </div>
    </header>
  );
}
