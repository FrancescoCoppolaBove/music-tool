import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Music, ChevronRight, AlertCircle } from 'lucide-react';
import { detectNotes, matchChords, NoteSmoothing, type DetectedNote, type ChordMatch } from './pitchDetector';

const CSS = `
  .cd-container { max-width: 600px; margin: 0 auto; }

  .cd-header { text-align: center; margin-bottom: 28px; }
  .cd-title { font-size: 28px; font-weight: 800; color: #e6edf3; margin: 0 0 6px; letter-spacing: -0.5px; }
  .cd-subtitle { font-size: 14px; color: #6b7280; }

  .cd-mic-btn {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    width: 100px; height: 100px; border-radius: 50%; margin: 0 auto 24px;
    border: 2px solid #30363d; background: #161b22; cursor: pointer;
    transition: all 0.25s; gap: 4px;
    font-family: 'DM Sans', sans-serif; color: #8b949e; font-size: 11px; font-weight: 600;
  }
  .cd-mic-btn:hover { border-color: #7c3aed60; background: #7c3aed10; color: #c4b5fd; }
  .cd-mic-btn.listening {
    border-color: #7c3aed; background: #7c3aed18;
    box-shadow: 0 0 0 8px #7c3aed18, 0 0 0 16px #7c3aed08;
    animation: cd-pulse 2s ease infinite; color: #c4b5fd;
  }
  @keyframes cd-pulse {
    0%, 100% { box-shadow: 0 0 0 8px #7c3aed18, 0 0 0 16px #7c3aed08; }
    50%       { box-shadow: 0 0 0 12px #7c3aed22, 0 0 0 22px #7c3aed06; }
  }

  .cd-level {
    height: 4px; border-radius: 2px; background: #21262d; margin-bottom: 24px;
    overflow: hidden;
  }
  .cd-level-bar {
    height: 100%; border-radius: 2px;
    background: linear-gradient(90deg, #7c3aed, #a855f7);
    transition: width 0.08s;
  }

  .cd-notes-card {
    background: #161b22; border: 1px solid #21262d; border-radius: 16px;
    padding: 20px 24px; margin-bottom: 16px;
  }
  .cd-notes-label {
    font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; color: #4b5563; margin-bottom: 14px;
  }
  .cd-notes-row {
    display: flex; gap: 10px; flex-wrap: wrap; min-height: 40px;
    align-items: center;
  }
  .cd-note-pill {
    padding: 6px 14px; border-radius: 100px;
    background: #7c3aed22; border: 1px solid #7c3aed60;
    color: #c4b5fd; font-size: 14px; font-weight: 700;
    font-family: 'DM Sans', sans-serif;
    animation: cd-pop 0.15s ease;
  }
  @keyframes cd-pop { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .cd-notes-empty { font-size: 13px; color: #374151; }

  .cd-matches-card {
    background: #161b22; border: 1px solid #21262d; border-radius: 16px;
    padding: 20px 24px; margin-bottom: 16px;
  }
  .cd-match {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 0; border-bottom: 1px solid #21262d;
  }
  .cd-match:last-child { border-bottom: none; padding-bottom: 0; }
  .cd-match-confidence {
    width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 800; background: #21262d; color: #6b7280;
  }
  .cd-match-confidence.high { background: #7c3aed22; color: #a78bfa; }
  .cd-match-symbol {
    font-size: 18px; font-weight: 800; color: #e6edf3; flex: 1;
  }
  .cd-match-type { font-size: 12px; color: #4b5563; }
  .cd-analyze-btn {
    display: flex; align-items: center; gap: 4px;
    padding: 6px 12px; border-radius: 8px;
    border: 1px solid #30363d; background: none;
    color: #8b949e; font-size: 12px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer;
    transition: all 0.12s; flex-shrink: 0;
  }
  .cd-analyze-btn:hover { border-color: #7c3aed60; color: #c4b5fd; background: #7c3aed10; }

  .cd-error {
    display: flex; align-items: center; gap: 10px; padding: 14px 16px;
    background: #ef444412; border: 1px solid #ef444430; border-radius: 10px;
    font-size: 13px; color: #f87171; margin-bottom: 16px;
  }
  .cd-tip {
    text-align: center; font-size: 12px; color: #374151; margin-top: 8px;
    line-height: 1.6;
  }
`;

interface Props {
  onNavigateToScaleAdvisor?: (root: string, quality: string) => void;
}

const QUALITY_MAP: Record<string, string> = {
  'Major': 'maj7', 'Minor': 'm7', 'Dominant 7th': '7', 'Major 7th': 'maj7',
  'Minor 7th': 'm7', 'Diminished': 'dim7', 'Augmented': 'aug', 'Half-dim 7th': 'm7b5',
  'Sus2': 'sus2', 'Sus4': 'sus4', 'Major 6th': '6', 'Minor 6th': 'm6',
};

