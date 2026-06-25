import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Edit3, Check, X, ChevronRight } from 'lucide-react';
import { db } from '../../firebase';
import { useAuth } from '../../shared/context/AuthContext';
import { useStats } from '../../shared/context/StatsContext';
import { computeStreak } from '../../shared/hooks/useExerciseScore';
import type { UserStats, PracticeLog } from '../../shared/context/StatsContext';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface UserProfile {
  displayName: string;
  avatarEmoji: string;
  instruments: string[];
  genres: string[];
  experience: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  goals: string[];
  joinedAt: number;
}

const DEFAULT_PROFILE: UserProfile = {
  displayName: 'Musicista',
  avatarEmoji: '🎵',
  instruments: [],
  genres: [],
  experience: 'beginner',
  goals: [],
  joinedAt: Date.now(),
};

// ── Constants ──────────────────────────────────────────────────────────────────

const AVATAR_EMOJIS = ['🎵','🎶','🎸','🎹','🎺','🎻','🥁','🎷','🎤','🎼','🎙️','🪗','🪘','🎧','🎯','🎲','🌟','🔥'];

const INSTRUMENTS = ['Piano','Chitarra','Basso','Voce','Batteria','Violino','Sassofono','Tromba','Trombone','Violoncello','Flauto','Ukulele','Tastiere','Chitarra classica','Altro'];

const GENRES = ['Jazz','Rock','Pop','Blues','Classica','Funk','Soul','R&B','Country','Elettronica','Bossa Nova','Flamenco','Metal','Hip-Hop','Altro'];

const GOALS = ['Migliorare l\'orecchio','Imparare la teoria','Cantare intonato','Improvvisare nel jazz','Comporre canzoni','Suonare a orecchio','Prepararmi per un\'audizione','Leggere a prima vista'];

const EXPERIENCE_LABELS: Record<UserProfile['experience'], string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzato',
  professional: 'Professionista',
};

