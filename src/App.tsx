import { useState, useEffect } from 'react';
import { computeStreak } from './shared/hooks/useExerciseScore';
import { useAuth } from './shared/context/AuthContext';
import { useStats } from './shared/context/StatsContext';
import { useGlobalKey, CHROMATIC_KEYS } from './shared/context/GlobalKeyContext';
import AuthGate from './features/auth/AuthGate';
import PracticeJournalFeature from './features/practice-journal/PracticeJournalFeature';
import SongLibraryFeature from './features/song-library/SongLibraryFeature';
import DailyChallengeFeature from './features/daily-challenge/DailyChallengeFeature';
import ChordVoicingsFeature from './features/chord-vocings/ChordVoicingsFeature';
import ScaleRecognitionFeature from './features/scale-recognition/ScaleRecognitionFeature';
import ScaleDictionaryFeature from './features/scale-dictionary/ScaleDictionaryFeature';
import EarTrainingFeature from './features/ear-training/EarTrainingFeature';
import CircleOfFifthsFeature from './features/circle-of-fifth/CircleOfFifthsFeature';
import ScaleHarmonizationFeature from './features/scale-harmonization/ScaleHarmonizationFeature';
import ModalInterchangeFeature from './features/modal-interchange/ModalInterchangeFeature';
import ChordProgressionFeature from './features/chord-progression/ChordProgressionFeature';
import ScaleAdvisorFeature from './features/scale-advisor/ScaleAdvisorFeature';
import HarmonicAnalysisFeature from './features/harmonic-analysis/HarmonicAnalysisFeature';
import RiffArchitectFeature from './features/riff-architect/RiffArchitectFeature';
import MelodyArchitectFeature from './features/melody-architect/MelodyArchitectFeature';
import IntervalQuizFeature from './features/interval-quiz/IntervalQuizFeature';
import ScoreToIRealFeature from './features/score-to-ireal/ScoreToIRealFeature';
import ChordLandingFeature from './features/chord-landing/ChordLandingFeature';
import SongArchitectFeature from './features/song-architect/SongArchitectFeature';
import ChordDetectionFeature from './features/chord-detection/ChordDetectionFeature';
import NailThePitchFeature from './features/nail-the-pitch/NailThePitchFeature';
import ModalBuddy from './shared/components/ModalBuddy';
import HomePage from './features/home/HomePage';

// ─── Theme styles ─────────────────────────────────────────────────────────────

const HEADER_STYLES = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Syne:wght@700;800&display=swap');

:root {
  --color-bg-base: #0d1117;
  --color-bg-surface: #161b22;
  --color-bg-raised: #1c2128;
  --color-bg-hover: #21262d;
  --color-border: #30363d;
  --color-border-subtle: #21262d;
  --color-text-primary: #e6edf3;
  --color-text-secondary: #8b949e;
  --color-text-muted: #6b7280;
  --color-accent: #7c3aed;
  --color-accent-dim: #6d28d9;
  --color-accent-soft: rgba(124,58,237,0.08);
  --color-accent-glow: rgba(124,58,237,0.3);
  --color-accent-text: #c4b5fd;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 14px;
  height: 100%;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--color-text-secondary);
  font-family: 'DM Sans', sans-serif;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.02em;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.15s, border-color 0.15s;
  user-select: none;
}

.nav-item:hover {
  color: var(--color-accent-text);
}

.nav-item.active {
  color: var(--color-text-primary);
  border-bottom-color: var(--color-accent);
}

.nav-dropdown-item {
  width: 100%;
  display: flex;
  align-items: stretch;
  gap: 0;
  padding: 0;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  overflow: hidden;
  transition: background 0.12s;
}

.nav-dropdown-item:hover {
  background: #21262d;
}

.nav-dropdown-item:hover .nav-dropdown-item-name {
  color: #e6edf3;
}

.nav-dropdown-item.active {
  background: rgba(124,58,237,0.08);
}

.nav-dropdown-item-name {
  font-family: 'DM Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #e6edf3;
  transition: color 0.12s;
}

