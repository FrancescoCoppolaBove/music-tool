import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { Upload, Search, Square, RotateCcw, Pencil, Undo2, Redo2, Music2 } from 'lucide-react';
import { INSTRUMENT_CONFIG, type DetectionSensitivity, type InstrumentKind, type NoteEvent, type ChordEvent, type TranscriptionResult } from './types';
import { analyzeAudio } from './engine/workerClient';
import { quantizeNotes } from './engine/quantizer';
import { analyzeChords } from './engine/chordAnalyzer';
import ExportBar from './components/ExportBar';
import NoteTable from './components/NoteTable';
import PianoRoll from './components/PianoRoll';
import TransportBar from './components/TransportBar';

/* Altezze esplicite: la tabella può avere migliaia di righe e, senza una
   catena di altezze definita, allungherebbe .at-split (e quindi il canvas
   del piano roll) fino a superare il limite di dimensione dei canvas. */
const ROLL_CSS = `
  .at-split { display: flex; gap: 12px; height: clamp(380px, calc(100vh - 310px), 800px); }
  .at-roll-pane { flex: 3; display: flex; flex-direction: column; min-height: 0; min-width: 0; }
  .at-table-pane { flex: 2; background: #161b22; border: 1px solid #21262d; border-radius: 12px; overflow: hidden; min-height: 0; min-width: 0; }
  @media (max-width: 768px) {
    .at-split { flex-direction: column; height: auto; }
    .at-roll-pane { height: 52vh; }
    .at-table-pane { height: 40vh; }
  }
`;

type AppState = 'idle' | 'loading' | 'loaded' | 'analyzing' | 'ready' | 'error';

const INSTRUMENTS: { id: InstrumentKind; label: string; icon: string }[] = [
  { id: 'keyboard',      label: 'Keyboard',     icon: '' },
  { id: 'bass',          label: 'Bass',         icon: '' },
  { id: 'guitar',        label: 'Guitar',       icon: '' },
  { id: 'voice',         label: 'Voice',        icon: '' },
  { id: 'winds',         label: 'Solo wind',    icon: '' },
  { id: 'winds-section', label: 'Wind section', icon: '' },
];

const LARGE_FILE_BYTES = 50 * 1024 * 1024;  // 50 MB
const LARGE_DURATION_SEC = 600;              // 10 min

function downmixToMono(buffer: AudioBuffer): Float32Array {
  if (buffer.numberOfChannels === 1) return buffer.getChannelData(0).slice();
  const len = buffer.length;
  const out = new Float32Array(len);
  for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
    const data = buffer.getChannelData(ch);
    for (let i = 0; i < len; i++) out[i] += data[i];
  }
  const norm = 1 / buffer.numberOfChannels;
  for (let i = 0; i < len; i++) out[i] *= norm;
  return out;
}

