// F008 — the rule-based Scaffold Selector. The single most defensible piece of
// pedagogy in the capstone: a pure function from learner state to scaffold name.
// Thresholds from CLAUDE.md § "Five tiers, mapped to ICAP".

import type { Interaction } from './schemas/content-schemas';

export type ScaffoldName =
  | 'WorkedExample'
  | 'ScaffoldedMCQ'
  | 'GuidedShortAnswer'
  | 'BareLongAnswer'
  | 'WikiDraft';

export interface LearnerStateInput {
  mastery: number;
  history: Interaction[];
}

export function pickScaffold({ mastery }: LearnerStateInput): ScaffoldName {
  if (mastery >= 0.85) return 'WikiDraft';
  if (mastery >= 0.65) return 'BareLongAnswer';
  if (mastery >= 0.45) return 'GuidedShortAnswer';
  if (mastery >= 0.20) return 'ScaffoldedMCQ';
  return 'WorkedExample';
}
