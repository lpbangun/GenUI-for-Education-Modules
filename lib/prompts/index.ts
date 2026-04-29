// lib/prompts/index.ts
import type { ScaffoldName } from '../scaffold-selector';
import { WORKED_EXAMPLE_SYSTEM } from './worked-example';
import { SCAFFOLDED_MCQ_SYSTEM } from './scaffolded-mcq';
import { GUIDED_SHORT_ANSWER_SYSTEM } from './guided-short-answer';
import { BARE_LONG_ANSWER_SYSTEM } from './bare-long-answer';
import { WIKI_DRAFT_SYSTEM } from './wiki-draft';

export const SYSTEM_PROMPTS: Record<ScaffoldName, string> = {
  WorkedExample: WORKED_EXAMPLE_SYSTEM,
  ScaffoldedMCQ: SCAFFOLDED_MCQ_SYSTEM,
  GuidedShortAnswer: GUIDED_SHORT_ANSWER_SYSTEM,
  BareLongAnswer: BARE_LONG_ANSWER_SYSTEM,
  WikiDraft: WIKI_DRAFT_SYSTEM,
};
