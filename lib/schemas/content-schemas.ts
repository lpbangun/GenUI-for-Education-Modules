import { z } from 'zod';

// ============================================================
// Concept Primer (MD with YAML frontmatter)
// ============================================================

export const ConceptPrimerFrontmatter = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  level: z.enum(['foundational', 'interpretive', 'communication']),
  prerequisites: z.array(z.string()),
  icap_alignment: z.array(z.enum(['passive', 'active', 'constructive', 'interactive'])).min(1),
  visible_thinking_routine: z.enum([
    'see-think-wonder',
    'claim-support-question',
    'connect-extend-challenge',
    'what-makes-you-say-that'
  ]),
  connected_concepts: z.array(z.string()),
  core_misconceptions: z.array(z.string()).min(2).max(6),
  version: z.number().int().positive()
});
export type ConceptPrimerFrontmatter = z.infer<typeof ConceptPrimerFrontmatter>;

// ============================================================
// Dictionary Entry (MD with YAML frontmatter)
// ============================================================

export const DictionaryEntryFrontmatter = z.object({
  term: z.string().min(1),
  plain_definition: z.string().min(1).max(200),
  technical_definition: z.string().optional(),
  related_terms: z.array(z.string()),
  common_confusion_with: z.array(z.string()),
  school_usage: z.record(z.string(), z.string()).refine(
    (obj) => Object.keys(obj).length >= 4,
    { message: 'school_usage must cover at least 4 schools' }
  ),
  version: z.number().int().positive()
});
export type DictionaryEntryFrontmatter = z.infer<typeof DictionaryEntryFrontmatter>;

// ============================================================
// Scenario (JSON)
// ============================================================

const ScenarioOption = z.object({
  id: z.string(),
  text: z.string(),
  correct: z.boolean(),
  feedback: z.string()
});

const ScenarioArtifact = z.object({
  type: z.enum(['summary_stats', 'data_table', 'chart_description', 'quote_excerpt', 'report_excerpt']),
  content: z.string()
});

const ScenarioHint = z.object({
  type: z.enum(['always_visible', 'on_request', 'after_first_attempt']),
  content: z.string()
});

const ScenarioRubric = z.object({
  primary_criterion: z.string(),
  secondary_criterion: z.string().optional(),
  scoring_dimensions: z.array(z.string()).optional()
});

const VisibleThinkingPrompts = z.object({
  notice: z.string().optional(),
  think: z.string().optional(),
  wonder: z.string().optional(),
  claim: z.string().optional(),
  support: z.string().optional(),
  question: z.string().optional(),
  connect: z.string().optional(),
  extend: z.string().optional(),
  challenge: z.string().optional()
});

export const ScenarioSchema = z.object({
  id: z.string().min(1),
  concept_id: z.string().min(1),
  tier: z.number().int().min(1).max(5),
  question_type: z.enum([
    'multiple_choice',
    'multiple_choice_with_hint',
    'short_answer',
    'long_answer',
    'wiki_draft'
  ]),
  dataset_ref: z.string().optional(),
  visible_thinking_scaffold: z.string(),
  setup_prose: z.string().min(20),
  artifact: ScenarioArtifact.optional(),
  prompt: z.string().min(10),
  options: z.array(ScenarioOption).optional(),
  hint: ScenarioHint.optional(),
  rubric: ScenarioRubric.optional(),
  visible_thinking_prompts: VisibleThinkingPrompts.optional()
}).refine(
  (s) => {
    if ((s.tier === 1 || s.tier === 2) && !s.options) return false;
    if (s.tier === 2 && !s.hint) return false;
    if (s.tier >= 3 && !s.rubric) return false;
    return true;
  },
  { message: 'Scenario violates tier-specific requirements' }
).refine(
  (s) => {
    const expected: Record<number, string[]> = {
      1: ['multiple_choice'],
      2: ['multiple_choice_with_hint'],
      3: ['short_answer'],
      4: ['long_answer'],
      5: ['wiki_draft']
    };
    return expected[s.tier]?.includes(s.question_type) ?? false;
  },
  { message: 'question_type does not match tier' }
);
export type Scenario = z.infer<typeof ScenarioSchema>;

