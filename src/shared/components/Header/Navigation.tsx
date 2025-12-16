/**
 * NAVIGATION COMPONENT
 * Tab navigation per le feature
 */

import React from 'react';
import type { Feature, FeatureId } from '../../config/features';

interface NavigationProps {
  features: Feature[];
  activeFeature: FeatureId;
  onFeatureChange: (featureId: FeatureId) => void;
}

export function Navigation({ features, activeFeature, onFeatureChange }: NavigationProps) {
  return (
    <nav className='header-nav'>
      <div className='nav-tabs'>
        {features.map((feature) => {
          const Icon = feature.icon;
          const isActive = feature.id === activeFeature;
          const isDisabled = feature.status === 'coming-soon';

          return (
            <button
              key={feature.id}
              onClick={() => !isDisabled && onFeatureChange(feature.id)}
              className={`nav-tab ${isActive ? 'nav-tab-active' : ''} ${isDisabled ? 'nav-tab-disabled' : ''}`}
              disabled={isDisabled}
              aria-label={feature.name}
              title={isDisabled ? `${feature.name} - Coming Soon` : feature.name}
            >
              <Icon size={20} className='nav-tab-icon' />
              <span className='nav-tab-label'>{feature.name}</span>

              {feature.status === 'coming-soon' && <span className='nav-tab-badge badge-soon'>Soon</span>}

              {feature.status === 'beta' && <span className='nav-tab-badge badge-beta'>Beta</span>}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