export default function ChordDetectionFeature({ onNavigateToScaleAdvisor }: Props) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const [level, setLevel] = useState(0);
  const [notes, setNotes] = useState<DetectedNote[]>([]);
  const [matches, setMatches] = useState<ChordMatch[]>([]);

  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number>(0);
  const smoothing = useRef(new NoteSmoothing(5));

  const analyze = useCallback(() => {
    const analyser = analyserRef.current;
    const ctx = contextRef.current;
    if (!analyser || !ctx) return;

    const freqData = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(freqData);

    // Level meter: RMS of top third of spectrum
    const slice = freqData.slice(0, Math.floor(freqData.length / 3));
    const rms = Math.sqrt(slice.reduce((s, v) => s + v * v, 0) / slice.length);
    setLevel(Math.min(100, rms * 1.5));

    // Detect notes from this frame
    const frameNotes = detectNotes(freqData, ctx.sampleRate, analyser.fftSize);
    smoothing.current.add(frameNotes);

    // Stable pitch classes from rolling window
    const stablePC = smoothing.current.getStable();
    const stableNotes = frameNotes.filter(n => stablePC.has(n.pitchClass));

    setNotes(stableNotes.slice(0, 5));
    setMatches(matchChords(stableNotes));

    rafRef.current = requestAnimationFrame(analyze);
  }, []);

  const startListening = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      streamRef.current = stream;

      const ctx = new AudioContext();
      contextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 8192;
      analyser.smoothingTimeConstant = 0.6;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      smoothing.current = new NoteSmoothing(5);
      setListening(true);
      rafRef.current = requestAnimationFrame(analyze);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Permission') || msg.includes('denied')) {
        setError('Microphone access denied. Allow microphone access and try again.');
      } else if (msg.includes('NotFound') || msg.includes('DevicesNotFound')) {
        setError('No microphone found. Connect a microphone and try again.');
      } else {
        setError(`Could not access microphone: ${msg}`);
      }
    }
  }, [analyze]);

  const stopListening = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    contextRef.current?.close();
    streamRef.current = null;
    contextRef.current = null;
    analyserRef.current = null;
    setListening(false);
    setLevel(0);
    setNotes([]);
    setMatches([]);
  }, []);

  // Clean up on unmount
  useEffect(() => () => { stopListening(); }, [stopListening]);

  return (
    <div className="cd-container">
      <style>{CSS}</style>

      <div className="cd-header">
        <h2 className="cd-title">Chord Detection</h2>
        <p className="cd-subtitle">Play a chord — the app identifies it in real time</p>
      </div>

      {error && (
        <div className="cd-error">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Mic button */}
      <button
        className={`cd-mic-btn${listening ? ' listening' : ''}`}
        onClick={listening ? stopListening : startListening}
      >
        {listening ? <MicOff size={28} /> : <Mic size={28} />}
        {listening ? 'Stop' : 'Listen'}
      </button>

      {/* Level meter */}
      {listening && (
        <div className="cd-level">
          <div className="cd-level-bar" style={{ width: `${level}%` }} />
        </div>
      )}

      {/* Detected notes */}
      <div className="cd-notes-card">
        <div className="cd-notes-label">Detected notes</div>
        <div className="cd-notes-row">
          {notes.length > 0
            ? notes.map(n => (
                <span key={n.pitchClass} className="cd-note-pill">
                  {n.name}
                </span>
              ))
            : (
                <span className="cd-notes-empty">
                  {listening ? 'Play something…' : 'Press Listen to start'}
                </span>
              )
          }
        </div>
      </div>

      {/* Chord matches */}
      {matches.length > 0 && (
        <div className="cd-matches-card">
          <div className="cd-notes-label">Chord matches</div>
          {matches.map((m, i) => (
            <div key={`${m.root}-${m.type}`} className="cd-match">
              <div className={`cd-match-confidence${i === 0 ? ' high' : ''}`}>
                {Math.round(m.confidence * 100)}%
              </div>
              <div style={{ flex: 1 }}>
                <div className="cd-match-symbol">{m.symbol}</div>
                <div className="cd-match-type">{m.type}</div>
              </div>
              {onNavigateToScaleAdvisor && (
                <button
                  className="cd-analyze-btn"
                  onClick={() => onNavigateToScaleAdvisor(m.root, QUALITY_MAP[m.type] ?? 'maj7')}
                >
                  Scales <ChevronRight size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!listening && notes.length === 0 && (
        <p className="cd-tip">
          Works best with piano or guitar. Play a clear chord,<br />
          let it ring, and the app will identify it.
        </p>
      )}

      {listening && matches.length === 0 && notes.length > 0 && (
        <p className="cd-tip">Keep holding the chord — needs a moment to stabilize</p>
      )}

      {!listening && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginTop: 16 }}>
          <Music size={14} style={{ color: '#374151' }} />
          <span style={{ fontSize: 12, color: '#374151' }}>
            Works with piano, guitar, voice, or any instrument
          </span>
        </div>
      )}
    </div>
  );
}
