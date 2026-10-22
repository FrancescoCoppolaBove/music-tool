import { lazy, type ComponentType } from 'react';

/**
 * Every tool is its own JS chunk, downloaded only when opened (mobile data and
 * first load). `preloadTab` starts the download on navigation intent (hover,
 * focus, touch) so opening still feels instant.
 * Home and the login screen stay in the main bundle: they are the first paint.
 */

const RELOAD_FLAG = 'tonic_chunk_reload';

/**
 * After a deploy, a tab opened earlier asks for chunk hashes that no longer
 * exist. Reload once to get the new build instead of showing an error.
 */
function loadOrReload<T>(loader: () => Promise<T>): Promise<T> {
  return loader().then(
    mod => {
      try { sessionStorage.removeItem(RELOAD_FLAG); } catch { /* storage unavailable */ }
      return mod;
    },
    err => {
      let alreadyReloaded = true;
      try {
        alreadyReloaded = sessionStorage.getItem(RELOAD_FLAG) === '1';
        if (!alreadyReloaded) sessionStorage.setItem(RELOAD_FLAG, '1');
      } catch { /* storage unavailable: don't risk a reload loop */ }
      if (alreadyReloaded) throw err;
      window.location.reload();
      return new Promise<T>(() => {});
    },
  );
}

// `any` mirrors React.lazy's own signature: each tool has its own props.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lazyFeature<T extends ComponentType<any>>(loader: () => Promise<{ default: T }>) {
  let pending: Promise<{ default: T }> | null = null;
  const load = () => (pending ??= loadOrReload(loader).catch(err => { pending = null; throw err; }));
  return Object.assign(lazy(load), { preload: load });
}

export const HarmonyCheatSheetFeature = lazyFeature(() => import('./features/harmony-cheat-sheet/HarmonyCheatSheetFeature'));
export const PracticeJournalFeature = lazyFeature(() => import('./features/practice-journal/PracticeJournalFeature'));
export const SongLibraryFeature = lazyFeature(() => import('./features/song-library/SongLibraryFeature'));
export const DailyChallengeFeature = lazyFeature(() => import('./features/daily-challenge/DailyChallengeFeature'));
export const ChordVoicingsFeature = lazyFeature(() => import('./features/chord-voicings/ChordVoicingsFeature'));
export const ScaleRecognitionFeature = lazyFeature(() => import('./features/scale-recognition/ScaleRecognitionFeature'));
export const ScaleDictionaryFeature = lazyFeature(() => import('./features/scale-dictionary/ScaleDictionaryFeature'));
export const CircleOfFifthsFeature = lazyFeature(() => import('./features/circle-of-fifth/CircleOfFifthsFeature'));
export const ScaleHarmonizationFeature = lazyFeature(() => import('./features/scale-harmonization/ScaleHarmonizationFeature'));
export const ModalInterchangeFeature = lazyFeature(() => import('./features/modal-interchange/ModalInterchangeFeature'));
export const ChordProgressionFeature = lazyFeature(() => import('./features/chord-progression/ChordProgressionFeature'));
export const ScaleAdvisorFeature = lazyFeature(() => import('./features/scale-advisor/ScaleAdvisorFeature'));
export const HarmonicCyclesFeature = lazyFeature(() => import('./features/harmonic-cycles/HarmonicCyclesFeature'));
export const ChordFinderFeature = lazyFeature(() => import('./features/chord-finder/ChordFinderFeature'));
export const HarmonicAnalysisFeature = lazyFeature(() => import('./features/harmonic-analysis/HarmonicAnalysisFeature'));
export const RiffArchitectFeature = lazyFeature(() => import('./features/riff-architect/RiffArchitectFeature'));
export const MelodyArchitectFeature = lazyFeature(() => import('./features/melody-architect/MelodyArchitectFeature'));
export const IntervalQuizFeature = lazyFeature(() => import('./features/interval-quiz/IntervalQuizFeature'));
export const ScoreToIRealFeature = lazyFeature(() => import('./features/score-to-ireal/ScoreToIRealFeature'));
export const ChordLandingFeature = lazyFeature(() => import('./features/chord-landing/ChordLandingFeature'));
export const SongArchitectFeature = lazyFeature(() => import('./features/song-architect/SongArchitectFeature'));
export const CadenceTrainerFeature = lazyFeature(() => import('./features/cadence-trainer/CadenceTrainerFeature'));
export const TransposingInstrumentsFeature = lazyFeature(() => import('./features/transposing-instruments/TransposingInstrumentsFeature'));
export const ChordDetectionFeature = lazyFeature(() => import('./features/chord-detection/ChordDetectionFeature'));
export const NailThePitchFeature = lazyFeature(() => import('./features/nail-the-pitch/NailThePitchFeature'));
export const ProfileFeature = lazyFeature(() => import('./features/profile/ProfileFeature'));
export const VoiceLeadingFeature = lazyFeature(() => import('./features/voice-leading/VoiceLeadingFeature'));
export const GrooveKitchenFeature = lazyFeature(() => import('./features/groove-kitchen/GrooveKitchenFeature'));
export const ArrangementBlueprintFeature = lazyFeature(() => import('./features/arrangement-blueprint/ArrangementBlueprintFeature'));
export const RhythmicDisplacementFeature = lazyFeature(() => import('./features/rhythmic-displacement/RhythmicDisplacementFeature'));
export const EarTrainingProFeature = lazyFeature(() => import('./features/ear-training-pro/EarTrainingProFeature'));
export const SolfeggioCantatoFeature = lazyFeature(() => import('./features/solfeggio-cantato/SolfeggioCantatoFeature'));
export const SetticlavioFeature = lazyFeature(() => import('./features/setticlavio/SetticlavioFeature'));
export const ExamTemplatesFeature = lazyFeature(() => import('./features/exam-templates/ExamTemplatesFeature'));
export const TeacherDashboardFeature = lazyFeature(() => import('./features/teacher-dashboard/TeacherDashboardFeature'));
export const HarmoniaCourseFeature = lazyFeature(() => import('./features/harmonia-course/HarmoniaCourseFeature'));
export const ReharmonizationFeature = lazyFeature(() => import('./features/reharmonization/ReharmonizationFeature'));
export const MelodyHarmonizerFeature = lazyFeature(() => import('./features/melody-harmonizer/MelodyHarmonizerFeature'));
export const SecondaryDominantsFeature = lazyFeature(() => import('./features/secondary-dominants/SecondaryDominantsFeature'));
export const AudioTranscriberFeature = lazyFeature(() => import('./features/audio-transcriber/AudioTranscriberFeature'));
export const MyCompositionsFeature = lazyFeature(() => import('./features/my-compositions/MyCompositionsFeature'));
export const PricingFeature = lazyFeature(() => import('./features/pricing/PricingFeature'));

