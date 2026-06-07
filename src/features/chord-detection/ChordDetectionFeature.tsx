import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, ChevronRight, AlertCircle, Lock } from 'lucide-react';
import {
  ChordEngine,
  toGlobalKeyName,
  NOTE_NAMES,
  type AnalysisResult,
  type ChordMatch,
} from './pitchDetector';

const FFT_SIZE = 16384;        // ~341ms window @48k — strong low-end resolution
const ANALYZE_INTERVAL = 33;   // ms between frames (~30fps)

const WHITE_KEYS = [0, 2, 4, 5, 7, 9, 11];
// Black keys are centered on the boundary between two white keys.
// Boundary i sits at i/7 of the width; the key (9% wide) is offset back by half its width.
const BLACK_KEYS = [
  { pc: 1, left: 100 / 7 * 1 - 4.5 },  // C# (C|D)
  { pc: 3, left: 100 / 7 * 2 - 4.5 },  // D# (D|E)
  { pc: 6, left: 100 / 7 * 4 - 4.5 },  // F# (F|G)
  { pc: 8, left: 100 / 7 * 5 - 4.5 },  // G# (G|A)
  { pc: 10, left: 100 / 7 * 6 - 4.5 }, // A# (A|B)
];

const CSS = `
  .cd-container { max-width: 620px; margin: 0 auto; }

  .cd-header { text-align: center; margin-bottom: 24px; }
  .cd-title { font-size: 28px; font-weight: 800; color: #e6edf3; margin: 0 0 6px; letter-spacing: -0.5px; }
  .cd-subtitle { font-size: 14px; color: #6b7280; }

  .cd-mic-btn {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    width: 96px; height: 96px; border-radius: 50%; margin: 0 auto 20px;
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

  .cd-level { height: 4px; border-radius: 2px; background: #21262d; margin-bottom: 22px; overflow: hidden; }
  .cd-level-bar { height: 100%; border-radius: 2px; background: linear-gradient(90deg, #7c3aed, #a855f7); transition: width 0.08s; }

  /* Primary chord card */
  .cd-primary {
    background: linear-gradient(160deg, #1a1430, #161b22);
    border: 1px solid #7c3aed40; border-radius: 18px;
    padding: 22px 24px; margin-bottom: 16px;
    display: flex; align-items: center; gap: 20px;
    animation: cd-fade 0.2s ease;
  }
  @keyframes cd-fade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  .cd-ring {
    width: 64px; height: 64px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 800; color: #c4b5fd;
    background: #0d1117;
  }
  .cd-primary-main { flex: 1; min-width: 0; }
  .cd-primary-symbol {
    font-size: 38px; font-weight: 800; color: #fff; line-height: 1.05;
    letter-spacing: -1px; word-break: break-word;
  }
  .cd-primary-type { font-size: 13px; color: #a78bfa; margin-top: 2px; font-weight: 600; }
  .cd-primary-meta { display: flex; align-items: center; gap: 12px; margin-top: 8px; flex-wrap: wrap; }
  .cd-bass { font-size: 12px; color: #6b7280; }
  .cd-bass b { color: #8b949e; font-weight: 700; }
  .cd-locked {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
    color: #34d399; background: #34d39915; border: 1px solid #34d39930;
    padding: 2px 8px; border-radius: 100px;
  }
  .cd-scales-btn {
    display: flex; align-items: center; gap: 4px; flex-shrink: 0;
    padding: 8px 14px; border-radius: 9px;
    border: 1px solid #7c3aed60; background: #7c3aed18;
    color: #c4b5fd; font-size: 13px; font-weight: 700;
    font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.12s;
  }
  .cd-scales-btn:hover { background: #7c3aed30; border-color: #7c3aed; }

  /* Single-note / interval banner */
  .cd-single {
    background: #161b22; border: 1px solid #21262d; border-radius: 16px;
    padding: 18px 24px; margin-bottom: 16px; text-align: center;
  }
  .cd-single-big { font-size: 26px; font-weight: 800; color: #e6edf3; }
  .cd-single-sub { font-size: 12px; color: #6b7280; margin-top: 4px; }

  /* Piano keyboard */
  .cd-piano-card {
    background: #161b22; border: 1px solid #21262d; border-radius: 16px;
    padding: 18px; margin-bottom: 16px;
  }
  .cd-piano { position: relative; height: 116px; display: flex; gap: 3px; }
  .cd-wkey {
    flex: 1; border-radius: 0 0 5px 5px; background: #20262e;
    border: 1px solid #2b333d; border-top: none;
    display: flex; align-items: flex-end; justify-content: center;
    padding-bottom: 7px; font-size: 10px; font-weight: 700; color: #3a434f;
    position: relative; transition: background 0.1s, color 0.1s;
  }
  .cd-bkey {
    position: absolute; top: 0; width: 9%; height: 64%;
    background: #0b0e13; border: 1px solid #000; border-radius: 0 0 4px 4px;
    display: flex; align-items: flex-end; justify-content: center;
    padding-bottom: 5px; font-size: 8px; font-weight: 700; color: #2b333d;
    z-index: 2; transition: background 0.1s, color 0.1s;
  }
  .cd-key-dot {
    position: absolute; top: 6px; left: 50%; transform: translateX(-50%);
    width: 6px; height: 6px; border-radius: 50%; background: #34d399;
  }

  /* Detected notes + alternatives */
  .cd-notes-card, .cd-matches-card {
    background: #161b22; border: 1px solid #21262d; border-radius: 16px;
    padding: 18px 22px; margin-bottom: 16px;
  }
  .cd-label {
    font-size: 11px; font-weight: 700; letter-spacing: 0.08em;
    text-transform: uppercase; color: #4b5563; margin-bottom: 12px;
  }
  .cd-notes-row { display: flex; gap: 8px; flex-wrap: wrap; min-height: 32px; align-items: center; }
  .cd-note-pill {
    padding: 5px 12px; border-radius: 100px;
    background: #7c3aed22; border: 1px solid #7c3aed60;
    color: #c4b5fd; font-size: 13px; font-weight: 700; font-family: 'DM Sans', sans-serif;
  }
  .cd-notes-empty { font-size: 13px; color: #374151; }

  .cd-match {
    display: flex; align-items: center; gap: 12px;
    padding: 11px 0; border-bottom: 1px solid #21262d;
  }
  .cd-match:last-child { border-bottom: none; padding-bottom: 0; }
  .cd-match-pct {
    width: 38px; text-align: right; flex-shrink: 0;
    font-size: 12px; font-weight: 800; color: #6b7280;
  }
  .cd-match-symbol { font-size: 17px; font-weight: 800; color: #e6edf3; }
  .cd-match-type { font-size: 11px; color: #4b5563; }
  .cd-match-scales {
    margin-left: auto; flex-shrink: 0;
    display: flex; align-items: center; gap: 2px;
    padding: 5px 10px; border-radius: 8px; border: 1px solid #30363d; background: none;
    color: #8b949e; font-size: 11px; font-weight: 600; font-family: 'DM Sans', sans-serif;
    cursor: pointer; transition: all 0.12s;
  }
  .cd-match-scales:hover { border-color: #7c3aed60; color: #c4b5fd; background: #7c3aed10; }

  .cd-error {
    display: flex; align-items: center; gap: 10px; padding: 14px 16px;
    background: #ef444412; border: 1px solid #ef444430; border-radius: 10px;
    font-size: 13px; color: #f87171; margin-bottom: 16px;
  }
  .cd-tip { text-align: center; font-size: 12px; color: #374151; margin-top: 12px; line-height: 1.6; }
`;

