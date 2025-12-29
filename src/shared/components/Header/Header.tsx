/**
 * HEADER COMPONENT
 * Header principale dell'applicazione con logo e navigazione
 */

import React, { useState } from 'react';
import { Music, Github, Menu, X } from 'lucide-react';
import { Navigation } from './Navigation';
import type { Feature, FeatureId } from '../../../config/features';

interface HeaderProps {
  features: Feature[];
  activeFeature: FeatureId;
  onFeatureChange: (featureId: FeatureId) => void;
}

export function Header({ features, activeFeature, onFeatureChange }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleFeatureChange = (featureId: FeatureId) => {
    onFeatureChange(featureId);
    setMobileMenuOpen(false); // Close mobile menu after selection
  };

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

        {/* Desktop Navigation */}
        <div className='header-nav-desktop'>
          <Navigation features={features} activeFeature={activeFeature} onFeatureChange={onFeatureChange} />
        </div>

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

          {/* Mobile Menu Button */}
          <button className='mobile-menu-btn' onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label='Toggle menu'>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className='header-nav-mobile'>
          <Navigation features={features} activeFeature={activeFeature} onFeatureChange={handleFeatureChange} />
        </div>
      )}
    </header>
  );
}