.nav-dropdown-item.active .nav-dropdown-item-name {
  color: #c4b5fd;
}

.nav-dropdown-item-desc {
  font-family: 'DM Sans', sans-serif;
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

.header-cta {
  transition: transform 0.15s, box-shadow 0.15s;
}

.header-cta:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 24px rgba(124,58,237,0.5);
}
`;

// ─── Types ───────────────────────────────────────────────────────────────────

type Tab =
  | 'home'
  | 'voicings'
  | 'scales'
  | 'dictionary'
  | 'ear'
  | 'circle'
  | 'harmonization'
  | 'modal'
  | 'progressions'
  | 'scaleadvisor'
  | 'analysis'
  | 'riff'
  | 'melody'
  | 'quiz'
  | 'score'
  | 'landing'
  | 'architect'
  | 'journal'
  | 'songs'
  | 'daily'
  | 'chorddetect'
  | 'nailpitch';

interface TabDef {
  id: Tab;
  label: string;
  icon: string;
  desc: string;
}

interface GroupDef {
  id: string;
  label: string;
  icon: string;
  tabs: TabDef[];
}

// ─── Navigation structure ────────────────────────────────────────────────────

const GROUPS: GroupDef[] = [
  {
    id: 'composition',
    label: 'Composition',
    icon: '✍️',
    tabs: [
      { id: 'scaleadvisor',  label: 'Scale Advisor',      icon: '🧭', desc: 'Find the right scale over any chord' },
      { id: 'progressions',  label: 'Chord Progressions', icon: '🎸', desc: 'Build jazz, modal & cinematic progressions' },
      { id: 'analysis',      label: 'Harmonic Analysis',  icon: '🔬', desc: 'Analyse key, Roman numerals & chord function' },
      { id: 'riff',          label: 'Riff Architect',     icon: '🎵', desc: 'Build a riff from rhythm, style & scale degrees' },
      { id: 'melody',        label: 'Melody Architect',   icon: '〰️', desc: 'Shape a melody with contour, approach & motif' },
      { id: 'score',         label: 'Score → iReal Pro',  icon: '📄', desc: 'Import a score photo and export to iReal Pro' },
      { id: 'landing',       label: 'Chord Landing',      icon: '🎯', desc: 'Find the best way to approach any target chord' },
      { id: 'architect',     label: 'Song Architect',     icon: '🏗️', desc: 'Develop harmonic sections B and C from your A section' },
    ],
  },
  {
    id: 'scale',
    label: 'Scale',
    icon: '🎼',
    tabs: [
      { id: 'scales',     label: 'Scale Recognition', icon: '🔍', desc: 'Identify a scale from its notes' },
      { id: 'dictionary', label: 'Scale Dictionary',  icon: '📚', desc: 'Browse all scales and their modes' },
    ],
  },
  {
    id: 'theory',
    label: 'Theory',
    icon: '📖',
    tabs: [
      { id: 'harmonization', label: 'Scale Harmony',     icon: '🎶', desc: 'See how chords relate to their scale' },
      { id: 'modal',         label: 'Modal Interchange', icon: '🔄', desc: 'Borrow chords from parallel modes' },
      { id: 'voicings',      label: 'Piano Voicings',    icon: '🎹', desc: 'Visualize drop 2, quartal & upper structures' },
      { id: 'circle',        label: 'Circle of Fifths',  icon: '🔵', desc: 'Explore key relationships at a glance' },
      { id: 'ear',           label: 'Ear Training',      icon: '👂', desc: 'Train your ear with interval exercises' },
      { id: 'quiz',          label: 'Scale Degree Quiz',  icon: '🎯', desc: 'Train your knowledge of major scale degrees' },
      { id: 'chorddetect',   label: 'Chord Detection',   icon: '🎙️', desc: 'Play a chord — app identifies it in real time' },
      { id: 'nailpitch',     label: 'Nail the Pitch',    icon: '🎤', desc: 'Sing and see which notes you hit, Melodyne-style' },
    ],
  },
  {
    id: 'practice',
    label: 'Practice',
    icon: '📈',
    tabs: [
      { id: 'daily',   label: 'Daily Challenge',  icon: '🎯', desc: 'One new ear training challenge every day — same for everyone' },
      { id: 'journal', label: 'Practice Journal', icon: '🔥', desc: 'Track your daily streak and ear training progress' },
      { id: 'songs',   label: 'Song Library',     icon: '🎵', desc: 'Your personal repertoire, synced across devices' },
    ],
  },
];

// ─── Desktop NavGroup dropdown ───────────────────────────────────────────────

function NavGroup({
  group, activeTab, isOpen, onToggle, onSelect,
}: {
  group: GroupDef;
  activeTab: Tab;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (tab: Tab) => void;
}) {
  const isGroupActive = group.tabs.some(t => t.id === activeTab);

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'stretch' }}>
      <button
        onClick={onToggle}
        className={`nav-item${isGroupActive || isOpen ? ' active' : ''}`}
      >
        <span>{group.label}</span>
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s',
            opacity: 0.5,
          }}
        >
          <path d="M1 3L5 7L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 2px)', left: 0,
            minWidth: 260,
            background: '#1c2128',
            border: '1px solid #30363d',
            borderRadius: 12,
            boxShadow: '0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(124,58,237,0.08)',
            zIndex: 200,
            padding: '6px',
          }}
        >
          {group.tabs.map(tab => {
            const isCurrent = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => onSelect(tab.id)}
                className={`nav-dropdown-item${isCurrent ? ' active' : ''}`}
              >
                {/* Accent bar */}
                <span style={{
                  width: 3,
                  alignSelf: 'stretch',
                  background: isCurrent ? '#7c3aed' : '#30363d',
                  borderRadius: '3px 0 0 3px',
                  flexShrink: 0,
                  marginRight: 14,
                }} />
                {/* Text content */}
                <span style={{ flex: 1, padding: '12px 16px 12px 0' }}>
                  <span className="nav-dropdown-item-name" style={{ display: 'block' }}>
                    {tab.label}
                  </span>
                  <span className="nav-dropdown-item-desc" style={{ display: 'block' }}>
                    {tab.desc}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Mobile key picker (inside drawer) ───────────────────────────────────────

function MobileKeyPicker({ onClose }: { onClose: () => void }) {
  const { globalKey, setGlobalKey } = useGlobalKey();
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ padding: '12px 20px', borderBottom: '1px solid #21262d' }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(e => !e)}
        role="button"
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          ♩ Global Key
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#c4b5fd' }}>{globalKey}</span>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', opacity: 0.5 }}>
            <path d="M1 3L5 7L9 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
      {expanded && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6, marginTop: 12 }}>
          {CHROMATIC_KEYS.map(k => (
            <button
              key={k}
              onClick={() => { setGlobalKey(k); setExpanded(false); onClose(); }}
              style={{
                padding: '10px 4px',
                borderRadius: 8,
                border: `1px solid ${globalKey === k ? '#7c3aed' : '#30363d'}`,
                background: globalKey === k ? '#7c3aed22' : '#21262d',
                color: globalKey === k ? '#c4b5fd' : '#e6edf3',
                fontSize: 13, fontWeight: 600,
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer',
              }}
            >
              {k}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Mobile full-screen menu ─────────────────────────────────────────────────

function MobileMenu({
  activeTab, onSelect, onClose,
}: {
  activeTab: Tab;
  onSelect: (tab: Tab) => void;
  onClose: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 299,
          background: 'rgba(0,0,0,0.6)',
        }}
      />

      {/* Drawer */}
      <div
        style={{
          position: 'fixed', top: 59, left: 0, right: 0, bottom: 0, zIndex: 300,
          background: '#161b22',
          borderTop: '1px solid #30363d',
          overflowY: 'scroll',
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
          padding: '8px 0 env(safe-area-inset-bottom, 32px)',
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 40px)',
        } as React.CSSProperties}
      >
        {/* Global key picker — mobile */}
        <MobileKeyPicker onClose={onClose} />

        {GROUPS.map(group => (
          <div key={group.id}>
            {/* Group header */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 20px 8px',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
              color: '#4b5563', textTransform: 'uppercase',
              borderTop: '1px solid #21262d',
              marginTop: 4,
            }}>
              <span style={{ fontSize: 13 }}>{group.icon}</span>
              {group.label}
            </div>

            {/* Tabs in group */}
            {group.tabs.map(tab => {
              const isCurrent = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelect(tab.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 20px',
                    background: isCurrent ? '#7c3aed18' : 'none',
                    border: 'none',
                    borderLeft: `3px solid ${isCurrent ? '#7c3aed' : 'transparent'}`,
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: isCurrent ? '#7c3aed22' : '#21262d',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0,
                  }}>
                    {tab.icon}
                  </span>
                  <span style={{ flex: 1 }}>
                    <span style={{
                      display: 'block',
                      fontSize: 15, fontWeight: isCurrent ? 600 : 500,
                      color: isCurrent ? '#c4b5fd' : '#e6edf3',
                      lineHeight: 1.3,
                    }}>
                      {tab.label}
                    </span>
                    <span style={{
                      display: 'block',
                      fontSize: 12, color: '#6b7280',
                      marginTop: 2, lineHeight: 1.4,
                    }}>
                      {tab.desc}
                    </span>
                  </span>
                  {isCurrent && (
                    <span style={{ color: '#7c3aed', fontSize: 12, flexShrink: 0 }}>●</span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );
}

// ─── Global key picker ────────────────────────────────────────────────────────

function GlobalKeyPicker() {
  const { globalKey, setGlobalKey } = useGlobalKey();
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: 'relative', alignSelf: 'center', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Set preferred key for all features"
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: open ? '#7c3aed18' : 'none',
          border: `1px solid ${open ? '#7c3aed60' : '#30363d'}`,
          borderRadius: 8,
          padding: '4px 10px',
          cursor: 'pointer',
          fontSize: 13, fontWeight: 600,
          color: globalKey !== 'C' ? '#c4b5fd' : '#8b949e',
          fontFamily: "'DM Sans', sans-serif",
          transition: 'all 0.15s',
          marginRight: 6,
        }}
      >
        <span style={{ fontSize: 11, opacity: 0.6 }}>♩</span>
        {globalKey}
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 300 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 301,
            background: '#1c2128', border: '1px solid #30363d', borderRadius: 12,
            padding: 12, minWidth: 200,
            boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
              Global key
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {CHROMATIC_KEYS.map(k => (
                <button
                  key={k}
                  onClick={() => { setGlobalKey(k); setOpen(false); }}
                  style={{
                    padding: '8px 4px',
                    borderRadius: 8,
                    border: `1px solid ${globalKey === k ? '#7c3aed' : '#30363d'}`,
                    background: globalKey === k ? '#7c3aed22' : 'none',
                    color: globalKey === k ? '#c4b5fd' : '#e6edf3',
                    fontSize: 13, fontWeight: 600,
                    fontFamily: "'DM Sans', sans-serif",
                    cursor: 'pointer',
                    transition: 'all 0.12s',
                  }}
                >
                  {k}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #21262d', fontSize: 11, color: '#4b5563', lineHeight: 1.5 }}>
              Sets the starting key for all theory tools
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── User avatar dropdown ──────────────────────────────────────────────────────

function UserMenu({ onSignOut }: { onSignOut: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <div style={{ position: 'relative', alignSelf: 'center', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'none', border: '1px solid #30363d', borderRadius: 100,
          padding: '4px 10px 4px 4px', cursor: 'pointer',
          transition: 'border-color 0.15s',
        }}
        title={user.displayName ?? 'Account'}
      >
        {user.photoURL ? (
          <img src={user.photoURL} alt="" width={26} height={26} style={{ borderRadius: '50%' }} />
        ) : (
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff' }}>
            {(user.displayName ?? user.email ?? '?')[0].toUpperCase()}
          </div>
        )}
        <span style={{ fontSize: 13, fontWeight: 500, color: '#8b949e', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.displayName?.split(' ')[0] ?? 'Account'}
        </span>
      </button>

      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 300 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 301,
            background: '#1c2128', border: '1px solid #30363d', borderRadius: 10,
            padding: 6, minWidth: 180,
            boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
          }}>
            <div style={{ padding: '8px 12px', fontSize: 12, color: '#4b5563', borderBottom: '1px solid #21262d', marginBottom: 4 }}>
              {user.email}
            </div>
            <button
              onClick={() => { setOpen(false); onSignOut(); }}
              style={{
                width: '100%', textAlign: 'left', padding: '8px 12px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, color: '#ef4444', borderRadius: 6,
              }}
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { stats } = useStats();
  const { globalKey, setGlobalKey } = useGlobalKey();
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const practiceStreak = computeStreak(stats.practiceLog);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  function handleToggleGroup(groupId: string) {
    setOpenGroup(prev => prev === groupId ? null : groupId);
  }

  function handleSelectTab(tab: Tab) {
    setActiveTab(tab);
    setOpenGroup(null);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleChordDetectToScaleAdvisor(root: string) {
    setGlobalKey(root);
    handleSelectTab('scaleadvisor');
  }

  // Auth loading spinner
  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 14, color: '#4b5563' }}>Loading…</div>
      </div>
    );
  }

  // Auth gate — no user
  if (!user) {
    return <AuthGate />;
  }

  // Find the active tool name for mobile header breadcrumb
  const activeToolLabel = GROUPS.flatMap(g => g.tabs).find(t => t.id === activeTab)?.label ?? null;

  // Build context string for Modal Buddy
  const buddyContext = activeToolLabel && activeTab !== 'home'
    ? `${activeToolLabel} — key: ${globalKey}`
    : undefined;


  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', color: '#e6edf3', display: 'flex', flexDirection: 'column' }}>

      {/* Inject header styles + Google Fonts */}
      <style>{HEADER_STYLES}</style>

      {/* Desktop overlay — closes dropdowns on outside click */}
      {openGroup && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 150 }} onClick={() => setOpenGroup(null)} />
      )}

      {/* ── Header ─────────────────────────────────────────────── */}
      <header style={{
        borderBottom: '1px solid #21262d',
        background: '#161b22',
        position: 'sticky', top: 0, zIndex: 160,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'stretch', height: 58 }}>

            {/* Logo + wordmark — click goes home */}
            <button
              onClick={() => handleSelectTab('home')}
              title="tonic — home"
              style={{
                display: 'flex', alignItems: 'center',
                padding: '0',
                marginRight: 0,
                background: 'none', border: 'none',
                cursor: 'pointer', flexShrink: 0,
                gap: 0,
              }}
            >
              <img
                src="/logo.png"
                alt="tonic"
                style={{ width: 36, height: 36, display: 'block', mixBlendMode: 'screen' }}
              />
              <span style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: 18,
                color: '#e6edf3',
                letterSpacing: '-0.5px',
                marginLeft: 10,
                lineHeight: 1,
              }}>
                tonic
              </span>
            </button>

            {/* Divider */}
            <div style={{
              width: 1,
              height: 28,
              background: '#21262d',
              alignSelf: 'center',
              margin: '0 20px',
              flexShrink: 0,
            }} />

            {/* ── Desktop nav (hidden on mobile via CSS) ── */}
            <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'stretch', position: 'relative', zIndex: 161 }}>
              {GROUPS.map(group => (
                <NavGroup
                  key={group.id}
                  group={group}
                  activeTab={activeTab}
                  isOpen={openGroup === group.id}
                  onToggle={() => handleToggleGroup(group.id)}
                  onSelect={handleSelectTab}
                />
              ))}
            </nav>

            {/* ── Mobile: active page label (hidden on desktop) ── */}
            {activeToolLabel && (
              <div className="mobile-breadcrumb" style={{
                display: 'none', /* overridden by CSS on mobile */
                alignItems: 'center',
                flex: 1,
                fontSize: 14, fontWeight: 600, color: '#c4b5fd',
                paddingLeft: 12,
              }}>
                {activeToolLabel}
              </div>
            )}

            {/* Right spacer */}
            <div style={{ flex: 1 }} />

            {/* Global key picker */}
            <GlobalKeyPicker />

            {/* Streak badge */}
            {practiceStreak > 0 && (
              <button
                onClick={() => handleSelectTab('journal')}
                title={`${practiceStreak} day streak — view Practice Journal`}
                style={{
                  alignSelf: 'center',
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'linear-gradient(135deg, #f97316, #dc2626)',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "'DM Sans', sans-serif",
                  padding: '6px 12px',
                  borderRadius: 100,
                  border: 'none',
                  cursor: 'pointer',
                  marginRight: 10,
                  flexShrink: 0,
                  boxShadow: '0 0 12px rgba(249,115,22,0.3)',
                }}
              >
                🔥 {practiceStreak}
              </button>
            )}

            {/* User avatar + sign out — desktop only */}
            <UserMenu onSignOut={signOut} />

            {/* ── Mobile: hamburger button (hidden on desktop) ── */}
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(o => !o)}
              aria-label="Open navigation menu"
              style={{
                display: 'none', /* overridden by CSS on mobile */
                alignItems: 'center', justifyContent: 'center',
                marginLeft: 8,
                width: 44, height: '100%',
                background: 'none', border: 'none',
                cursor: 'pointer', color: '#e6edf3',
                flexShrink: 0,
              }}
            >
              {mobileMenuOpen ? (
                /* X icon */
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                /* Hamburger icon */
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </button>

          </div>
        </div>
      </header>

      {/* ── Mobile full menu ─────────────────────────────────────── */}
      {mobileMenuOpen && (
        <MobileMenu
          activeTab={activeTab}
          onSelect={handleSelectTab}
          onClose={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── Main content ────────────────────────────────────────── */}
      <main style={{
        flex: 1,
        maxWidth: activeTab === 'home' ? '100%' : 1200,
        width: '100%',
        margin: '0 auto',
        padding: activeTab === 'home' ? '0' : '24px 16px',
        boxSizing: 'border-box',
      }}>
        {activeTab === 'home'          && <HomePage onNavigate={handleSelectTab} />}
        {activeTab === 'voicings'      && <ChordVoicingsFeature />}
        {activeTab === 'scales'        && <ScaleRecognitionFeature />}
        {activeTab === 'dictionary'    && <ScaleDictionaryFeature />}
        {activeTab === 'ear'           && <EarTrainingFeature />}
        {activeTab === 'circle'        && <CircleOfFifthsFeature />}
        {activeTab === 'harmonization' && <ScaleHarmonizationFeature />}
        {activeTab === 'modal'         && <ModalInterchangeFeature />}
        {activeTab === 'progressions'  && <ChordProgressionFeature />}
        {activeTab === 'scaleadvisor'  && <ScaleAdvisorFeature />}
        {activeTab === 'analysis'      && <HarmonicAnalysisFeature />}
        {activeTab === 'riff'          && <RiffArchitectFeature />}
        {activeTab === 'melody'        && <MelodyArchitectFeature />}
        {activeTab === 'quiz'          && <IntervalQuizFeature />}
        {activeTab === 'score'         && <ScoreToIRealFeature />}
        {activeTab === 'landing'       && <ChordLandingFeature />}
        {activeTab === 'architect'     && <SongArchitectFeature />}
        {activeTab === 'daily'         && <DailyChallengeFeature />}
        {activeTab === 'journal'       && <PracticeJournalFeature />}
        {activeTab === 'songs'         && <SongLibraryFeature />}
        {activeTab === 'chorddetect'   && <ChordDetectionFeature onNavigateToScaleAdvisor={handleChordDetectToScaleAdvisor} />}
        {activeTab === 'nailpitch'     && <NailThePitchFeature />}
      </main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid #21262d',
        padding: '12px 16px',
        textAlign: 'center',
        fontSize: 11,
        color: '#4b5563',
      }}>
        tonic · Explore. Hear. Create.
      </footer>

      {/* ── Modal Buddy — floating AI chat ── */}
      <ModalBuddy context={buddyContext} />
    </div>
  );
}
