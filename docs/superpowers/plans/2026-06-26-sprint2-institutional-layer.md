# Sprint 2 — Layer Istituzionale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the institutional conservatory layer to tonic — multi-role auth (student/teacher), Teacher Dashboard with assignment/roster tracking, Simulated Exam templates in the Solfeggio group, and automatic Firestore submission saving.

**Architecture:** A new `UserProfileContext` reads `users/{uid}` from Firestore on login and exposes `role: 'student' | 'teacher' | null` to all components. New Firestore collections (`classes`, `assignments`, `submissions`) support the teacher workflow. The Teacher Dashboard is a hidden tab revealed only when `role === 'teacher'`. Exam Templates appear as a 4th item in the Solfeggio nav group. All cloud features degrade gracefully — `LocalModeNotice` when Firebase is absent, access-denied message when role is insufficient.

**Tech Stack:** React 18, TypeScript, Firebase Firestore v9 modular SDK, existing tonal/audioPlayer/generateQuestions infrastructure from Sprint 1.

---

## File Map

### New files
| File | Purpose |
|---|---|
| `src/shared/types/conservatory.types.ts` | UserProfile, ClassDoc, AssignmentDoc, SubmissionDoc types |
| `src/shared/utils/firestoreConservatory.ts` | Firestore CRUD for all conservatory collections |
| `src/shared/context/UserProfileContext.tsx` | role/profile context provider |
| `src/features/exam-templates/types.ts` | ExamTemplate, ExamSection, MultiSectionExamResult |
| `src/features/exam-templates/data/templates.ts` | 3 built-in exam templates |
| `src/features/exam-templates/components/TemplateSelector.tsx` | pick a template + start |
| `src/features/exam-templates/components/SectionExamSession.tsx` | single-section question loop |
| `src/features/exam-templates/components/MultiModuleExamSession.tsx` | multi-section exam runner |
| `src/features/exam-templates/components/ExamTemplateResults.tsx` | final results + Firestore save |
| `src/features/exam-templates/ExamTemplatesFeature.tsx` | entry point |
| `src/features/teacher-dashboard/TeacherDashboardFeature.tsx` | entry + layout + data loading |
| `src/features/teacher-dashboard/components/AlertsPanel.tsx` | inactive students + deadline badges |
| `src/features/teacher-dashboard/components/AssignmentsPanel.tsx` | active assignments list |
| `src/features/teacher-dashboard/components/NewAssignmentModal.tsx` | create assignment modal |
| `src/features/teacher-dashboard/components/RosterPanel.tsx` | student list with stats |
| `src/features/teacher-dashboard/components/StudentDrawer.tsx` | student detail slide-in |

### Modified files
| File | Change |
|---|---|
| `src/main.tsx` | wrap App with `<UserProfileProvider>` |
| `src/App.tsx` | add `'examtemplates' \| 'teacherdashboard'` tabs, teacher nav button, render branches |
| `src/features/ear-training-pro/components/ExamResults.tsx` | save submission to Firestore on mount |

---

## Task 1: Shared types + Firestore utilities

**Files:**
- Create: `src/shared/types/conservatory.types.ts`
- Create: `src/shared/utils/firestoreConservatory.ts`

- [ ] **Step 1: Create conservatory types**

```typescript
// src/shared/types/conservatory.types.ts

export type UserRole = 'student' | 'teacher';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: UserRole;
  conservatory?: string;
  createdAt: number;
}

export interface ClassDoc {
  id?: string;
  teacherId: string;
  name: string;
  studentIds: string[];
  createdAt: number;
}

export interface AssignmentDoc {
  id?: string;
  classId: string;
  teacherId: string;
  moduleId: string;
  level: 1 | 2 | 3;
  mode: 'training' | 'exam';
  dueDate: number;
  createdAt: number;
  title: string;
}

export interface SubmissionDoc {
  id?: string;
  userId: string;
  assignmentId?: string;
  moduleId: string;
  score: number;
  answers: Array<{
    questionId: string;
    given: string;
    correct: string;
    isCorrect: boolean;
    timeMs: number;
  }>;
  completedAt: number;
  durationMs: number;
}
```

- [ ] **Step 2: Create Firestore utilities**

```typescript
// src/shared/utils/firestoreConservatory.ts
import {
  doc, collection, getDoc, getDocs, setDoc, addDoc,
  query, where, orderBy, limit, type DocumentData,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from '../../firebase';
import type { UserProfile, ClassDoc, AssignmentDoc, SubmissionDoc } from '../types/conservatory.types';

function requireDb() {
  if (!db) throw new Error('Firebase not configured');
  return db;
}

// ─── UserProfile ─────────────────────────────────────────────────────────────

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(requireDb(), 'users', uid));
  if (!snap.exists()) return null;
  return { uid, ...(snap.data() as Omit<UserProfile, 'uid'>) };
}

export async function getOrCreateUserProfile(user: User): Promise<UserProfile> {
  const existing = await getUserProfile(user.uid);
  if (existing) return existing;

  const profile: Omit<UserProfile, 'uid'> = {
    displayName: user.displayName ?? user.email ?? 'Utente',
    email: user.email ?? '',
    role: 'student',
    createdAt: Date.now(),
  };
  await setDoc(doc(requireDb(), 'users', user.uid), profile);
  return { uid: user.uid, ...profile };
}

export async function getUserProfiles(uids: string[]): Promise<UserProfile[]> {
  if (!uids.length) return [];
  // Firestore `in` limit is 30; batch if needed
  const batches: string[][] = [];
  for (let i = 0; i < uids.length; i += 30) batches.push(uids.slice(i, i + 30));

  const results: UserProfile[] = [];
  for (const batch of batches) {
    const q = query(collection(requireDb(), 'users'), where('__name__', 'in', batch));
    const snap = await getDocs(q);
    snap.docs.forEach(d => results.push({ uid: d.id, ...(d.data() as Omit<UserProfile, 'uid'>) }));
  }
  return results;
}

// ─── Classes ─────────────────────────────────────────────────────────────────

export async function getClassesByTeacher(teacherId: string): Promise<ClassDoc[]> {
  const q = query(collection(requireDb(), 'classes'), where('teacherId', '==', teacherId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<ClassDoc, 'id'>) }));
}

export async function createClass(data: Omit<ClassDoc, 'id'>): Promise<ClassDoc> {
  const ref = await addDoc(collection(requireDb(), 'classes'), data);
  return { id: ref.id, ...data };
}

// ─── Assignments ─────────────────────────────────────────────────────────────

export async function getAssignmentsByTeacher(teacherId: string): Promise<AssignmentDoc[]> {
  const q = query(
    collection(requireDb(), 'assignments'),
    where('teacherId', '==', teacherId),
    orderBy('createdAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<AssignmentDoc, 'id'>) }));
}

export async function createAssignment(data: Omit<AssignmentDoc, 'id'>): Promise<AssignmentDoc> {
  const ref = await addDoc(collection(requireDb(), 'assignments'), data);
  return { id: ref.id, ...data };
}

// ─── Submissions ─────────────────────────────────────────────────────────────

export async function addSubmission(data: Omit<SubmissionDoc, 'id'>): Promise<string> {
  const ref = await addDoc(collection(requireDb(), 'submissions'), data);
  return ref.id;
}

export async function getSubmissionsByUser(userId: string, limitN = 50): Promise<SubmissionDoc[]> {
  const q = query(
    collection(requireDb(), 'submissions'),
    where('userId', '==', userId),
    orderBy('completedAt', 'desc'),
    limit(limitN),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<SubmissionDoc, 'id'>) }));
}

export async function getSubmissionsByStudents(studentIds: string[]): Promise<SubmissionDoc[]> {
  if (!studentIds.length) return [];
  const batches: string[][] = [];
  for (let i = 0; i < studentIds.length; i += 30) batches.push(studentIds.slice(i, i + 30));

  const results: SubmissionDoc[] = [];
  for (const batch of batches) {
    const q = query(
      collection(requireDb(), 'submissions'),
      where('userId', 'in', batch),
      orderBy('completedAt', 'desc'),
    );
    const snap = await getDocs(q);
    snap.docs.forEach(d => results.push({ id: d.id, ...(d.data() as Omit<SubmissionDoc, 'id'>) }));
  }
  return results;
}
```

- [ ] **Step 3: Verify TypeScript**

```bash
npm run build
```

Expected: no errors in the two new files.

- [ ] **Step 4: Commit**

```bash
git add src/shared/types/conservatory.types.ts src/shared/utils/firestoreConservatory.ts
git commit -m "feat(conservatory): add shared types and Firestore utilities"
```

---

## Task 2: UserProfileContext + main.tsx integration

