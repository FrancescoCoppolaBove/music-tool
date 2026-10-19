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
const PITCH_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const GUTTER = 44;
const MIN_ROWS = 12;

interface RollState {
  notes: NoteEvent[];
  chords: ChordEvent[];
  bpm: number | null;
  duration: number;
  selectedIds: Set<string>;
  zoomX: number;
  scrollX: number;
  rowPx: number;   // 0 = auto-fit; >0 = fixed px per MIDI row (vertical zoom)
  scrollY: number; // pixel offset from top (only active when rowPx > 0)
  playheadSec: number;
  editMode: boolean;
}

interface RowParams {
  minMidi: number;
  maxMidi: number;
  numRows: number;
  rowH: number;
  scrollY: number;
  totalH: number;
}

function getRowParams(notes: NoteEvent[], H: number, rowPx: number, scrollY: number): RowParams {
  let minMidi = 60, maxMidi = 72;
  if (notes.length > 0) {
    minMidi = Infinity; maxMidi = -Infinity;
    for (const n of notes) {
      if (n.midi < minMidi) minMidi = n.midi;
      if (n.midi > maxMidi) maxMidi = n.midi;
    }
  }
  minMidi -= 3;
  maxMidi += 3;
  const numRows = Math.max(MIN_ROWS, maxMidi - minMidi + 1);
  maxMidi = minMidi + numRows - 1;
  const rowH = rowPx > 0 ? rowPx : H / numRows;
  const totalH = numRows * rowH;
  const sy = rowPx > 0 ? Math.max(0, Math.min(Math.max(0, totalH - H), scrollY)) : 0;
  return { minMidi, maxMidi, numRows, rowH, scrollY: sy, totalH };
}

