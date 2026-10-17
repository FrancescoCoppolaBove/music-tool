import { useRef, useLayoutEffect, useEffect } from 'react';
import type { NoteEvent, ChordEvent } from '../types';

export interface PianoRollProps {
  notes: NoteEvent[];
  chords: ChordEvent[];
  bpm: number | null;
  duration: number;
  selectedIds: Set<string>;
  isPlaying: boolean;
  getPlayheadSec: () => number;
  onSelectNote: (id: string, addToSelection: boolean) => void;
  onSeek: (sec: number) => void;
  editMode: boolean;
  onEditNote: (id: string, changes: Partial<Pick<NoteEvent, 'midi' | 'startSec' | 'durationSec'>>) => void;
  onDeleteNotes: (ids: string[]) => void;
  onCreateNote: (note: Omit<NoteEvent, 'id' | 'chordId' | 'startBeat' | 'durationBeats' | 'velocity'>) => void;
}

const CHORD_PALETTE = [
  '#7c3aed','#9333ea','#a855f7','#c084fc',
  '#8b5cf6','#6d28d9','#7e22ce','#d946ef',
];
const BLACK_PCS = new Set([1,3,6,8,10]);
const GUTTER = 44;   // left label column width in px
const MIN_ROWS = 12; // minimum pitch rows visible

interface RollState {
  notes: NoteEvent[];
  chords: ChordEvent[];
  bpm: number | null;
  duration: number;
  selectedIds: Set<string>;
  zoomX: number;
  scrollX: number;
  playheadSec: number;
  editMode: boolean;
}

function drawAll(canvas: HTMLCanvasElement, s: RollState): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;

  // Compute MIDI range from notes (loop, not spread: notes can be thousands)
  let minMidi = 60, maxMidi = 72;
  if (s.notes.length > 0) {
    minMidi = Infinity; maxMidi = -Infinity;
    for (const n of s.notes) {
      if (n.midi < minMidi) minMidi = n.midi;
      if (n.midi > maxMidi) maxMidi = n.midi;
    }
  }
  minMidi -= 3;
  maxMidi += 3;
  const numRows = Math.max(MIN_ROWS, maxMidi - minMidi + 1);
  maxMidi = minMidi + numRows - 1;
  const rowH = H / numRows;

  // ── Background: piano key rows ─────────────────────────────
  for (let m = minMidi; m <= maxMidi; m++) {
    const isBlack = BLACK_PCS.has(m % 12);
    const y = (maxMidi - m) * rowH;
    ctx.fillStyle = isBlack ? '#0c0f14' : '#161b22';
    ctx.fillRect(0, y, W, rowH);
    ctx.fillStyle = '#1a1f27';
    ctx.fillRect(0, y + rowH - 1, W, 1);
  }

  // ── Left gutter ───────────────────────────────────────────
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, GUTTER, H);
  ctx.fillStyle = '#21262d';
  ctx.fillRect(GUTTER - 1, 0, 1, H);

  // C-note labels in gutter
  ctx.font = `10px "DM Sans", sans-serif`;
  ctx.textBaseline = 'middle';
  for (let m = minMidi; m <= maxMidi; m++) {
    if (m % 12 === 0) {
      const y = (maxMidi - m) * rowH + rowH / 2;
      ctx.fillStyle = '#4b5563';
      ctx.fillText(`C${Math.floor(m / 12) - 1}`, 4, y);
    }
  }

  // ── Time grid ─────────────────────────────────────────────
  if (s.bpm !== null) {
    const beatSec = 60 / s.bpm;
    const beatPx = beatSec * s.zoomX;
    if (beatPx >= 3) {
      const firstBeat = Math.max(0, Math.floor(s.scrollX / beatPx));
      const lastBeat = Math.ceil((s.scrollX + W - GUTTER) / beatPx) + 1;
      for (let b = firstBeat; b <= lastBeat; b++) {
        const x = GUTTER + b * beatPx - s.scrollX;
        if (x < GUTTER || x > W) continue;
        ctx.fillStyle = b % 4 === 0 ? '#2d3340' : '#1e2430';
        ctx.fillRect(x, 0, 1, H);
      }
    }
  } else {
    // Second ticks when no BPM
    const secPx = s.zoomX;
    if (secPx >= 4) {
      const totalSecs = Math.ceil(s.duration || 30);
      for (let t = 0; t <= totalSecs; t++) {
        const x = GUTTER + t * secPx - s.scrollX;
        if (x < GUTTER || x > W) continue;
        ctx.fillStyle = '#1e2430';
        ctx.fillRect(x, 0, 1, H);
      }
    }
  }

  // ── Notes ─────────────────────────────────────────────────
  const chordIdxById = new Map<string, number>();
  s.chords.forEach((c, i) => chordIdxById.set(c.id, i));

  for (const note of s.notes) {
    const chordIdx = note.chordId !== undefined ? (chordIdxById.get(note.chordId) ?? -1) : -1;
    const color = chordIdx >= 0
      ? CHORD_PALETTE[chordIdx % CHORD_PALETTE.length]
      : '#4b5563';
    const x = GUTTER + note.startSec * s.zoomX - s.scrollX;
    const w = Math.max(4, note.durationSec * s.zoomX);
    const y = (maxMidi - note.midi) * rowH + 1;
    const h = rowH - 2;

    // Skip notes outside viewport
    if (x + w < GUTTER || x > W) continue;

    const isSelected = s.selectedIds.has(note.id);
    const isSounding = s.playheadSec >= note.startSec && s.playheadSec < note.startSec + note.durationSec;
    ctx.fillStyle = isSounding && chordIdx < 0 ? '#9ca3af' : color;
    ctx.globalAlpha = isSelected || isSounding ? 1 : 0.75;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1;

    if (isSelected || isSounding) {
      ctx.strokeStyle = isSelected ? '#ffffff' : '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);
    }

    // Cents micro-bar: 2px strip on bottom of note
    const a = Math.abs(note.cents);
    ctx.fillStyle = a < 15 ? '#34d399' : a < 30 ? '#fbbf24' : '#f87171';
    ctx.fillRect(x, y + h - 2, w, 2);
  }

  // ── Playhead ──────────────────────────────────────────────
  const phX = GUTTER + s.playheadSec * s.zoomX - s.scrollX;
  if (phX >= GUTTER && phX <= W) {
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(phX, 0);
    ctx.lineTo(phX, H);
    ctx.stroke();
    // Triangle head at top
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(phX - 5, 0);
    ctx.lineTo(phX + 5, 0);
    ctx.lineTo(phX, 8);
    ctx.closePath();
    ctx.fill();
  }
}