**Files:**
- Create: `src/shared/context/UserProfileContext.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Create UserProfileContext**

```typescript
// src/shared/context/UserProfileContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { getOrCreateUserProfile } from '../utils/firestoreConservatory';
import { firebaseEnabled } from '../../firebase';
import type { UserProfile, UserRole } from '../types/conservatory.types';

interface UserProfileContextValue {
  profile: UserProfile | null;
  profileLoading: boolean;
  role: UserRole | null;
}

const UserProfileContext = createContext<UserProfileContextValue>({
  profile: null,
  profileLoading: false,
  role: null,
});

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (!user || !firebaseEnabled) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    getOrCreateUserProfile(user)
      .then(p => { setProfile(p); setProfileLoading(false); })
      .catch(() => { setProfileLoading(false); });
  }, [user?.uid]);

  return (
    <UserProfileContext.Provider value={{ profile, profileLoading, role: profile?.role ?? null }}>
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  return useContext(UserProfileContext);
}
```

- [ ] **Step 2: Wrap App with UserProfileProvider in main.tsx**

Current `src/main.tsx`:
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { AuthProvider } from './shared/context/AuthContext.tsx'
import { StatsProvider } from './shared/context/StatsContext.tsx'
import { GlobalKeyProvider } from './shared/context/GlobalKeyContext.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <StatsProvider>
        <GlobalKeyProvider>
          <App />
        </GlobalKeyProvider>
      </StatsProvider>
    </AuthProvider>
  </React.StrictMode>,
)
```

Replace with:
```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { AuthProvider } from './shared/context/AuthContext.tsx'
import { UserProfileProvider } from './shared/context/UserProfileContext.tsx'
import { StatsProvider } from './shared/context/StatsContext.tsx'
import { GlobalKeyProvider } from './shared/context/GlobalKeyContext.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <UserProfileProvider>
        <StatsProvider>
          <GlobalKeyProvider>
            <App />
          </GlobalKeyProvider>
        </StatsProvider>
      </UserProfileProvider>
    </AuthProvider>
  </React.StrictMode>,
)
```

- [ ] **Step 3: Verify TypeScript**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/shared/context/UserProfileContext.tsx src/main.tsx
git commit -m "feat(conservatory): add UserProfileContext for role-based access"
```

---

## Task 3: App.tsx wiring — new tabs + teacher nav button

**Files:**
- Modify: `src/App.tsx`

This task makes three targeted changes to `App.tsx`:
1. Add two tab IDs to the `Tab` union type
2. Add `examtemplates` to the Solfeggio group in `GROUPS`
3. Add teacher nav button in the desktop header + mobile menu
4. Add two render branches in `<main>`
5. Import the two new feature components

- [ ] **Step 1: Add imports at the top of App.tsx (after the existing imports, before the theme styles)**

Locate the line:
```typescript
import SetticlavioFeature from './features/setticlavio/SetticlavioFeature';
```

Add after it:
```typescript
import ExamTemplatesFeature from './features/exam-templates/ExamTemplatesFeature';
import TeacherDashboardFeature from './features/teacher-dashboard/TeacherDashboardFeature';
import { useUserProfile } from './shared/context/UserProfileContext';
```

- [ ] **Step 2: Extend the Tab union type**

Find:
```typescript
  | 'setticlavio';
```

Replace with:
```typescript
  | 'setticlavio'
  | 'examtemplates'
  | 'teacherdashboard';
```

- [ ] **Step 3: Add examtemplates to the Solfeggio group**

Find in the `GROUPS` array the `solfeggio` group:
```typescript
    tabs: [
      { id: 'eartrainingpro', label: 'Ear Training Pro', icon: '👂', desc: 'Intervalli, accordi, funzioni tonali — modalità Allenamento ed Esame' },
      { id: 'solfeggiocan',   label: 'Solfeggio Cantato', icon: '🎵', desc: 'Canta scale e intervalli — pitchy valuta la tua intonazione' },
      { id: 'setticlavio',    label: 'Setticlavio',       icon: '🗝️',  desc: 'Leggi note in chiave di contralto e tenore' },
    ],
```

Replace with:
```typescript
    tabs: [
      { id: 'eartrainingpro', label: 'Ear Training Pro',   icon: '👂', desc: 'Intervalli, accordi, funzioni tonali — modalità Allenamento ed Esame' },
      { id: 'solfeggiocan',   label: 'Solfeggio Cantato',  icon: '🎵', desc: 'Canta scale e intervalli — pitchy valuta la tua intonazione' },
      { id: 'setticlavio',    label: 'Setticlavio',         icon: '🗝️',  desc: 'Leggi note in chiave di contralto e tenore' },
      { id: 'examtemplates',  label: 'Prove d\'Esame',      icon: '📝', desc: 'Simula un esame AFAM — domande miste su intervalli, accordi e cadenze' },
    ],
```

- [ ] **Step 4: Add `useUserProfile` to the App component**

Find in the `App()` function body:
```typescript
  const { user, loading: authLoading, signOut } = useAuth();
```

Add after it:
```typescript
  const { role } = useUserProfile();
```

- [ ] **Step 5: Add teacher button in the desktop header**

Find:
```typescript
            {/* User avatar + sign out — desktop only (hidden in local mode) */}
            {user && <UserMenu onSignOut={signOut} onProfile={() => handleSelectTab('profile')} />}
```

Replace with:
```typescript
            {/* Teacher nav button — only for teacher role */}
            {role === 'teacher' && (
              <button
                onClick={() => handleSelectTab('teacherdashboard')}
                style={{
                  alignSelf: 'center',
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: activeTab === 'teacherdashboard' ? 'rgba(124,58,237,0.15)' : 'none',
                  color: activeTab === 'teacherdashboard' ? '#c4b5fd' : '#8b949e',
                  fontSize: 13, fontWeight: 600,
                  fontFamily: "'DM Sans', sans-serif",
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: '1px solid',
                  borderColor: activeTab === 'teacherdashboard' ? '#7c3aed' : '#30363d',
                  cursor: 'pointer',
                  marginRight: 8,
                  flexShrink: 0,
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                🎓 Docente
              </button>
            )}

            {/* User avatar + sign out — desktop only (hidden in local mode) */}
            {user && <UserMenu onSignOut={signOut} onProfile={() => handleSelectTab('profile')} />}
```

- [ ] **Step 6: Add teacher button to the MobileMenu component**

The `MobileMenu` function currently iterates `GROUPS`. It needs to use `useUserProfile` and show a Docente section at the bottom for teachers.

Find the function signature:
```typescript
function MobileMenu({
  activeTab, onSelect, onClose,
}: {
  activeTab: Tab;
  onSelect: (tab: Tab) => void;
  onClose: () => void;
}) {
```

Add a `role` prop:
```typescript
function MobileMenu({
  activeTab, onSelect, onClose, role,
}: {
  activeTab: Tab;
  onSelect: (tab: Tab) => void;
  onClose: () => void;
  role: import('./shared/types/conservatory.types').UserRole | null;
}) {
```

At the bottom of the drawer content (after the `{GROUPS.map(...)}` block, before the closing `</div>` of the Drawer), add:
```typescript
        {/* Teacher section — only visible when role === 'teacher' */}
        {role === 'teacher' && (
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 20px 8px',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
              color: '#4b5563', textTransform: 'uppercase',
              borderTop: '1px solid #21262d',
              marginTop: 4,
            }}>
              <span style={{ fontSize: 13 }}>🎓</span>
              Docente
            </div>
            <button
              onClick={() => onSelect('teacherdashboard')}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 20px',
                background: activeTab === 'teacherdashboard' ? '#7c3aed18' : 'none',
                border: 'none',
                borderLeft: `3px solid ${activeTab === 'teacherdashboard' ? '#7c3aed' : 'transparent'}`,
                cursor: 'pointer', textAlign: 'left',
                color: '#e6edf3',
              }}
            >
              <span style={{ fontSize: 16 }}>📊</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Dashboard Docente</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>Gestisci classi, compiti e studenti</div>
              </div>
            </button>
          </div>
        )}
```

Find where MobileMenu is used:
```typescript
        <MobileMenu
          activeTab={activeTab}
          onSelect={handleSelectTab}
          onClose={() => setMobileMenuOpen(false)}
        />
```

Replace with:
```typescript
        <MobileMenu
          activeTab={activeTab}
          onSelect={handleSelectTab}
          onClose={() => setMobileMenuOpen(false)}
          role={role}
        />
```

- [ ] **Step 7: Add render branches in the main section**

Find:
```typescript
        {activeTab === 'profile'       && (firebaseEnabled ? <ProfileFeature />         : <LocalModeNotice feature="Profile" />)}
