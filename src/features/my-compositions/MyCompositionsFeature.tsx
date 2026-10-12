import { useRef, useState } from 'react';
import { storageSet } from '@shared/utils/storage';
import type { Tab } from '@shared/types/navigation.types';
import { appendCompositionVersion, compareCompositionSnapshots, createCompositionProject, duplicateCompositionProject, normalizeCompositionSections, type CompositionProject } from '../harmony-composition-lab/projectVersioning';
import { buildMidiFile } from '../harmony-composition-lab/midiExport';
import { buildMusicXml } from '../harmony-composition-lab/musicXmlExport';
import { EDITOR_REQUEST_KEY, PROJECTS_KEY, isSnapshot, readCompositions, type CompositionEditor } from './compositionRepository';

const panel: React.CSSProperties = { background: '#161b22', border: '1px solid #30363d', borderRadius: 12, padding: 18 };
const button: React.CSSProperties = { background: '#21262d', color: '#e6edf3', border: '1px solid #30363d', borderRadius: 8, padding: '8px 12px', cursor: 'pointer' };

export default function MyCompositionsFeature({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  const [projects, setProjects] = useState(readCompositions);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const selected = projects.find(project => project.id === selectedId);
  function persist(next: CompositionProject[]) { storageSet(PROJECTS_KEY, next); setProjects(next); }
  function open(target: CompositionEditor) {
    if (!selected) return;
    storageSet(EDITOR_REQUEST_KEY, { target, projectId: selected.id, snapshot: selected });
    onNavigate(target);
  }
  function download(data: BlobPart, extension: string, mime: string) {
    const url = URL.createObjectURL(new Blob([data], { type: mime }));
    const anchor = document.createElement('a'); anchor.href = url;
    anchor.download = `${selected?.title.replace(/[^a-z0-9]+/gi, '-') || 'composition'}.${extension}`;
    anchor.click(); URL.revokeObjectURL(url);
  }
  async function importFile(file?: File) {
    if (!file) return;
    try {
      const value = JSON.parse(await file.text());
      if (!isSnapshot(value)) throw new Error('Invalid composition');
      const base = createCompositionProject({ ...value, sections: normalizeCompositionSections(value.sections) });
      const versions = (value as CompositionProject).versions;
      const imported = { ...base, versions: Array.isArray(versions) && versions.length ? versions.filter(v => v && typeof v.id === 'string' && typeof v.label === 'string' && isSnapshot(v.snapshot)).map(v => ({ ...v, snapshot: { ...v.snapshot, sections: normalizeCompositionSections(v.snapshot.sections) } })) : base.versions };
      persist([imported, ...projects]); setSelectedId(imported.id); setCompareIds([]); setStatus('Composition imported.');
    } catch { setStatus('Unable to import this file. Choose a composition JSON export.'); }
  }
  const compared = selected?.versions.filter(v => compareIds.includes(v.id)) ?? [];
  return <div style={{ display: 'grid', gap: 18, color: '#e6edf3' }}>
    <header><h1>My compositions</h1><p style={{ color: '#8b949e' }}>Saved ideas, versions and exports. Develop harmony in Chord Progressions, form in Song Architect and motifs in Melody Architect.</p></header>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <button style={button} onClick={() => onNavigate('progressions')}>Create a progression</button>
      <button style={button} onClick={() => onNavigate('architect')}>Plan a song</button>
      <button style={button} onClick={() => input.current?.click()}>Import JSON</button>
      <input ref={input} hidden type="file" accept=".json,application/json" onChange={e => { void importFile(e.target.files?.[0]); e.currentTarget.value = ''; }} />
    </div>
    <p style={{ margin: 0, color: '#8b949e', fontSize: 12 }}>Stored in this browser. Export JSON to back up the complete project and its history.</p>
    {status && <p role="status">{status}</p>}
    <section style={{ ...panel, display: 'grid', gap: 8 }} aria-label="Saved compositions">
      {!projects.length && <p>No compositions saved yet. Save an idea from Chord Progressions or Song Architect.</p>}
      {projects.map(project => <button key={project.id} style={{ ...button, textAlign: 'left', borderColor: selectedId === project.id ? '#a78bfa' : '#30363d' }} aria-pressed={selectedId === project.id} onClick={() => { setSelectedId(project.id); setCompareIds([]); }}>
        <strong>{project.title}</strong> · {project.tonic} {project.mode} · {project.versions.length} revisions
      </button>)}
    </section>
    {selected && <section style={{ ...panel, display: 'grid', gap: 12 }}>
      <h2 style={{ margin: 0 }}>{selected.title}</h2>
      <p>{selected.tonic} {selected.mode} · {selected.bpm} BPM · {selected.meter}</p>
      <div style={{ fontFamily: 'monospace' }}>{selected.chords.join(' → ')}</div>
      {(selected.sections ?? []).map(section => <div key={section.id} style={{ padding: 10, background: '#0d1117', borderRadius: 8 }}>
        <strong>{section.name}</strong> · {section.bars} bars<div>{section.chords.join(' → ')}</div>
        {!!section.melody?.length && <div>Melody: {section.melody.join(' · ')}</div>}
      </div>)}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button style={button} onClick={() => open('architect')}>Edit form in Song Architect</button>
        <button style={button} onClick={() => open('progressions')}>Edit chords in Chord Progressions</button>
        <button style={button} onClick={() => open('melody')}>Develop motif in Melody Architect</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button style={button} onClick={() => download(JSON.stringify(selected, null, 2), 'json', 'application/json')}>Export complete JSON</button>
        <button style={button} disabled={!selected.chords.length} onClick={() => download(buildMidiFile(selected).buffer as ArrayBuffer, 'mid', 'audio/midi')}>Progression MIDI</button>
        <button style={button} disabled={!selected.chords.length} onClick={() => download(buildMusicXml(selected), 'musicxml', 'application/vnd.recordare.musicxml+xml')}>Progression MusicXML</button>
        <button style={button} onClick={() => { const copy = duplicateCompositionProject(selected); persist([copy, ...projects]); setSelectedId(copy.id); setCompareIds([]); }}>Duplicate</button>
        <button style={button} onClick={() => { if (window.confirm(`Delete “${selected.title}” and its revisions?`)) { persist(projects.filter(p => p.id !== selected.id)); setSelectedId(null); } }}>Delete</button>
      </div>
      <details><summary>Version history and comparison</summary>
        <p>Select two revisions to compare. Restoring adds a new revision and keeps the previous history.</p>
        {[...selected.versions].reverse().map(version => <div key={version.id} style={{ display: 'flex', gap: 12, padding: 8, flexWrap: 'wrap' }}>
          <label><input type="checkbox" checked={compareIds.includes(version.id)} onChange={() => setCompareIds(ids => ids.includes(version.id) ? ids.filter(id => id !== version.id) : [...ids, version.id].slice(-2))} /> {version.label} · {version.savedAt}</label>
          <button style={button} onClick={() => { const updated = appendCompositionVersion(selected, version.snapshot); persist(projects.map(p => p.id === updated.id ? updated : p)); setStatus(`Restored ${version.label} as a new revision.`); }}>Restore</button>
        </div>)}
        {compared.length === 2 && <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', textAlign: 'left' }}><thead><tr><th>Field</th><th>{compared[0].label}</th><th>{compared[1].label}</th></tr></thead><tbody>
          {compareCompositionSnapshots(compared[0].snapshot, compared[1].snapshot).map(row => <tr key={row.field} style={{ background: row.changed ? '#2b2142' : 'transparent' }}><th>{row.label}{row.changed ? ' · changed' : ''}</th><td>{row.left || '—'}</td><td>{row.right || '—'}</td></tr>)}
        </tbody></table></div>}
      </details>
    </section>}
  </div>;
}
