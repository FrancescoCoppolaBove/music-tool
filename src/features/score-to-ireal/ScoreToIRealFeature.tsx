import { useState, useRef, useCallback, useMemo } from 'react';
import { Chord } from 'tonal';
import { audioPlayer } from '../ear-training/utils/audio-player';

// ─── Fonts ────────────────────────────────────────────────────────────────────
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@700;800&display=swap');`;

// ─── Types ────────────────────────────────────────────────────────────────────
type SectionType = 'Intro' | 'A' | 'B' | 'C' | 'D' | 'Verse' | 'Chorus' | 'Bridge' | 'Outro';
type TimeSig = '4/4' | '3/4' | '6/8' | '5/4' | '7/4' | '2/4';

interface ChordBar {
  id: string;
  chords: string[];
  isRest: boolean;
  isRepeatBar: boolean;
}

interface SongSection {
  id: string;
  type: SectionType;
  repeat: boolean;
  bars: ChordBar[];
}

interface SongData {
  title: string;
  composer: string;
  style: string;
  key: string;
  timeSignature: TimeSig;
  sections: SongSection[];
}

interface UploadedImage {
  id: string;
  name: string;
  objectUrl: string;
  base64: string;
  mimeType: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const STYLES = [
  'Jazz Swing', 'Medium Jazz', 'Fast Swing', 'Slow Swing', 'Latin',
  'Bossa Nova', 'Samba', 'Jazz Ballad', 'Pop Ballad', 'Funk',
  'Rock', 'R&B', 'Gospel', 'Blues', 'Afro-Cuban', 'Waltz', 'Even 8ths',
];

const KEYS = [
  'C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B',
  'A-', 'Bb-', 'B-', 'C-', 'C#-', 'D-', 'Eb-', 'E-', 'F-', 'F#-', 'G-', 'Ab-',
];

const TIME_SIGS: TimeSig[] = ['4/4', '3/4', '6/8', '5/4', '7/4', '2/4'];

const SECTION_TYPES: SectionType[] = ['Intro', 'A', 'B', 'C', 'D', 'Verse', 'Chorus', 'Bridge', 'Outro'];

// In local dev VITE_API_URL=http://localhost:3001 (from .env).
// In production (Netlify) it's not set → empty string → relative URL
// → Netlify redirect rule sends /api/* to the Netlify Function.
const API_URL = import.meta.env.VITE_API_URL || '';

// ─── Utilities ────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function defaultBar(): ChordBar {
  return { id: uid(), chords: [], isRest: false, isRepeatBar: false };
}

function defaultSection(type: SectionType = 'A', barCount = 8): SongSection {
  return {
    id: uid(),
    type,
    repeat: false,
    bars: Array.from({ length: barCount }, defaultBar),
  };
}

const DEFAULT_SONG: SongData = {
  title: '',
  composer: '',
  style: 'Jazz Swing',
  key: 'C',
  timeSignature: '4/4',
  sections: [defaultSection('A', 8)],
};