const RADAR_EXERCISES = [
  { id: 'intervals',         label: 'Intervalli' },
  { id: 'chords',            label: 'Accordi' },
  { id: 'scales',            label: 'Scale' },
  { id: 'progressions',      label: 'Progressioni' },
  { id: 'degrees',           label: 'Gradi' },
  { id: 'melodic',           label: 'Melodia' },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

type DayRecord = Record<string, { correct: number; total: number }>;

function computeTotals(log: PracticeLog): { correct: number; total: number } {
  let correct = 0, total = 0;
  for (const day of Object.values(log) as DayRecord[]) {
    for (const s of Object.values(day)) {
      correct += s.correct; total += s.total;
    }
  }
  return { correct, total };
}

function computeExerciseAccuracies(log: PracticeLog) {
  const acc: Record<string, { correct: number; total: number }> = {};
  for (const day of Object.values(log) as DayRecord[]) {
    for (const [id, s] of Object.entries(day)) {
      if (!acc[id]) acc[id] = { correct: 0, total: 0 };
      acc[id].correct += s.correct; acc[id].total += s.total;
    }
  }
  return Object.fromEntries(
    Object.entries(acc).map(([id, { correct, total }]) => [
      id,
      { accuracy: total > 0 ? Math.round(correct / total * 100) : 0, total },
    ])
  );
}

function computeDaysPracticed(log: PracticeLog): number {
  return Object.keys(log).filter(date => {
    const day = log[date] as DayRecord | undefined;
    return Object.values(day ?? {}).some(s => s.total > 0);
  }).length;
}

// Weighted Tonic Score 0-1000
function computeTonicScore(stats: UserStats, streak: number, dailyCompleted: number): number {
  const { correct, total } = computeTotals(stats.practiceLog);
  const volume    = Math.min(1, total / 1000);
  const accuracy  = total >= 10 ? correct / total : 0;
  const streakN   = Math.min(1, streak / 30);
  const days      = computeDaysPracticed(stats.practiceLog);
  const consist   = Math.min(1, days / 60);
  const daily     = Math.min(1, dailyCompleted / 30);
  return Math.round(volume * 200 + accuracy * 300 + streakN * 200 + consist * 200 + daily * 100);
}

function memberSince(ms: number): string {
  const months = Math.floor((Date.now() - ms) / (1000 * 60 * 60 * 24 * 30));
  if (months === 0) return 'questo mese';
  if (months === 1) return '1 mese fa';
  return `${months} mesi fa`;
}

// ── Badges ────────────────────────────────────────────────────────────────────

interface BadgeDef {
  id: string; icon: string; name: string; desc: string;
  check: (s: UserStats, dc: number, perfect: number, songs: number) => boolean;
}

const BADGE_DEFS: BadgeDef[] = [
  { id: 'first-session', icon: '🌱', name: 'Prime note', desc: 'Prima sessione di pratica completata',
    check: s => Object.keys(s.practiceLog).length >= 1 },
  { id: 'streak-7', icon: '🔥', name: 'Settimana di fuoco', desc: '7 giorni consecutivi di pratica',
    check: s => computeStreak(s.practiceLog) >= 7 || Object.values(s.exerciseStats).some(e => e.bestStreak >= 7) },
  { id: 'streak-30', icon: '💫', name: 'Un mese solido', desc: '30 giorni consecutivi',
    check: s => computeStreak(s.practiceLog) >= 30 },
  { id: 'questions-100', icon: '🎯', name: '100 domande', desc: 'Hai risposto a 100 domande di ear training',
    check: s => computeTotals(s.practiceLog).total >= 100 },
  { id: 'questions-500', icon: '🏅', name: '500 domande', desc: 'Hai risposto a 500 domande',
    check: s => computeTotals(s.practiceLog).total >= 500 },
  { id: 'accuracy-80', icon: '🎵', name: 'Orecchio preciso', desc: '80%+ di accuratezza globale (min 50 domande)',
    check: s => { const { correct, total } = computeTotals(s.practiceLog); return total >= 50 && correct / total >= 0.80; } },
  { id: 'intervals-80', icon: '🎶', name: 'Intervallista', desc: '80%+ sugli intervalli (min 20 domande)',
    check: s => { const a = computeExerciseAccuracies(s.practiceLog)['intervals']; return !!(a && a.total >= 20 && a.accuracy >= 80); } },
  { id: 'chords-80', icon: '🎸', name: 'Accordi dominati', desc: '80%+ sugli accordi (min 20 domande)',
    check: s => { const a = computeExerciseAccuracies(s.practiceLog)['chords']; return !!(a && a.total >= 20 && a.accuracy >= 80); } },
  { id: 'scales-80', icon: '🎼', name: 'Scale esplorate', desc: '80%+ sulle scale (min 20 domande)',
    check: s => { const a = computeExerciseAccuracies(s.practiceLog)['scales']; return !!(a && a.total >= 20 && a.accuracy >= 80); } },
  { id: 'daily-first', icon: '⭐', name: 'Prima sfida', desc: 'Prima Daily Challenge completata',
    check: (_s, dc) => dc >= 1 },
  { id: 'daily-perfect', icon: '🌟', name: 'Giornata perfetta', desc: '5/5 in una Daily Challenge',
    check: (_s, _dc, perfect) => perfect >= 1 },
  { id: 'daily-7', icon: '📅', name: 'Sfidante abitudinario', desc: '7 Daily Challenge completate',
    check: (_s, dc) => dc >= 7 },
  { id: 'daily-30', icon: '🏆', name: 'Maestro delle sfide', desc: '30 Daily Challenge completate',
    check: (_s, dc) => dc >= 30 },
  { id: 'song-library', icon: '📚', name: 'Il mio repertorio', desc: 'Prima canzone aggiunta alla Song Library',
    check: (_s, _dc, _p, songs) => songs >= 1 },
  { id: 'perfect-streak-10', icon: '🎖️', name: 'Orecchio d\'acciaio', desc: 'Streak di 10 risposte consecutive corrette',
    check: s => Object.values(s.exerciseStats).some(e => e.bestStreak >= 10) },
];

// ── RadarChart ────────────────────────────────────────────────────────────────

function RadarChart({ accuracies }: { accuracies: Record<string, { accuracy: number; total: number }> }) {
  const N = RADAR_EXERCISES.length;
  const SIZE = 200;
  const CENTER = SIZE / 2;
  const MAX_R = 80;

  const angleOf = (i: number) => (Math.PI * 2 * i) / N - Math.PI / 2;
  const point = (i: number, r: number) => ({
    x: CENTER + r * Math.cos(angleOf(i)),
    y: CENTER + r * Math.sin(angleOf(i)),
  });

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const hasAnyData = RADAR_EXERCISES.some(e => (accuracies[e.id]?.total ?? 0) >= 5);

  const dataPoints = RADAR_EXERCISES.map((e, i) => {
    const acc = accuracies[e.id];
    const ratio = acc && acc.total >= 5 ? acc.accuracy / 100 : 0;
    return point(i, ratio * MAX_R);
  });

  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ overflow: 'visible' }}>
        {/* Grid lines */}
        {gridLevels.map(level => (
          <polygon
            key={level}
            points={RADAR_EXERCISES.map((_, i) => { const p = point(i, level * MAX_R); return `${p.x},${p.y}`; }).join(' ')}
            fill="none"
            stroke="#21262d"
            strokeWidth="1"
          />
        ))}
        {/* Spokes */}
        {RADAR_EXERCISES.map((_, i) => {
          const outer = point(i, MAX_R);
          return <line key={i} x1={CENTER} y1={CENTER} x2={outer.x} y2={outer.y} stroke="#21262d" strokeWidth="1" />;
        })}
        {/* Data polygon */}
        {hasAnyData && (
          <>
            <path d={dataPath} fill="#7c3aed30" stroke="#7c3aed" strokeWidth="2" />
            {dataPoints.map((p, i) => {
              const acc = accuracies[RADAR_EXERCISES[i].id];
              if (!acc || acc.total < 5) return null;
              return <circle key={i} cx={p.x} cy={p.y} r="4" fill="#7c3aed" stroke="#0d1117" strokeWidth="1.5" />;
            })}
          </>
        )}
        {/* Labels */}
        {RADAR_EXERCISES.map((e, i) => {
          const labelR = MAX_R + 20;
          const p = point(i, labelR);
          const acc = accuracies[e.id];
          const hasData = acc && acc.total >= 5;
          return (
            <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
              fill={hasData ? '#8b949e' : '#374151'}
              fontSize="10" fontWeight="600" fontFamily="'DM Sans', sans-serif">
              {e.label}
              {hasData && ` ${acc.accuracy}%`}
            </text>
          );
        })}
      </svg>
      {!hasAnyData && (
        <div style={{ fontSize: 12, color: '#4b5563', textAlign: 'center' }}>
          Completa degli esercizi di ear training per riempire il radar
        </div>
      )}
    </div>
  );
}

