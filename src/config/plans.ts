import type { Tab } from '@shared/types/navigation.types';

/**
 * Free vs Pro. Free is a complete theory toolkit; Pro adds composition and
 * arranging labs, advanced training, AI and cloud sync.
 * Changing this list is the only step needed to move a tool between plans
 * (AI limits are enforced server-side in netlify/lib/aiGuard.ts).
 */
export const PRO_TABS: ReadonlySet<Tab> = new Set<Tab>([
  // Composition — advanced harmony
  'score', 'reharm', 'voiceleading', 'landing', 'cycles',
  // Composition — arrange
  'riff', 'melody', 'mel-harm', 'architect', 'groove', 'arrangement', 'rhythmic-displacement',
  // Training
  'eartrainingpro', 'solfeggiocan', 'setticlavio', 'examtemplates',
  // Theory
  'harmonia', 'audio-transcriber', 'nailpitch',
  // Practice (cloud sync)
  'journal', 'songs',
]);

export const PRICES = {
  monthly: { label: '4,99 €', per: '/ month' },
  yearly: { label: '39 €', per: '/ year', note: '≈ 3,25 € / month — save 35%' },
} as const;

export const TRIAL_DAYS = 7;

export const FREE_AI_MESSAGES_PER_DAY = 5;

/**
 * Billing is live only when the Paddle client token is configured. Without it
 * (local dev, pre-launch beta) nothing is locked — the server mirrors this.
 */
export const billingEnabled = Boolean(import.meta.env.VITE_PADDLE_CLIENT_TOKEN);