```

Add after it:
```typescript
        {activeTab === 'examtemplates'    && <ExamTemplatesFeature />}
        {activeTab === 'teacherdashboard' && (firebaseEnabled ? <TeacherDashboardFeature /> : <LocalModeNotice feature="Dashboard Docente" />)}
```

- [ ] **Step 8: Verify TypeScript**

```bash
npm run build
```

Expected: errors about missing modules `ExamTemplatesFeature` and `TeacherDashboardFeature` — that's fine (stub files don't exist yet). The Tab type, Group, and header changes should type-check correctly once you create empty stub exports. To unblock build, create temporary stubs:

```typescript
// src/features/exam-templates/ExamTemplatesFeature.tsx
export default function ExamTemplatesFeature() { return null; }
```

```typescript
// src/features/teacher-dashboard/TeacherDashboardFeature.tsx
export default function TeacherDashboardFeature() { return null; }
```

Then run `npm run build` and expect zero errors.

- [ ] **Step 9: Commit**

```bash
git add src/App.tsx src/main.tsx src/features/exam-templates/ExamTemplatesFeature.tsx src/features/teacher-dashboard/TeacherDashboardFeature.tsx
git commit -m "feat(nav): add exam-templates and teacher-dashboard tabs, teacher nav button"
```

---

## Task 4: Exam Templates — types + data

**Files:**
- Create: `src/features/exam-templates/types.ts`
- Create: `src/features/exam-templates/data/templates.ts`

- [ ] **Step 1: Create exam template types**

```typescript
// src/features/exam-templates/types.ts
import type { EarModuleId, ExerciseLevel, ExamAnswer } from '../ear-training-pro/types';

export interface ExamSection {
  moduleId: EarModuleId;
  questionCount: number;
  level: ExerciseLevel;
  label: string;
}

export interface ExamTemplate {
  id: string;
  title: string;
  description: string;
  totalDurationMinutes: number;
  sections: ExamSection[];
}

export interface SectionResult {
  moduleId: EarModuleId;
  level: ExerciseLevel;
  label: string;
  answers: ExamAnswer[];
  score: number;  // 0-100
}

export interface MultiSectionExamResult {
  templateId: string;
  sections: SectionResult[];
  totalScore: number;     // weighted average across sections
  completedAt: string;    // ISO timestamp
  durationMs: number;
}
```

- [ ] **Step 2: Create the 3 built-in templates**

```typescript
// src/features/exam-templates/data/templates.ts
import type { ExamTemplate } from '../types';

export const EXAM_TEMPLATES: ExamTemplate[] = [
  {
    id: 'base',
    title: 'Prova Base',
    description: '5 intervalli melodici + 5 triadi — livello 1. Circa 10 minuti.',
    totalDurationMinutes: 10,
    sections: [
      { moduleId: 'melodic-intervals', questionCount: 5, level: 1, label: 'Intervalli melodici' },
      { moduleId: 'triads',            questionCount: 5, level: 1, label: 'Triadi' },
    ],
  },
  {
    id: 'intermedio',
    title: 'Prova Intermedia',
    description: '5 intervalli armonici L2 + 5 settime L2 + 3 cadenze. Circa 15 minuti.',
    totalDurationMinutes: 15,
    sections: [
      { moduleId: 'harmonic-intervals', questionCount: 5, level: 2, label: 'Intervalli armonici' },
      { moduleId: 'sevenths',           questionCount: 5, level: 2, label: 'Accordi di settima' },
      { moduleId: 'cadences',           questionCount: 3, level: 2, label: 'Cadenze' },
    ],
  },
  {
    id: 'avanzato',
    title: 'Prova Avanzata',
    description: '3 intervalli armonici + 3 settime L3 + 4 funzioni tonali. Circa 20 minuti.',
    totalDurationMinutes: 20,
    sections: [
      { moduleId: 'harmonic-intervals', questionCount: 3, level: 3, label: 'Intervalli armonici' },
      { moduleId: 'sevenths',           questionCount: 3, level: 3, label: 'Accordi di settima' },
      { moduleId: 'tonal-functions',    questionCount: 4, level: 3, label: 'Funzioni tonali' },
    ],
  },
];
```

- [ ] **Step 3: Verify TypeScript**

```bash
npm run build
```

Expected: no new errors from these two files.

- [ ] **Step 4: Commit**

```bash
git add src/features/exam-templates/types.ts src/features/exam-templates/data/templates.ts
git commit -m "feat(exam-templates): add types and 3 built-in exam templates"
```

---

## Task 5: Exam Templates — UI components + feature entry

**Files:**
- Create: `src/features/exam-templates/components/TemplateSelector.tsx`
- Create: `src/features/exam-templates/components/SectionExamSession.tsx`
- Create: `src/features/exam-templates/components/MultiModuleExamSession.tsx`
- Create: `src/features/exam-templates/components/ExamTemplateResults.tsx`
- Replace stub: `src/features/exam-templates/ExamTemplatesFeature.tsx`

### TemplateSelector

- [ ] **Step 1: Create TemplateSelector**

```typescript
// src/features/exam-templates/components/TemplateSelector.tsx
import React from 'react';
import type { ExamTemplate } from '../types';
import { EXAM_TEMPLATES } from '../data/templates';

interface Props {
  onSelect: (template: ExamTemplate) => void;
}

