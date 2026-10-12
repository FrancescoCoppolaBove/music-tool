import { KEYS } from './keys';
import { MODES } from './modes';
import { OTHER_SCALES } from './scales';
import { IDEAS } from './ideas';
import { WORLD } from './world';
import { normalizeSearch } from './theory';
import type { TaggedReference, Genre, Emotion } from './types';
export { KEYS, MODES, OTHER_SCALES, IDEAS, WORLD };
export const ALL_REFERENCES = [...KEYS,...MODES,...OTHER_SCALES,...WORLD,...IDEAS];
export interface ReferenceFilters { query: string; genre: Genre | ''; emotion: Emotion | ''; favoritesOnly: boolean; favorites: string[] }
export function matchesReference(item: TaggedReference, filters: ReferenceFilters): boolean {
  const { query, genre, emotion, favoritesOnly, favorites } = filters;
  if (genre && !item.genres.includes(genre)) return false;
  if (emotion && !item.emotions.includes(emotion)) return false;
  if (favoritesOnly && !favorites.includes(item.id)) return false;
  const searchText = normalizeSearch(JSON.stringify(item));
  return normalizeSearch(query).trim().split(/\s+/).filter(Boolean).every(word => searchText.includes(word));
}
export function readFavoriteIds(value: unknown): string[] {
  const ids = new Set(ALL_REFERENCES.map(item => item.id));
  return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string' && ids.has(id)))] : [];
}
