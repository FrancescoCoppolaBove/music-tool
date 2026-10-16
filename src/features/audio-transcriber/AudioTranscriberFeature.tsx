import { useState, useRef, useCallback, useEffect } from 'react';
import type { InstrumentKind, NoteEvent, ChordEvent, TranscriptionResult } from './types';
import { analyzeAudio } from './engine/workerClient';
import { quantizeNotes } from './engine/quantizer';
import { analyzeChords } from './engine/chordAnalyzer';

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
  const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false);

  const audioCtxRef    = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    return () => { audioCtxRef.current?.close(); };
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

  return (
    <div style={{ minHeight: 'calc(100vh - 58px)', display: 'flex', flexDirection: 'column', background: '#0d1117' }}>

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
            <div style={{ flex: 1, display: 'flex', gap: 12, minHeight: 400 }}>
              {/* Piano roll placeholder */}
              <div style={{ flex: 3, background: '#161b22', border: '1px solid #21262d', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563', fontSize: 14 }}>
                {appState === 'loaded' ? 'Clicca Analizza per avviare la trascrizione' : appState === 'analyzing' ? `Analisi… ${Math.round(analysisProgress * 100)}%` : 'Piano roll — Task 5'}
              </div>
              {/* Note table placeholder */}
              <div style={{ flex: 2, background: '#161b22', border: '1px solid #21262d', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4b5563', fontSize: 14 }}>
                Note table — Task 8
              </div>
            </div>
          </div>
        )}
      </div>

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