export default function AudioTranscriberFeature() {
  const [appState, setAppState]         = useState<AppState>('idle');
  const [instrument, setInstrument]     = useState<InstrumentKind>('keyboard');
  const [voiceCount, setVoiceCount]     = useState(4);
  const [sensitivity, setSensitivity] = useState<DetectionSensitivity>('balanced');
  const analysisAbortRef = useRef<AbortController | null>(null);
  const loadIdRef = useRef(0);
  const [fileName, setFileName]         = useState('');
  const [errorMsg, setErrorMsg]         = useState<string | null>(null);
  const [analysisProgress, setProgress] = useState(0);
  const [result, setResult]             = useState<TranscriptionResult | null>(null);
  const [notes, setNotes]               = useState<NoteEvent[]>([]);
  const [chords, setChords]             = useState<ChordEvent[]>([]);
  const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set());
  const [undoStack, setUndoStack] = useState<NoteEvent[][]>([]);
  const [redoStack, setRedoStack] = useState<NoteEvent[][]>([]);
  const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const audioCtxRef    = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const [isPlaying, setIsPlaying]     = useState(false);
  const [playheadSec, setPlayheadSec] = useState(0);
  const [loopA, setLoopA]             = useState<number | null>(null);
  const [loopB, setLoopB]             = useState<number | null>(null);
  const sourceRef        = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef     = useRef(0);
  const pausePositionRef = useRef(0);
  const rafRef           = useRef(0);
  const isPlayingRef     = useRef(false);
  const handlePlayRef    = useRef<() => void>(() => {});
  const handlePauseRef   = useRef<() => void>(() => {});
  const handleUndoRef    = useRef<() => void>(() => {});
  const handleRedoRef    = useRef<() => void>(() => {});
  const deleteSelectedRef = useRef<() => void>(() => {});

  function stopSource() {
    try { sourceRef.current?.stop(); } catch { /* already stopped */ }
    sourceRef.current = null;
    cancelAnimationFrame(rafRef.current);
  }

  useEffect(() => {
    return () => {
      analysisAbortRef.current?.abort();
      loadIdRef.current++;
      stopSource();
      audioCtxRef.current?.close();
    };
  }, []);

  async function decodeFile(file: File) {
    if (hasUnsavedEdits && appState === 'ready') {
      if (!window.confirm('Loading a new file will discard your edits. Continue?')) return;
    }
    analysisAbortRef.current?.abort();
    const loadId = ++loadIdRef.current;
    stopSource();
    setIsPlaying(false);
    pausePositionRef.current = 0;
    setPlayheadSec(0);
    setLoopA(null); setLoopB(null);
    setUndoStack([]); setRedoStack([]);
    audioCtxRef.current?.close();
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    setErrorMsg(null);
    setAppState('loading');
    setFileName(file.name.replace(/\.[^.]+$/, ''));
    setResult(null);
    setNotes([]);
    setChords([]);
    setSelectedIds(new Set());
    setHasUnsavedEdits(false);
    audioBufferRef.current = null;

    if (file.size > LARGE_FILE_BYTES) {
      if (!window.confirm(`This file is ${(file.size / 1024 / 1024).toFixed(0)} MB. Analysis may take a while. Continue?`)) {
        setAppState('idle');
        return;
      }
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      if (loadId !== loadIdRef.current) return;

      if (audioBuffer.duration > LARGE_DURATION_SEC) {
        if (!window.confirm(`This recording is ${(audioBuffer.duration / 60).toFixed(0)} minutes long. Continue?`)) {
          setAppState('idle');
          return;
        }
      }

      audioBufferRef.current = audioBuffer;
      setAppState('loaded');
    } catch {
      if (loadId !== loadIdRef.current) return;
      setErrorMsg('Could not decode this file. Audio format support depends on your browser. Try a WAV or MP3 file.');
      setAppState('error');
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) decodeFile(file);
    e.target.value = '';
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) decodeFile(file);
  }

  const [editedBpm, setEditedBpm] = useState<string>('');
  const [bpmEditActive, setBpmEditActive] = useState(false);
  const tempoRef = useRef<{ bpm: number; beatOffsetSec: number } | null>(null);

  const runAnalysis = useCallback(async () => {
    const buf = audioBufferRef.current;
    if (!buf) return;
    analysisAbortRef.current?.abort();
    const controller = new AbortController();
    analysisAbortRef.current = controller;
    stopSource();
    setIsPlaying(false);
    setResult(null);
    setErrorMsg(null);
    setUndoStack([]); setRedoStack([]);
    setAppState('analyzing');
    setProgress(0);
    setSelectedIds(new Set());
    setNotes([]);
    setChords([]);
    try {
      const signal = downmixToMono(buf);
      const res = await analyzeAudio(
        signal,
        buf.sampleRate,
        instrument,
        setProgress,
        { voiceCount: instrument === 'winds-section' ? voiceCount : undefined, sensitivity, signal: controller.signal },
      );
      if (controller.signal.aborted) return;
      if (res.notes.length === 0) {
        setErrorMsg('No notes detected. Try Sensitive detection or a clearer, isolated instrument recording.');
        setAppState('error');
        return;
      }
      tempoRef.current = res.bpm !== null
        ? { bpm: res.bpm, beatOffsetSec: res.beatOffsetSec }
        : null;
      setEditedBpm(res.bpm !== null ? res.bpm.toFixed(1) : '');
      setResult(res);
      setNotes([...res.notes]);
      setChords([...res.chords]);
      setHasUnsavedEdits(false);
      setAppState('ready');
    } catch (err) {
      if (controller.signal.aborted) return;
      setErrorMsg(`Analysis failed: ${err instanceof Error ? err.message : String(err)}`);
      setAppState('error');
    }
  }, [instrument, voiceCount, sensitivity]);

  const canAnalyze = (appState === 'loaded' || appState === 'ready' || appState === 'error') && !!audioBufferRef.current;

  const getPlayheadSecCb = useCallback((): number => {
    const ctx = audioCtxRef.current;
    if (!isPlaying || !ctx) return pausePositionRef.current;
    const elapsed = ctx.currentTime - startTimeRef.current;
    // Con il loop A-B attivo l'AudioBufferSourceNode riavvolge da solo:
    // ripiega il tempo trascorso dentro la finestra di loop.
    if (loopA !== null && loopB !== null && loopB > loopA && elapsed > loopB) {
      return loopA + ((elapsed - loopA) % (loopB - loopA));
    }
    return elapsed;
  }, [isPlaying, loopA, loopB]);

  const getPlayheadSec = getPlayheadSecCb;

  function handleStop() {
    stopSource();
    pausePositionRef.current = 0;
    setIsPlaying(false);
    setPlayheadSec(0);
  }

  function handlePlay() {
    const ctx = audioCtxRef.current;
    const buf = audioBufferRef.current;
    if (!ctx || !buf) return;
    if (ctx.state === 'suspended') ctx.resume();
    stopSource();
    const src = ctx.createBufferSource();
    src.buffer = buf;
    if (loopA !== null && loopB !== null && loopB > loopA) {
      src.loop = true;
      src.loopStart = loopA;
      src.loopEnd = loopB;
    }
    src.connect(ctx.destination);
    const offset = Math.min(pausePositionRef.current, buf.duration);
    startTimeRef.current = ctx.currentTime - offset;
    src.start(0, offset);
    sourceRef.current = src;
    src.onended = () => {
      if (sourceRef.current === src) {
        pausePositionRef.current = 0;
        setIsPlaying(false);
        setPlayheadSec(0);
      }
    };
    setIsPlaying(true);
    const ctxCapture = ctx;
    const bufDuration = buf.duration;
    const loopActive = loopA !== null && loopB !== null && loopB > loopA;
    const la = loopA ?? 0;
    const lb = loopB ?? 0;
    let lastShown = -1;
    function tick() {
      let sec = ctxCapture.currentTime - startTimeRef.current;
      if (loopActive && sec > lb) sec = la + ((sec - la) % (lb - la));
      // Lo stato React alimenta transport e tabella: aggiornarlo a 60fps
      // ridisegnerebbe migliaia di righe — bastano ~8 aggiornamenti al secondo.
      if (Math.abs(sec - lastShown) > 0.12) {
        lastShown = sec;
        setPlayheadSec(Math.min(sec, bufDuration));
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    rafRef.current = requestAnimationFrame(tick);
  }

  function handlePause() {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    pausePositionRef.current = ctx.currentTime - startTimeRef.current;
    stopSource();
    setIsPlaying(false);
  }

  useLayoutEffect(() => {
    isPlayingRef.current       = isPlaying;
    handlePlayRef.current      = handlePlay;
    handlePauseRef.current     = handlePause;
    handleUndoRef.current      = handleUndo;
    handleRedoRef.current      = handleRedo;
    deleteSelectedRef.current  = () => {
      if (selectedIds.size > 0) handleDeleteNotesImpl([...selectedIds]);
    };
  });

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        handleUndoRef.current();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        handleRedoRef.current();
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedRef.current();
        return;
      }
      if (e.key === ' ') {
        e.preventDefault();
        if (isPlayingRef.current) handlePauseRef.current(); else handlePlayRef.current();
      }
      if (e.key === 'a' || e.key === 'A') {
        const ctx = audioCtxRef.current;
        if (ctx && isPlayingRef.current) setLoopA(ctx.currentTime - startTimeRef.current);
      }
      if (e.key === 'b' || e.key === 'B') {
        const ctx = audioCtxRef.current;
        if (ctx && isPlayingRef.current) setLoopB(ctx.currentTime - startTimeRef.current);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Stabile (useCallback []): le righe memoizzate della NoteTable la ricevono
  // come prop e non devono ri-renderizzare a ogni render del parent.
  const handleSelectNote = useCallback((id: string, addToSelection: boolean) => {
    setSelectedIds(prev => {
      const next = addToSelection ? new Set(prev) : new Set<string>();
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);
  function handleSeek(sec: number) {
    pausePositionRef.current = Math.max(0, Math.min(sec, audioBufferRef.current?.duration ?? 0));
    if (isPlaying) handlePlay();
    else setPlayheadSec(pausePositionRef.current);
  }
  function pushUndo(snapshot: NoteEvent[]) {
    setUndoStack(s => [...s.slice(-99), snapshot]);
    setRedoStack([]);
  }

  function handleEditNote(id: string, changes: Partial<Pick<NoteEvent, 'midi' | 'startSec' | 'durationSec'>>) {
    pushUndo(notes);
    const updated = notes.map(n => n.id === id ? { ...n, ...changes } : n);
    setNotes(updated);
    setChords(analyzeChords(updated));
    setHasUnsavedEdits(true);
  }

  function handleDeleteNotesImpl(ids: string[]) {
    pushUndo(notes);
    const updated = notes.filter(n => !ids.includes(n.id));
    setNotes(updated);
    setChords(analyzeChords(updated));
    setSelectedIds(new Set());
    setHasUnsavedEdits(true);
  }

  function handleDeleteNotes(ids: string[]) {
    handleDeleteNotesImpl(ids);
  }

  function handleCreateNote(note: Omit<NoteEvent, 'id' | 'chordId' | 'startBeat' | 'durationBeats' | 'velocity'>) {
    const newNote: NoteEvent = {
      ...note,
      id: Math.random().toString(36).slice(2),
      velocity: 0.7,
    };
    pushUndo(notes);
    const updated = [...notes, newNote].sort((a, b) => a.startSec - b.startSec);
    setNotes(updated);
    setChords(analyzeChords(updated));
    setHasUnsavedEdits(true);
  }

  function handleUndo() {
    if (!undoStack.length) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack(s => s.slice(0, -1));
    setRedoStack(r => [notes, ...r]);
    setNotes(prev);
    setChords(analyzeChords(prev));
  }

  function handleRedo() {
    if (!redoStack.length) return;
    const next = redoStack[0];
    setRedoStack(s => s.slice(1));
    setUndoStack(u => [...u, notes]);
    setNotes(next);
    setChords(analyzeChords(next));
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 58px)', display: 'flex', flexDirection: 'column', background: '#0d1117' }}>
      <style>{ROLL_CSS}</style>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        style={{ display: 'none' }}
        onChange={handleFileInput}
      />

      {/* ── Toolbar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
        padding: '10px 16px',
        borderBottom: '1px solid #21262d',
        background: '#161b22',
      }}>
        {/* Upload button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          style={btnStyle('#30363d', '#8b949e')}
        >
          <Upload size={16} /> Upload audio
        </button>

        {/* File chip */}
        {fileName && (
          <span style={{ fontSize: 13, color: '#8b949e', background: '#21262d', borderRadius: 6, padding: '4px 10px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {fileName}
          </span>
        )}

        {/* Instrument pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {INSTRUMENTS.map(ins => (
            <button
              key={ins.id}
              disabled={appState === 'analyzing' || appState === 'loading'}
              aria-pressed={instrument === ins.id}
              onClick={() => setInstrument(ins.id)}
              style={btnStyle(
                instrument === ins.id ? '#7c3aed' : '#21262d',
                instrument === ins.id ? '#e6edf3' : '#8b949e',
              )}
            >
              {ins.label}
            </button>
          ))}
        </div>

        {instrument === 'winds-section' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#8b949e' }}>Max voices</span>
            <select
              aria-label="Maximum voices"
              disabled={appState === 'analyzing' || appState === 'loading'}
              value={voiceCount}
              onChange={e => setVoiceCount(Number(e.target.value))}
              style={{
                background: '#21262d', color: '#e6edf3',
                border: '1px solid #30363d', borderRadius: 8,
                padding: '5px 10px', fontSize: 13,
                fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
              }}
            >
              {[2, 3, 4, 5, 6].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        )}

        {INSTRUMENT_CONFIG[instrument].poly && (
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8b949e' }}>
            Detection
            <select value={sensitivity} disabled={appState === 'analyzing' || appState === 'loading'}
              onChange={e => setSensitivity(e.target.value as DetectionSensitivity)}
              style={{ background: '#21262d', color: '#e6edf3', border: '1px solid #30363d', borderRadius: 6, padding: '6px 8px' }}>
              <option value="precise">Precise</option>
              <option value="balanced">Balanced</option>
              <option value="sensitive">Sensitive</option>
            </select>
          </label>
        )}

        <div style={{ flex: 1 }} />

        {/* Analyze button */}
        <button
          onClick={() => runAnalysis()}
          disabled={!canAnalyze}
          style={btnStyle(canAnalyze ? '#7c3aed' : '#21262d', canAnalyze ? '#fff' : '#4b5563')}
        >
          <Search size={16} /> {appState === 'loading' ? 'Loading...' : appState === 'analyzing' ? 'Analyzing...' : 'Analyze'}
        </button>
        {appState === 'analyzing' && (
          <button onClick={() => { analysisAbortRef.current?.abort(); setAppState('loaded'); }}
            style={btnStyle('#21262d', '#e6edf3')}><Square size={14} /> Cancel</button>
        )}

        {/* BPM display / edit */}
        {result !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#6b7280' }}>BPM</span>
            <input
              value={editedBpm}
              onChange={e => setEditedBpm(e.target.value)}
              onFocus={() => setBpmEditActive(true)}
              onBlur={() => {
                setBpmEditActive(false);
                const parsed = parseFloat(editedBpm);
                if (!isNaN(parsed) && parsed > 0 && tempoRef.current) {
                  tempoRef.current = { bpm: parsed, beatOffsetSec: tempoRef.current.beatOffsetSec };
                  const updated = notes.map(n => ({ ...n }));
                  quantizeNotes(updated, parsed, tempoRef.current.beatOffsetSec);
                  const updatedChords = analyzeChords(updated);
                  setNotes(updated);
                  setChords(updatedChords);
                  setHasUnsavedEdits(true);
                  setResult(r => r ? { ...r, bpm: parsed } : r);
                }
              }}
              onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
              style={{
                width: 64, background: bpmEditActive ? '#1c2128' : '#0d1117',
                border: '1px solid #30363d', borderRadius: 6,
                color: '#e6edf3', fontSize: 13, padding: '3px 8px',
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
          </div>
        )}

        {/* Rianalizza */}
        {appState === 'ready' && (
          <button onClick={() => runAnalysis()} style={btnStyle('#21262d', '#8b949e')}>
            <RotateCcw size={16} /> Reanalyze
          </button>
        )}

        {/* Key display */}
        {result?.key && (
          <span style={{ fontSize: 13, color: '#c4b5fd', fontWeight: 600 }}>
            {result.key}
          </span>
        )}
      </div>
      <div role="status" style={{ padding: '8px 16px', fontSize: 12, color: '#8b949e', borderBottom: '1px solid #21262d' }}>
        {appState === 'loading' ? 'Decoding audio file...'
          : appState === 'analyzing'
          ? (analysisProgress < 0.03 && INSTRUMENT_CONFIG[instrument].poly ? 'Loading transcription model...' : 'Analyzing audio locally...')
          : result ? `${notes.length} notes · ${chords.length} chord regions · ${result.engine === 'basic-pitch' ? 'Basic Pitch' : 'Monophonic'} · 4/4 grid (assumed)`
          : 'Audio stays on your device. For best results, use an isolated instrument track.'}
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>

        {/* Idle: dropzone */}
        {(appState === 'idle' || appState === 'error') && (
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? '#7c3aed' : '#30363d'}`,
              borderRadius: 8, padding: '48px 24px', maxWidth: '100%', boxSizing: 'border-box',
              textAlign: 'center', cursor: 'pointer',
              background: dragging ? 'rgba(124,58,237,0.05)' : 'transparent',
              transition: 'all 0.2s',
            }}
          >
            <Music2 size={40} style={{ marginBottom: 16 }} />
            <div style={{ fontSize: 18, fontWeight: 700, color: '#e6edf3', marginBottom: 8, fontFamily: "'Syne', sans-serif" }}>
              Upload an audio track
            </div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>
              WAV · MP3 · OGG · M4A/AAC · FLAC
            </div>
            {errorMsg && (
              <div style={{ marginTop: 16, padding: '10px 16px', background: '#450a0a', border: '1px solid #7f1d1d', borderRadius: 8, fontSize: 13, color: '#fca5a5' }}>
                {errorMsg}
              </div>
            )}
          </div>
        )}

        {/* Loaded / ready / analyzing: split layout placeholder */}
        {(appState === 'loading' || appState === 'loaded' || appState === 'analyzing' || appState === 'ready') && (
          <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 16px 0' }}>
            {(appState === 'loading' || appState === 'analyzing') && (
              <div style={{ height: 3, background: '#21262d', margin: '0 16px' }}>
                <div style={{ height: '100%', width: `${appState === 'loading' ? 24 : Math.round(analysisProgress * 100)}%`, background: '#7c3aed', transition: 'width 0.1s' }} />
              </div>
            )}
            <div className="at-split">
              {/* Piano roll */}
              <div className="at-roll-pane">
                {/* Edit mode toggle */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
                  <button
                    onClick={() => setEditMode(m => !m)}
                    style={btnStyle(editMode ? '#7c3aed' : '#21262d', editMode ? '#fff' : '#8b949e')}
                  >
                    <Pencil size={14} /> {editMode ? 'Editing' : 'Edit'}
                  </button>
                  {editMode && (
                    <>
                      <button
                        onClick={handleUndo}
                        disabled={!undoStack.length}
                        style={btnStyle('#21262d', undoStack.length ? '#8b949e' : '#4b5563')}
                        title="Undo (⌘Z)"
                      aria-label="Undo"><Undo2 size={16} /></button>
                      <button
                        onClick={handleRedo}
                        disabled={!redoStack.length}
                        style={btnStyle('#21262d', redoStack.length ? '#8b949e' : '#4b5563')}
                        title="Redo (⌘⇧Z)"
                      aria-label="Redo"><Redo2 size={16} /></button>
                    </>
                  )}
                </div>
                <div style={{ flex: 1, minHeight: 0 }}>
                  <PianoRoll
                    notes={notes}
                    chords={chords}
                    bpm={result?.bpm ?? null}
                    duration={audioBufferRef.current?.duration ?? 0}
                    selectedIds={selectedIds}
                    isPlaying={isPlaying}
                    getPlayheadSec={getPlayheadSec}
                    onSelectNote={handleSelectNote}
                    onSeek={handleSeek}
                    editMode={editMode}
                    onEditNote={handleEditNote}
                    onDeleteNotes={handleDeleteNotes}
                    onCreateNote={handleCreateNote}
                  />
                </div>
              </div>
              {/* Note table */}
              <div className="at-table-pane">
                <NoteTable
                  notes={notes}
                  chords={chords}
                  selectedIds={selectedIds}
                  onSelectNote={handleSelectNote}
                  playheadSec={playheadSec}
                  isPlaying={isPlaying}
                />
              </div>
            </div>
            <TransportBar
              isPlaying={isPlaying}
              playheadSec={playheadSec}
              duration={audioBufferRef.current?.duration ?? 0}
              loopA={loopA}
              loopB={loopB}
              disabled={appState !== 'ready'}
              onPlay={handlePlay}
              onPause={handlePause}
              onStop={handleStop}
              onClearLoop={() => { setLoopA(null); setLoopB(null); }}
            />
          </div>
        )}
      </div>

      {/* ExportBar always visible at bottom */}
      <ExportBar
        appState={appState}
        progress={analysisProgress}
        fileName={fileName}
        hasNotes={notes.length > 0}
      />

    </div>
  );
}

function btnStyle(bg: string, color: string): React.CSSProperties {
  return {
    background: bg, color, border: 'none', borderRadius: 8,
    padding: '6px 14px', fontSize: 13, fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif", cursor: 'pointer',
    transition: 'opacity 0.15s', whiteSpace: 'nowrap',
    display: 'inline-flex', alignItems: 'center', gap: 6,
  };
}
