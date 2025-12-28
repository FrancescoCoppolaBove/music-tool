/**
 * FEATURE CONFIGURATION
 * Configurazione centralizzata di tutte le feature dell'app
 */

import { Piano, Search, Book, Music, Headphones, Circle, Grid } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type FeatureId =
  | 'voicings'
  | 'scale-recognition'
  | 'scale-dictionary'
  | 'scale-harmonization'
  | 'ear-training'
  | 'circle-fifths'
  | 'chord-builder';

export type FeatureLevel = 'beginner' | 'intermediate' | 'advanced' | 'all';

export interface Feature {
  id: FeatureId;
  name: string;
  description: string;
  icon: LucideIcon;
  level: FeatureLevel;
  status: 'active' | 'coming-soon' | 'beta';
  badge?: string;
}

/**
 * Lista completa delle feature disponibili
 */
export const FEATURES: Feature[] = [
  {
    id: 'voicings',
    name: 'Piano Voicings',
    description: 'Discover chord voicings and inversions',
    icon: Piano,
    level: 'all',
    status: 'active',
  },
  {
    id: 'scale-recognition',
    name: 'Scale Recognition',
    description: 'Identify scales from notes',
    icon: Search,
    level: 'all',
    status: 'active',
  },
  {
    id: 'scale-dictionary',
    name: 'Scale Dictionary',
    description: 'Explore scales in all keys',
    icon: Book,
    level: 'beginner',
    status: 'active',
  },
  {
    id: 'scale-harmonization',
    name: 'Scale Harmonization',
    description: 'Harmonize scales and modes',
    icon: Music,
    level: 'intermediate',
    status: 'active',
  },
  {
    id: 'ear-training',
    name: 'Ear Training',
    description: 'Improve your musical ear',
    icon: Headphones,
    level: 'all',
    status: 'active',
  },
  {
    id: 'circle-fifths',
    name: 'Circle of Fifths',
    description: 'Interactive key relationships',
    icon: Circle,
    level: 'beginner',
    status: 'coming-soon',
  },
  {
    id: 'chord-builder',
    name: 'Chord Builder',
    description: 'Build and learn chords',
    icon: Grid,
    level: 'beginner',
    status: 'coming-soon',
  },
];

/**
 * Ottieni feature per ID
 */
export function getFeatureById(id: FeatureId): Feature | undefined {
  return FEATURES.find((f) => f.id === id);
}

/**
 * Filtra feature per livello
 */
export function getFeaturesByLevel(level: FeatureLevel): Feature[] {
  if (level === 'all') return FEATURES;
  return FEATURES.filter((f) => f.level === level || f.level === 'all');
}

/**
 * Filtra feature per stato
 */
export function getActiveFeatures(): Feature[] {
  return FEATURES.filter((f) => f.status === 'active');
}