// ── Badge Card ────────────────────────────────────────────────────────────────

function BadgeCard({ badge, unlocked }: { badge: BadgeDef; unlocked: boolean }) {
  const [showTip, setShowTip] = useState(false);
  return (
    <div
      title={badge.desc}
      onClick={() => setShowTip(v => !v)}
      style={{
        position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        padding: '14px 10px', borderRadius: 14,
        background: unlocked ? '#161b22' : '#0d1117',
        border: `1px solid ${unlocked ? '#30363d' : '#21262d'}`,
        cursor: 'pointer', transition: 'all 0.15s',
        opacity: unlocked ? 1 : 0.45,
        minWidth: 80,
      }}
    >
      <div style={{ fontSize: 26, filter: unlocked ? 'none' : 'grayscale(100%)' }}>
        {badge.icon}
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: unlocked ? '#8b949e' : '#4b5563', textAlign: 'center', lineHeight: 1.3 }}>
        {badge.name}
      </div>
      {showTip && (
        <div style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)',
          background: '#21262d', border: '1px solid #30363d', borderRadius: 8,
          padding: '8px 10px', fontSize: 11, color: '#8b949e', whiteSpace: 'nowrap',
          zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
        }}>
          {badge.desc}
        </div>
      )}
    </div>
  );
}

// ── Edit Panel ────────────────────────────────────────────────────────────────

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 600,
      border: `1px solid ${active ? '#7c3aed' : '#30363d'}`,
      background: active ? '#7c3aed20' : 'transparent',
      color: active ? '#c4b5fd' : '#8b949e',
      fontFamily: "'DM Sans', sans-serif", transition: 'all 0.12s',
    }}>
      {label}
    </button>
  );
}

