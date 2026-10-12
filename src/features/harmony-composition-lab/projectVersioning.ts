export interface CompositionSnapshot {
  title: string;
  tonic: string;
  mode: string;
  bpm: number;
  meter: string;
  chords: string[];
  sections?: CompositionSection[];
}

export type CompositionSectionKind = 'intro' | 'verse' | 'pre-chorus' | 'chorus' | 'post-chorus' | 'bridge' | 'special' | 'instrumental' | 'solo' | 'outro';

export interface CompositionSection {
  id: string;
  kind: CompositionSectionKind;
  name: string;
  bars: number;
  chords: string[];
  melody?: string[];
  feel?: string;
  energy?: number;
}

const SECTION_KINDS: CompositionSectionKind[] = ['intro', 'verse', 'pre-chorus', 'chorus', 'post-chorus', 'bridge', 'special', 'instrumental', 'solo', 'outro'];

export function normalizeCompositionSections(value: unknown): CompositionSection[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is CompositionSection => Boolean(item && typeof item === 'object'
    && typeof item.id === 'string' && typeof item.name === 'string' && item.name.trim().length > 0 && item.name.length <= 80
    && SECTION_KINDS.includes(item.kind) && Number.isInteger(item.bars) && item.bars >= 1 && item.bars <= 128
    && Array.isArray(item.chords) && item.chords.length <= 64 && item.chords.every((chord: unknown) => typeof chord === 'string' && chord.length <= 24)))
    .map(section => ({ ...section, chords: [...section.chords], melody: Array.isArray(section.melody) ? section.melody.filter((note: unknown) => typeof note === 'string' && note.length <= 8).slice(0, 64) : [] }));
}

export interface CompositionVersion {
  id: string;
  label: string;
  savedAt: string;
  snapshot: CompositionSnapshot;
}

export interface CompositionProject extends CompositionSnapshot {
  id: string;
  createdAt: string;
  updatedAt: string;
  versions: CompositionVersion[];
}

export type SnapshotComparisonRow = { field: string; label: string; left: string; right: string; changed: boolean };

export function compareCompositionSnapshots(left: CompositionSnapshot, right: CompositionSnapshot): SnapshotComparisonRow[] {
  const rows = [
    { field: 'title', label: 'Title', left: left.title, right: right.title },
    { field: 'tonic', label: 'Key', left: left.tonic, right: right.tonic },
    { field: 'mode', label: 'Mode', left: left.mode, right: right.mode },
    { field: 'bpm', label: 'Tempo', left: `${left.bpm} BPM`, right: `${right.bpm} BPM` },
    { field: 'meter', label: 'Meter', left: left.meter, right: right.meter },
    { field: 'chords', label: 'Progression', left: left.chords.join(' → '), right: right.chords.join(' → ') },
    { field: 'sections', label: 'Sections', left: describeSections(left.sections), right: describeSections(right.sections) },
  ];
  return rows.map(row => ({ ...row, changed: row.left !== row.right }));
}

const randomId = () => globalThis.crypto.randomUUID();
const copySections = (sections: CompositionSection[] = []) => sections.map(section => ({ ...section, chords: [...section.chords], melody: [...(section.melody ?? [])] }));
const snapshotCopy = (snapshot: CompositionSnapshot): CompositionSnapshot => ({
  title: snapshot.title, tonic: snapshot.tonic, mode: snapshot.mode, bpm: snapshot.bpm, meter: snapshot.meter,
  chords: [...snapshot.chords], sections: copySections(snapshot.sections),
});

function describeSections(sections: CompositionSection[] = []): string {
  return sections.map(section => `${section.name} (${section.bars} bars): ${section.chords.join(' → ')}${section.melody?.length ? ' · melody: ' + section.melody.join(' ') : ''}${section.feel ? ' · ' + section.feel : ''}${section.energy ? ' · energy ' + section.energy : ''}`).join(' | ');
}

export function createCompositionProject(
  snapshot: CompositionSnapshot,
  idFactory: () => string = randomId,
  now = new Date().toISOString(),
): CompositionProject {
  const version: CompositionVersion = { id: idFactory(), label: 'Revision 1', savedAt: now, snapshot: snapshotCopy(snapshot) };
  return { ...snapshotCopy(snapshot), id: idFactory(), createdAt: now, updatedAt: now, versions: [version] };
}

export function appendCompositionVersion(
  project: CompositionProject,
  snapshot: CompositionSnapshot,
  idFactory: () => string = randomId,
  now = new Date().toISOString(),
): CompositionProject {
  const version: CompositionVersion = {
    id: idFactory(),
    label: `Revision ${project.versions.length + 1}`,
    savedAt: now,
    snapshot: snapshotCopy(snapshot),
  };
  return { ...snapshotCopy(snapshot), id: project.id, createdAt: project.createdAt, updatedAt: now, versions: [...project.versions, version] };
}

export function restoreCompositionVersion(project: CompositionProject, versionId: string): CompositionSnapshot | null {
  const version = project.versions.find(item => item.id === versionId);
  return version ? snapshotCopy(version.snapshot) : null;
}

export function duplicateCompositionProject(
  project: CompositionProject,
  idFactory: () => string = randomId,
  now = new Date().toISOString(),
): CompositionProject {
  const title = `Copy of ${project.title}`;
  return {
    ...snapshotCopy({ ...project, title }),
    id: idFactory(),
    createdAt: now,
    updatedAt: now,
    versions: project.versions.map(version => ({
      ...version,
      id: idFactory(),
      snapshot: { ...snapshotCopy(version.snapshot), title: `Copy of ${version.snapshot.title}` },
    })),
  };
}
