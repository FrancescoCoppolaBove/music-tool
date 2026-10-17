import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import type { InstrumentKind, NoteEvent, ChordEvent, TranscriptionResult } from './types';
import { analyzeAudio } from './engine/workerClient';
import { quantizeNotes } from './engine/quantizer';
import { analyzeChords } from './engine/chordAnalyzer';
import ExportBar from './components/ExportBar';
import NoteTable from './components/NoteTable';
import PianoRoll from './components/PianoRoll';
import TransportBar from './components/TransportBar';

const ROLL_CSS = `
  .at-split { display: flex; gap: 12px; flex: 1; min-height: 400px; }
  @media (max-width: 768px) {
    .at-split { flex-direction: column; }
  }
`;

type AppState = 'idle' | 'loaded' | 'analyzing' | 'ready' | 'error';

const INSTRUMENTS: { id: InstrumentKind; label: string; icon: string }[] = [
  { id: 'keyboard', label: 'Tastiera', icon: '🎹' },
  { id: 'bass',     label: 'Basso',    icon: '🎸' },
  { id: 'guitar',   label: 'Chitarra', icon: '🪕' },
  { id: 'voice',    label: 'Voce',     icon: '🎤' },
  { id: 'winds',    label: 'Fiati',    icon: '🎺' },
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
      stopSource();
      audioCtxRef.current?.close();
    };
  }, []);

  async function decodeFile(file: File) {
    if (hasUnsavedEdits && appState === 'ready') {
      if (!window.confirm('Ci sono modifiche non esportate. Caricare un nuovo file le perderà. Continuare?')) return;
    }
    audioCtxRef.current?.close();
    const ctx = new AudioContext();
    audioCtxRef.current = ctx;

    setErrorMsg(null);
    setAppState('loaded');
    setFileName(file.name.replace(/\.[^.]+$/, ''));
    setResult(null);
    setNotes([]);
    setChords([]);
    setSelectedIds(new Set());
    setHasUnsavedEdits(false);
    audioBufferRef.current = null;

    if (file.size > LARGE_FILE_BYTES) {
      if (!window.confirm(`Il file è grande (${(file.size / 1024 / 1024).toFixed(0)} MB). L'analisi potrebbe essere lenta. Continuare?`)) {
        setAppState('idle');
        return;
      }
    }

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      if (audioBuffer.duration > LARGE_DURATION_SEC) {
        if (!window.confirm(`La traccia dura ${(audioBuffer.duration / 60).toFixed(0)} min. Continuare?`)) {
          setAppState('idle');
          return;
        }
      }

      audioBufferRef.current = audioBuffer;
      setAppState('loaded');
    } catch {
      setErrorMsg('Impossibile decodificare il file. Formati supportati: WAV, MP3, OGG, M4A/AAC, FLAC.');
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
    setAppState('analyzing');
    setProgress(0);
    setSelectedIds(new Set());
    try {
      const signal = downmixToMono(buf);
      const res = await analyzeAudio(signal, buf.sampleRate, instrument, setProgress);
      if (res.notes.length === 0) {
        setErrorMsg('Nessuna nota rilevata. Prova a selezionare un altro strumento o verificare il file audio.');
        setAppState('error');
        return;
      }
      tempoRef.current = res.bpm !== null
        ? { bpm: res.bpm, beatOffsetSec: 0 }
        : null;
      setEditedBpm(res.bpm !== null ? res.bpm.toFixed(1) : '');
      setResult(res);
      setNotes([...res.notes]);
      setChords([...res.chords]);
      setHasUnsavedEdits(false);
      setAppState('ready');
    } catch (err) {
      setErrorMsg(`Errore durante l'analisi: ${err instanceof Error ? err.message : String(err)}`);
      setAppState('error');
    }
  }, [instrument]);

  const canAnalyze = appState === 'loaded' || appState === 'ready';

  const getPlayheadSecCb = useCallback((): number => {
    const ctx = audioCtxRef.current;
    if (!isPlaying || !ctx) return pausePositionRef.current;
    return ctx.currentTime - startTimeRef.current;
  }, [isPlaying]);

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
    function tick() {
      const sec = ctxCapture.currentTime - startTimeRef.current;
      setPlayheadSec(Math.min(sec, bufDuration));
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

  function handleSelectNote(id: string, addToSelection: boolean) {
    setSelectedIds(prev => {
      const next = addToSelection ? new Set(prev) : new Set<string>();
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
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
    setNotes(prev => {
      pushUndo(prev);
      const updated = prev.map(n => n.id === id ? { ...n, ...changes } : n);
      setChords(analyzeChords(updated));
      setHasUnsavedEdits(true);
      return updated;
    });
  }

  function handleDeleteNotesImpl(ids: string[]) {
    setNotes(prev => {
      pushUndo(prev);
      const updated = prev.filter(n => !ids.includes(n.id));
      setChords(analyzeChords(updated));
      setSelectedIds(new Set());
      setHasUnsavedEdits(true);
      return updated;
    });
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
    setNotes(prev => {
      pushUndo(prev);
      const updated = [...prev, newNote].sort((a, b) => a.startSec - b.startSec);
      setChords(analyzeChords(updated));
      setHasUnsavedEdits(true);
      return updated;
    });
  }

  function handleUndo() {
    setUndoStack(s => {
      if (!s.length) return s;
      const prev = s[s.length - 1];
      const next = s.slice(0, -1);
      setNotes(current => {
        setRedoStack(r => [current, ...r]);
        setChords(analyzeChords(prev));
        return prev;
      });
      return next;
    });
  }

  function handleRedo() {
    setRedoStack(s => {
      if (!s.length) return s;
      const next = s[0];
      const rest = s.slice(1);
      setNotes(current => {
        setUndoStack(u => [...u, current]);
        setChords(analyzeChords(next));
        return next;
      });
      return rest;
    });
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
          📂 Carica file
        </button>

        {/* File chip */}
        {fileName && (
          <span style={{ fontSize: 13, color: '#8b949e', background: '#21262d', borderRadius: 6, padding: '4px 10px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            🎵 {fileName}
          </span>
        )}

        {/* Instrument pills */}
        <div style={{ display: 'flex', gap: 6 }}>
          {INSTRUMENTS.map(ins => (
            <button
              key={ins.id}
              onClick={() => setInstrument(ins.id)}
              style={btnStyle(
                instrument === ins.id ? '#7c3aed' : '#21262d',
                instrument === ins.id ? '#e6edf3' : '#8b949e',
              )}
            >
              {ins.icon} {ins.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Analyze button */}
        <button
          onClick={() => runAnalysis()}
          disabled={!canAnalyze}
          style={btnStyle(canAnalyze ? '#7c3aed' : '#21262d', canAnalyze ? '#fff' : '#4b5563')}
        >
          {appState === 'analyzing' ? '⏳ Analisi…' : '🔍 Analizza'}
        </button>

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
            🔄 Rianalizza
          </button>
        )}

        {/* Key display */}
        {result?.key && (
          <span style={{ fontSize: 13, color: '#c4b5fd', fontWeight: 600 }}>
            🎵 {result.key}
          </span>
        )}
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
              borderRadius: 16, padding: '60px 80px',
              textAlign: 'center', cursor: 'pointer',
              background: dragging ? 'rgba(124,58,237,0.05)' : 'transparent',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>🎵</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#e6edf3', marginBottom: 8, fontFamily: "'Syne', sans-serif" }}>
              Carica una traccia audio
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
        {(appState === 'loaded' || appState === 'analyzing' || appState === 'ready') && (
          <div style={{ width: '100%', flex: 1, display: 'flex', flexDirection: 'column', padding: '16px 16px 0' }}>
            {appState === 'analyzing' && (
              <div style={{ height: 3, background: '#21262d', margin: '0 16px' }}>
                <div style={{ height: '100%', width: `${Math.round(analysisProgress * 100)}%`, background: '#7c3aed', transition: 'width 0.1s' }} />
              </div>
            )}
            <div className="at-split">
              {/* Piano roll */}
              <div style={{ flex: 3, display: 'flex', flexDirection: 'column', minHeight: 400 }}>
                {/* Edit mode toggle */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 6 }}>
                  <button
                    onClick={() => setEditMode(m => !m)}
                    style={btnStyle(editMode ? '#7c3aed' : '#21262d', editMode ? '#fff' : '#8b949e')}
                  >
                    ✏️ {editMode ? 'Modifica attiva' : 'Modifica'}
                  </button>
                  {editMode && (
                    <>
                      <button
                        onClick={handleUndo}
                        disabled={!undoStack.length}
                        style={btnStyle('#21262d', undoStack.length ? '#8b949e' : '#4b5563')}
                        title="Undo (⌘Z)"
                      >↩</button>
                      <button
                        onClick={handleRedo}
                        disabled={!redoStack.length}
                        style={btnStyle('#21262d', redoStack.length ? '#8b949e' : '#4b5563')}
                        title="Redo (⌘⇧Z)"
                      >↪</button>
                    </>
                  )}
                </div>
                <div style={{ flex: 1 }}>
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
              <div style={{
                flex: 2, background: '#161b22', border: '1px solid #21262d',
                borderRadius: 12, overflow: 'hidden', minHeight: 400,
              }}>
                <NoteTable
                  notes={notes}
                  chords={chords}
                  selectedIds={selectedIds}
                  onSelectNote={handleSelectNote}
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
  };
}
