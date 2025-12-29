/**
 * NAVIGATION COMPONENT
 * Navigazione principale con supporto desktop e mobile
 */

import React from 'react';
import type { Feature, FeatureId } from '../../../config/features';

interface NavigationProps {
  features: Feature[];
  activeFeature: FeatureId;
  onFeatureChange: (featureId: FeatureId) => void;
}

export function Navigation({ features, activeFeature, onFeatureChange }: NavigationProps) {
  // Filter only active features
  const activeFeatures = features.filter((f) => f.status === 'active');

  return (
    <nav className='app-navigation'>
      {activeFeatures.map((feature) => {
        const Icon = feature.icon;
        const isActive = feature.id === activeFeature;

        return (
          <button
            key={feature.id}
            onClick={() => onFeatureChange(feature.id)}
            className={`nav-item ${isActive ? 'active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <Icon size={20} className='nav-icon' />
            <span className='nav-label'>{feature.name}</span>
          </button>
        );
      })}
    </nav>
  );
}
