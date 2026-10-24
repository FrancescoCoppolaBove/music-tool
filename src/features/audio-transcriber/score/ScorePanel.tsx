import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Download, Printer, RotateCcw, Play, Undo2, Redo2, Upload, Anchor } from 'lucide-react';
import type { ChordEvent, NoteEvent, TranscriptionResult } from '../types';
import { buildScore, buildBarTimeline, DIVISIONS, METERS, KEY_SIGNATURES, normalizeScoreKey, normalizeEvents, validateSettings, type BarEdits, type ScoreBar, type ScoreEvent, type ScoreSettings } from './scoreModel';
import { buildChartXml } from './scoreXml';
import ScorePreview from './ScorePreview';
import { printScore } from './scorePrint';

const control: CSSProperties = { background: '#0d1117', color: '#e6edf3', border: '1px solid #30363d', borderRadius: 5, padding: '7px 8px', fontSize: 13, minWidth: 0, width: '100%', boxSizing: 'border-box' };
const command: CSSProperties = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '7px 10px', color: '#e6edf3', background: '#21262d', border: '1px solid #30363d', borderRadius: 5, cursor: 'pointer', minHeight: 34 };
const label: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12, color: '#9ca3af' };
function saveFile(name: string, body: string, type: string) {
  const url = URL.createObjectURL(new Blob([body], { type }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function defaults(result: TranscriptionResult, duration: number): ScoreSettings {
  const bpm = result.bpm ?? 100;
  return { offset: Number(Math.max(0, result.beatOffsetSec).toFixed(3)), grid: 'eighth', mode: 'harmony', key: normalizeScoreKey(result.key ?? 'C major'), anchors: [],
    sections: [{ id: 'section-1', name: 'A', meter: '4/4', bpm, bars: Math.min(512, Math.max(1, Math.ceil((duration - Math.max(0, result.beatOffsetSec)) * bpm / 240))) }] };
}
interface Props {
  notes: NoteEvent[]; chords: ChordEvent[]; result: TranscriptionResult; fileName: string; duration: number;
  active: boolean; playhead: number; onSeek: (sec: number) => void; onAudition: (start: number, end: number) => void; onDirty: () => void;
}
export default function ScorePanel({ notes, chords, result, fileName, duration, active, playhead, onSeek, onAudition, onDirty }: Props) {
  const [draft, setDraft] = useState<ScoreSettings>(() => defaults(result, duration));
  const [settings, setSettings] = useState(draft);
  const [title, setTitle] = useState(fileName || 'Harmonic sketch');
  const [edits, setEdits] = useState<BarEdits>({});
  const [undo, setUndo] = useState<BarEdits[]>([]), [redo, setRedo] = useState<BarEdits[]>([]);
  const [selected, setSelected] = useState(1), [page, setPage] = useState(0);
  const [error, setError] = useState(''), [printing, setPrinting] = useState(false);
  const [anchorTime, setAnchorTime] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const bars = useMemo(() => buildScore(notes, chords, settings, edits), [notes, chords, settings, edits]);
  const current = bars[Math.min(selected - 1, bars.length - 1)];
  const visible = useMemo(() => bars.slice(page * 12, page * 12 + 12), [bars, page]);
  const xml = useMemo(() => buildChartXml(visible, title, settings.key, true), [visible, title, settings.key]);
  const end = bars[bars.length - 1].endSec;
  const changed = JSON.stringify(draft) !== JSON.stringify(settings);
  const review = bars.filter(b => b.events.some(e => e.review)).length;
  const basename = (title || 'score').replace(/[^a-z0-9_-]/gi, '_');
  function generate() {
    try {
      validateSettings(draft);
      if (Object.keys(edits).length && !window.confirm('Regenerate the draft and replace manual bar edits?')) return;
      setSettings(structuredClone(draft)); setEdits({}); setUndo([]); setRedo([]); setSelected(1); setPage(0); setError(''); onDirty();
    } catch (e) { setError((e as Error).message); }
  }
  function editBar(events: ScoreEvent[]) {
    try {
      const normalized = normalizeEvents(events, current.ticks);
      setUndo(history => [...history.slice(-29), edits]); setRedo([]);
      setEdits({ ...edits, [current.number]: normalized }); setError(''); onDirty();
    } catch (e) { setError((e as Error).message); }
  }
  function anchorBar(seconds: number) {
    try {
      const next = { ...settings, offset: current.number === 1 ? seconds : settings.offset,
        anchors: current.number === 1 ? settings.anchors : [...settings.anchors.filter(a => a.bar !== current.number), { bar: current.number, seconds }] };
      validateSettings(next); setDraft(next); setSettings(next); setError(''); onDirty();
    } catch (e) { setError((e as Error).message); }
  }
  async function loadProject(file: File) {
    try {
      if (file.size > 2000000) throw new Error('Score projects must be smaller than 2 MB.');
      const data = JSON.parse(await file.text());
      if (data.version !== 1 || typeof data.title !== 'string' || data.title.length > 200 || typeof data.settings?.key !== 'string' || !data.edits || typeof data.edits !== 'object' || Array.isArray(data.edits)) throw new Error('Invalid score project.');
      validateSettings(data.settings);
      const timeline = buildBarTimeline(data.settings);
      for (const [number, events] of Object.entries(data.edits)) {
        const bar = timeline[Number(number) - 1];
        if (!bar || !Array.isArray(events)) throw new Error('Invalid bar edits.');
        normalizeEvents(events as ScoreEvent[], bar.ticks);
      }
      if (data.fileName !== fileName && !window.confirm('This project was saved for another audio file. Apply its structure to this recording?')) return;
      setDraft(data.settings); setSettings(data.settings); setEdits(data.edits); setTitle(data.title);
      setUndo([]); setRedo([]); setPage(0); setSelected(1); setError(''); onDirty();
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load score project.'); }
  }
  const updateSection = (index: number, patch: Partial<ScoreSettings['sections'][number]>) => setDraft(s => ({ ...s, sections: s.sections.map((section, i) => i === index ? { ...section, ...patch } : section) }));
  return <section hidden={!active} aria-label="Score workspace" style={{ padding: '12px 0 20px', color: '#e6edf3', minWidth: 0 }}>
    <style>{`.score-toolbar{display:flex;flex-wrap:wrap;align-items:end;gap:12px}.score-settings{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:12px;margin:14px 0}.score-section-row{display:grid;grid-template-columns:minmax(100px,1fr) 70px 80px 80px auto;gap:8px;align-items:end;margin:10px 0}.score-bar-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:6px;margin:12px 0}.score-editor-row{display:grid;grid-template-columns:1.5fr 80px 80px 50px 34px;gap:8px;align-items:end;margin:8px 0}@media(max-width:600px){.score-section-row{grid-template-columns:minmax(90px,1fr) 65px 70px}.score-section-row>label:nth-child(4){grid-column:1}.score-editor-row{grid-template-columns:1fr 68px 68px}.score-editor-row>label:nth-child(4){grid-column:1}.score-bar-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}`}</style>
    <div className="score-toolbar">
      <label style={{ ...label, flex: '1 1 200px' }}>Score title<input aria-label="Score title" value={title} maxLength={200} onChange={e => { setTitle(e.target.value); onDirty(); }} style={control} /></label>
      <button style={command} disabled={changed} onClick={() => saveFile(`${basename}.musicxml`, buildChartXml(bars, title, settings.key), 'application/vnd.recordare.musicxml+xml')}><Download size={15} /> MusicXML</button>
      <button style={command} disabled={printing || changed} onClick={async () => { setPrinting(true); try { await printScore(buildChartXml(bars, title, settings.key, true), title); } catch (e) { setError((e as Error).message); } finally { setPrinting(false); } }}><Printer size={15} /> {printing ? 'Preparing...' : 'Print / PDF'}</button>
      <button style={command} disabled={changed} onClick={() => saveFile(`${basename}.tonic-score.json`, JSON.stringify({ version: 1, fileName, title, settings, edits }, null, 2), 'application/json')}><Download size={15} /> Save project</button>
      <button style={command} onClick={() => input.current?.click()}><Upload size={15} /> Load project</button>
      <input ref={input} type="file" accept=".json" aria-label="Load score project" hidden onChange={e => { const file = e.target.files?.[0]; if (file) void loadProject(file); e.target.value = ''; }} />
    </div>
    <details open style={{ marginTop: 16, borderBlock: '1px solid #30363d', padding: '12px 0' }}>
      <summary style={{ cursor: 'pointer', fontWeight: 600 }}>Tempo & song structure</summary>
      <div className="score-settings">
        <label style={label}>First bar starts at (seconds)<input style={control} type="number" min="0" step="0.01" value={draft.offset} onChange={e => setDraft({ ...draft, offset: Number(e.target.value) })} /></label>
        <label style={label}>Notation<select aria-label="Notation" style={control} value={draft.mode} onChange={e => setDraft({ ...draft, mode: e.target.value as ScoreSettings['mode'] })}><option value="harmony">Harmonic chart</option><option value="rhythm">Rhythmic chart</option></select></label>
        <label style={label}>Rhythm grid<select aria-label="Rhythm grid" style={control} value={draft.grid} onChange={e => setDraft({ ...draft, grid: e.target.value as ScoreSettings['grid'] })}><option value="eighth">Eighth notes</option><option value="sixteenth">Sixteenth notes</option><option value="triplet">Eighth-note triplets</option></select></label>
        <label style={label}>Key signature<select aria-label="Key signature" style={control} value={draft.key} onChange={e => setDraft({ ...draft, key: e.target.value })}>{(['major', 'minor'] as const).flatMap(mode => Object.keys(KEY_SIGNATURES[mode]).map(key => <option key={`${key} ${mode}`}>{key} {mode}</option>))}</select></label>
      </div>
      {draft.sections.map((section, i) => <div className="score-section-row" key={section.id}>
        <label style={label}>Section<input style={control} aria-label={`Section ${i + 1} name`} value={section.name} maxLength={100} onChange={e => updateSection(i, { name: e.target.value })} /></label>
        <label style={label}>Bars<input style={control} aria-label={`Section ${i + 1} bars`} type="number" min="1" max="512" value={section.bars} onChange={e => updateSection(i, { bars: Number(e.target.value) })} /></label>
        <label style={label}>Meter<select style={control} aria-label={`Section ${i + 1} meter`} value={section.meter} onChange={e => updateSection(i, { meter: e.target.value })}>{METERS.map(m => <option key={m}>{m}</option>)}</select></label>
        <label style={label}>Quarter BPM<input style={control} aria-label={`Section ${i + 1} BPM`} type="number" min="20" max="320" step="0.1" value={section.bpm} onChange={e => updateSection(i, { bpm: Number(e.target.value) })} /></label>
        <div style={{ display: 'flex', gap: 4 }}>
          <button style={command} title="Move section up" aria-label={`Move section ${i + 1} up`} disabled={i === 0} onClick={() => setDraft(s => { const sections = [...s.sections]; [sections[i - 1], sections[i]] = [sections[i], sections[i - 1]]; return { ...s, sections }; })}><ArrowUp size={14} /></button>
          <button style={command} title="Move section down" aria-label={`Move section ${i + 1} down`} disabled={i === draft.sections.length - 1} onClick={() => setDraft(s => { const sections = [...s.sections]; [sections[i], sections[i + 1]] = [sections[i + 1], sections[i]]; return { ...s, sections }; })}><ArrowDown size={14} /></button>
          <button style={command} title="Delete section" aria-label={`Delete section ${i + 1}`} disabled={draft.sections.length === 1} onClick={() => setDraft(s => ({ ...s, sections: s.sections.filter((_, index) => index !== i) }))}><Trash2 size={14} /></button>
        </div>
      </div>)}
      <div className="score-toolbar">
        <button style={command} disabled={draft.sections.length >= 32} onClick={() => setDraft(s => ({ ...s, sections: [...s.sections, { id: crypto.randomUUID(), name: String.fromCharCode(65 + s.sections.length % 26), bars: 8, meter: s.sections[s.sections.length - 1].meter, bpm: s.sections[s.sections.length - 1].bpm }] }))}><Plus size={15} /> Add section</button>
        <button style={{ ...command, background: '#145c52' }} onClick={generate}><RotateCcw size={15} /> Generate draft</button>
        <button style={command} onClick={() => { try { const timeline = buildBarTimeline({ ...draft, anchors: [] }); const last = draft.sections.length - 1; const start = timeline[timeline.length - draft.sections[last].bars].startSec; const [n, d] = draft.sections[last].meter.split('/').map(Number); updateSection(last, { bars: Math.min(512 - (timeline.length - draft.sections[last].bars), Math.max(1, Math.ceil((duration - start) / (n * 4 / d * 60 / draft.sections[last].bpm)))) }); } catch (e) { setError((e as Error).message); } }}>Fit last section to audio</button>
        {changed && <span role="status" style={{ fontSize: 12, color: '#fbbf24' }}>Structure changes pending</span>}
      </div>
      <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 0 }}>BPM counts quarter notes in every meter. Estimated tempo: {result.bpm ?? 'unavailable'}. Meter starts as 4/4; confirm the structure before exporting.</p>
    </details>
    {error && <p role="alert" style={{ color: '#fca5a5' }}>{error}</p>}
    <p style={{ fontSize: 12, color: '#9ca3af' }}>{bars.length} bars · {review} bars to review · Audio covered to {end.toFixed(2)} s{duration - end > 0.2 ? ` · ${(duration - end).toFixed(2)} s not covered` : ''}</p>
    <div className="score-toolbar" style={{ justifyContent: 'space-between', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button style={command} disabled={page === 0} aria-label="Previous score page" onClick={() => setPage(p => p - 1)}><ArrowUp size={15} /></button>
        <span style={{ fontSize: 12 }}>Bars {visible[0]?.number}–{visible[visible.length - 1]?.number}</span>
        <button style={command} disabled={(page + 1) * 12 >= bars.length} aria-label="Next score page" onClick={() => setPage(p => p + 1)}><ArrowDown size={15} /></button>
      </div>
      <button style={command} onClick={() => { const bar = bars.find(b => playhead >= b.startSec && playhead < b.endSec); if (bar) { setSelected(bar.number); setPage(Math.floor((bar.number - 1) / 12)); } }}>Locate playhead</button>
    </div>
    <ScorePreview xml={xml} active={active} />
    <div className="score-bar-grid">{visible.map(bar => <button key={bar.number} onClick={() => { setSelected(bar.number); setAnchorTime(''); onSeek(bar.startSec); }} style={{ ...command, display: 'block', textAlign: 'left', background: selected === bar.number ? '#173a36' : '#161b22', borderColor: selected === bar.number ? '#39bbaa' : '#30363d', overflowWrap: 'anywhere' }}>
      <span style={{ color: '#9ca3af', fontSize: 11 }}>Bar {bar.number} · {bar.meter}{bar.section ? ` · ${bar.section}` : ''}</span>
      <div style={{ marginTop: 4, fontSize: 13 }}>{[...new Set(bar.events.filter(e => !e.rest && e.symbol).map(e => e.symbol))].join(' · ') || (bar.events.every(e => e.rest) ? 'Rest' : 'Rhythm only')}</div>
      {bar.events.some(e => e.review) && <span style={{ fontSize: 10, color: '#fbbf24' }}>Review timing / notes</span>}
    </button>)}</div>
    <div style={{ paddingBlock: 14, borderTop: '1px solid #30363d' }}>
      <div className="score-toolbar">
        <strong>Bar {current.number} · {current.meter}</strong><span style={{ fontSize: 12, color: '#9ca3af' }}>{current.startSec.toFixed(2)}–{current.endSec.toFixed(2)} s</span>
        <button style={command} onClick={() => onAudition(current.startSec, Math.min(duration, current.endSec))}><Play size={14} /> Loop bar</button>
        <button style={command} title="Undo bar edit" aria-label="Undo bar edit" disabled={!undo.length} onClick={() => { setRedo(r => [...r, edits]); setEdits(undo[undo.length - 1]); setUndo(h => h.slice(0, -1)); onDirty(); }}><Undo2 size={14} /></button>
        <button style={command} title="Redo bar edit" aria-label="Redo bar edit" disabled={!redo.length} onClick={() => { setUndo(h => [...h, edits]); setEdits(redo[redo.length - 1]); setRedo(r => r.slice(0, -1)); onDirty(); }}><Redo2 size={14} /></button>
        <button style={command} onClick={() => { const next = { ...edits }; delete next[current.number]; setUndo(h => [...h.slice(-29), edits]); setRedo([]); setEdits(next); onDirty(); }}>Restore detected bar</button>
      </div>
      <BarEditor key={`${current.number}-${JSON.stringify(current.events)}`} bar={current} onApply={editBar} />
      <div className="score-toolbar" style={{ marginTop: 16 }}>
        <label style={{ ...label, maxWidth: 180 }}>Bar starts at (seconds)<input style={control} type="number" min="0" step="0.01" placeholder={current.startSec.toFixed(2)} value={anchorTime} onChange={e => setAnchorTime(e.target.value)} /></label>
        <button style={command} disabled={changed || anchorTime === ''} onClick={() => anchorBar(Number(anchorTime))}><Anchor size={14} /> Set bar anchor</button>
        <button style={command} disabled={changed} onClick={() => anchorBar(playhead)}>Use playhead as bar start</button>
      </div>
      {settings.anchors.length > 0 && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>{settings.anchors.map(a => <button key={a.bar} style={command} disabled={changed} title="Remove bar anchor" onClick={() => { const next = { ...settings, anchors: settings.anchors.filter(v => v.bar !== a.bar) }; setSettings(next); setDraft(next); onDirty(); }}>Bar {a.bar}: {a.seconds.toFixed(2)} s <Trash2 size={12} /></button>)}</div>}
      <p style={{ color: '#9ca3af', fontSize: 12 }}>Anchors align free timing between marked bars. Amber notation needs review. Slash notes show rhythm, not the recorded pitches. MusicXML remains editable in notation software.</p>
    </div>
  </section>;
}

function BarEditor({ bar, onApply }: { bar: ScoreBar; onApply: (events: ScoreEvent[]) => void }) {
  const unit = DIVISIONS * 4 / Number(bar.meter.split('/')[1]);
  const [events, setEvents] = useState(bar.events.map(e => ({ ...e })));
  const update = (index: number, patch: Partial<ScoreEvent>) => setEvents(es => es.map((e, i) => i === index ? { ...e, ...patch, review: false, tieIn: false, tieOut: false } : e));
  return <div>
    {events.map((event, i) => <div className="score-editor-row" key={i}>
      <label style={label}>Chord<input style={control} aria-label={`Event ${i + 1} chord`} placeholder="No chord label" value={event.symbol} disabled={event.rest} onChange={e => update(i, { symbol: e.target.value })} maxLength={80} /></label>
      <label style={label}>Position<input style={control} aria-label={`Event ${i + 1} position`} type="number" min="1" step="0.08333333333333333" value={Number((event.tick / unit + 1).toFixed(3))} onChange={e => update(i, { tick: Math.round((Number(e.target.value) - 1) * unit) })} /></label>
      <label style={label}>Duration<input style={control} aria-label={`Event ${i + 1} duration`} type="number" min="0.083" step="0.08333333333333333" value={Number((event.duration / unit).toFixed(3))} onChange={e => update(i, { duration: Math.round(Number(e.target.value) * unit) })} /></label>
      <label style={{ ...label, alignItems: 'center' }}>Rest<input aria-label={`Event ${i + 1} rest`} type="checkbox" checked={event.rest} onChange={e => update(i, { rest: e.target.checked, symbol: '' })} style={{ height: 30 }} /></label>
      <button style={command} title="Remove event" aria-label={`Remove event ${i + 1}`} onClick={() => setEvents(es => es.filter((_, index) => index !== i))}><Trash2 size={14} /></button>
    </div>)}
    <div className="score-toolbar" style={{ marginTop: 10 }}>
      <button style={command} onClick={() => setEvents(es => {
        const rest = es.findIndex(e => e.rest && e.duration > 1);
        const index = rest >= 0 ? rest : es.findIndex(e => e.duration > 1);
        if (index < 0) return es.length ? es : [{ tick: 0, duration: unit, symbol: '', rest: false }];
        const event = es[index], first = Math.max(1, Math.min(unit, Math.floor(event.duration / 2)));
        return es.flatMap((e, i) => i !== index ? [e] : [{ ...e, duration: first, tieOut: false },
          { tick: e.tick + first, duration: e.duration - first, symbol: '', rest: false }]);
      })}><Plus size={14} /> Add event</button>
      <button style={command} onClick={() => onApply(events)}>Apply bar edits</button>
      <span style={{ fontSize: 12, color: '#9ca3af' }}>Positions and durations count {bar.meter.endsWith('/8') ? 'eighth' : 'quarter'} notes; gaps become rests.</span>
    </div>
  </div>;
}