const BY_TAB: Record<string, { preload: () => Promise<unknown> }> = {
  'pricing': PricingFeature,
  'harmony-lab': MyCompositionsFeature,
  'voicings': ChordVoicingsFeature,
  'scales': ScaleRecognitionFeature,
  'dictionary': ScaleDictionaryFeature,
  'eartrainingpro': EarTrainingProFeature,
  'solfeggiocan': SolfeggioCantatoFeature,
  'setticlavio': SetticlavioFeature,
  'circle': CircleOfFifthsFeature,
  'harmonization': ScaleHarmonizationFeature,
  'modal': ModalInterchangeFeature,
  'progressions': ChordProgressionFeature,
  'scaleadvisor': ScaleAdvisorFeature,
  'cycles': HarmonicCyclesFeature,
  'chordfinder': ChordFinderFeature,
  'analysis': HarmonicAnalysisFeature,
  'secondary-dominants': SecondaryDominantsFeature,
  'riff': RiffArchitectFeature,
  'melody': MelodyArchitectFeature,
  'mel-harm': MelodyHarmonizerFeature,
  'quiz': IntervalQuizFeature,
  'score': ScoreToIRealFeature,
  'landing': ChordLandingFeature,
  'reharm': ReharmonizationFeature,
  'architect': SongArchitectFeature,
  'cadence': CadenceTrainerFeature,
  'transpose': TransposingInstrumentsFeature,
  'daily': DailyChallengeFeature,
  'journal': PracticeJournalFeature,
  'songs': SongLibraryFeature,
  'chorddetect': ChordDetectionFeature,
  'nailpitch': NailThePitchFeature,
  'audio-transcriber': AudioTranscriberFeature,
  'profile': ProfileFeature,
  'examtemplates': ExamTemplatesFeature,
  'teacherdashboard': TeacherDashboardFeature,
  'harmony-cheat-sheet': HarmonyCheatSheetFeature,
  'harmonia': HarmoniaCourseFeature,
  'voiceleading': VoiceLeadingFeature,
  'groove': GrooveKitchenFeature,
  'arrangement': ArrangementBlueprintFeature,
  'rhythmic-displacement': RhythmicDisplacementFeature,
};

/** True for tabs that render something (lazy tools + the eager home page). */
export function isKnownTab(tab: string): boolean {
  return tab === 'home' || tab in BY_TAB;
}

/** Starts downloading a tool's code. Safe to call repeatedly. */
export function preloadTab(tab: string): void {
  BY_TAB[tab]?.preload().catch(() => { /* retried on render */ });
}
