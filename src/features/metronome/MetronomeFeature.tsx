import { useState, useEffect, useRef, useCallback } from 'react';
import { storageGet, storageSet } from '@shared/utils/storage';

type TimeSig = '2/4' | '3/4' | '4/4' | '5/4' | '6/8';

const BEATS_PER_SIG: Record<TimeSig, number> = {
  '2/4': 2, '3/4': 3, '4/4': 4, '5/4': 5, '6/8': 6,
};

const SCHEDULE_AHEAD = 0.12;  // seconds — look-ahead window
const LOOKAHEAD_MS   = 25;    // scheduler poll interval

// ─── helpers ─────────────────────────────────────────────────────────────────

function clampBpm(v: number) { return Math.max(20, Math.min(300, Math.round(v))); }

function scheduleBeep(
  ctx: AudioContext,
  time: number,
  isAccent: boolean,
  subdivision: boolean,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  if (subdivision) {
    osc.frequency.value = 660;
    gain.gain.setValueAtTime(0.25, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
    osc.start(time);
    osc.stop(time + 0.03);
  } else {
    osc.frequency.value = isAccent ? 1200 : 800;
    gain.gain.setValueAtTime(isAccent ? 0.9 : 0.55, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.06);
    osc.start(time);
    osc.stop(time + 0.06);
  }
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MetronomeFeature() {
  const [bpm, setBpmState] = useState<number>(() => storageGet<number>('metro_bpm', 120));
  const [timeSig, setTimeSig] = useState<TimeSig>(() => storageGet<TimeSig>('metro_ts', '4/4'));
  const [subdivide, setSubdivide] = useState<boolean>(() => storageGet<boolean>('metro_sub', false));
  const [running, setRunning] = useState(false);
  const [activeBeat, setActiveBeat] = useState<number>(-1);

  // Scheduling state kept in refs so scheduler closure sees latest
  const bpmRef = useRef(bpm);
  const timeSigRef = useRef(timeSig);
  const subdivideRef = useRef(subdivide);
  const runningRef = useRef(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nextNoteTimeRef = useRef(0.0);
  const currentBeatRef = useRef(0);
  const schedulerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { bpmRef.current = bpm; storageSet('metro_bpm', bpm); }, [bpm]);
  useEffect(() => { timeSigRef.current = timeSig; storageSet('metro_ts', timeSig); }, [timeSig]);
  useEffect(() => { subdivideRef.current = subdivide; storageSet('metro_sub', subdivide); }, [subdivide]);

  const setBpm = useCallback((v: number) => setBpmState(clampBpm(v)), []);

  function secondsPerBeat(b: number) {
    return 60.0 / b;
  }

  function scheduleNote(beat: number, time: number) {
    const beats = BEATS_PER_SIG[timeSigRef.current];
    scheduleBeep(audioCtxRef.current!, time, beat === 0, false);

    // Subdivision tick (8th notes) — halfway between beats
    if (subdivideRef.current) {
      const halfBeat = time + secondsPerBeat(bpmRef.current) / 2;
      scheduleBeep(audioCtxRef.current!, halfBeat, false, true);
    }

    // Visual update fires at the scheduled audio time
    const delay = Math.max(0, (time - audioCtxRef.current!.currentTime) * 1000);
    setTimeout(() => setActiveBeat(beat % beats), delay);
  }

  function advanceBeat() {
    const beats = BEATS_PER_SIG[timeSigRef.current];
    nextNoteTimeRef.current += secondsPerBeat(bpmRef.current);
    currentBeatRef.current = (currentBeatRef.current + 1) % beats;
  }

  function scheduler() {
    const ctx = audioCtxRef.current;
    if (!ctx || !runningRef.current) return;

    while (nextNoteTimeRef.current < ctx.currentTime + SCHEDULE_AHEAD) {
      scheduleNote(currentBeatRef.current, nextNoteTimeRef.current);
      advanceBeat();
    }
    schedulerTimerRef.current = setTimeout(scheduler, LOOKAHEAD_MS);
  }

  function start() {
    if (runningRef.current) return;
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    } else if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    currentBeatRef.current = 0;
    nextNoteTimeRef.current = audioCtxRef.current.currentTime + 0.05;
    runningRef.current = true;
    setRunning(true);
    scheduler();
  }

  function stop() {
    runningRef.current = false;
    setRunning(false);
    setActiveBeat(-1);
    if (schedulerTimerRef.current) {
      clearTimeout(schedulerTimerRef.current);
      schedulerTimerRef.current = null;
    }
  }

  function toggle() { running ? stop() : start(); }

  // Tap tempo
  const tapTimesRef = useRef<number[]>([]);
  function handleTap() {
    const now = performance.now();
    tapTimesRef.current.push(now);
    if (tapTimesRef.current.length > 8) tapTimesRef.current = tapTimesRef.current.slice(-8);
    const taps = tapTimesRef.current;
    if (taps.length >= 2) {
      const gaps = taps.slice(1).map((t, i) => t - taps[i]);
      const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      setBpm(Math.round(60000 / avg));
    }
  }

  // BPM drag
  const dragRef = useRef<{ startX: number; startBpm: number } | null>(null);
  function onBpmPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startBpm: bpm };
  }
  function onBpmPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    const delta = Math.round((e.clientX - dragRef.current.startX) / 3);
    setBpm(dragRef.current.startBpm + delta);
  }
  function onBpmPointerUp() { dragRef.current = null; }

  // Keyboard shortcut: space = toggle
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        toggle();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }); // intentionally no deps — toggle changes

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stop();
      audioCtxRef.current?.close();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const beats = BEATS_PER_SIG[timeSig];

  return (
    <div style={{
      maxWidth: 520, margin: '0 auto',
      display: 'flex', flexDirection: 'column', gap: 24,
    }}>
      {/* Title */}
      <div>
        <h2 style={{ margin: '0 0 4px', fontSize: 22, color: '#e6edf3' }}>Metronome</h2>
        <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
          Precise Web Audio timing · tap tempo · space bar to start/stop
        </p>
      </div>

      {/* Beat indicators */}
      <div style={{
        background: '#161b22', border: '1px solid #30363d', borderRadius: 16,
        padding: '28px 24px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
      }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          {Array.from({ length: beats }).map((_, i) => {
            const isActive = activeBeat === i;
            const isAccent = i === 0;
            return (
              <div
                key={i}
                style={{
                  width: isAccent ? 28 : 22,
                  height: isAccent ? 28 : 22,
                  borderRadius: '50%',
                  background: isActive
                    ? (isAccent ? '#f97316' : '#7c3aed')
                    : '#21262d',
                  border: `2px solid ${isActive ? 'transparent' : '#30363d'}`,
                  boxShadow: isActive
                    ? `0 0 ${isAccent ? 20 : 12}px ${isAccent ? '#f97316' : '#7c3aed'}`
                    : 'none',
                  transition: 'background 0.04s, box-shadow 0.04s',
                }}
              />
            );
          })}
        </div>

        {/* BPM display — draggable */}
        <div
          onPointerDown={onBpmPointerDown}
          onPointerMove={onBpmPointerMove}
          onPointerUp={onBpmPointerUp}
          style={{
            cursor: 'ew-resize', userSelect: 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}
          title="Drag left/right to change BPM"
        >
          <div style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: 80, fontWeight: 800, lineHeight: 1,
            color: running ? '#c4b5fd' : '#e6edf3',
            letterSpacing: '-4px',
            transition: 'color 0.2s',
          }}>
            {bpm}
          </div>
          <div style={{ fontSize: 11, color: '#4b5563', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>
            BPM — drag to adjust
          </div>
        </div>

        {/* BPM fine controls */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {[-10, -5, -1].map(d => (
            <button key={d} onClick={() => setBpm(bpm + d)} style={smallBtn}>
              {d}
            </button>
          ))}
          <span style={{ width: 1, height: 20, background: '#30363d' }} />
          {[1, 5, 10].map(d => (
            <button key={d} onClick={() => setBpm(bpm + d)} style={smallBtn}>
              +{d}
            </button>
          ))}
        </div>

        {/* BPM preset tempos */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          {TEMPO_MARKS.map(({ label, bpm: b }) => (
            <button
              key={b}
              onClick={() => setBpm(b)}
              style={{
                padding: '4px 10px',
                background: Math.abs(bpm - b) <= 5 ? '#7c3aed20' : '#0d1117',
                border: `1px solid ${Math.abs(bpm - b) <= 5 ? '#7c3aed60' : '#30363d'}`,
                borderRadius: 6, cursor: 'pointer',
                fontSize: 11, color: Math.abs(bpm - b) <= 5 ? '#c4b5fd' : '#6b7280',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {label} <span style={{ opacity: 0.5 }}>{b}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Controls row */}
      <div style={{
        background: '#161b22', border: '1px solid #30363d', borderRadius: 12,
        padding: '16px 20px',
        display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center',
      }}>
        {/* Start / Stop */}
        <button
          onClick={toggle}
          style={{
            flex: '1 1 120px',
            padding: '14px 24px',
            background: running
              ? 'linear-gradient(135deg, #dc2626, #b91c1c)'
              : 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            border: 'none', borderRadius: 10, cursor: 'pointer',
            fontSize: 16, fontWeight: 700, color: '#fff',
            fontFamily: "'DM Sans', sans-serif",
            boxShadow: running
              ? '0 0 20px rgba(220,38,38,0.3)'
              : '0 0 20px rgba(124,58,237,0.3)',
            transition: 'all 0.15s',
          }}
        >
          {running ? '⏹ Stop' : '▶ Start'}
        </button>

        {/* Tap Tempo */}
        <button
          onClick={handleTap}
          style={{
            flex: '1 1 100px',
            padding: '14px 20px',
            background: '#1c2128', border: '1px solid #30363d',
            borderRadius: 10, cursor: 'pointer',
            fontSize: 14, fontWeight: 600, color: '#e6edf3',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          👆 Tap
        </button>

        {/* Time signature */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Time sig.
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {(Object.keys(BEATS_PER_SIG) as TimeSig[]).map(ts => (
              <button
                key={ts}
                onClick={() => { setTimeSig(ts); if (running) { stop(); setTimeout(start, 50); } }}
                style={{
                  padding: '5px 8px',
                  background: timeSig === ts ? '#7c3aed22' : 'none',
                  border: `1px solid ${timeSig === ts ? '#7c3aed' : '#30363d'}`,
                  borderRadius: 6, cursor: 'pointer',
                  fontSize: 12, fontWeight: 600,
                  color: timeSig === ts ? '#c4b5fd' : '#6b7280',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {ts}
              </button>
            ))}
          </div>
        </div>

        {/* Subdivide toggle */}
        <button
          onClick={() => setSubdivide(s => !s)}
          style={{
            padding: '10px 14px',
            background: subdivide ? '#7c3aed22' : 'none',
            border: `1px solid ${subdivide ? '#7c3aed' : '#30363d'}`,
            borderRadius: 8, cursor: 'pointer',
            fontSize: 12, fontWeight: 600,
            color: subdivide ? '#c4b5fd' : '#6b7280',
            fontFamily: "'DM Sans', sans-serif",
            whiteSpace: 'nowrap',
          }}
        >
          ♩♩ 8ths
        </button>
      </div>
    </div>
  );
}

// ─── Styles & constants ───────────────────────────────────────────────────────

const smallBtn: React.CSSProperties = {
  padding: '6px 10px',
  background: '#1c2128', border: '1px solid #30363d', borderRadius: 6,
  cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#8b949e',
  fontFamily: "'DM Sans', sans-serif",
};

const TEMPO_MARKS = [
  { label: 'Largo',     bpm: 50  },
  { label: 'Andante',   bpm: 76  },
  { label: 'Moderato',  bpm: 100 },
  { label: 'Allegro',   bpm: 132 },
  { label: 'Presto',    bpm: 176 },
];