export function TemplateSelector({ onSelect }: Props) {
  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>
      <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: '#e6edf3', margin: '0 0 6px' }}>
        Prove d'Esame
      </h1>
      <p style={{ fontSize: 14, color: '#8b949e', margin: '0 0 28px' }}>
        Simulazioni d'esame AFAM. Nessun feedback durante la prova — i risultati appaiono alla fine.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {EXAM_TEMPLATES.map(t => (
          <div
            key={t.id}
            style={{
              background: '#161b22',
              border: '1px solid #30363d',
              borderRadius: 14,
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#e6edf3', marginBottom: 4 }}>{t.title}</div>
              <div style={{ fontSize: 13, color: '#8b949e', marginBottom: 8 }}>{t.description}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {t.sections.map(s => (
                  <span
                    key={s.moduleId}
                    style={{
                      fontSize: 11, padding: '2px 8px',
                      background: 'rgba(124,58,237,0.1)',
                      border: '1px solid rgba(124,58,237,0.3)',
                      borderRadius: 100,
                      color: '#c4b5fd',
                    }}
                  >
                    {s.label} L{s.level} ×{s.questionCount}
                  </span>
                ))}
              </div>
            </div>
            <button
              onClick={() => onSelect(t)}
              style={{
                flexShrink: 0,
                padding: '10px 20px',
                background: '#7c3aed',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Inizia
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### SectionExamSession

This is a stripped-down question loop (no internal results screen). It calls `onDone(answers)` when all questions are answered.

- [ ] **Step 2: Create SectionExamSession**

```typescript
// src/features/exam-templates/components/SectionExamSession.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { audioPlayer } from '../../ear-training/utils/audio-player';
import type { ExamQuestion, ExamAnswer } from '../../ear-training-pro/types';

interface Props {
  questions: ExamQuestion[];
  sectionLabel: string;
  sectionIndex: number;
  totalSections: number;
  onDone: (answers: ExamAnswer[]) => void;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function midiToNoteNames(midis: number[]): string[] {
  return midis.map(m => `${NOTE_NAMES[m % 12]}${Math.floor(m / 12) - 1}`);
}

export function SectionExamSession({ questions, sectionLabel, sectionIndex, totalSections, onDone }: Props) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<ExamAnswer[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const questionStart = useRef(Date.now());

  const q = questions[idx];

  const play = useCallback(async () => {
    if (isPlaying || !q) return;
    setIsPlaying(true);
    try {
      if (q.notes.includes(999)) {
        const sep = q.notes.indexOf(999);
        await audioPlayer.playChord(midiToNoteNames(q.notes.slice(0, sep)));
        await audioPlayer.delay((q.gapMs ?? 700) + 500);
        await audioPlayer.playChord(midiToNoteNames(q.notes.slice(sep + 1)));
      } else if (q.playMode === 'sequential') {
        await audioPlayer.playSequence(midiToNoteNames(q.notes), q.gapMs ?? 600, 0.8);
      } else {
        await audioPlayer.playChord(midiToNoteNames(q.notes));
      }
    } finally {
      await audioPlayer.delay(1500);
      setIsPlaying(false);
    }
  }, [q, isPlaying]);

  // Auto-play on each new question
  useEffect(() => {
    questionStart.current = Date.now();
    play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  function handleAnswer(choice: string) {
    const ans: ExamAnswer = {
      questionId: q.id,
      given: choice,
      correct: q.correct,
      isCorrect: choice === q.correct,
      timeMs: Date.now() - questionStart.current,
    };
    const next = [...answers, ans];
    if (idx + 1 >= questions.length) {
      onDone(next);
    } else {
      setAnswers(next);
      setIdx(i => i + 1);
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 16px' }}>
      {/* Section header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
          Sezione {sectionIndex + 1} di {totalSections}
        </div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#c4b5fd' }}>{sectionLabel}</div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: '#21262d', borderRadius: 2, marginBottom: 20, overflow: 'hidden' }}>
        <div style={{ width: `${(idx / questions.length) * 100}%`, height: '100%', background: '#7c3aed', borderRadius: 2, transition: 'width .3s' }} />
      </div>

      <div style={{ fontSize: 12, color: '#8b949e', marginBottom: 20, textAlign: 'center' }}>
        Domanda {idx + 1} / {questions.length}
      </div>

      {/* Play button */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <button
          onClick={play}
          disabled={isPlaying}
          style={{
            padding: '12px 32px',
            background: isPlaying ? '#4b5563' : '#7c3aed',
            color: '#fff', border: 'none', borderRadius: 100,
            fontSize: 14, fontWeight: 700, cursor: isPlaying ? 'default' : 'pointer',
          }}
        >
          {isPlaying ? '▶ Suono…' : '▶ Riascolta'}
        </button>
      </div>

      {/* Choices */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {q.choices.map(c => (
          <button
            key={c}
            onClick={() => handleAnswer(c)}
            style={{
              padding: '14px 10px', background: '#1c2128',
              border: '1px solid #30363d', borderRadius: 10,
              color: '#e6edf3', fontSize: 14, fontWeight: 600,
              cursor: 'pointer', textAlign: 'center',
            }}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
```

### MultiModuleExamSession

- [ ] **Step 3: Create MultiModuleExamSession**

```typescript
// src/features/exam-templates/components/MultiModuleExamSession.tsx
import React, { useState, useMemo } from 'react';
import { generateQuestions } from '../../ear-training-pro/data/index';
import { SectionExamSession } from './SectionExamSession';
import type { ExamTemplate, SectionResult, MultiSectionExamResult } from '../types';
import type { ExamAnswer } from '../../ear-training-pro/types';

interface Props {
  template: ExamTemplate;
  onDone: (result: MultiSectionExamResult) => void;
  onBack: () => void;
}

type Phase = 'intro' | 'running' | 'interstitial';

export function MultiModuleExamSession({ template, onDone, onBack }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [sectionIdx, setSectionIdx] = useState(0);
  const [completedSections, setCompletedSections] = useState<SectionResult[]>([]);
  const [startTime] = useState(Date.now());

  const currentSection = template.sections[sectionIdx];
  const questions = useMemo(
    () => generateQuestions(currentSection.moduleId, currentSection.level, currentSection.questionCount),
    [sectionIdx], // regenerate when section changes
  );

  function handleSectionDone(answers: ExamAnswer[]) {
    const correct = answers.filter(a => a.isCorrect).length;
    const score = answers.length ? Math.round((correct / answers.length) * 100) : 0;
    const result: SectionResult = {
      moduleId: currentSection.moduleId,
      level: currentSection.level,
      label: currentSection.label,
      answers,
      score,
    };
    const updated = [...completedSections, result];
    setCompletedSections(updated);

    if (sectionIdx + 1 >= template.sections.length) {
      // All sections done
      const totalScore = Math.round(updated.reduce((acc, s) => acc + s.score, 0) / updated.length);
      onDone({
        templateId: template.id,
        sections: updated,
        totalScore,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      });
    } else {
      setPhase('interstitial');
    }
  }

  function handleNextSection() {
    setSectionIdx(i => i + 1);
    setPhase('running');
  }

  if (phase === 'intro') {
    return (
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '40px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 16 }}>📝</div>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 24, fontWeight: 800, color: '#e6edf3', margin: '0 0 12px' }}>
          {template.title}
        </h2>
        <p style={{ fontSize: 14, color: '#8b949e', margin: '0 0 8px' }}>{template.description}</p>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 32px' }}>
          {template.sections.length} sezioni · ~{template.totalDurationMinutes} minuti<br />
          Nessun feedback durante la prova.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={onBack}
            style={{
              padding: '12px 24px', background: 'none',
              border: '1px solid #30363d', borderRadius: 8,
              color: '#8b949e', fontSize: 14, cursor: 'pointer',
            }}
          >
            Annulla
          </button>
          <button
            onClick={() => setPhase('running')}
            style={{
              padding: '12px 28px', background: '#7c3aed',
              border: 'none', borderRadius: 8,
              color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            Inizia prova
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'interstitial') {
    const nextSection = template.sections[sectionIdx + 1];
    return (
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '40px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 16 }}>✓</div>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 22, fontWeight: 800, color: '#e6edf3', margin: '0 0 8px' }}>
          Sezione completata!
        </h2>
        <p style={{ fontSize: 14, color: '#8b949e', margin: '0 0 28px' }}>
          Prossima sezione: <strong style={{ color: '#c4b5fd' }}>{nextSection.label}</strong>
          {' '}— {nextSection.questionCount} domande, livello {nextSection.level}
        </p>
        <button
          onClick={handleNextSection}
          style={{
            padding: '12px 28px', background: '#7c3aed',
            border: 'none', borderRadius: 8,
            color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Continua →
        </button>
      </div>
    );
  }

  return (
    <SectionExamSession
      questions={questions}
      sectionLabel={currentSection.label}
      sectionIndex={sectionIdx}
      totalSections={template.sections.length}
      onDone={handleSectionDone}
    />
  );
}
```

### ExamTemplateResults

- [ ] **Step 4: Create ExamTemplateResults**

```typescript
// src/features/exam-templates/components/ExamTemplateResults.tsx
import React, { useEffect, useRef } from 'react';
import type { MultiSectionExamResult } from '../types';
import { useAuth } from '../../../shared/context/AuthContext';
import { addSubmission } from '../../../shared/utils/firestoreConservatory';
import { firebaseEnabled } from '../../../firebase';

interface Props {
  result: MultiSectionExamResult;
  onRetry: () => void;
  onBack: () => void;
}

function scoreColor(s: number): string {
  if (s >= 80) return '#10b981';
  if (s >= 60) return '#f59e0b';
  return '#ef4444';
}

export function ExamTemplateResults({ result, onRetry, onBack }: Props) {
  const { user } = useAuth();
  const saved = useRef(false);

  // Save to Firestore once
  useEffect(() => {
    if (saved.current || !firebaseEnabled || !user) return;
    saved.current = true;

    // Flatten answers for Firestore (combine all sections)
    const allAnswers = result.sections.flatMap(s =>
      s.answers.map(a => ({
        questionId: a.questionId,
        given: a.given,
        correct: a.correct,
        isCorrect: a.isCorrect,
        timeMs: a.timeMs,
      })),
    );

    addSubmission({
      userId: user.uid,
      moduleId: `exam-template:${result.templateId}`,
      score: result.totalScore,
      answers: allAnswers,
      completedAt: new Date(result.completedAt).getTime(),
      durationMs: result.durationMs,
    }).catch(() => {/* fail silently */});
  }, []);

  const mins = Math.floor(result.durationMs / 60000);
  const secs = Math.floor((result.durationMs % 60000) / 1000);

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', padding: '24px 16px' }}>
      {/* Total score */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 64, fontWeight: 800, fontFamily: "'Syne', sans-serif", color: scoreColor(result.totalScore) }}>
          {result.totalScore}%
        </div>
        <div style={{ fontSize: 14, color: '#8b949e', marginTop: 4 }}>
          Durata: {mins}m {String(secs).padStart(2, '0')}s
        </div>
        {!firebaseEnabled && (
          <div style={{ fontSize: 12, color: '#f59e0b', marginTop: 8 }}>
            Firebase non configurato — risultato non salvato
          </div>
        )}
      </div>

      {/* Section breakdown */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
        {result.sections.map((s, i) => {
          const correct = s.answers.filter(a => a.isCorrect).length;
          return (
            <div
              key={i}
              style={{
                background: '#161b22',
                border: '1px solid #30363d',
                borderRadius: 12,
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#e6edf3' }}>{s.label}</div>
                <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>
                  Livello {s.level} · {correct}/{s.answers.length} corrette
                </div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: scoreColor(s.score) }}>
                {s.score}%
              </div>
            </div>
          );
        })}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <button
          onClick={onBack}
          style={{
            padding: '12px 24px', background: 'none',
            border: '1px solid #30363d', borderRadius: 8,
            color: '#8b949e', fontSize: 14, cursor: 'pointer',
          }}
        >
          Menu
        </button>
        <button
          onClick={onRetry}
          style={{
            padding: '12px 24px', background: '#7c3aed',
            border: 'none', borderRadius: 8,
            color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
          }}
        >
          Riprova
        </button>
      </div>
    </div>
  );
}
```

### ExamTemplatesFeature entry point

- [ ] **Step 5: Replace the stub ExamTemplatesFeature**

```typescript
// src/features/exam-templates/ExamTemplatesFeature.tsx
import React, { useState } from 'react';
import { TemplateSelector } from './components/TemplateSelector';
import { MultiModuleExamSession } from './components/MultiModuleExamSession';
import { ExamTemplateResults } from './components/ExamTemplateResults';
import type { ExamTemplate, MultiSectionExamResult } from './types';

type Screen = 'selector' | 'exam' | 'results';

export default function ExamTemplatesFeature() {
  const [screen, setScreen] = useState<Screen>('selector');
  const [template, setTemplate] = useState<ExamTemplate | null>(null);
  const [result, setResult] = useState<MultiSectionExamResult | null>(null);

  function handleSelect(t: ExamTemplate) {
    setTemplate(t);
    setResult(null);
    setScreen('exam');
  }

  function handleDone(r: MultiSectionExamResult) {
    setResult(r);
    setScreen('results');
  }

  if (screen === 'exam' && template) {
    return (
      <MultiModuleExamSession
        template={template}
        onDone={handleDone}
        onBack={() => setScreen('selector')}
      />
    );
  }

  if (screen === 'results' && result) {
    return (
      <ExamTemplateResults
        result={result}
        onRetry={() => { setScreen('exam'); }}
        onBack={() => setScreen('selector')}
      />
    );
  }

  return <TemplateSelector onSelect={handleSelect} />;
}
```

- [ ] **Step 6: Verify TypeScript**

```bash
npm run build
```

Expected: no errors in the exam-templates folder.

- [ ] **Step 7: Commit**

```bash
git add src/features/exam-templates/
git commit -m "feat(exam-templates): TemplateSelector, MultiModuleExamSession, results + Firestore save"
```

---

## Task 6: Save EarTrainingPro exam results to Firestore

**Files:**
- Modify: `src/features/ear-training-pro/components/ExamResults.tsx`

Currently `ExamResults` only displays results. This task adds a `useEffect` that saves to Firestore on first render if Firebase is enabled and a user is logged in.

- [ ] **Step 1: Read the current ExamResults.tsx**

Read file `src/features/ear-training-pro/components/ExamResults.tsx` to see the current imports and component signature.

- [ ] **Step 2: Add Firestore save to ExamResults**

At the top of the file, add these imports after the existing ones:
```typescript
import { useEffect, useRef } from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import { addSubmission } from '../../../shared/utils/firestoreConservatory';
import { firebaseEnabled } from '../../../firebase';
```

Inside the `ExamResults` function body, after the opening brace, add before the `return`:
```typescript
  const { user } = useAuth();
  const saved = useRef(false);

  useEffect(() => {
    if (saved.current || !firebaseEnabled || !user) return;
    saved.current = true;

    addSubmission({
      userId: user.uid,
      moduleId: result.moduleId,
      score: result.score,
      answers: result.answers.map(a => ({
        questionId: a.questionId,
        given: a.given,
        correct: a.correct,
        isCorrect: a.isCorrect,
        timeMs: a.timeMs,
      })),
      completedAt: new Date(result.completedAt).getTime(),
      durationMs: result.durationMs,
    }).catch(() => {/* fail silently */});
  }, []);
```

- [ ] **Step 3: Verify TypeScript**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/ear-training-pro/components/ExamResults.tsx
git commit -m "feat(ear-training-pro): save exam results to Firestore submissions collection"
```

---

## Task 7: Teacher Dashboard — entry, role gate, data loading

**Files:**
- Replace stub: `src/features/teacher-dashboard/TeacherDashboardFeature.tsx`

This task creates the full entry point for the teacher dashboard. It:
1. Shows `LocalModeNotice` when Firebase is absent (already handled in App.tsx, but guard here too)
2. Shows an "Accesso riservato" message if `role !== 'teacher'`
3. Loads classes, all student IDs, student profiles, assignments, and submissions
4. Renders a three-panel layout: AlertsPanel (top), AssignmentsPanel (left), RosterPanel (right)

The data-loading stubs for AlertsPanel, AssignmentsPanel, and RosterPanel are created in Tasks 8–10. This task creates placeholders that receive props and renders them.

- [ ] **Step 1: Create the full TeacherDashboardFeature**

```typescript
// src/features/teacher-dashboard/TeacherDashboardFeature.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import { useUserProfile } from '../../shared/context/UserProfileContext';
import {
  getClassesByTeacher,
  getAssignmentsByTeacher,
  getUserProfiles,
  getSubmissionsByStudents,
} from '../../shared/utils/firestoreConservatory';
import type { ClassDoc, AssignmentDoc, UserProfile, SubmissionDoc } from '../../shared/types/conservatory.types';

// Placeholder imports — replaced in Tasks 8, 9, 10
const AlertsPanel = (_p: AlertsPanelProps) => <div />;
const AssignmentsPanel = (_p: AssignmentsPanelProps) => <div />;
const RosterPanel = (_p: RosterPanelProps) => <div />;

// ── Prop types shared with sub-components ────────────────────────────────────
export interface DashboardData {
  classes: ClassDoc[];
  assignments: AssignmentDoc[];
  students: UserProfile[];
  submissions: SubmissionDoc[];
}

export interface AlertsPanelProps {
  data: DashboardData;
}

export interface AssignmentsPanelProps {
  data: DashboardData;
  onNewAssignment: () => void;
  onRefresh: () => void;
}

export interface RosterPanelProps {
  data: DashboardData;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function TeacherDashboardFeature() {
  const { user } = useAuth();
  const { role, profileLoading } = useUserProfile();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewAssignment, setShowNewAssignment] = useState(false);

  async function loadData() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const classes = await getClassesByTeacher(user.uid);
      const assignments = await getAssignmentsByTeacher(user.uid);

      const allStudentIds = [...new Set(classes.flatMap(c => c.studentIds))];
      const [students, submissions] = await Promise.all([
        getUserProfiles(allStudentIds),
        getSubmissionsByStudents(allStudentIds),
      ]);

      setData({ classes, assignments, students, submissions });
    } catch (e) {
      setError('Errore nel caricamento dei dati. Riprova.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (role === 'teacher') loadData();
    else setLoading(false);
  }, [role, user?.uid]);

  // Role gate
  if (profileLoading || loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
        <div style={{ fontSize: 14, color: '#4b5563' }}>Caricamento…</div>
      </div>
    );
  }

  if (role !== 'teacher') {
    return (
      <div style={{
        maxWidth: 520, margin: '40px auto', padding: '28px 30px',
        background: '#161b22', border: '1px solid #30363d', borderRadius: 16, textAlign: 'center',
      }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🎓</div>
        <h2 style={{ margin: '0 0 8px', fontSize: 20, color: '#e6edf3', fontFamily: "'Syne', sans-serif" }}>
          Accesso riservato ai docenti
        </h2>
        <p style={{ margin: 0, fontSize: 14, color: '#8b949e', lineHeight: 1.6 }}>
          Questa sezione è disponibile solo per i docenti. Se sei un docente, contatta l'amministratore
          per richiedere l'accesso.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: '#ef4444' }}>
        {error}
        <br />
        <button onClick={loadData} style={{ marginTop: 12, padding: '8px 20px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
          Riprova
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: '#e6edf3', margin: '0 0 4px' }}>
            Dashboard Docente
          </h1>
          <div style={{ fontSize: 13, color: '#8b949e' }}>
            {data.classes.length} {data.classes.length === 1 ? 'classe' : 'classi'} ·{' '}
            {data.students.length} studenti ·{' '}
            {data.assignments.filter(a => a.dueDate > Date.now()).length} compiti attivi
          </div>
        </div>
      </div>

      {/* Alerts */}
      <AlertsPanel data={data} />

      {/* Two-column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 16, marginTop: 16 }}>
        <AssignmentsPanel
          data={data}
          onNewAssignment={() => setShowNewAssignment(true)}
          onRefresh={loadData}
        />
        <RosterPanel data={data} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npm run build
```

Expected: no errors (AlertsPanel, AssignmentsPanel, RosterPanel are stubs that accept any props).

- [ ] **Step 3: Commit**

```bash
git add src/features/teacher-dashboard/TeacherDashboardFeature.tsx
git commit -m "feat(teacher-dashboard): add entry point with role gate and data loading"
```

---

## Task 8: Teacher Dashboard — RosterPanel + StudentDrawer

**Files:**
- Create: `src/features/teacher-dashboard/components/RosterPanel.tsx`
- Create: `src/features/teacher-dashboard/components/StudentDrawer.tsx`
- Modify: `src/features/teacher-dashboard/TeacherDashboardFeature.tsx` (replace placeholder imports)

### RosterPanel

- [ ] **Step 1: Create RosterPanel**

```typescript
// src/features/teacher-dashboard/components/RosterPanel.tsx
import React, { useState, useMemo } from 'react';
import type { RosterPanelProps } from '../TeacherDashboardFeature';
import type { UserProfile } from '../../../shared/types/conservatory.types';

type SortKey = 'name' | 'accuracy' | 'sessions';

const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;

export function RosterPanel({ data, onSelectStudent }: RosterPanelProps & { onSelectStudent: (s: UserProfile) => void }) {
  const [sort, setSort] = useState<SortKey>('name');
  const now = Date.now();

  const studentStats = useMemo(() => {
    return data.students.map(s => {
      const subs = data.submissions.filter(sub => sub.userId === s.uid);
      const recent = subs.filter(sub => now - sub.completedAt < ONE_WEEK);
      const accuracy = subs.length
        ? Math.round(subs.reduce((acc, sub) => acc + sub.score, 0) / subs.length)
        : 0;
      return { student: s, sessions: subs.length, recentSessions: recent.length, accuracy };
    });
  }, [data.students, data.submissions]);

  const sorted = [...studentStats].sort((a, b) => {
    if (sort === 'name')     return a.student.displayName.localeCompare(b.student.displayName);
    if (sort === 'accuracy') return b.accuracy - a.accuracy;
    return b.recentSessions - a.recentSessions;
  });

  return (
    <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 14, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #21262d', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#e6edf3' }}>
          Studenti ({data.students.length})
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['name', 'accuracy', 'sessions'] as SortKey[]).map(k => (
            <button
              key={k}
              onClick={() => setSort(k)}
              style={{
                padding: '4px 10px', fontSize: 11, fontWeight: 600,
                background: sort === k ? '#7c3aed' : '#21262d',
                color: sort === k ? '#fff' : '#8b949e',
                border: 'none', borderRadius: 6, cursor: 'pointer',
              }}
            >
              {k === 'name' ? 'Nome' : k === 'accuracy' ? '% Media' : 'Sessioni'}
            </button>
          ))}
        </div>
      </div>

      {/* Student rows */}
      {sorted.length === 0 ? (
        <div style={{ padding: '24px 18px', fontSize: 13, color: '#6b7280', textAlign: 'center' }}>
          Nessuno studente nelle tue classi.<br />
          Aggiungi gli studenti via Firebase console (MVP).
        </div>
      ) : (
        <div>
          {sorted.map(({ student, sessions, recentSessions, accuracy }) => {
            const inactive = recentSessions === 0;
            const initials = student.displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

            return (
              <button
                key={student.uid}
                onClick={() => onSelectStudent(student)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 18px',
                  background: 'none', border: 'none',
                  borderBottom: '1px solid #21262d',
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                  background: inactive ? '#374151' : '#7c3aed33',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 700,
                  color: inactive ? '#6b7280' : '#c4b5fd',
                }}>
                  {initials}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: inactive ? '#8b949e' : '#e6edf3', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {student.displayName}
                    {inactive && <span style={{ fontSize: 10, padding: '1px 6px', background: '#374151', color: '#6b7280', borderRadius: 4 }}>Inattivo</span>}
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>
                    {sessions} sessioni totali · {recentSessions} questa settimana
                  </div>
                </div>

                {/* Accuracy */}
                <div style={{ fontSize: 16, fontWeight: 800, color: accuracy >= 80 ? '#10b981' : accuracy >= 60 ? '#f59e0b' : '#ef4444' }}>
                  {sessions > 0 ? `${accuracy}%` : '—'}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

### StudentDrawer

- [ ] **Step 2: Create StudentDrawer**

```typescript
// src/features/teacher-dashboard/components/StudentDrawer.tsx
import React from 'react';
import type { UserProfile, SubmissionDoc } from '../../../shared/types/conservatory.types';

interface Props {
  student: UserProfile;
  submissions: SubmissionDoc[];
  onClose: () => void;
}

const MODULE_LABELS: Record<string, string> = {
  'melodic-intervals': 'Intervalli melodici',
  'harmonic-intervals': 'Intervalli armonici',
  'triads': 'Triadi',
  'sevenths': 'Settime',
  'tonal-functions': 'Funzioni tonali',
  'cadences': 'Cadenze',
};

function scoreColor(s: number): string {
  if (s >= 80) return '#10b981';
  if (s >= 60) return '#f59e0b';
  return '#ef4444';
}

export function StudentDrawer({ student, submissions, onClose }: Props) {
  const recent = [...submissions]
    .sort((a, b) => b.completedAt - a.completedAt)
    .slice(0, 15);

  const avgScore = submissions.length
    ? Math.round(submissions.reduce((acc, s) => acc + s.score, 0) / submissions.length)
    : 0;

  // Build sparkline data (last 10 submissions in chronological order)
  const sparkData = [...submissions]
    .sort((a, b) => a.completedAt - b.completedAt)
    .slice(-10)
    .map(s => s.score);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.5)' }}
      />

      {/* Drawer */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: Math.min(380, window.innerWidth),
        zIndex: 401,
        background: '#161b22',
        borderLeft: '1px solid #30363d',
        overflowY: 'auto',
        padding: '24px',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#e6edf3' }}>{student.displayName}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{student.email}</div>
            {student.conservatory && (
              <div style={{ fontSize: 12, color: '#6b7280' }}>{student.conservatory}</div>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8b949e', fontSize: 20, cursor: 'pointer', padding: 4 }}>✕</button>
        </div>

        {/* Stats summary */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1, background: '#1c2128', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: scoreColor(avgScore) }}>{submissions.length > 0 ? `${avgScore}%` : '—'}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Media</div>
          </div>
          <div style={{ flex: 1, background: '#1c2128', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#e6edf3' }}>{submissions.length}</div>
            <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>Sessioni</div>
          </div>
        </div>

        {/* Sparkline (DIY SVG) */}
        {sparkData.length >= 2 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Andamento (ultime {sparkData.length})
            </div>
            <svg width="100%" height="50" viewBox={`0 0 ${(sparkData.length - 1) * 30} 50`} preserveAspectRatio="none">
              <polyline
                points={sparkData.map((v, i) => `${i * 30},${50 - (v / 100) * 44}`).join(' ')}
                fill="none"
                stroke="#7c3aed"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {sparkData.map((v, i) => (
                <circle key={i} cx={i * 30} cy={50 - (v / 100) * 44} r="3" fill={scoreColor(v)} />
              ))}
            </svg>
          </div>
        )}

        {/* Recent submissions */}
        <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Sessioni recenti
        </div>
        {recent.length === 0 ? (
          <div style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', padding: '16px 0' }}>
            Nessuna sessione ancora
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {recent.map(sub => {
              const label = MODULE_LABELS[sub.moduleId] ?? sub.moduleId.replace('exam-template:', 'Prova: ');
              const date = new Date(sub.completedAt).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
              return (
                <div
                  key={sub.id}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: '#1c2128',
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                >
                  <div>
                    <div style={{ color: '#e6edf3', fontWeight: 500 }}>{label}</div>
                    <div style={{ color: '#6b7280', fontSize: 11, marginTop: 1 }}>{date}</div>
                  </div>
                  <div style={{ fontWeight: 800, color: scoreColor(sub.score) }}>{sub.score}%</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
```

- [ ] **Step 3: Wire RosterPanel + StudentDrawer into TeacherDashboardFeature**

In `src/features/teacher-dashboard/TeacherDashboardFeature.tsx`, replace the placeholder imports at the top:
```typescript
// Placeholder imports — replaced in Tasks 8, 9, 10
const AlertsPanel = (_p: AlertsPanelProps) => <div />;
const AssignmentsPanel = (_p: AssignmentsPanelProps) => <div />;
const RosterPanel = (_p: RosterPanelProps) => <div />;
```

Replace with:
```typescript
import { RosterPanel } from './components/RosterPanel';
import { StudentDrawer } from './components/StudentDrawer';
const AlertsPanel = (_p: AlertsPanelProps) => <div />;
const AssignmentsPanel = (_p: AssignmentsPanelProps) => <div />;
```

Add `selectedStudent` state in the component:
```typescript
  const [selectedStudent, setSelectedStudent] = useState<UserProfile | null>(null);
```

Replace `<RosterPanel data={data} />` with:
```typescript
        <RosterPanel data={data} onSelectStudent={setSelectedStudent} />
```

Add before the closing `</div>` of the return:
```typescript
      {/* Student drawer */}
      {selectedStudent && (
        <StudentDrawer
          student={selectedStudent}
          submissions={data.submissions.filter(s => s.userId === selectedStudent.uid)}
          onClose={() => setSelectedStudent(null)}
        />
      )}
```

- [ ] **Step 4: Verify TypeScript**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/features/teacher-dashboard/
git commit -m "feat(teacher-dashboard): add RosterPanel with stats and StudentDrawer with sparkline"
```

---

## Task 9: Teacher Dashboard — AssignmentsPanel + NewAssignmentModal

**Files:**
- Create: `src/features/teacher-dashboard/components/AssignmentsPanel.tsx`
- Create: `src/features/teacher-dashboard/components/NewAssignmentModal.tsx`
- Modify: `src/features/teacher-dashboard/TeacherDashboardFeature.tsx`

### AssignmentsPanel

- [ ] **Step 1: Create AssignmentsPanel**

```typescript
// src/features/teacher-dashboard/components/AssignmentsPanel.tsx
import React from 'react';
import type { AssignmentsPanelProps } from '../TeacherDashboardFeature';

const MODULE_LABELS: Record<string, string> = {
  'melodic-intervals': 'Intervalli melodici',
  'harmonic-intervals': 'Intervalli armonici',
  'triads': 'Triadi',
  'sevenths': 'Settime',
  'tonal-functions': 'Funzioni tonali',
  'cadences': 'Cadenze',
};

export function AssignmentsPanel({ data, onNewAssignment, onRefresh }: AssignmentsPanelProps) {
  const now = Date.now();
  const active = data.assignments.filter(a => a.dueDate > now);
  const past   = data.assignments.filter(a => a.dueDate <= now).slice(0, 5);

  function daysUntil(ms: number) {
    return Math.ceil((ms - now) / (24 * 60 * 60 * 1000));
  }

  function completionRate(assignmentId: string, classId: string): { done: number; total: number } {
    const cls = data.classes.find(c => c.id === classId);
    if (!cls) return { done: 0, total: 0 };
    const total = cls.studentIds.length;
    const done = data.submissions.filter(s => s.assignmentId === assignmentId).length;
    return { done, total };
  }

  return (
    <div style={{ background: '#161b22', border: '1px solid #30363d', borderRadius: 14, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #21262d', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#e6edf3' }}>
          Compiti attivi ({active.length})
        </div>
        <button
          onClick={onNewAssignment}
          style={{
            padding: '6px 14px', background: '#7c3aed', color: '#fff',
            border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}
        >
          + Nuovo
        </button>
      </div>

      {/* Active assignments */}
      {active.length === 0 ? (
        <div style={{ padding: '20px 18px', fontSize: 13, color: '#6b7280', textAlign: 'center' }}>
          Nessun compito attivo.
        </div>
      ) : (
        active.map(a => {
          const { done, total } = completionRate(a.id!, a.classId);
          const days = daysUntil(a.dueDate);
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          const cls = data.classes.find(c => c.id === a.classId);

          return (
            <div key={a.id} style={{ padding: '14px 18px', borderBottom: '1px solid #21262d' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3' }}>
                    {a.title || MODULE_LABELS[a.moduleId] || a.moduleId}
                  </div>
                  <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
                    {cls?.name ?? '—'} · L{a.level} · {a.mode === 'exam' ? 'Esame' : 'Allenamento'}
                  </div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: days <= 2 ? '#ef4444' : '#f59e0b', textAlign: 'right' }}>
                  {days <= 0 ? 'Scaduto' : `${days}g`}
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 4, background: '#21262d', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: pct >= 80 ? '#10b981' : '#7c3aed', borderRadius: 2 }} />
                </div>
                <div style={{ fontSize: 11, color: '#8b949e', whiteSpace: 'nowrap' }}>{done}/{total}</div>
              </div>
            </div>
          );
        })
      )}

      {/* Past assignments (collapsed) */}
      {past.length > 0 && (
        <div style={{ padding: '10px 18px', borderTop: '1px solid #21262d' }}>
          <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
            Scaduti recenti
          </div>
          {past.map(a => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12, color: '#6b7280', borderBottom: '1px solid #1c2128' }}>
              <span>{a.title || MODULE_LABELS[a.moduleId] || a.moduleId}</span>
              <span>{new Date(a.dueDate).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### NewAssignmentModal

- [ ] **Step 2: Create NewAssignmentModal**

```typescript
// src/features/teacher-dashboard/components/NewAssignmentModal.tsx
import React, { useState } from 'react';
import { createAssignment } from '../../../shared/utils/firestoreConservatory';
import { useAuth } from '../../../shared/context/AuthContext';
import type { ClassDoc } from '../../../shared/types/conservatory.types';

const MODULE_OPTIONS = [
  { id: 'melodic-intervals',  label: 'Intervalli melodici' },
  { id: 'harmonic-intervals', label: 'Intervalli armonici' },
  { id: 'triads',             label: 'Triadi' },
  { id: 'sevenths',           label: 'Accordi di settima' },
  { id: 'tonal-functions',    label: 'Funzioni tonali' },
  { id: 'cadences',           label: 'Cadenze' },
];

interface Props {
  classes: ClassDoc[];
  onClose: () => void;
  onCreated: () => void;
}

export function NewAssignmentModal({ classes, onClose, onCreated }: Props) {
  const { user } = useAuth();
  const [classId,  setClassId]  = useState(classes[0]?.id ?? '');
  const [moduleId, setModuleId] = useState('melodic-intervals');
  const [level,    setLevel]    = useState<1 | 2 | 3>(1);
  const [mode,     setMode]     = useState<'training' | 'exam'>('exam');
  const [dueDate,  setDueDate]  = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !classId) return;
    setSaving(true);
    setErr(null);
    try {
      const moduleLabel = MODULE_OPTIONS.find(m => m.id === moduleId)?.label ?? moduleId;
      await createAssignment({
        classId,
        teacherId: user.uid,
        moduleId,
        level,
        mode,
        dueDate: new Date(dueDate).getTime(),
        createdAt: Date.now(),
        title: `${moduleLabel} — L${level}`,
      });
      onCreated();
    } catch {
      setErr('Errore nella creazione del compito. Riprova.');
      setSaving(false);
    }
  }

  const selectStyle: React.CSSProperties = {
    width: '100%', padding: '10px 12px',
    background: '#1c2128', border: '1px solid #30363d',
    borderRadius: 8, color: '#e6edf3', fontSize: 14,
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 12, fontWeight: 600, color: '#8b949e',
    marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em',
  };

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.6)' }} />
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 501,
        width: Math.min(420, window.innerWidth - 32),
        background: '#161b22',
        border: '1px solid #30363d',
        borderRadius: 16,
        padding: '28px 24px',
      }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: '#e6edf3', margin: '0 0 20px' }}>
          Nuovo compito
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {classes.length > 1 && (
            <label>
              <span style={labelStyle}>Classe</span>
              <select value={classId} onChange={e => setClassId(e.target.value)} style={selectStyle}>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
          )}

          <label>
            <span style={labelStyle}>Modulo</span>
            <select value={moduleId} onChange={e => setModuleId(e.target.value)} style={selectStyle}>
              {MODULE_OPTIONS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </label>

          <label>
            <span style={labelStyle}>Livello</span>
            <select value={level} onChange={e => setLevel(Number(e.target.value) as 1|2|3)} style={selectStyle}>
              <option value={1}>Livello 1 — Propedeutico</option>
              <option value={2}>Livello 2 — Intermedio</option>
              <option value={3}>Livello 3 — Avanzato</option>
            </select>
          </label>

          <label>
            <span style={labelStyle}>Modalità</span>
            <select value={mode} onChange={e => setMode(e.target.value as 'training' | 'exam')} style={selectStyle}>
              <option value="exam">Esame (nessun feedback)</option>
              <option value="training">Allenamento (feedback immediato)</option>
            </select>
          </label>

          <label>
            <span style={labelStyle}>Scadenza</span>
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              style={{ ...selectStyle, fontFamily: 'inherit' }}
            />
          </label>

          {err && <div style={{ fontSize: 13, color: '#ef4444' }}>{err}</div>}

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1, padding: '11px', background: 'none', border: '1px solid #30363d', borderRadius: 8, color: '#8b949e', fontSize: 14, cursor: 'pointer' }}
            >
              Annulla
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{ flex: 1, padding: '11px', background: saving ? '#4b5563' : '#7c3aed', border: 'none', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'default' : 'pointer' }}
            >
              {saving ? 'Creazione…' : 'Crea compito'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
```

- [ ] **Step 3: Wire AssignmentsPanel + NewAssignmentModal into TeacherDashboardFeature**

In `src/features/teacher-dashboard/TeacherDashboardFeature.tsx`, replace the `AssignmentsPanel` placeholder:
```typescript
const AssignmentsPanel = (_p: AssignmentsPanelProps) => <div />;
```

With the import:
```typescript
import { AssignmentsPanel } from './components/AssignmentsPanel';
import { NewAssignmentModal } from './components/NewAssignmentModal';
```

Wire the modal — the `showNewAssignment` state is already there. Add after the `StudentDrawer` block:
```typescript
      {/* New assignment modal */}
      {showNewAssignment && (
        <NewAssignmentModal
          classes={data.classes}
          onClose={() => setShowNewAssignment(false)}
          onCreated={() => { setShowNewAssignment(false); loadData(); }}
        />
      )}
```

- [ ] **Step 4: Verify TypeScript**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/features/teacher-dashboard/
git commit -m "feat(teacher-dashboard): add AssignmentsPanel and NewAssignmentModal"
```

---

## Task 10: Teacher Dashboard — AlertsPanel + CSV export

**Files:**
- Create: `src/features/teacher-dashboard/components/AlertsPanel.tsx`
- Modify: `src/features/teacher-dashboard/TeacherDashboardFeature.tsx` (wire AlertsPanel + add CSV button)

### AlertsPanel

- [ ] **Step 1: Create AlertsPanel**

```typescript
// src/features/teacher-dashboard/components/AlertsPanel.tsx
import React from 'react';
import type { AlertsPanelProps } from '../TeacherDashboardFeature';

const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
const TWO_DAYS = 2 * 24 * 60 * 60 * 1000;

export function AlertsPanel({ data }: AlertsPanelProps) {
  const now = Date.now();

  // Students with 0 sessions in the last 7 days
  const inactiveStudents = data.students.filter(s => {
    const recent = data.submissions.filter(sub => sub.userId === s.uid && now - sub.completedAt < ONE_WEEK);
    return recent.length === 0;
  });

  // Assignments expiring within 48h with < 50% completion
  const urgentAssignments = data.assignments.filter(a => {
    if (a.dueDate <= now) return false;
    if (a.dueDate - now > TWO_DAYS) return false;
    const cls = data.classes.find(c => c.id === a.classId);
    if (!cls || cls.studentIds.length === 0) return false;
    const done = data.submissions.filter(s => s.assignmentId === a.id).length;
    return done / cls.studentIds.length < 0.5;
  });

  if (inactiveStudents.length === 0 && urgentAssignments.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
      {inactiveStudents.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 16px',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 10, fontSize: 13, color: '#fca5a5',
        }}>
          <span style={{
            background: '#ef4444', color: '#fff',
            borderRadius: '50%', width: 20, height: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 700, flexShrink: 0,
          }}>
            {inactiveStudents.length}
          </span>
          {inactiveStudents.length === 1
            ? `${inactiveStudents[0].displayName} non studia da 7 giorni`
            : `${inactiveStudents.length} studenti inattivi questa settimana`}
        </div>
      )}

      {urgentAssignments.map(a => {
        const hours = Math.ceil((a.dueDate - now) / (60 * 60 * 1000));
        return (
          <div
            key={a.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 16px',
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 10, fontSize: 13, color: '#fcd34d',
            }}
          >
            <span style={{
              background: '#f59e0b', color: '#fff',
              borderRadius: '50%', width: 20, height: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700, flexShrink: 0,
            }}>
              !
            </span>
            {a.title || a.moduleId} scade in {hours}h — completamento basso
          </div>
        );
      })}
    </div>
  );
}
```

### CSV Export

The CSV export downloads a file containing all submissions for the teacher's students.

- [ ] **Step 2: Add CSV export to TeacherDashboardFeature**

In `TeacherDashboardFeature.tsx`, add a `downloadCSV` function inside the component body (after `loadData`):

```typescript
  function downloadCSV() {
    if (!data) return;
    const headers = ['studentName', 'email', 'moduleId', 'score', 'completedAt', 'durationMs'];
    const studentMap = new Map(data.students.map(s => [s.uid, s]));

    const rows = data.submissions.map(sub => {
      const s = studentMap.get(sub.userId);
      return [
        s?.displayName ?? sub.userId,
        s?.email ?? '',
        sub.moduleId,
        sub.score,
        new Date(sub.completedAt).toISOString(),
        sub.durationMs,
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tonic-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
```

In the dashboard header section, add the CSV button next to the existing header content:

Find:
```typescript
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: '#e6edf3', margin: '0 0 4px' }}>
            Dashboard Docente
          </h1>
          <div style={{ fontSize: 13, color: '#8b949e' }}>
            ...
          </div>
        </div>
```

Replace with:
```typescript
        <div>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800, color: '#e6edf3', margin: '0 0 4px' }}>
            Dashboard Docente
          </h1>
          <div style={{ fontSize: 13, color: '#8b949e' }}>
            {data.classes.length} {data.classes.length === 1 ? 'classe' : 'classi'} ·{' '}
            {data.students.length} studenti ·{' '}
            {data.assignments.filter(a => a.dueDate > Date.now()).length} compiti attivi
          </div>
        </div>
        <button
          onClick={downloadCSV}
          style={{
            padding: '9px 18px', background: '#21262d',
            border: '1px solid #30363d', borderRadius: 8,
            color: '#8b949e', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          ⬇ Esporta CSV
        </button>
```

- [ ] **Step 3: Wire AlertsPanel into TeacherDashboardFeature**

Replace the `AlertsPanel` placeholder at the top of the file:
```typescript
const AlertsPanel = (_p: AlertsPanelProps) => <div />;
```

With:
```typescript
import { AlertsPanel } from './components/AlertsPanel';
```

- [ ] **Step 4: Verify TypeScript**

```bash
npm run build
```

Expected: zero errors. The entire Sprint 2 implementation should compile cleanly.

- [ ] **Step 5: Verify in browser**

```bash
npm run dev
```

Check:
- Solfeggio group now has 4 items: Ear Training Pro, Solfeggio Cantato, Setticlavio, Prove d'Esame
- Prove d'Esame shows the 3 template cards
- Picking a template → intro screen → section questions → results
- In local mode (no `.env`): `examtemplates` tab shows exam normally; `teacherdashboard` shows LocalModeNotice
- With Firebase: logging in as a teacher shows 🎓 Docente button in nav

- [ ] **Step 6: Commit**

```bash
git add src/features/teacher-dashboard/
git commit -m "feat(teacher-dashboard): add AlertsPanel, CSV export — Sprint 2 complete"
```

---

## Self-Review

### Spec coverage check

| Spec requirement | Covered by |
|---|---|
| `users/{uid}` with `role` field | Task 1 (conservatory.types), Task 2 (UserProfileContext) |
| `getOrCreateUserProfile` on login | Task 2 |
| `classes`, `assignments`, `submissions` Firestore schema | Task 1 |
| Multi-role auth — teacher field | Task 2 (role read from Firestore, default 'student') |
| Dashboard — hidden tab, teacher-only | Task 3 (Tab union, teacher nav button), Task 7 (role gate) |
| Dashboard — Alert badges (inactive + deadline) | Task 10 (AlertsPanel) |
| Dashboard — Active assignments list + progress | Task 9 (AssignmentsPanel) |
| Dashboard — "+ Nuovo compito" modal | Task 9 (NewAssignmentModal) |
| Dashboard — Roster sortable by name/accuracy/sessions | Task 8 (RosterPanel) |
| Dashboard — Student drawer with history + sparkline | Task 8 (StudentDrawer) |
| Dashboard — CSV export | Task 10 |
| Prove d'esame simulate — 3 templates | Task 4 |
| Prove d'esame simulate — multi-section runner | Task 5 |
| Prove d'esame simulate — results saved to Firestore | Task 5 (ExamTemplateResults) |
| EarTrainingPro — save submissions to Firestore | Task 6 |
| Exam templates in Solfeggio group | Task 3 |

### Type consistency check

- `EarModuleId`, `ExerciseLevel`, `ExamAnswer` → from `ear-training-pro/types.ts` ✅
- `UserProfile`, `ClassDoc`, `AssignmentDoc`, `SubmissionDoc` → from `shared/types/conservatory.types.ts` ✅
- `ExamTemplate`, `ExamSection`, `SectionResult`, `MultiSectionExamResult` → from `exam-templates/types.ts` ✅
- `DashboardData`, `AlertsPanelProps`, `AssignmentsPanelProps`, `RosterPanelProps` → exported from `TeacherDashboardFeature.tsx` ✅
- `generateQuestions(moduleId, level, count)` → imported from `ear-training-pro/data/index.ts` ✅
- `audioPlayer.playChord`, `audioPlayer.playSequence`, `audioPlayer.delay` → from `ear-training/utils/audio-player` ✅

### No placeholders check

All tasks contain complete code. No TBD, TODO, or "similar to Task N" patterns present.