// Convert common chord notation to iReal Pro notation
function toIReal(chord: string): string {
  if (!chord.trim()) return '';
  const c = chord.trim();
  if (c === 'n') return 'n';
  if (c === 'r') return 'r';
  if (c === 'x' || c === '%') return 'x';

  const m = c.match(/^([A-G][b#]?)(.*)/);
  if (!m) return c;
  const root = m[1];
  let q = m[2] || '';

  // Half-diminished / m7b5 (before other min patterns)
  q = q.replace(/m7b5|min7b5|-7b5|ø7?/g, 'h7');
  // Maj variants (long before short)
  q = q.replace(/maj7|Maj7|M7/g, '^7');
  q = q.replace(/maj9|Maj9/g, '^9');
  q = q.replace(/maj11|Maj11/g, '^11');
  q = q.replace(/maj13|Maj13/g, '^13');
  q = q.replace(/maj|Maj/g, '^');
  // Min variants (long before short)
  q = q.replace(/min7|m7/g, '-7');
  q = q.replace(/min9|m9/g, '-9');
  q = q.replace(/min11|m11/g, '-11');
  q = q.replace(/minor|min/g, '-');
  if (q === 'm' || q === 'm ') q = '-';
  // Dim
  q = q.replace(/dim7|°7/g, 'o7');
  q = q.replace(/dim(?!7)|°(?!7)/g, 'o');
  // Aug / sus
  q = q.replace(/aug/g, '+');
  q = q.replace(/sus4/g, 'sus');
  q = q.replace(/sus2/g, '2');

  return root + q;
}

// Build iReal Pro chart string
function buildIRealChart(song: SongData): string {
  const timeSigMap: Record<TimeSig, string> = {
    '4/4': 'T44', '3/4': 'T34', '6/8': 'T68',
    '5/4': 'T54', '7/4': 'T74', '2/4': 'T24',
  };
  const sectionMap: Record<SectionType, string> = {
    'Intro': '*i', 'A': '*A', 'B': '*B', 'C': '*C', 'D': '*D',
    'Verse': '*v', 'Chorus': '*B', 'Bridge': '*C', 'Outro': '*o',
  };

  const ts = timeSigMap[song.timeSignature] ?? 'T44';

  return song.sections.map((section, sIdx) => {
    const isLastSection = sIdx === song.sections.length - 1;
    const marker = sectionMap[section.type] ?? '*A';
    const timePart = sIdx === 0 ? ts : '';

    // Build bar content strings
    const barStrings = section.bars.map(bar => {
      if (bar.isRest) return 'r';
      if (bar.isRepeatBar) return 'x';
      if (bar.chords.length === 0) return 'n';
      return bar.chords.map(toIReal).filter(Boolean).join(' ');
    });

    // Last bar of last section gets Z, last bar of other sections gets nothing (bracket closes)
    const barsJoined = barStrings
      .map((b, i) => {
        const isLast = i === barStrings.length - 1;
        if (isLast && isLastSection) return b + ' Z';
        if (isLast) return b;
        return b + ' |';
      })
      .join('');

    if (section.repeat) {
      return `[${marker}${timePart}{${barsJoined}}]`;
    }
    return `[${marker}${timePart}${barsJoined}]`;
  }).join('');
}

function buildIRealURL(song: SongData): string {
  const chart = buildIRealChart(song);
  const title = song.title || 'Untitled';
  const composer = song.composer || 'Unknown';
  // Only title and composer need encoding; key, style, chart use raw iReal chars
  const payload = `${encodeURIComponent(title)}=${encodeURIComponent(composer)}=${song.style}=${song.key}=n=${chart}`;
  return `irealbook://${payload}`;
}

// Generate HTML for printing
function buildPrintHTML(song: SongData): string {
  const beatsPerBar: Record<TimeSig, number> = {
    '4/4': 4, '3/4': 3, '6/8': 6, '5/4': 5, '7/4': 7, '2/4': 2,
  };
  const bpb = beatsPerBar[song.timeSignature] ?? 4;
  const barsPerRow = Math.min(bpb === 3 ? 4 : 4, 8);

  const sectionsHTML = song.sections.map(section => {
    const barsHTML = section.bars.map((bar, i) => {
      const chord = bar.isRest ? '𝄺'
        : bar.isRepeatBar ? '𝄎'
        : bar.chords.length === 0 ? '—'
        : bar.chords.join('  ');
      return `<div class="bar" style="border-right: ${i % barsPerRow === barsPerRow - 1 ? '3px solid #333' : '1px solid #aaa'}">
        <span class="bar-num">${i + 1}</span>
        <span class="chord-name">${chord}</span>
      </div>`;
    }).join('');

    return `<div class="section">
      <div class="section-label">${section.repeat ? '‖: ' : ''}${section.type}${section.repeat ? ' :‖' : ''}</div>
      <div class="bars">${barsHTML}</div>
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${song.title || 'Chord Chart'}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;600&family=DM+Mono&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'EB Garamond', serif; padding: 32px 40px; color: #111; background: #fff; }
  .header { text-align: center; margin-bottom: 28px; border-bottom: 2px solid #111; padding-bottom: 14px; }
  .title { font-size: 28px; font-weight: 600; letter-spacing: -0.5px; }
  .meta { font-size: 13px; color: #555; margin-top: 4px; font-family: 'DM Mono', monospace; }
  .section { margin-bottom: 20px; }
  .section-label { font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 500;
    letter-spacing: 0.1em; text-transform: uppercase; color: #666; margin-bottom: 6px; }
  .bars { display: grid; grid-template-columns: repeat(${barsPerRow}, 1fr);
    border: 2px solid #333; border-right: none; }
  .bar { position: relative; height: 60px; padding: 6px 8px;
    border-right: 1px solid #aaa; display: flex; align-items: center; justify-content: center; }
  .bar-num { position: absolute; top: 4px; left: 5px; font-size: 9px;
    color: #bbb; font-family: 'DM Mono', monospace; }
  .chord-name { font-family: 'DM Mono', monospace; font-size: 16px; font-weight: 500;
    color: #111; text-align: center; }
  @media print {
    body { padding: 20px 28px; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
<div class="header">
  <div class="title">${song.title || 'Untitled'}</div>
  <div class="meta">${song.composer ? `${song.composer} · ` : ''}${song.style} · ${song.key} · ${song.timeSignature}</div>
</div>
${sectionsHTML}
<div class="no-print" style="margin-top:32px;text-align:center;font-size:13px;color:#888;font-family:monospace">
  ⌘P / Ctrl+P → Save as PDF
</div>
</body>
</html>`;
}

// Convert File to base64 + objectUrl
function readImageFile(file: File): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1];
      resolve({
        id: uid(),
        name: file.name,
        objectUrl: URL.createObjectURL(file),
        base64,
        mimeType: file.type || 'image/png',
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabButton({
  active, onClick, children, color,
}: {
  active: boolean; onClick: () => void; children: React.ReactNode; color: string;
}) {
  return (
    <button onClick={onClick} style={{
      padding: '9px 20px',
      border: 'none',
      borderBottom: active ? `2px solid ${color}` : '2px solid transparent',
      background: active ? `${color}12` : 'transparent',
      color: active ? color : '#6b7280',
      fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 500,
      textTransform: 'uppercase', letterSpacing: '0.1em',
      cursor: 'pointer', transition: 'all 0.14s', marginBottom: -1,
      borderRadius: '5px 5px 0 0',
    }}>
      {children}
    </button>
  );
}

function BarCell({
  bar, color, beatsPerBar, onUpdate, onDelete,
}: {
  bar: ChordBar;
  color: string;
  beatsPerBar: number;
  onUpdate: (chords: string[], isRest: boolean, isRepeatBar: boolean) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const displayText = bar.isRest ? 'rest'
    : bar.isRepeatBar ? '%'
    : bar.chords.length === 0 ? ''
    : bar.chords.join(' ');

  const chordCount = bar.chords.length;
  const bgColor = bar.isRest || bar.isRepeatBar ? `${color}0a`
    : chordCount === 0 ? 'transparent'
    : `${color}${chordCount === 1 ? '10' : chordCount === 2 ? '18' : '20'}`;

  function startEdit() {
    setDraft(displayText === 'rest' ? 'r' : displayText === '%' ? 'x' : displayText);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  }

  function commitEdit() {
    setEditing(false);
    const val = draft.trim();
    if (val === 'r') { onUpdate([], true, false); return; }
    if (val === 'x' || val === '%') { onUpdate([], false, true); return; }
    const chords = val === '' ? [] : val.split(/\s+/).filter(Boolean);
    onUpdate(chords, false, false);
  }

  return (
    <div
      style={{
        width: `${Math.max(60, 100 / beatsPerBar)}%`,
        minWidth: 56,
        maxWidth: 140,
        height: 58,
        border: `1px solid ${chordCount > 0 ? color + '44' : '#30363d'}`,
        borderRadius: 6,
        background: bgColor,
        position: 'relative',
        cursor: 'pointer',
        flexShrink: 0,
      }}
      onClick={() => !editing && startEdit()}
    >
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={e => {
            if (e.key === 'Enter') commitEdit();
            if (e.key === 'Escape') setEditing(false);
          }}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            background: `${color}22`, border: `2px solid ${color}`,
            borderRadius: 6, padding: '4px 6px',
            fontFamily: "'DM Mono', monospace", fontSize: 12,
            color: '#e6edf3', outline: 'none', textAlign: 'center',
          }}
        />
      ) : (
        <>
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 6px',
          }}>
            <span style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: chordCount > 2 ? 10 : 13,
              fontWeight: 500,
              color: chordCount > 0 ? color : '#4b5563',
              textAlign: 'center',
              lineHeight: 1.3,
              wordBreak: 'break-all',
            }}>
              {displayText || '·'}
            </span>
          </div>
          <button
            onClick={e => { e.stopPropagation(); onDelete(); }}
            style={{
              position: 'absolute', top: -6, right: -6,
              width: 16, height: 16, borderRadius: '50%',
              background: '#30363d', border: 'none',
              color: '#6b7280', fontSize: 10,
              cursor: 'pointer', display: 'none',
              alignItems: 'center', justifyContent: 'center',
              lineHeight: 1,
            }}
            className="bar-delete"
          >
            ×
          </button>
        </>
      )}
    </div>
  );
}