export default function PianoRoll(props: PianoRollProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef     = useRef<RollState>({
    notes: [], chords: [], bpm: null, duration: 0,
    selectedIds: new Set(), zoomX: 120, scrollX: 0,
    playheadSec: 0, editMode: false,
  });
  const propsRef = useRef(props);
  const hadNotesRef = useRef(false);

  // Keep propsRef in sync (used by interaction effects in later tasks)
  useLayoutEffect(() => {
    propsRef.current = props;
    stateRef.current = {
      ...stateRef.current,
      notes: props.notes,
      chords: props.chords,
      bpm: props.bpm,
      duration: props.duration,
      selectedIds: props.selectedIds,
      editMode: props.editMode,
      playheadSec: props.getPlayheadSec(),
    };
    // Dopo un'analisi (0 → N note) porta in vista la prima nota: l'audio può
    // iniziare con molti secondi di silenzio.
    if (!hadNotesRef.current && props.notes.length > 0) {
      let first = Infinity;
      for (const n of props.notes) if (n.startSec < first) first = n.startSec;
      stateRef.current.scrollX = Math.max(0, first * stateRef.current.zoomX - 60);
    }
    hadNotesRef.current = props.notes.length > 0;
    if (canvasRef.current) drawAll(canvasRef.current, stateRef.current);
  });

  // rAF loop for playhead when playing
  useEffect(() => {
    if (!propsRef.current.isPlaying) {
      stateRef.current.playheadSec = propsRef.current.getPlayheadSec();
      if (canvasRef.current) drawAll(canvasRef.current, stateRef.current);
      return;
    }
    let raf: number;
    function tick() {
      const s = stateRef.current;
      s.playheadSec = propsRef.current.getPlayheadSec();
      const canvas = canvasRef.current;
      if (canvas) {
        // Auto-follow: se il playhead esce dalla zona visibile (o torna
        // indietro per il loop), riposiziona lo scroll al 15% da sinistra.
        const W = canvas.width;
        const phPx = GUTTER + s.playheadSec * s.zoomX - s.scrollX;
        if (phPx > W * 0.8 || phPx < GUTTER) {
          s.scrollX = Math.max(0, s.playheadSec * s.zoomX - (W - GUTTER) * 0.15);
        }
        drawAll(canvas, s);
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [props.isPlaying, props.getPlayheadSec]);

  // ResizeObserver: resize canvas to container and redraw
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      // Cap difensivo: oltre ~16k px Chrome non alloca il buffer e il canvas
      // muore (placeholder bianco). Nessun layout legittimo arriva qui.
      canvas.width  = Math.min(el.clientWidth, 8192);
      canvas.height = Math.min(el.clientHeight, 4096);
      drawAll(canvas, stateRef.current);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Wheel zoom
  useEffect(() => {
    const canvas: HTMLCanvasElement | null = canvasRef.current;
    if (!canvas) return;
    const cv: HTMLCanvasElement = canvas;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const s = stateRef.current;
      const delta = e.deltaY > 0 ? 0.85 : 1 / 0.85;
      const mouseX = e.offsetX - GUTTER;
      const timeBefore = (mouseX + s.scrollX) / s.zoomX;
      s.zoomX = Math.max(20, Math.min(2000, s.zoomX * delta));
      s.scrollX = Math.max(0, timeBefore * s.zoomX - mouseX);
      drawAll(cv, s);
    }
    cv.addEventListener('wheel', onWheel, { passive: false });
    return () => cv.removeEventListener('wheel', onWheel);
  }, []);

  // Drag scroll + note hit-test + click-to-select + click-to-seek
  useEffect(() => {
    const canvas: HTMLCanvasElement | null = canvasRef.current;
    if (!canvas) return;
    const cv: HTMLCanvasElement = canvas;

    let dragging = false;
    let lastX = 0;
    let didDrag = false;

    function hitTestNote(mouseX: number, mouseY: number): string | null {
      const s = stateRef.current;
      const numRows = Math.max(MIN_ROWS,
        s.notes.length === 0 ? MIN_ROWS :
        (Math.max(...s.notes.map(n => n.midi)) - Math.min(...s.notes.map(n => n.midi)) + 7));
      const maxMidi = (s.notes.length === 0 ? 72 : Math.max(...s.notes.map(n => n.midi))) + 3;
      const H = cv.height;
      const rowH = H / numRows;
      for (let i = s.notes.length - 1; i >= 0; i--) {
        const note = s.notes[i];
        const x = GUTTER + note.startSec * s.zoomX - s.scrollX;
        const w = Math.max(4, note.durationSec * s.zoomX);
        const y = (maxMidi - note.midi) * rowH;
        if (mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + rowH) return note.id;
      }
      return null;
    }

    function onMouseDown(e: MouseEvent) {
      if (e.button !== 0) return;
      if (stateRef.current.editMode) return;
      dragging = true;
      didDrag = false;
      lastX = e.clientX;
    }

    function onMouseMove(e: MouseEvent) {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      if (Math.abs(dx) > 3) didDrag = true;
      lastX = e.clientX;
      stateRef.current.scrollX = Math.max(0, stateRef.current.scrollX - dx);
      drawAll(cv, stateRef.current);
    }

    function onMouseUp(e: MouseEvent) {
      if (!dragging) return;
      dragging = false;
      if (!didDrag) {
        const rect = cv.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const hitId = hitTestNote(mx, my);
        if (hitId !== null) {
          propsRef.current.onSelectNote(hitId, e.shiftKey || e.metaKey);
        } else if (my < 14 && mx > GUTTER) {
          const sec = (mx - GUTTER + stateRef.current.scrollX) / stateRef.current.zoomX;
          propsRef.current.onSeek(Math.max(0, sec));
        }
      }
    }

    cv.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      cv.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  // Edit-mode mouse interactions
  useEffect(() => {
    const canvas: HTMLCanvasElement | null = canvasRef.current;
    if (!canvas) return;
    const cv: HTMLCanvasElement = canvas;

    type DragOp =
      | { kind: 'time';  noteId: string; startX: number; origStart: number }
      | { kind: 'dur';   noteId: string; startX: number; origDur: number };

    let drag: DragOp | null = null;

    function getGeometry() {
      const s = stateRef.current;
      const n = s.notes;
      const numRows = n.length === 0 ? MIN_ROWS :
        Math.max(MIN_ROWS, Math.max(...n.map(x => x.midi)) - Math.min(...n.map(x => x.midi)) + 7);
      const maxMidi = (n.length === 0 ? 72 : Math.max(...n.map(x => x.midi))) + 3;
      const rowH = cv.height / numRows;
      return { numRows, maxMidi, rowH };
    }

    function hitTestEdit(mx: number, my: number): { noteId: string; region: 'edge' | 'body' } | null {
      const s = stateRef.current;
      const { maxMidi, rowH } = getGeometry();
      for (let i = s.notes.length - 1; i >= 0; i--) {
        const note = s.notes[i];
        const x = GUTTER + note.startSec * s.zoomX - s.scrollX;
        const w = Math.max(4, note.durationSec * s.zoomX);
        const y = (maxMidi - note.midi) * rowH;
        if (mx >= x && mx <= x + w && my >= y && my <= y + rowH) {
          const edgeW = Math.min(8, w * 0.3);
          return { noteId: note.id, region: mx >= x + w - edgeW ? 'edge' : 'body' };
        }
      }
      return null;
    }

    function onMouseDown(e: MouseEvent) {
      if (!propsRef.current.editMode) return;
      if (e.button !== 0) return;
      const rect = cv.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const hit = hitTestEdit(mx, my);
      if (!hit) return;
      e.stopPropagation();
      const s = stateRef.current;
      const note = s.notes.find(n => n.id === hit.noteId);
      if (!note) return;
      if (hit.region === 'edge') {
        drag = { kind: 'dur', noteId: note.id, startX: e.clientX, origDur: note.durationSec };
      } else {
        drag = { kind: 'time', noteId: note.id, startX: e.clientX, origStart: note.startSec };
      }
    }

    function onMouseMove(e: MouseEvent) {
      if (!drag) return;
      const s = stateRef.current;
      const dx = e.clientX - drag.startX;
      if (drag.kind === 'dur') {
        const newDur = Math.max(0.02, drag.origDur + dx / s.zoomX);
        propsRef.current.onEditNote(drag.noteId, { durationSec: newDur });
      } else {
        const newStart = Math.max(0, drag.origStart + dx / s.zoomX);
        propsRef.current.onEditNote(drag.noteId, { startSec: newStart });
      }
    }

    function onMouseUp() { drag = null; }

    function onDblClick(e: MouseEvent) {
      if (!propsRef.current.editMode) return;
      const rect = cv.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      if (hitTestEdit(mx, my)) return;
      const s = stateRef.current;
      const { maxMidi, rowH } = getGeometry();
      const sec = Math.max(0, (mx - GUTTER + s.scrollX) / s.zoomX);
      const midi = Math.round(maxMidi - my / rowH);
      propsRef.current.onCreateNote({ midi, cents: 0, startSec: sec, durationSec: 0.5 });
    }

    cv.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    cv.addEventListener('dblclick', onDblClick);
    return () => {
      cv.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      cv.removeEventListener('dblclick', onDblClick);
    };
  }, []);

  // Cursor changes based on editMode and hover
  useEffect(() => {
    const canvas: HTMLCanvasElement | null = canvasRef.current;
    if (!canvas) return;
    const cv: HTMLCanvasElement = canvas;

    function onMove(e: MouseEvent) {
      const s = stateRef.current;
      if (!s.editMode) {
        cv.style.cursor = 'default';
        return;
      }
      const rect = cv.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const n = s.notes;
      if (n.length === 0) { cv.style.cursor = 'crosshair'; return; }
      const numRows = Math.max(MIN_ROWS, Math.max(...n.map(x => x.midi)) - Math.min(...n.map(x => x.midi)) + 7);
      const maxMidi = Math.max(...n.map(x => x.midi)) + 3;
      const rowH = cv.height / numRows;
      for (let i = n.length - 1; i >= 0; i--) {
        const note = n[i];
        const x = GUTTER + note.startSec * s.zoomX - s.scrollX;
        const w = Math.max(4, note.durationSec * s.zoomX);
        const y = (maxMidi - note.midi) * rowH;
        if (mx >= x && mx <= x + w && my >= y && my <= y + rowH) {
          const edgeW = Math.min(8, w * 0.3);
          cv.style.cursor = mx >= x + w - edgeW ? 'ew-resize' : 'grab';
          return;
        }
      }
      cv.style.cursor = 'crosshair';
    }

    cv.addEventListener('mousemove', onMove);
    return () => cv.removeEventListener('mousemove', onMove);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative', borderRadius: 12 }}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
}