// ============================================================
// Synthetic Dataset (JSON)
// ============================================================

const PedagogicalMetadata = z.object({
  primary_concept: z.string(),
  teaches: z.array(z.string()).min(1),
  features: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])),
  pitfalls_surfaced: z.array(z.string()).min(1),
  appropriate_tiers: z.array(z.number().int().min(1).max(5)).min(1),
  relevant_roles: z.array(z.string())
});

export const SyntheticDatasetSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  n_rows: z.number().int().positive(),
  generator_function: z.string(),
  generator_parameters: z.record(z.string(), z.any()),
  pedagogical_metadata: PedagogicalMetadata,
  fields_schema: z.record(z.string(), z.string()),
  plausibility_notes: z.array(z.string()).min(1),
  rows: z.array(z.record(z.string(), z.any())).min(1)
}).refine(
  (d) => d.rows.length === d.n_rows,
  { message: 'rows.length must equal n_rows' }
);
export type SyntheticDataset = z.infer<typeof SyntheticDatasetSchema>;

// ============================================================
// Taxonomy (JSON)
// ============================================================

const TaxonomyConcept = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  category: z.enum(['foundational', 'interpretive', 'communication']),
  prerequisites: z.array(z.string()),
  outcome: z.string().min(20),
  exemplar_status: z.enum(['calibrated', 'to_generate', 'in_progress'])
});

export const TaxonomySchema = z.object({
  version: z.string(),
  total_concepts: z.number().int().positive(),
  philosophy: z.string(),
  categories: z.record(z.string(), z.object({
    description: z.string(),
    concepts: z.array(z.string())
  })),
  concepts: z.array(TaxonomyConcept)
}).refine(
  (t) => t.concepts.length === t.total_concepts,
  { message: 'concepts.length must match total_concepts' }
);
export type Taxonomy = z.infer<typeof TaxonomySchema>;

// ============================================================
// Learner Interaction (runtime, for State Inferrer)
// ============================================================

export const InteractionSchema = z.object({
  id: z.string(),
  learner_id: z.string(),
  concept_id: z.string(),
  scenario_id: z.string(),
  tier: z.number().int().min(1).max(5),
  response: z.string(),
  response_type: z.enum(['mcq_choice', 'short_text', 'long_text']),
  timestamp: z.string().datetime(),
  time_spent_ms: z.number().nonnegative()
});
export type Interaction = z.infer<typeof InteractionSchema>;

export const LearnerStateSchema = z.object({
  learner_id: z.string(),
  concept_id: z.string(),
  mastery: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  history: z.array(InteractionSchema),
  last_updated: z.string().datetime()
});
export type LearnerState = z.infer<typeof LearnerStateSchema>;

// ============================================================
// Gemini provider configuration (for backend)
// ============================================================

export const ThinkingLevel = z.enum(['minimal', 'low', 'medium', 'high']);
export type ThinkingLevel = z.infer<typeof ThinkingLevel>;

export const AgentRoleConfig = z.object({
  modelId: z.string(),
  thinkingLevel: ThinkingLevel,
  maxOutputTokens: z.number().int().positive(),
  responseFormat: z.enum(['text', 'json_object']).optional()
});
export type AgentRoleConfig = z.infer<typeof AgentRoleConfig>;

export const AGENT_CONFIGS = {
  contentGenerator: {
    modelId: 'gemini-3.1-flash-lite-preview',
    thinkingLevel: 'medium' as const,
    maxOutputTokens: 2000
  },
  stateInferrer: {
    modelId: 'gemini-3.1-flash-lite-preview',
    thinkingLevel: 'low' as const,
    maxOutputTokens: 500,
    responseFormat: 'json_object' as const
  },
  qualityEvaluator: {
    modelId: 'gemini-3.1-flash-lite-preview',
    thinkingLevel: 'medium' as const,
    maxOutputTokens: 800
  },
  templateFiller: {
    modelId: 'gemini-3.1-flash-lite-preview',
    thinkingLevel: 'low' as const,
    maxOutputTokens: 1000,
    responseFormat: 'json_object' as const
  }
} satisfies Record<string, AgentRoleConfig>;