function SectionCard({
  section, color, beatsPerBar, onChange, onDelete,
}: {
  section: SongSection;
  color: string;
  beatsPerBar: number;
  onChange: (s: SongSection) => void;
  onDelete: () => void;
}) {
  function updateBar(barId: string, chords: string[], isRest: boolean, isRepeatBar: boolean) {
    onChange({
      ...section,
      bars: section.bars.map(b => b.id === barId ? { ...b, chords, isRest, isRepeatBar } : b),
    });
  }

  function deleteBar(barId: string) {
    onChange({ ...section, bars: section.bars.filter(b => b.id !== barId) });
  }

  function addBar() {
    onChange({ ...section, bars: [...section.bars, defaultBar()] });
  }

  const selectStyle: React.CSSProperties = {
    background: '#1c2128', border: '1px solid #30363d', color: '#c9d1d9',
    fontFamily: "'DM Mono', monospace", fontSize: 11,
    borderRadius: 5, padding: '4px 8px', cursor: 'pointer',
    WebkitAppearance: 'none' as const,
  };

  return (
    <div style={{
      border: `1px solid ${color}25`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 10, background: '#161b22',
      marginBottom: 16, overflow: 'hidden',
    }}>
      {/* Section header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 16px', borderBottom: '1px solid #21262d',
        background: `${color}08`,
      }}>
        <select
          value={section.type}
          onChange={e => onChange({ ...section, type: e.target.value as SectionType })}
          style={{ ...selectStyle, fontWeight: 500 }}
        >
          {SECTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={section.repeat}
            onChange={e => onChange({ ...section, repeat: e.target.checked })}
            style={{ accentColor: color }}
          />
          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#6b7280' }}>
            Repeat
          </span>
        </label>

        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#4b5563', marginLeft: 4 }}>
          {section.bars.length} bars
        </span>

        <div style={{ flex: 1 }} />

        <button
          onClick={onDelete}
          style={{
            background: 'none', border: '1px solid #30363d', borderRadius: 5,
            color: '#6b7280', fontFamily: "'DM Mono', monospace", fontSize: 10,
            padding: '3px 9px', cursor: 'pointer',
          }}
        >
          Remove section
        </button>
      </div>

      {/* Bar grid */}
      <div style={{ padding: '14px 16px' }}>
        <style>{`.bar-cell:hover .bar-delete { display: flex !important; }`}</style>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {section.bars.map(bar => (
            <div key={bar.id} className="bar-cell">
              <BarCell
                bar={bar}
                color={color}
                beatsPerBar={beatsPerBar}
                onUpdate={(chords, isRest, isRepeatBar) => updateBar(bar.id, chords, isRest, isRepeatBar)}
                onDelete={() => deleteBar(bar.id)}
              />
            </div>
          ))}
          <button
            onClick={addBar}
            style={{
              width: 56, height: 58,
              border: '1px dashed #30363d', borderRadius: 6,
              background: 'transparent', color: '#4b5563',
              fontFamily: "'DM Mono', monospace", fontSize: 18,
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            +
          </button>
        </div>
        <div style={{ marginTop: 8, fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#4b5563' }}>
          Click a cell to edit · Space-separated chords per bar · r = rest · x = repeat bar
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ScoreToIRealFeature() {
  const [tab, setTab] = useState<'import' | 'editor' | 'export'>('import');
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [selectedImg, setSelectedImg] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [song, setSong] = useState<SongData>({ ...DEFAULT_SONG });
  const [copied, setCopied] = useState(false);
  const [playingProg, setPlayingProg] = useState(false);
  const stopPlayRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const COLOR = '#7c3aed';
  const CYAN = '#06b6d4';

  const beatsPerBar: Record<TimeSig, number> = {
    '4/4': 4, '3/4': 3, '6/8': 6, '5/4': 5, '7/4': 7, '2/4': 2,
  };
  const bpb = beatsPerBar[song.timeSignature] ?? 4;

  const iRealURL = useMemo(() => buildIRealURL(song), [song]);

  // ── Image upload ────────────────────────────────────────────────────────────

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;
    const loaded = await Promise.all(imageFiles.map(readImageFile));
    setImages(prev => [...prev, ...loaded]);
    setAnalyzeError(null);
  }, []);

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  function removeImage(id: string) {
    setImages(prev => {
      const next = prev.filter(i => i.id !== id);
      setSelectedImg(0);
      return next;
    });
  }

  // ── AI analysis ─────────────────────────────────────────────────────────────

  async function analyzeImages() {
    if (images.length === 0) return;
    setAnalyzing(true);
    setAnalyzeError(null);

    try {
      const payload = images.map(img => ({ base64: img.base64, mimeType: img.mimeType }));
      const resp = await fetch(`${API_URL}/api/score/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images: payload }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: resp.statusText }));
        throw new Error(err.error || 'Analysis failed');
      }

      const data = await resp.json();
      const s = data.song;

      // Build SongData from the API response
      const newSong: SongData = {
        title: s.title || '',
        composer: s.composer || '',
        style: STYLES.includes(s.style) ? s.style : 'Jazz Swing',
        key: KEYS.includes(s.key) ? s.key : 'C',
        timeSignature: (['4/4','3/4','6/8','5/4','7/4','2/4'] as TimeSig[]).includes(s.timeSignature)
          ? s.timeSignature : '4/4',
        sections: (s.sections || []).map((sec: { type?: string; repeat?: boolean; bars?: { chords?: string[] }[] }) => ({
          id: uid(),
          type: SECTION_TYPES.includes(sec.type as SectionType) ? sec.type as SectionType : 'A',
          repeat: sec.repeat || false,
          bars: (sec.bars || []).map((bar: { chords?: string[] }) => ({
            id: uid(),
            chords: bar.chords || [],
            isRest: false,
            isRepeatBar: false,
          })),
        })),
      };

      if (newSong.sections.length === 0) {
        newSong.sections = [defaultSection('A', 8)];
      }

      setSong(newSong);
      setTab('editor');
    } catch (err) {
      setAnalyzeError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setAnalyzing(false);
    }
  }

  // ── Song editing ─────────────────────────────────────────────────────────────

  function updateMeta<K extends keyof SongData>(key: K, value: SongData[K]) {
    setSong(prev => ({ ...prev, [key]: value }));
  }

  function updateSection(updated: SongSection) {
    setSong(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.id === updated.id ? updated : s),
    }));
  }

  function deleteSection(id: string) {
    setSong(prev => ({
      ...prev,
      sections: prev.sections.length > 1 ? prev.sections.filter(s => s.id !== id) : prev.sections,
    }));
  }

  function addSection() {
    setSong(prev => ({
      ...prev,
      sections: [...prev.sections, defaultSection('B', 8)],
    }));
  }

  // ── Export ──────────────────────────────────────────────────────────────────

  function copyURL() {
    navigator.clipboard.writeText(iRealURL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function openInIReal() {
    window.open(iRealURL, '_blank');
  }

  function printPDF() {
    const html = buildPrintHTML(song);
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 600);
  }

  // ── Shared style helpers ─────────────────────────────────────────────────────

  const inputStyle: React.CSSProperties = {
    background: '#1c2128', border: '1px solid #30363d', borderRadius: 6,
    color: '#e6edf3', fontFamily: "'DM Mono', monospace", fontSize: 12,
    padding: '8px 12px', outline: 'none', width: '100%', boxSizing: 'border-box',
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    WebkitAppearance: 'none' as const, cursor: 'pointer',
  };

  const btnPrimary: React.CSSProperties = {
    padding: '10px 22px', borderRadius: 7,
    background: `linear-gradient(135deg, ${COLOR}, #6d28d9)`,
    border: 'none', color: '#fff',
    fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 500,
    cursor: 'pointer', letterSpacing: '0.04em',
  };

  const btnSecondary: React.CSSProperties = {
    padding: '10px 18px', borderRadius: 7,
    background: 'transparent', border: `1px solid ${COLOR}55`,
    color: COLOR, fontFamily: "'DM Mono', monospace",
    fontSize: 12, cursor: 'pointer',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: "'DM Mono', monospace", fontSize: 9,
    textTransform: 'uppercase', letterSpacing: '0.1em',
    color: '#4b5563', display: 'block', marginBottom: 5,
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3' }}>
      <style>{FONTS}</style>
      <style>{`
        .bar-cell:hover .bar-delete { display: flex !important; }
        input[type=file] { display: none; }
        select option { background: #1c2128; }
      `}</style>

      {/* Header */}
      <div style={{ padding: '28px 0 0', borderBottom: '1px solid #21262d' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ marginBottom: 4 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#4b5563', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Composition · Import
            </span>
          </div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 26, letterSpacing: '-0.5px', color: '#e6edf3', margin: '0 0 20px' }}>
            Score → iReal Pro
          </h1>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid #21262d', marginBottom: -1 }}>
            <TabButton active={tab === 'import'}  onClick={() => setTab('import')}  color={COLOR}>① Import</TabButton>
            <TabButton active={tab === 'editor'}  onClick={() => setTab('editor')}  color={CYAN}>② Edit Chart</TabButton>
            <TabButton active={tab === 'export'}  onClick={() => setTab('export')}  color='#10b981'>③ Export</TabButton>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 24px 64px' }}>

        {/* ── IMPORT TAB ──────────────────────────────────────────────────────── */}
        {tab === 'import' && (
          <div>
            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? COLOR : '#30363d'}`,
                borderRadius: 12,
                background: dragging ? `${COLOR}08` : '#161b22',
                padding: '48px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s',
                marginBottom: 24,
              }}
            >
              <div style={{ fontSize: 36, marginBottom: 12 }}>🎼</div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 18, color: '#e6edf3', marginBottom: 6 }}>
                Drop score screenshots here
              </div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#6b7280', marginBottom: 14 }}>
                PNG, JPG, WebP — multiple pages supported
              </div>
              <div style={{ display: 'inline-block', padding: '8px 20px', borderRadius: 6, border: `1px solid ${COLOR}55`, color: COLOR, fontFamily: "'DM Mono', monospace", fontSize: 11 }}>
                Browse files
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={e => handleFiles(e.target.files)}
            />

            {/* Uploaded images */}
            {images.length > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#6b7280', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {images.length} page{images.length !== 1 ? 's' : ''} loaded
                  </span>
                  <button
                    onClick={() => { setImages([]); setSelectedImg(0); }}
                    style={{ background: 'none', border: 'none', color: '#4b5563', fontFamily: "'DM Mono', monospace", fontSize: 10, cursor: 'pointer' }}
                  >
                    Clear all
                  </button>
                </div>

                {/* Thumbnail strip */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
                  {images.map((img, i) => (
                    <div key={img.id} style={{ position: 'relative', flexShrink: 0 }}>
                      <div
                        onClick={() => setSelectedImg(i)}
                        style={{
                          width: 90, height: 64,
                          borderRadius: 6,
                          border: `2px solid ${selectedImg === i ? COLOR : '#30363d'}`,
                          overflow: 'hidden', cursor: 'pointer',
                          background: '#0d1117',
                        }}
                      >
                        <img src={img.objectUrl} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      <button
                        onClick={() => removeImage(img.id)}
                        style={{
                          position: 'absolute', top: -5, right: -5,
                          width: 18, height: 18, borderRadius: '50%',
                          background: '#30363d', border: 'none',
                          color: '#8b949e', fontSize: 11, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        ×
                      </button>
                      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: '#4b5563', textAlign: 'center', marginTop: 3 }}>
                        p.{i + 1}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Large preview */}
                {images[selectedImg] && (
                  <div style={{
                    borderRadius: 10, overflow: 'hidden',
                    border: '1px solid #30363d', marginBottom: 20,
                    maxHeight: 520, background: '#0d1117',
                    display: 'flex', justifyContent: 'center',
                  }}>
                    <img
                      src={images[selectedImg].objectUrl}
                      alt="Preview"
                      style={{ maxWidth: '100%', maxHeight: 520, objectFit: 'contain' }}
                    />
                  </div>
                )}

                {/* Analyze button */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <button
                    onClick={analyzeImages}
                    disabled={analyzing}
                    style={{
                      ...btnPrimary,
                      opacity: analyzing ? 0.7 : 1,
                      cursor: analyzing ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {analyzing ? '⟳ Analyzing…' : `✦ Analyze with AI${images.length > 1 ? ` (${images.length} pages)` : ''}`}
                  </button>

                  <button onClick={() => setTab('editor')} style={btnSecondary}>
                    Skip → Edit manually
                  </button>

                  {analyzeError && (
                    <div style={{
                      padding: '8px 14px', borderRadius: 6,
                      background: '#ff000012', border: '1px solid #ff000033',
                      fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#f87171',
                    }}>
                      {analyzeError}
                    </div>
                  )}
                </div>

                <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 6, background: '#161b22', border: '1px solid #21262d' }}>
                  <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#4b5563' }}>
                    ℹ️ &nbsp;AI analysis requires{' '}
                    <code style={{ color: '#6b7280' }}>AI_API_KEY</code> in the server{' '}
                    <code style={{ color: '#6b7280' }}>.env</code> file. Without it you can still edit the chart manually.
                  </span>
                </div>
              </div>
            )}

            {images.length === 0 && (
              <div style={{ textAlign: 'center', marginTop: 12 }}>
                <button onClick={() => setTab('editor')} style={{ ...btnSecondary, fontSize: 11 }}>
                  Skip — start from a blank chart →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── EDITOR TAB ──────────────────────────────────────────────────────── */}
        {tab === 'editor' && (
          <div>
            {/* Metadata row */}
            <div style={{
              background: '#161b22', border: '1px solid #21262d',
              borderRadius: 10, padding: '18px 20px', marginBottom: 22,
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 12 }}>
                {/* Title */}
                <div style={{ gridColumn: '1/3' }}>
                  <label style={labelStyle}>Title</label>
                  <input
                    style={inputStyle}
                    placeholder="Song title"
                    value={song.title}
                    onChange={e => updateMeta('title', e.target.value)}
                  />
                </div>

                {/* Composer */}
                <div style={{ gridColumn: '3/5' }}>
                  <label style={labelStyle}>Composer</label>
                  <input
                    style={inputStyle}
                    placeholder="Composer"
                    value={song.composer}
                    onChange={e => updateMeta('composer', e.target.value)}
                  />
                </div>

                {/* Style */}
                <div>
                  <label style={labelStyle}>Style</label>
                  <select style={selectStyle} value={song.style} onChange={e => updateMeta('style', e.target.value)}>
                    {STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* Key */}
                <div>
                  <label style={labelStyle}>Key</label>
                  <select style={selectStyle} value={song.key} onChange={e => updateMeta('key', e.target.value)}>
                    {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>

                {/* Time sig */}
                <div>
                  <label style={labelStyle}>Time Signature</label>
                  <select style={selectStyle} value={song.timeSignature} onChange={e => updateMeta('timeSignature', e.target.value as TimeSig)}>
                    {TIME_SIGS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Sections */}
            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Sections — {song.sections.length} section{song.sections.length !== 1 ? 's' : ''} · {song.sections.reduce((t, s) => t + s.bars.length, 0)} bars total
              </span>
              <button
                onClick={() => setSong({ ...DEFAULT_SONG, title: song.title, composer: song.composer })}
                style={{ background: 'none', border: 'none', color: '#4b5563', fontFamily: "'DM Mono', monospace", fontSize: 10, cursor: 'pointer' }}
              >
                Reset chart
              </button>
            </div>

            {song.sections.map(section => (
              <SectionCard
                key={section.id}
                section={section}
                color={CYAN}
                beatsPerBar={bpb}
                onChange={updateSection}
                onDelete={() => deleteSection(section.id)}
              />
            ))}

            <button
              onClick={addSection}
              style={{
                width: '100%', padding: '14px',
                border: '1px dashed #30363d', borderRadius: 10,
                background: 'transparent', color: '#4b5563',
                fontFamily: "'DM Mono', monospace", fontSize: 11,
                cursor: 'pointer', letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              + Add Section
            </button>

            <div style={{ marginTop: 22, display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                onClick={async () => {
                  if (playingProg) { stopPlayRef.current = true; return; }
                  stopPlayRef.current = false;
                  setPlayingProg(true);
                  const allChords = song.sections.flatMap(s =>
                    s.bars.flatMap(b => b.isRest || b.isRepeatBar ? [] : b.chords)
                  );
                  await audioPlayer.preloadAllNotes();
                  for (const sym of allChords) {
                    if (stopPlayRef.current) break;
                    const notes = Chord.get(sym).notes;
                    if (notes.length > 0) {
                      await audioPlayer.playChord(notes.map(n => `${n}3`));
                    }
                    await audioPlayer.delay(1100);
                  }
                  setPlayingProg(false);
                }}
                style={{
                  ...btnSecondary,
                  color: playingProg ? '#86efac' : COLOR,
                  borderColor: playingProg ? '#22c55e60' : `${COLOR}55`,
                  background: playingProg ? '#1a2e1a' : 'transparent',
                }}
              >
                {playingProg ? '⏹ Stop' : '▶ Play progression'}
              </button>
              <button onClick={() => setTab('export')} style={btnPrimary}>
                Continue to Export →
              </button>
            </div>
          </div>
        )}

        {/* ── EXPORT TAB ──────────────────────────────────────────────────────── */}
        {tab === 'export' && (
          <div>
            {/* iReal Pro section */}
            <div style={{
              background: '#161b22', border: '1px solid #30363d',
              borderRadius: 10, padding: '22px 24px', marginBottom: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 3, height: 18, background: COLOR, borderRadius: 2 }} />
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: '#e6edf3' }}>
                  iReal Pro
                </span>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>iReal Pro URL — copy and open in iReal Pro app</label>
                <textarea
                  readOnly
                  value={iRealURL}
                  rows={3}
                  style={{
                    ...inputStyle,
                    resize: 'vertical',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 10,
                    color: '#8b949e',
                    lineHeight: 1.6,
                    height: 'auto',
                  } as React.CSSProperties}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={copyURL} style={{ ...btnPrimary, minWidth: 140 }}>
                  {copied ? '✓ Copied!' : '⎘ Copy URL'}
                </button>
                <button onClick={openInIReal} style={btnSecondary}>
                  ↗ Open in iReal Pro
                </button>
              </div>

              <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 8, background: '#0d1117', border: '1px solid #21262d' }}>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#6b7280', lineHeight: 1.8 }}>
                  <strong style={{ color: '#8b949e' }}>How to import:</strong><br />
                  <strong style={{ color: '#6b7280' }}>Desktop iReal Pro:</strong> Copy the URL → File menu → Open URL (⌘L) → Paste<br />
                  <strong style={{ color: '#6b7280' }}>iOS / Android:</strong> Open this URL directly from the device browser — iReal Pro will open automatically<br />
                  <strong style={{ color: '#6b7280' }}>Alternative:</strong> Tap "Open in iReal Pro" button above if the app is installed on this device
                </div>
              </div>
            </div>

            {/* PDF section */}
            <div style={{
              background: '#161b22', border: '1px solid #30363d',
              borderRadius: 10, padding: '22px 24px', marginBottom: 20,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ width: 3, height: 18, background: '#10b981', borderRadius: 2 }} />
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: '#e6edf3' }}>
                  PDF / Print
                </span>
              </div>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#6b7280', marginBottom: 14, lineHeight: 1.65 }}>
                Opens a formatted chord chart in a new window. Use your browser's print dialog (⌘P / Ctrl+P) and select "Save as PDF".
              </p>
              <button
                onClick={printPDF}
                style={{
                  ...btnSecondary,
                  borderColor: '#10b98155',
                  color: '#10b981',
                }}
              >
                🖨 Open Print Preview
              </button>
            </div>

            {/* Chart preview */}
            <div style={{
              background: '#161b22', border: '1px solid #30363d',
              borderRadius: 10, padding: '22px 24px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 3, height: 18, background: CYAN, borderRadius: 2 }} />
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 16, color: '#e6edf3' }}>
                  Chart Preview
                </span>
                <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: '#4b5563', marginLeft: 4 }}>
                  {song.title || 'Untitled'} · {song.key} · {song.timeSignature}
                </span>
              </div>

              {song.sections.map(section => (
                <div key={section.id} style={{ marginBottom: 18 }}>
                  <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 9, color: CYAN, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
                    {section.repeat ? '‖: ' : ''}{section.type}{section.repeat ? ' :‖' : ''}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {section.bars.map((bar, i) => {
                      const text = bar.isRest ? 'r'
                        : bar.isRepeatBar ? '%'
                        : bar.chords.length === 0 ? ''
                        : bar.chords.join(' ');
                      const isRowEnd = (i + 1) % 4 === 0;
                      return (
                        <div key={bar.id} style={{
                          width: 72, height: 44,
                          border: `1px solid ${bar.chords.length > 0 ? CYAN + '44' : '#21262d'}`,
                          borderRight: isRowEnd ? `2px solid ${CYAN}55` : undefined,
                          borderRadius: 4,
                          background: bar.chords.length > 0 ? `${CYAN}0c` : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          position: 'relative',
                        }}>
                          <span style={{ position: 'absolute', top: 2, left: 4, fontFamily: "'DM Mono', monospace", fontSize: 7, color: '#4b5563' }}>{i + 1}</span>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: bar.chords.length > 0 ? '#c9d1d9' : '#30363d', textAlign: 'center', padding: '0 4px' }}>
                            {text || '·'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 14 }}>
                <button onClick={() => setTab('editor')} style={{ ...btnSecondary, fontSize: 10 }}>
                  ← Back to Editor
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