interface Props {
  onNavigateToScaleAdvisor?: (root: string, quality: string) => void;
}

const EMPTY: AnalysisResult = {
  level: 0, silent: true, chroma: new Array(12).fill(0), activePitchClasses: [],
  bassPc: null, notes: [], matches: [], primary: null, interval: null, stable: false,
};

function ringStyle(confidence: number): React.CSSProperties {
  const deg = Math.round(confidence * 360);
  return {
    background: `conic-gradient(#a855f7 ${deg}deg, #21262d ${deg}deg)`,
    padding: 4,
  };
}

export default function ChordDetectionFeature({ onNavigateToScaleAdvisor }: Props) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AnalysisResult>(EMPTY);

  const streamRef = useRef<MediaStream | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const rafRef = useRef<number>(0);
  const lastTickRef = useRef<number>(0);
  const engineRef = useRef<ChordEngine>(new ChordEngine());

  const analyze = useCallback(() => {
    rafRef.current = requestAnimationFrame(analyze);

    const now = performance.now();
    if (now - lastTickRef.current < ANALYZE_INTERVAL) return;
    lastTickRef.current = now;

    const analyser = analyserRef.current;
    const ctx = contextRef.current;
    const data = dataRef.current;
    if (!analyser || !ctx || !data) return;

    analyser.getFloatFrequencyData(data);
    const res = engineRef.current.process(data, ctx.sampleRate, analyser.fftSize, now);
    setResult(res);
  }, []);

  const startListening = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      streamRef.current = stream;

      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      await ctx.resume();
      contextRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyser.smoothingTimeConstant = 0.5;
      analyserRef.current = analyser;
      dataRef.current = new Float32Array(analyser.frequencyBinCount);

      ctx.createMediaStreamSource(stream).connect(analyser);

      engineRef.current.reset();
      lastTickRef.current = 0;
      setListening(true);
      rafRef.current = requestAnimationFrame(analyze);
    } catch (err) {
      const e = err as { name?: string; message?: string };
      const name = e?.name ?? '';
      if (name === 'NotAllowedError' || name === 'SecurityError') {
        setError('Microphone access denied. Allow microphone access in your browser and try again.');
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setError('No microphone found. Connect a microphone and try again.');
      } else {
        setError(`Could not access microphone: ${e?.message ?? 'unknown error'}`);
      }
    }
  }, [analyze]);

  const stopListening = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    contextRef.current?.close().catch(() => {});
    streamRef.current = null;
    contextRef.current = null;
    analyserRef.current = null;
    dataRef.current = null;
    engineRef.current.reset();
    setListening(false);
    setResult(EMPTY);
  }, []);

  useEffect(() => () => { stopListening(); }, [stopListening]);

  function goToScales(m: ChordMatch) {
    onNavigateToScaleAdvisor?.(toGlobalKeyName(m.root), m.quality);
  }

  const { primary, interval, notes, matches, activePitchClasses, bassPc, chroma, level } = result;
  const rootPc = primary?.rootPc ?? null;
  const activeSet = new Set(activePitchClasses);
  const alternatives = matches.filter(m => m.symbol !== primary?.symbol).slice(0, 3);
  const singlePc = !primary && activePitchClasses.length === 1 ? activePitchClasses[0] : null;
  const singleNote = singlePc !== null ? (notes.find(n => n.pitchClass === singlePc) ?? notes[0]) : null;
  const showSingleNote = listening && !!singleNote;
  const showInterval = !primary && !!interval;

  return (
    <div className="cd-container">
      <style>{CSS}</style>

      <div className="cd-header">
        <h2 className="cd-title">Chord Detection</h2>
        <p className="cd-subtitle">Play a chord on any instrument — it's identified in real time</p>
      </div>

      {error && (
        <div className="cd-error">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <button
        className={`cd-mic-btn${listening ? ' listening' : ''}`}
        onClick={listening ? stopListening : startListening}
      >
        {listening ? <MicOff size={26} /> : <Mic size={26} />}
        {listening ? 'Stop' : 'Listen'}
      </button>

      {listening && (
        <div className="cd-level">
          <div className="cd-level-bar" style={{ width: `${level}%` }} />
        </div>
      )}

      {/* Primary chord */}
      {primary && (
        <div className="cd-primary">
          <div className="cd-ring" style={ringStyle(primary.confidence)}>
            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {Math.round(primary.confidence * 100)}%
            </div>
          </div>
          <div className="cd-primary-main">
            <div className="cd-primary-symbol">{primary.symbol}</div>
            <div className="cd-primary-type">{primary.type}</div>
            <div className="cd-primary-meta">
              {bassPc !== null && bassPc !== primary.rootPc && (
                <span className="cd-bass">slash bass <b>{NOTE_NAMES[bassPc]}</b></span>
              )}
              {result.stable && <span className="cd-locked"><Lock size={9} /> locked</span>}
            </div>
          </div>
          {onNavigateToScaleAdvisor && (
            <button className="cd-scales-btn" onClick={() => goToScales(primary)}>
              Scales <ChevronRight size={14} />
            </button>
          )}
        </div>
      )}

      {/* Single note / interval feedback */}
      {showSingleNote && singleNote && (
        <div className="cd-single">
          <div className="cd-single-big">{singleNote.name}{singleNote.octave}</div>
          <div className="cd-single-sub">Single note — play more notes to detect a chord</div>
        </div>
      )}
      {showInterval && (
        <div className="cd-single">
          <div className="cd-single-big">{interval.lowName} – {interval.highName}</div>
          <div className="cd-single-sub">{interval.name} — add a third note for a full chord</div>
        </div>
      )}

      {/* Live piano */}
      {listening && (
        <div className="cd-piano-card">
          <div className="cd-piano">
            {WHITE_KEYS.map(pc => {
              const on = activeSet.has(pc);
              const isRoot = pc === rootPc;
              const intensity = Math.min(1, chroma[pc] * 1.3);
              const bg = isRoot ? '#7c3aed'
                : on ? `rgba(124,58,237,${0.25 + intensity * 0.5})`
                : '#20262e';
              return (
                <div key={pc} className="cd-wkey" style={{ background: bg, color: on ? '#fff' : '#3a434f' }}>
                  {bassPc === pc && <span className="cd-key-dot" />}
                  {NOTE_NAMES[pc]}
                </div>
              );
            })}
            {BLACK_KEYS.map(({ pc, left }) => {
              const on = activeSet.has(pc);
              const isRoot = pc === rootPc;
              const intensity = Math.min(1, chroma[pc] * 1.3);
              const bg = isRoot ? '#7c3aed'
                : on ? `rgba(168,85,247,${0.4 + intensity * 0.5})`
                : '#0b0e13';
              return (
                <div key={pc} className="cd-bkey" style={{ left: `${left}%`, background: bg, color: on ? '#fff' : '#2b333d' }}>
                  {bassPc === pc && <span className="cd-key-dot" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detected notes */}
      {listening && (
        <div className="cd-notes-card">
          <div className="cd-label">Detected notes</div>
          <div className="cd-notes-row">
            {activePitchClasses.length > 0
              ? activePitchClasses
                  .slice()
                  .sort((a, b) => chroma[b] - chroma[a])
                  .map(pc => <span key={pc} className="cd-note-pill">{NOTE_NAMES[pc]}</span>)
              : <span className="cd-notes-empty">Play something…</span>}
          </div>
        </div>
      )}

      {/* Alternative interpretations */}
      {alternatives.length > 0 && (
        <div className="cd-matches-card">
          <div className="cd-label">Other interpretations</div>
          {alternatives.map(m => (
            <div key={m.symbol} className="cd-match">
              <div className="cd-match-pct">{Math.round(m.confidence * 100)}%</div>
              <div>
                <div className="cd-match-symbol">{m.symbol}</div>
                <div className="cd-match-type">{m.type}</div>
              </div>
              {onNavigateToScaleAdvisor && (
                <button className="cd-match-scales" onClick={() => goToScales(m)}>
                  Scales <ChevronRight size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {!listening && (
        <p className="cd-tip">
          Works with piano, guitar, voice, or any instrument.<br />
          Play a clear chord and let it ring — the app locks onto it in real time.
        </p>
      )}
    </div>
  );
}
