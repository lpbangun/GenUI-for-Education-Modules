// lib/types.ts
// Turn shape produced by composeTurn(). Single source of truth — both the
// live module route and the autoplay pregenerator deserialize into this.
//
// Note: this is intentionally an interface, not a Zod schema (DD-006).
// Tail blocks are parsed loosely; missing fields fall back to safe defaults.

import type { ScaffoldName } from './scaffold-selector';
import type { VizDecision } from './viz-selector';

export type HandoffKind = 'passive' | 'active' | 'constructive';

export type AgreementResponse = 'yes' | 'no' | 'unsure' | 'differently';

export interface PassiveHandoff {
  kind: 'passive';
  termsSurfaced: string[];
}

export interface ActiveHandoff {
  kind: 'active';
  candidateTerm: string;             // T3 — single term
  surfacedTerms: string[];           // T4 — 2–3 terms
  handoffQuestion: string;           // verbatim prose to render
}

export interface ConstructiveHandoff {
  kind: 'constructive';
  targetTerm: string;
  draftTemplate: {
    schoolPlaceholder: string;       // e.g., "HGSE"
    howWeUseItPlaceholder: string;
    examplePlaceholder: string;
    differsPlaceholder: string;
  };
}

export type DictionaryHandoff =
  | PassiveHandoff
  | ActiveHandoff
  | ConstructiveHandoff;

export interface Turn {
  tier: ScaffoldName;
  conceptId: string;
  mastery: number;
  vizDecision: VizDecision;
  scaffold: { name: ScaffoldName; input: unknown };
  chart: unknown | null;
  flowchart: unknown | null;
  termsSurfaced: string[];
  dictionaryHandoff: DictionaryHandoff;
}

export const SAFE_DEFAULT_HANDOFF: PassiveHandoff = {
  kind: 'passive',
  termsSurfaced: [],
};
