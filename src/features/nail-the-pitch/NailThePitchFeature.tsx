import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Trash2, AlertCircle } from 'lucide-react';
import { PitchTracker, type PitchReading, UNVOICED } from './pitchTracker';
import { useGlobalKey, CHROMATIC_KEYS } from '../../shared/context/GlobalKeyContext';

const VIEW_SEMITONES = 17;     // vertical range of rows shown (fewer = taller, bigger notes)
const TIME_WINDOW_MS = 5000;   // horizontal history shown in the live window
const GUTTER = 46;             // left label column (px)
const FFT_SIZE = 4096;         // ~85ms window — good for voice F0
const MAX_HISTORY_MS = 300000; // keep up to 5 min of session history for scroll-back
const BLACK_PCS = new Set([1, 3, 6, 8, 10]);
const NATURAL_NAMES: Record<number, string> = { 0: 'C', 2: 'D', 4: 'E', 5: 'F', 7: 'G', 9: 'A', 11: 'B' };
const MAJOR = [0, 2, 4, 5, 7, 9, 11];

interface Sample { t: number; midi: number; cents: number; voiced: boolean; }

// Rounded-rect path helper (works everywhere, no roundRect API needed)
function blobRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + rr, y);
  g.lineTo(x + w - rr, y);
  g.arcTo(x + w, y, x + w, y + rr, rr);
  g.lineTo(x + w, y + h - rr);
  g.arcTo(x + w, y + h, x + w - rr, y + h, rr);
  g.lineTo(x + rr, y + h);
  g.arcTo(x, y + h, x, y + h - rr, rr);
  g.lineTo(x, y + rr);
  g.arcTo(x, y, x + rr, y, rr);
  g.closePath();
}

// Returns an rgba string for the given cents deviation and opacity
function centsRgba(cents: number, alpha: number): string {
  const a = Math.abs(cents);
  if (a < 15) return `rgba(52,211,153,${alpha})`;
  if (a < 30) return `rgba(251,191,36,${alpha})`;
  return `rgba(248,113,113,${alpha})`;
}

const CSS = `
  .ntp-container { max-width: 760px; margin: 0 auto; }
  .ntp-header { text-align: center; margin-bottom: 20px; }
  .ntp-title { font-size: 28px; font-weight: 800; color: #e6edf3; margin: 0 0 6px; letter-spacing: -0.5px; }
  .ntp-subtitle { font-size: 14px; color: #6b7280; }

  .ntp-tuner {
    background: #161b22; border: 1px solid #21262d; border-radius: 16px;
    padding: 16px 22px; margin-bottom: 14px;
    display: flex; align-items: center; gap: 22px;
  }
  .ntp-readout { min-width: 96px; text-align: center; }
  .ntp-note { font-size: 40px; font-weight: 800; line-height: 1; letter-spacing: -1px; }
  .ntp-note small { font-size: 18px; font-weight: 700; opacity: 0.55; }
  .ntp-cents-txt { font-size: 13px; font-weight: 700; margin-top: 4px; }
  .ntp-cents-idle { color: #374151; }

  .ntp-meter { flex: 1; }
  .ntp-meter-scale { display: flex; justify-content: space-between; font-size: 10px; color: #4b5563; margin-bottom: 6px; font-weight: 600; }
  .ntp-meter-track {
    position: relative; height: 12px; border-radius: 6px;
    background: linear-gradient(90deg, #f8717130, #fbbf2430, #34d39930, #fbbf2430, #f8717130);
    border: 1px solid #21262d;
  }
  .ntp-meter-center { position: absolute; left: 50%; top: -3px; bottom: -3px; width: 2px; background: #4b5563; transform: translateX(-50%); }
  .ntp-needle {
    position: absolute; top: -4px; width: 4px; height: 20px; border-radius: 3px;
    transform: translateX(-50%); transition: left 0.06s linear, background 0.1s;
    box-shadow: 0 0 8px currentColor;
  }

  .ntp-canvas-card {
    background: #0d1117; border: 1px solid #21262d; border-radius: 16px;
    padding: 6px; margin-bottom: 14px; overflow: hidden; position: relative;
  }
  .ntp-canvas { display: block; width: 100%; border-radius: 11px; touch-action: none; }
  .ntp-canvas.scrollable { cursor: grab; }
  .ntp-canvas.grabbing { cursor: grabbing; }
  .ntp-scrub-hint {
    position: absolute; left: 50%; bottom: 12px; transform: translateX(-50%);
    font-size: 11px; font-weight: 600; color: #6b7280; pointer-events: none;
    background: #0d1117cc; padding: 4px 12px; border-radius: 8px; border: 1px solid #21262d;
  }

  .ntp-controls { display: flex; gap: 10px; justify-content: center; align-items: center; }
  .ntp-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 22px; border-radius: 12px; cursor: pointer;
    font-family: 'DM Sans', sans-serif; font-size: 14px; font-weight: 700;
    border: 1px solid #30363d; background: #161b22; color: #8b949e; transition: all 0.18s;
  }
  .ntp-btn:hover { border-color: #7c3aed60; color: #c4b5fd; background: #7c3aed10; }
  .ntp-btn.rec { border-color: #7c3aed; background: #7c3aed18; color: #c4b5fd; }
  .ntp-btn.rec:hover { background: #7c3aed28; }

  .ntp-error {
    display: flex; align-items: center; gap: 10px; padding: 14px 16px;
    background: #ef444412; border: 1px solid #ef444430; border-radius: 10px;
    font-size: 13px; color: #f87171; margin-bottom: 14px;
  }
  .ntp-tip { text-align: center; font-size: 12px; color: #374151; margin-top: 14px; line-height: 1.6; }
`;