function EditPanel({ profile, onSave, onClose }: {
  profile: UserProfile;
  onSave: (p: UserProfile) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState({ ...profile });

  function toggle<K extends 'instruments' | 'genres' | 'goals'>(key: K, val: string) {
    setDraft(prev => ({
      ...prev,
      [key]: prev[key].includes(val) ? prev[key].filter(v => v !== val) : [...prev[key], val],
    }));
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', alignItems: 'stretch', justifyContent: 'flex-end',
    }}>
      <div onClick={onClose} style={{ flex: 1, background: 'rgba(0,0,0,0.5)' }} />
      <div style={{
        width: '100%', maxWidth: 420, background: '#0d1117',
        border: '1px solid #21262d', borderRight: 'none',
        padding: '24px 20px', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 22,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#e6edf3' }}>Modifica profilo</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onSave(draft)} style={{
              background: '#7c3aed', border: 'none', color: '#fff', borderRadius: 8,
              padding: '8px 14px', cursor: 'pointer', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
            }}><Check size={14} /> Salva</button>
            <button onClick={onClose} style={{
              background: '#21262d', border: '1px solid #30363d', color: '#8b949e', borderRadius: 8,
              padding: '8px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center',
            }}><X size={14} /></button>
          </div>
        </div>

        {/* Avatar picker */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 10, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Avatar</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {AVATAR_EMOJIS.map(e => (
              <button key={e} onClick={() => setDraft(d => ({ ...d, avatarEmoji: e }))} style={{
                width: 44, height: 44, fontSize: 22, borderRadius: 10, cursor: 'pointer',
                border: `2px solid ${draft.avatarEmoji === e ? '#7c3aed' : '#30363d'}`,
                background: draft.avatarEmoji === e ? '#7c3aed20' : '#161b22',
                transition: 'all 0.1s',
              }}>
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Nome d'artista</div>
          <input
            value={draft.displayName}
            onChange={e => setDraft(d => ({ ...d, displayName: e.target.value }))}
            maxLength={40}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: '#161b22', border: '1px solid #30363d', borderRadius: 8,
              color: '#e6edf3', padding: '10px 12px', fontSize: 14, outline: 'none',
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
        </div>

        {/* Level */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Livello</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(['beginner','intermediate','advanced','professional'] as const).map(level => (
              <Chip key={level} label={EXPERIENCE_LABELS[level]} active={draft.experience === level}
                onClick={() => setDraft(d => ({ ...d, experience: level }))} />
            ))}
          </div>
        </div>

        {/* Instruments */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Strumenti</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {INSTRUMENTS.map(i => (
              <Chip key={i} label={i} active={draft.instruments.includes(i)} onClick={() => toggle('instruments', i)} />
            ))}
          </div>
        </div>

        {/* Genres */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Generi</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {GENRES.map(g => (
              <Chip key={g} label={g} active={draft.genres.includes(g)} onClick={() => toggle('genres', g)} />
            ))}
          </div>
        </div>

        {/* Goals */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Obiettivi</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {GOALS.map(g => (
              <Chip key={g} label={g} active={draft.goals.includes(g)} onClick={() => toggle('goals', g)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CSS ───────────────────────────────────────────────────────────────────────

const CSS = `
  .pf-container { max-width: 760px; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; }

  .pf-hero {
    background: linear-gradient(135deg, #161b22 0%, #0f1318 100%);
    border: 1px solid #21262d; border-radius: 20px; padding: 28px 28px 24px;
    display: flex; align-items: flex-start; gap: 20px;
  }
  .pf-avatar {
    width: 80px; height: 80px; border-radius: 20px; font-size: 44px;
    background: #21262d; border: 2px solid #30363d;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .pf-hero-info { flex: 1; min-width: 0; }
  .pf-name { font-size: 26px; font-weight: 800; color: #e6edf3; letter-spacing: -0.5px; line-height: 1.1; }
  .pf-identity { font-size: 14px; color: #8b949e; margin-top: 6px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .pf-identity-badge {
    display: inline-flex; align-items: center; gap: 5px;
    background: #21262d; border: 1px solid #30363d; border-radius: 8px;
    padding: 3px 10px; font-size: 12px; font-weight: 600; color: #8b949e;
  }
  .pf-identity-badge.level { background: #7c3aed18; border-color: #7c3aed40; color: #c4b5fd; }
  .pf-edit-btn {
    background: none; border: 1px solid #30363d; color: #8b949e; border-radius: 10px;
    padding: 8px 14px; cursor: pointer; font-size: 13px; font-weight: 600;
    display: flex; align-items: center; gap: 6px; flex-shrink: 0;
    font-family: 'DM Sans', sans-serif; transition: all 0.15s;
  }
  .pf-edit-btn:hover { border-color: #7c3aed60; color: #c4b5fd; background: #7c3aed10; }

  .pf-score-band {
    background: #161b22; border: 1px solid #21262d; border-radius: 16px; padding: 20px 24px;
    display: flex; flex-direction: column; gap: 10px;
  }
  .pf-score-label { font-size: 11px; font-weight: 700; color: #6b7280; letter-spacing: 0.08em; text-transform: uppercase; }
  .pf-score-row { display: flex; align-items: baseline; gap: 10px; }
  .pf-score-num { font-size: 42px; font-weight: 800; color: #c4b5fd; letter-spacing: -1px; line-height: 1; }
  .pf-score-max { font-size: 18px; color: #4b5563; font-weight: 600; }
  .pf-score-bar { background: #21262d; border-radius: 6px; height: 8px; overflow: hidden; }
  .pf-score-fill { height: 100%; border-radius: 6px; background: linear-gradient(90deg, #7c3aed, #a78bfa); transition: width 0.8s ease; }
  .pf-score-milestone { font-size: 12px; color: #4b5563; }

  .pf-stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  @media (max-width: 500px) { .pf-stats-grid { grid-template-columns: repeat(2, 1fr); } }

  .pf-stat-card {
    background: #161b22; border: 1px solid #21262d; border-radius: 14px;
    padding: 18px 14px; text-align: center;
  }
  .pf-stat-icon { font-size: 20px; margin-bottom: 8px; }
  .pf-stat-num { font-size: 30px; font-weight: 800; letter-spacing: -1px; color: #e6edf3; line-height: 1; }
  .pf-stat-label { font-size: 11px; font-weight: 600; color: #6b7280; margin-top: 5px; }

  .pf-section-header { font-size: 16px; font-weight: 800; color: #e6edf3; margin: 0 0 16px; }

  .pf-card { background: #161b22; border: 1px solid #21262d; border-radius: 16px; padding: 22px 24px; }

  .pf-radar-row { display: flex; flex-direction: column; align-items: center; }

  .pf-insights { display: flex; flex-direction: column; gap: 12px; }
  .pf-insight {
    display: flex; align-items: center; gap: 12px;
    background: #0d1117; border: 1px solid #21262d; border-radius: 12px; padding: 14px 16px;
  }
  .pf-insight-icon { font-size: 22px; flex-shrink: 0; }
  .pf-insight-text { font-size: 14px; color: #8b949e; line-height: 1.4; }
  .pf-insight-text strong { color: #e6edf3; }

  .pf-badges-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 10px; }

  .pf-tags-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
  .pf-tag {
    display: inline-flex; align-items: center; gap: 5px;
    background: #21262d; border: 1px solid #30363d; border-radius: 8px;
    padding: 4px 10px; font-size: 12px; font-weight: 600; color: #8b949e;
  }

  .pf-empty { text-align: center; color: #4b5563; font-size: 14px; padding: 20px 0; }

  .pf-goals-list { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
  .pf-goal-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #8b949e; }
  .pf-goal-dot { width: 6px; height: 6px; border-radius: 50%; background: #7c3aed; flex-shrink: 0; }
`;

// ── Main Component ────────────────────────────────────────────────────────────

export default function ProfileFeature() {
  const { user } = useAuth();
  const { stats, statsLoading } = useStats();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [dailyStats, setDailyStats] = useState({ completed: 0, perfect: 0 });
  const [songsCount, setSongsCount] = useState(0);

  // Load profile + daily challenge history + songs count
  useEffect(() => {
    if (!user || !db) { setProfileLoading(false); return; }
    const database = db;

    const profileRef = doc(database, 'users', user.uid, 'data', 'profile');
    const dailyRef   = doc(database, 'users', user.uid, 'data', 'daily');

    Promise.all([
      getDoc(profileRef),
      getDoc(dailyRef),
    ]).then(([profileSnap, dailySnap]) => {
      if (profileSnap.exists()) {
        setProfile(profileSnap.data() as UserProfile);
      } else {
        // Auto-seed name from Google account
        const auto: UserProfile = {
          ...DEFAULT_PROFILE,
          displayName: user.displayName ?? DEFAULT_PROFILE.displayName,
          joinedAt: Date.now(),
        };
        setProfile(auto);
      }

      if (dailySnap.exists()) {
        const data = dailySnap.data() as Record<string, { completed: boolean; firstTryCount: number; total: number }>;
        const completed = Object.values(data).filter(d => d.completed).length;
        const perfect   = Object.values(data).filter(d => d.completed && d.firstTryCount === d.total).length;
        setDailyStats({ completed, perfect });
      }

      setProfileLoading(false);
    }).catch(() => {
      setProfile({ ...DEFAULT_PROFILE, displayName: user.displayName ?? DEFAULT_PROFILE.displayName, joinedAt: Date.now() });
      setProfileLoading(false);
    });

    // Load songs count from collection length
    import('firebase/firestore').then(({ collection, getDocs }) => {
      getDocs(collection(database, 'users', user.uid, 'songs'))
        .then(snap => setSongsCount(snap.size))
        .catch(() => {});
    });
  }, [user]);

  const saveProfile = useCallback(async (p: UserProfile) => {
    if (!user || !db) return;
    setProfile(p);
    setEditing(false);
    await setDoc(doc(db, 'users', user.uid, 'data', 'profile'), p).catch(() => {});
  }, [user]);

  if (!user) {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🎵</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#8b949e', marginBottom: 8 }}>Accedi per vedere il tuo profilo</div>
        <div style={{ fontSize: 14 }}>I tuoi progressi e il tuo percorso musicale ti aspettano.</div>
      </div>
    );
  }

  if (profileLoading || statsLoading) {
    return (
      <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', padding: '60px 0', color: '#6b7280' }}>
        <div style={{ fontSize: 14 }}>Caricamento profilo…</div>
      </div>
    );
  }

  const p = profile ?? DEFAULT_PROFILE;
  const { practiceLog: log, exerciseStats } = stats;
  const streak = computeStreak(log);
  const daysPracticed = computeDaysPracticed(log);
  const { correct, total } = computeTotals(log);
  const overallAccuracy = total >= 5 ? Math.round(correct / total * 100) : 0;
  const exerciseAcc = computeExerciseAccuracies(log);
  const tonicScore = computeTonicScore(stats, streak, dailyStats.completed);

  // Best streak across all exercises (or current streak)
  const bestExerciseStreak = Math.max(streak, ...Object.values(exerciseStats).map(e => e.bestStreak));

  // Personalized insights
  const exercisesWithData = RADAR_EXERCISES.filter(e => (exerciseAcc[e.id]?.total ?? 0) >= 10);
  const strongest = exercisesWithData.sort((a, b) => (exerciseAcc[b.id]?.accuracy ?? 0) - (exerciseAcc[a.id]?.accuracy ?? 0))[0];
  const weakest   = exercisesWithData.sort((a, b) => (exerciseAcc[a.id]?.accuracy ?? 0) - (exerciseAcc[b.id]?.accuracy ?? 0))[0];

  const insights: { icon: string; text: React.ReactNode }[] = [];
  if (strongest && strongest !== weakest)
    insights.push({ icon: '💪', text: <><strong>Punto di forza</strong>: {strongest.label} — {exerciseAcc[strongest.id].accuracy}% di accuratezza</> });
  if (weakest && strongest !== weakest)
    insights.push({ icon: '🎯', text: <><strong>Da allenare</strong>: {weakest.label} — {exerciseAcc[weakest.id].accuracy}% ({exerciseAcc[weakest.id].total} domande)</> });
  if (total > 0)
    insights.push({ icon: '📊', text: <>Hai risposto a <strong>{total} domande</strong> di ear training in <strong>{daysPracticed} sessioni</strong></> });
  if (daysPracticed > 0)
    insights.push({ icon: '📆', text: <>Pratichi da <strong>{memberSince(p.joinedAt)}</strong>{streak > 0 ? ` · streak attuale: ${streak} giorni 🔥` : ''}</> });
  if (dailyStats.completed > 0)
    insights.push({ icon: '⭐', text: <>Hai completato <strong>{dailyStats.completed} Daily Challenge</strong>{dailyStats.perfect > 0 ? ` di cui ${dailyStats.perfect} con punteggio pieno` : ''}</> });
  if (bestExerciseStreak >= 5)
    insights.push({ icon: '🏅', text: <>Record di risposte consecutive corrette: <strong>{bestExerciseStreak}</strong></> });

  // Compute badges
  const badges = BADGE_DEFS.map(b => ({
    ...b,
    unlocked: b.check(stats, dailyStats.completed, dailyStats.perfect, songsCount),
  }));
  const unlockedCount = badges.filter(b => b.unlocked).length;

  // Score milestone label
  const nextMilestone = [250, 500, 750, 1000].find(m => tonicScore < m) ?? 1000;
  const prevMilestone = nextMilestone - 250;
  const scoreProgress = ((tonicScore - prevMilestone) / 250) * 100;

  return (
    <div className="pf-container">
      <style>{CSS}</style>

      {/* Hero */}
      <div className="pf-hero">
        <div className="pf-avatar">{p.avatarEmoji}</div>
        <div className="pf-hero-info">
          <div className="pf-name">{p.displayName}</div>
          <div className="pf-identity" style={{ marginTop: 8 }}>
            {p.instruments.length > 0 && (
              <span className="pf-identity-badge">{p.instruments.slice(0, 2).join(' · ')}</span>
            )}
            <span className={`pf-identity-badge level`}>{EXPERIENCE_LABELS[p.experience]}</span>
            {p.genres.length > 0 && (
              <span className="pf-identity-badge">{p.genres.slice(0, 2).join(' · ')}</span>
            )}
          </div>
          {p.joinedAt && (
            <div style={{ fontSize: 12, color: '#4b5563', marginTop: 8 }}>
              Membro {memberSince(p.joinedAt)}
            </div>
          )}
        </div>
        <button className="pf-edit-btn" onClick={() => setEditing(true)}>
          <Edit3 size={14} /> Modifica
        </button>
      </div>

      {/* Tonic Score */}
      <div className="pf-score-band">
        <div className="pf-score-label">Tonic Score</div>
        <div className="pf-score-row">
          <div className="pf-score-num">{tonicScore}</div>
          <div className="pf-score-max">/ 1000</div>
        </div>
        <div className="pf-score-bar">
          <div className="pf-score-fill" style={{ width: `${(tonicScore / 1000) * 100}%` }} />
        </div>
        <div className="pf-score-milestone">
          {tonicScore >= 1000
            ? '🏆 Punteggio massimo raggiunto!'
            : `Prossimo traguardo: ${nextMilestone} — mancano ${nextMilestone - tonicScore} punti`}
        </div>
      </div>

      {/* Stats strip */}
      <div className="pf-stats-grid">
        {[
          { icon: '🔥', value: streak,             label: 'Streak giorni'     },
          { icon: '📅', value: daysPracticed,       label: 'Sessioni totali'   },
          { icon: '🎯', value: `${overallAccuracy}%`, label: 'Accuratezza'     },
          { icon: '⭐', value: dailyStats.completed, label: 'Daily Challenge'  },
        ].map(({ icon, value, label }) => (
          <div key={label} className="pf-stat-card">
            <div className="pf-stat-icon">{icon}</div>
            <div className="pf-stat-num">{value}</div>
            <div className="pf-stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Two columns: radar + insights */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="pf-card">
          <div className="pf-section-header">Skill Radar</div>
          <div className="pf-radar-row">
            <RadarChart accuracies={exerciseAcc} />
          </div>
        </div>

        <div className="pf-card">
          <div className="pf-section-header">Le tue intuizioni</div>
          <div className="pf-insights">
            {insights.length > 0
              ? insights.slice(0, 5).map((ins, i) => (
                  <div key={i} className="pf-insight">
                    <div className="pf-insight-icon">{ins.icon}</div>
                    <div className="pf-insight-text">{ins.text}</div>
                  </div>
                ))
              : <div className="pf-empty">Completa degli esercizi per sbloccare le tue intuizioni personali.</div>
            }
          </div>
        </div>
      </div>

      {/* Achievements */}
      <div className="pf-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="pf-section-header" style={{ margin: 0 }}>
            Traguardi <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>({unlockedCount}/{badges.length})</span>
          </div>
        </div>
        <div className="pf-badges-grid">
          {badges.map(b => <BadgeCard key={b.id} badge={b} unlocked={b.unlocked} />)}
        </div>
      </div>

      {/* Profile details */}
      {(p.goals.length > 0 || p.instruments.length > 0) && (
        <div className="pf-card">
          <div className="pf-section-header">Il mio percorso</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {p.goals.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Obiettivi</div>
                <div className="pf-goals-list">
                  {p.goals.map(g => (
                    <div key={g} className="pf-goal-item"><div className="pf-goal-dot" />{g}</div>
                  ))}
                </div>
              </div>
            )}
            {p.genres.length > 0 && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Generi preferiti</div>
                <div className="pf-tags-row">
                  {p.genres.map(g => <span key={g} className="pf-tag">{g}</span>)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit panel */}
      {editing && (
        <EditPanel profile={p} onSave={saveProfile} onClose={() => setEditing(false)} />
      )}
    </div>
  );
}