function drawAll(canvas: HTMLCanvasElement, s: RollState): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;

  const { minMidi, maxMidi, rowH, scrollY, totalH } = getRowParams(s.notes, H, s.rowPx, s.scrollY);

  // ── Background: piano key rows ─────────────────────────────
  for (let m = minMidi; m <= maxMidi; m++) {
    const y = (maxMidi - m) * rowH - scrollY;
    if (y + rowH < 0 || y > H) continue;
    const isBlack = BLACK_PCS.has(m % 12);
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

  // Label every pitch; include octave numbers on C rows as stable landmarks.
  ctx.textBaseline = 'middle';
  for (let m = minMidi; m <= maxMidi; m++) {
    const y = (maxMidi - m) * rowH + rowH / 2 - scrollY;
    if (y < -rowH || y > H + rowH) continue;
    const pitchName = PITCH_NAMES[((m % 12) + 12) % 12];
    const label = pitchName === 'C' ? `C${Math.floor(m / 12) - 1}` : pitchName;
    ctx.font = `${Math.max(6, Math.min(10, rowH * 0.78))}px "DM Sans", sans-serif`;
    ctx.fillStyle = BLACK_PCS.has(m % 12) ? '#9ca3af' : '#6b7280';
    ctx.fillText(label, 4, y, GUTTER - 8);
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

  ctx.save();
  ctx.beginPath();
  ctx.rect(GUTTER, 0, W - GUTTER, H);
  ctx.clip();

  for (const note of s.notes) {
    const chordIdx = note.chordId !== undefined ? (chordIdxById.get(note.chordId) ?? -1) : -1;
    const color = chordIdx >= 0
      ? CHORD_PALETTE[chordIdx % CHORD_PALETTE.length]
      : '#4b5563';
    const x = GUTTER + note.startSec * s.zoomX - s.scrollX;
    const w = Math.max(4, note.durationSec * s.zoomX);
    const y = (maxMidi - note.midi) * rowH + 1 - scrollY;
    const h = rowH - 2;

    if (x + w < GUTTER || x > W) continue;
    if (y + h < 0 || y > H) continue;

    const isSelected = s.selectedIds.has(note.id);
    const isSounding = s.playheadSec >= note.startSec && s.playheadSec < note.startSec + note.durationSec;
    const lowConfidence = (note.confidence ?? 1) < 0.4;
    ctx.fillStyle = isSounding && chordIdx < 0 ? '#9ca3af' : color;
    ctx.globalAlpha = isSelected || isSounding ? 1 : lowConfidence ? 0.48 : 0.75;
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

    // Dashed outline for low-confidence notes
    if (lowConfidence) {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 2]);
      ctx.strokeRect(x + 0.5, y + 0.5, Math.max(1, w - 1), Math.max(1, h - 1));
      ctx.setLineDash([]);
    }

    // Note name label
    if (w >= 28 && rowH >= 9) {
      const noteName = `${PITCH_NAMES[((note.midi % 12) + 12) % 12]}${Math.floor(note.midi / 12) - 1}`;
      ctx.font = `600 ${Math.min(11, Math.max(8, rowH * 0.7))}px "DM Sans", sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(noteName, x + 4, y + h / 2, Math.max(0, w - 8));
    }
  }
  ctx.restore();

  // ── Playhead ──────────────────────────────────────────────
  const phX = GUTTER + s.playheadSec * s.zoomX - s.scrollX;
  if (phX >= GUTTER && phX <= W) {
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(phX, 0);
    ctx.lineTo(phX, H);
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(phX - 5, 0);
    ctx.lineTo(phX + 5, 0);
    ctx.lineTo(phX, 8);
    ctx.closePath();
    ctx.fill();
  }

  // ── Vertical scrollbar (when content overflows) ───────────
  if (s.rowPx > 0 && totalH > H) {
    const trackH = H - 4;
    const thumbH = Math.max(20, (H / totalH) * trackH);
    const thumbY = 2 + (scrollY / Math.max(1, totalH - H)) * (trackH - thumbH);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(W - 6, thumbY, 4, thumbH);
  }
}

export default function PianoRoll(props: PianoRollProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef     = useRef<RollState>({
    notes: [], chords: [], bpm: null, duration: 0,
    selectedIds: new Set(), zoomX: 120, scrollX: 0,
    rowPx: 0, scrollY: 0, playheadSec: 0, editMode: false,
  });
  const propsRef = useRef(props);
  const hadNotesRef = useRef(false);

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
    if (!hadNotesRef.current && props.notes.length > 0) {
      let first = Infinity;
      for (const n of props.notes) if (n.startSec < first) first = n.startSec;
      stateRef.current.scrollX = Math.max(0, first * stateRef.current.zoomX - 60);
      stateRef.current.rowPx = 0;
      stateRef.current.scrollY = 0;
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

  // ResizeObserver
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width  = Math.min(el.clientWidth, 8192);
      canvas.height = Math.min(el.clientHeight, 4096);
      drawAll(canvas, stateRef.current);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Wheel: horizontal zoom (normal) + vertical zoom (Shift)
  useEffect(() => {
    const canvas: HTMLCanvasElement | null = canvasRef.current;
    if (!canvas) return;
    const cv: HTMLCanvasElement = canvas;

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const s = stateRef.current;

      if (e.shiftKey) {
        // ── Vertical zoom ──────────────────────────────────────
        const H = cv.height;
        const params = getRowParams(s.notes, H, s.rowPx, s.scrollY);
        const { rowH: currentRowH, scrollY: oldScrollY } = params;
        const delta = e.deltaY > 0 ? 0.85 : 1 / 0.85;
        const newRowPx = Math.max(8, Math.min(80, currentRowH * delta));
        const autoRowH = H / params.numRows;

        if (Math.abs(newRowPx - autoRowH) < 0.8 && newRowPx < currentRowH) {
          s.rowPx = 0;
          s.scrollY = 0;
        } else {
          // Anchor: keep the MIDI pitch under the cursor at the same Y position
          const ratio = newRowPx / currentRowH;
          s.rowPx = newRowPx;
          s.scrollY = Math.max(0, e.offsetY * (ratio - 1) + oldScrollY * ratio);
        }
      } else {
        // ── Horizontal zoom ────────────────────────────────────
        const delta = e.deltaY > 0 ? 0.85 : 1 / 0.85;
        const mouseX = e.offsetX - GUTTER;
        const timeBefore = (mouseX + s.scrollX) / s.zoomX;
        s.zoomX = Math.max(20, Math.min(2000, s.zoomX * delta));
        s.scrollX = Math.max(0, timeBefore * s.zoomX - mouseX);
      }
      drawAll(cv, s);
    }
    cv.addEventListener('wheel', onWheel, { passive: false });
    return () => cv.removeEventListener('wheel', onWheel);
  }, []);

  // Drag scroll (horizontal always, vertical when rowPx > 0) + hit-test
  useEffect(() => {
    const canvas: HTMLCanvasElement | null = canvasRef.current;
    if (!canvas) return;
    const cv: HTMLCanvasElement = canvas;

    let dragging = false;
    let lastX = 0;
    let lastY = 0;
    let didDrag = false;

    function hitTestNote(mouseX: number, mouseY: number): string | null {
      const s = stateRef.current;
      const { maxMidi, rowH, scrollY } = getRowParams(s.notes, cv.height, s.rowPx, s.scrollY);
      for (let i = s.notes.length - 1; i >= 0; i--) {
        const note = s.notes[i];
        const x = GUTTER + note.startSec * s.zoomX - s.scrollX;
        const w = Math.max(4, note.durationSec * s.zoomX);
        const y = (maxMidi - note.midi) * rowH - scrollY;
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
      lastY = e.clientY;
    }

    function onMouseMove(e: MouseEvent) {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag = true;
      lastX = e.clientX;
      lastY = e.clientY;
      const s = stateRef.current;
      s.scrollX = Math.max(0, s.scrollX - dx);
      if (s.rowPx > 0) {
        const { totalH } = getRowParams(s.notes, cv.height, s.rowPx, s.scrollY);
        s.scrollY = Math.max(0, Math.min(Math.max(0, totalH - cv.height), s.scrollY + dy));
      }
      drawAll(cv, s);
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
      const { maxMidi, rowH, scrollY } = getRowParams(s.notes, cv.height, s.rowPx, s.scrollY);
      return { maxMidi, rowH, scrollY };
    }

    function hitTestEdit(mx: number, my: number): { noteId: string; region: 'edge' | 'body' } | null {
      const s = stateRef.current;
      const { maxMidi, rowH, scrollY } = getGeometry();
      for (let i = s.notes.length - 1; i >= 0; i--) {
        const note = s.notes[i];
        const x = GUTTER + note.startSec * s.zoomX - s.scrollX;
        const w = Math.max(4, note.durationSec * s.zoomX);
        const y = (maxMidi - note.midi) * rowH - scrollY;
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
        propsRef.current.onEditNote(drag.noteId, { durationSec: Math.max(0.02, drag.origDur + dx / s.zoomX) });
      } else {
        propsRef.current.onEditNote(drag.noteId, { startSec: Math.max(0, drag.origStart + dx / s.zoomX) });
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
      const { maxMidi, rowH, scrollY } = getGeometry();
      const sec = Math.max(0, (mx - GUTTER + s.scrollX) / s.zoomX);
      const midi = Math.round(maxMidi - (my + scrollY) / rowH);
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
      if (!s.editMode) { cv.style.cursor = 'default'; return; }
      const rect = cv.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const n = s.notes;
      if (n.length === 0) { cv.style.cursor = 'crosshair'; return; }
      const { maxMidi, rowH, scrollY } = getRowParams(n, cv.height, s.rowPx, s.scrollY);
      for (let i = n.length - 1; i >= 0; i--) {
        const note = n[i];
        const x = GUTTER + note.startSec * s.zoomX - s.scrollX;
        const w = Math.max(4, note.durationSec * s.zoomX);
        const y = (maxMidi - note.midi) * rowH - scrollY;
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
      title="Scroll: zoom orizzontale | Shift+Scroll: zoom verticale | Trascina: scorrimento"
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />
    </div>
  );
}
