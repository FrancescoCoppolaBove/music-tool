import { storageGet, storageSet } from '@shared/utils/storage';
import { appendCompositionVersion, createCompositionProject, normalizeCompositionSections, type CompositionProject, type CompositionSnapshot } from '../harmony-composition-lab/projectVersioning';

// Retain the original key: projects and revisions created in the Lab remain available.
export const PROJECTS_KEY = 'harmony_composition_lab_projects';
export type CompositionEditor = 'architect' | 'melody' | 'progressions';
export interface EditorRequest { target: CompositionEditor; projectId: string; snapshot: CompositionSnapshot }
export const EDITOR_REQUEST_KEY = 'composition_editor_request';

export function isSnapshot(value: unknown): value is CompositionSnapshot {
  if (!value || typeof value !== 'object') return false;
  const item = value as CompositionSnapshot;
  return typeof item.title === 'string' && typeof item.tonic === 'string' && typeof item.mode === 'string'
    && Number.isFinite(item.bpm) && item.bpm >= 30 && item.bpm <= 300
    && typeof item.meter === 'string' && /^\d+\/(2|4|8|16)$/.test(item.meter)
    && Array.isArray(item.chords) && item.chords.length <= 256 && item.chords.every(chord => typeof chord === 'string');
}

export function readCompositions(): CompositionProject[] {
  const value = storageGet<unknown>(PROJECTS_KEY, []);
  if (!Array.isArray(value)) return [];
  return value.filter(item => isSnapshot(item) && 'id' in item && typeof item.id === 'string').map(item => ({
    ...item, sections: normalizeCompositionSections(item.sections),
    createdAt: item.createdAt || item.updatedAt || new Date().toISOString(),
    updatedAt: item.updatedAt || new Date().toISOString(),
    versions: Array.isArray(item.versions) ? item.versions.filter((version: CompositionProject['versions'][number]) => version && typeof version.id === 'string' && isSnapshot(version.snapshot)) : [],
  }));
}

export function saveComposition(snapshot: CompositionSnapshot, projectId?: string): CompositionProject {
  const projects = readCompositions();
  const current = projects.find(project => project.id === projectId);
  const normalized = { ...snapshot, sections: normalizeCompositionSections(snapshot.sections) };
  const project = current ? appendCompositionVersion(current, normalized) : createCompositionProject(normalized);
  storageSet(PROJECTS_KEY, current ? projects.map(item => item.id === project.id ? project : item) : [project, ...projects]);
  return project;
}

export function readEditorRequest(target: CompositionEditor): EditorRequest | null {
  const value = storageGet<EditorRequest | null>(EDITOR_REQUEST_KEY, null);
  return value?.target === target && typeof value.projectId === 'string' && isSnapshot(value.snapshot) ? value : null;
}