function centsColor(cents: number): string {
  const a = Math.abs(cents);
  if (a < 12) return '#34d399';
  if (a < 30) return '#fbbf24';
  return '#f87171';
}

export default function NailThePitchFeature() {
  const { globalKey } = useGlobalKey();
  const [listening, setListening] = useState(false);
  const [error, setError] = useState('');
  const [reading, setReading] = useState<PitchReading>(UNVOICED);

  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bufRef = useRef<Float32Array<ArrayBuffer> | null>(null);
  const rafRef = useRef(0);
  const trackerRef = useRef(new PitchTracker());
  const samplesRef = useRef<Sample[]>([]);
  const viewCenterRef = useRef(60); // start centered on C4
  const lastReadoutRef = useRef(0);

  // Scroll-back: when stopped, the right edge of the window is frozen here and
  // can be dragged through the session history.
  const viewEndRef = useRef(performance.now());
  const listeningRef = useRef(false);
  const dragRef = useRef<{ startX: number; startEnd: number } | null>(null);
  const [scrubbing, setScrubbing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scaleSetRef = useRef<Set<number>>(new Set());

  // Keep the in-key row set in sync with the global key.
  useEffect(() => {
    const rootPc = Math.max(0, CHROMATIC_KEYS.indexOf(globalKey));
    scaleSetRef.current = new Set(MAJOR.map(i => (rootPc + i) % 12));
  }, [globalKey]);

  // viewEnd = time at the right edge of the window; liveNow = playhead time when
  // recording (null when scrolling back through frozen history).
  const draw = useCallback((viewEnd: number, liveNow: number | null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const g = canvas.getContext('2d');
    if (!g) return;
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.width / dpr;
    const H = canvas.height / dpr;

    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    g.fillStyle = '#0d1117';
    g.fillRect(0, 0, W, H);

    const center = viewCenterRef.current;
    const bottomEdge = center - VIEW_SEMITONES / 2;
    const rowH = H / VIEW_SEMITONES;
    const midiToY = (m: number) => H * (1 - (m - bottomEdge) / VIEW_SEMITONES);

    const plotW = W - GUTTER;
    const t0 = viewEnd - TIME_WINDOW_MS;
    const timeToX = (t: number) => GUTTER + ((t - t0) / TIME_WINDOW_MS) * plotW;

    const scaleSet = scaleSetRef.current;
    const loMidi = Math.floor(bottomEdge) - 1;
    const hiMidi = Math.ceil(bottomEdge + VIEW_SEMITONES) + 1;

    // Row bands + grid + labels
    for (let m = loMidi; m <= hiMidi; m++) {
      const pc = ((m % 12) + 12) % 12;
      const yTop = midiToY(m + 0.5);
      const isBlack = BLACK_PCS.has(pc);
      g.fillStyle = isBlack ? '#0b0e13' : '#11161d';
      g.fillRect(GUTTER, yTop, plotW, rowH);
      if (scaleSet.has(pc)) {
        g.fillStyle = 'rgba(124,58,237,0.08)';
        g.fillRect(GUTTER, yTop, plotW, rowH);
      }
      g.strokeStyle = '#1b2129';
      g.lineWidth = 1;
      g.beginPath(); g.moveTo(GUTTER, yTop); g.lineTo(W, yTop); g.stroke();

      if (!isBlack && rowH >= 11) {
        g.fillStyle = pc === 0 ? '#8b949e' : '#4b5563';
        g.font = `${pc === 0 ? '700' : '600'} 10px 'DM Sans', sans-serif`;
        g.textBaseline = 'middle';
        g.fillText(`${NATURAL_NAMES[pc]}${Math.floor(m / 12) - 1}`, 6, midiToY(m));
      }
    }
    // gutter divider
    g.strokeStyle = '#21262d';
    g.beginPath(); g.moveTo(GUTTER, 0); g.lineTo(GUTTER, H); g.stroke();

    const samples = samplesRef.current;

    // ── Melodyne-style note blobs ──────────────────────────────────────────
    // Group consecutive voiced samples into note segments. Boundary hysteresis:
    // stay on the current note unless the pitch moves clearly (>0.62 semitone)
    // past the boundary — this kills the flicker between adjacent semitones.
    type Seg = { midiNote: number; startT: number; endT: number; pts: Sample[] };
    const segs: Seg[] = [];
    let cur: Seg | null = null;
    for (const s of samples) {
      if (!s.voiced) { if (cur) { segs.push(cur); cur = null; } continue; }
      const gap = cur ? s.t - cur.endT : Infinity;
      const stay = cur && gap <= 150 && Math.abs(s.midi - cur.midiNote) < 0.62;
      if (stay && cur) {
        cur.pts.push(s); cur.endT = s.t;
      } else {
        if (cur) segs.push(cur);
        cur = { midiNote: Math.round(s.midi), startT: s.t, endT: s.t, pts: [s] };
      }
    }
    if (cur) segs.push(cur);

    // Confine note rendering to the plot area so blobs never spill into the
    // left-hand label gutter.
    g.save();
    g.beginPath(); g.rect(GUTTER, 0, plotW, H); g.clip();

    const blobH = Math.max(rowH * 0.86, 10);
    const blobR = Math.min(6, blobH / 2);
    for (const seg of segs) {
      const x1 = timeToX(seg.startT);
      const x2 = Math.max(timeToX(seg.endT), x1 + 7);
      if (x2 < GUTTER || x1 > W) continue; // outside view, skip
      const yCenter = midiToY(seg.midiNote);
      const avgCents = seg.pts.reduce((acc, p) => acc + Math.abs(p.cents), 0) / seg.pts.length;

      // Thick filled blob at the quantized note row
      g.fillStyle = centsRgba(avgCents, 0.55);
      blobRect(g, x1, yCenter - blobH / 2, x2 - x1, blobH, blobR);
      g.fill();

      // Crisp border
      g.strokeStyle = centsRgba(avgCents, 0.9);
      g.lineWidth = 1.5;
      blobRect(g, x1, yCenter - blobH / 2, x2 - x1, blobH, blobR);
      g.stroke();

      // Pitch deviation curve inside blob — shows vibrato and intonation drift
      if (seg.pts.length >= 2) {
        g.strokeStyle = 'rgba(255,255,255,0.82)';
        g.lineWidth = 1.75;
        g.lineCap = 'round';
        g.lineJoin = 'round';
        g.beginPath();
        for (let i = 0; i < seg.pts.length; i++) {
          const p = seg.pts[i];
          i === 0 ? g.moveTo(timeToX(p.t), midiToY(p.midi))
                  : g.lineTo(timeToX(p.t), midiToY(p.midi));
        }
        g.stroke();
      } else {
        // Single sample — small bright dot
        const p = seg.pts[0];
        g.fillStyle = 'rgba(255,255,255,0.85)';
        g.beginPath();
        g.arc(timeToX(p.t), midiToY(p.midi), 2.5, 0, Math.PI * 2);
        g.fill();
      }
    }

    // Live marker: bright tip at the most-recent voiced sample (only while live)
    if (liveNow !== null && segs.length > 0) {
      const lastSeg = segs[segs.length - 1];
      const last = lastSeg.pts[lastSeg.pts.length - 1];
      const lx = timeToX(last.t), ly = midiToY(last.midi);
      g.fillStyle = centsColor(last.cents);
      g.beginPath(); g.arc(lx, ly, 6, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#0d1117'; g.lineWidth = 2; g.stroke();
    }
    g.restore();

    // Playhead — solid now-line while live, dashed scrub-line when reviewing
    if (liveNow !== null) {
      const nx = timeToX(liveNow);
      g.strokeStyle = '#7c3aed'; g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(nx, 0); g.lineTo(nx, H); g.stroke();
    }
  }, []);

  const loop = useCallback(() => {
    rafRef.current = requestAnimationFrame(loop);
    const ctx = ctxRef.current, analyser = analyserRef.current, buf = bufRef.current;
    if (!ctx || !analyser || !buf) return;

    const now = performance.now();
    analyser.getFloatTimeDomainData(buf);
    const r = trackerRef.current.detect(buf, ctx.sampleRate);

    samplesRef.current.push({ t: now, midi: r.midi, cents: r.cents, voiced: r.voiced });
    // Keep the whole session (bounded) so it can be reviewed after stopping.
    const cutoff = now - MAX_HISTORY_MS;
    const s = samplesRef.current;
    let drop = 0; while (drop < s.length && s[drop].t < cutoff) drop++;
    if (drop) s.splice(0, drop);

    if (r.voiced) {
      const c = viewCenterRef.current;
      // Snap quickly when the note is out of view, ease gently otherwise.
      const factor = Math.abs(r.midi - c) > VIEW_SEMITONES / 2 - 2 ? 0.4 : 0.06;
      viewCenterRef.current = c + (r.midi - c) * factor;
    }

    viewEndRef.current = now;
    draw(now, now);

    if (now - lastReadoutRef.current > 60) { lastReadoutRef.current = now; setReading(r); }
  }, [draw]);

  const sizeCanvas = useCallback(() => {
    const canvas = canvasRef.current, container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const cssW = container.clientWidth - 12;
    const cssH = Math.min(520, Math.max(360, window.innerHeight * 0.5));
    canvas.style.height = `${cssH}px`;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    draw(viewEndRef.current, listeningRef.current ? performance.now() : null);
  }, [draw]);

  // Recenter the vertical view on the notes currently visible in the window.
  const recenterToVisible = useCallback(() => {
    const t1 = viewEndRef.current, t0 = t1 - TIME_WINDOW_MS;
    const mids = samplesRef.current.filter(s => s.voiced && s.t >= t0 && s.t <= t1).map(s => s.midi);
    if (!mids.length) return;
    mids.sort((a, b) => a - b);
    viewCenterRef.current = mids[mids.length >> 1];
  }, []);

  useEffect(() => {
    sizeCanvas();
    window.addEventListener('resize', sizeCanvas);
    return () => window.removeEventListener('resize', sizeCanvas);
  }, [sizeCanvas]);

  const start = useCallback(async () => {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      streamRef.current = stream;
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      await ctx.resume();
      ctxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      analyserRef.current = analyser;
      bufRef.current = new Float32Array(analyser.fftSize);
      ctx.createMediaStreamSource(stream).connect(analyser);

      trackerRef.current.reset();
      lastReadoutRef.current = 0;
      listeningRef.current = true;
      setListening(true);
      rafRef.current = requestAnimationFrame(loop);
    } catch (err) {
      const e = err as { name?: string; message?: string };
      if (e?.name === 'NotAllowedError' || e?.name === 'SecurityError') {
        setError('Microphone access denied. Allow microphone access in your browser and try again.');
      } else if (e?.name === 'NotFoundError') {
        setError('No microphone found. Connect a microphone and try again.');
      } else {
        setError(`Could not access microphone: ${e?.message ?? 'unknown error'}`);
      }
    }
  }, [loop]);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    ctxRef.current?.close().catch(() => {});
    streamRef.current = null; ctxRef.current = null; analyserRef.current = null; bufRef.current = null;
    listeningRef.current = false;
    setListening(false);
    setReading(UNVOICED);
    // Freeze the view on the end of the session so it can be reviewed/scrolled.
    const s = samplesRef.current;
    if (s.length) {
      viewEndRef.current = s[s.length - 1].t;
      recenterToVisible();
    }
    draw(viewEndRef.current, null);
  }, [draw, recenterToVisible]);

  const clear = useCallback(() => {
    samplesRef.current = [];
    viewEndRef.current = performance.now();
    draw(viewEndRef.current, listeningRef.current ? performance.now() : null);
  }, [draw]);

  // ── Scroll-back: drag horizontally across the frozen session (mouse + touch).
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (listeningRef.current || samplesRef.current.length === 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startEnd: viewEndRef.current };
    setScrubbing(true);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const d = dragRef.current;
    if (!d) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const plotW = canvas.width / dpr - GUTTER;
    const dt = ((e.clientX - d.startX) / plotW) * TIME_WINDOW_MS;
    const s = samplesRef.current;
    const firstT = s[0].t, lastT = s[s.length - 1].t;
    // Drag right → go back in time (window end decreases).
    viewEndRef.current = Math.max(firstT, Math.min(lastT, d.startEnd - dt));
    recenterToVisible();
    draw(viewEndRef.current, null);
  }, [draw, recenterToVisible]);

  const endDrag = useCallback(() => {
    if (dragRef.current) { dragRef.current = null; setScrubbing(false); }
  }, []);

  useEffect(() => () => { stop(); }, [stop]);

  const noteColor = reading.voiced ? centsColor(reading.cents) : '#374151';
  const needleLeft = `${50 + Math.max(-50, Math.min(50, reading.cents))}%`;

  return (
    <div className="ntp-container" ref={containerRef}>
      <style>{CSS}</style>

      <div className="ntp-header">
        <h2 className="ntp-title">Nail the Pitch</h2>
        <p className="ntp-subtitle">Sing — see exactly which note you're hitting, and how in-tune</p>
      </div>

      {error && <div className="ntp-error"><AlertCircle size={16} /> {error}</div>}

      {/* Tuner + readout */}
      <div className="ntp-tuner">
        <div className="ntp-readout">
          <div className="ntp-note" style={{ color: noteColor }}>
            {reading.voiced ? <>{reading.note}<small>{reading.octave}</small></> : '–'}
          </div>
          <div className={`ntp-cents-txt ${reading.voiced ? '' : 'ntp-cents-idle'}`} style={reading.voiced ? { color: noteColor } : undefined}>
            {reading.voiced ? `${reading.cents >= 0 ? '+' : ''}${Math.round(reading.cents)}¢` : 'listening…'}
          </div>
        </div>
        <div className="ntp-meter">
          <div className="ntp-meter-scale"><span>-50¢</span><span>in tune</span><span>+50¢</span></div>
          <div className="ntp-meter-track">
            <div className="ntp-meter-center" />
            {reading.voiced && (
              <div className="ntp-needle" style={{ left: needleLeft, background: noteColor, color: noteColor }} />
            )}
          </div>
        </div>
      </div>

      {/* Piano-roll canvas */}
      <div className="ntp-canvas-card">
        <canvas
          ref={canvasRef}
          className={`ntp-canvas${!listening && samplesRef.current.length ? ' scrollable' : ''}${scrubbing ? ' grabbing' : ''}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        />
        {!listening && samplesRef.current.length > 0 && (
          <div className="ntp-scrub-hint">← drag to scroll through your session →</div>
        )}
      </div>

      {/* Controls */}
      <div className="ntp-controls">
        <button className={`ntp-btn${listening ? ' rec' : ''}`} onClick={listening ? stop : start}>
          {listening ? <><MicOff size={17} /> Stop</> : <><Mic size={17} /> Start singing</>}
        </button>
        <button className="ntp-btn" onClick={clear}><Trash2 size={16} /> Clear</button>
      </div>

      <p className="ntp-tip">
        Colored blobs = notes you sang. White curve inside = your exact pitch (vibrato visible).<br />
        Green = in tune · amber/red = sharp or flat · purple tint = in-key rows. Stop, then drag the grid to review your session.
      </p>
    </div>
  );
}
