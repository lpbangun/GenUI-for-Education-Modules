// lib/turn-composer.ts
// The single composition path producing a Turn. Both the live module
// (backend/index.ts) and the autoplay pregenerator
// (scripts/pregenerate_autoplay.ts) call this — that's how we prevent drift
// between the demo surface and the actual learner experience (DD-007).
//
// Tier selection: pickScaffold() (rule-based, CLAUDE.md invariant 1).
// Viz selection: pickVisualization() (rule-based).
// Pedagogy: per-tier system prompt from lib/prompts (DD-006).
// Tail blocks: parseTailBlocks() — loose parsing with safe fallbacks.

import type { Turn, DictionaryHandoff } from './types';
import type { Interaction } from './schemas/content-schemas';
import { pickScaffold, type ScaffoldName } from './scaffold-selector';
import {
  pickVisualization,
  type VizDemand,
  type VizHistoryEntry,
  type VizKind,
} from './viz-selector';
import { SYSTEM_PROMPTS } from './prompts';

function normalizeHandoff(raw: unknown, termsSurfaced: string[]): DictionaryHandoff {
  if (!raw || typeof raw !== 'object') {
    return { kind: 'passive', termsSurfaced };
  }
  const r = raw as Record<string, unknown>;
  const kind = r.kind;
  if (kind === 'active') {
    const candidate = typeof r.candidate_term === 'string' ? r.candidate_term.toLowerCase() : null;
    if (!candidate) return { kind: 'passive', termsSurfaced };
    return {
      kind: 'active',
      candidateTerm: candidate,
      surfacedTerms: termsSurfaced,
      handoffQuestion: typeof r.handoff_question === 'string' && r.handoff_question.trim()
        ? r.handoff_question
        : 'Is this how your school uses this term?',
    };
  }
  if (kind === 'constructive') {
    const target = typeof r.target_term === 'string' ? r.target_term.toLowerCase() : null;
    if (!target) return { kind: 'passive', termsSurfaced };
    return {
      kind: 'constructive',
      targetTerm: target,
      draftTemplate: {
        schoolPlaceholder: 'Your school (e.g., HGSE)',
        howWeUseItPlaceholder: 'How does your team use this term?',
        examplePlaceholder: 'A short example from your work.',
        differsPlaceholder: 'How does this differ from how other schools use it? (optional)',
      },
    };
  }
  return { kind: 'passive', termsSurfaced };
}

const SCAFFOLD_NAMES = new Set<ScaffoldName>([
  'WorkedExample',
  'ScaffoldedMCQ',
  'GuidedShortAnswer',
  'BareLongAnswer',
  'WikiDraft',
]);

export interface ComposeTurnInput {
  conceptId: string;
  mastery: number;
  history: Interaction[];
  surfacedTerms: string[];
  vizDemand: VizDemand;
  /** Optional injection point for tests. Production callers omit. */
  _generateText?: GenerateTextLike;
  /** Optional injection point for tests / live module wiring. */
  _model?: unknown;
  /** Optional override for the tools map (live module supplies allTools). */
  _tools?: Record<string, unknown>;
}

type GenerateTextLike = (args: {
  model: unknown;
  system: string;
  prompt: string;
  tools?: Record<string, unknown>;
  toolChoice?: 'required' | 'auto';
  maxOutputTokens?: number;
}) => Promise<{
  toolCalls?: Array<{ toolName: string; input: unknown }>;
  text?: string;
}>;

function vizClause(kind: VizKind, mastery: number): string {
  if (kind === 'none') {
    return 'Do NOT call any visualization tool. The Visualization Selector deliberately omitted viz for this turn.';
  }
  if (kind === 'chart') {
    return 'ALSO call render_chart in the SAME response. Pick chart_type appropriate to the concept (histogram for distribution shape, bar for groups, scatter for relationships, time_series for change, box for spread). Include non-empty values, caption, provenance.';
  }
  if (mastery >= 0.85) {
    return 'ALSO call render_flowchart with flowchart_type=cycle showing the wiki contribution routine (claim → support → question → revise) — 4 nodes. Caption + provenance required.';
  }
  return 'ALSO call render_flowchart with flowchart_type linear or decision (3–5 nodes) showing the sequential reasoning routine for this concept. Edges connect node ids. Caption + provenance required.';
}

function buildPrompt(
  tier: ScaffoldName,
  conceptId: string,
  mastery: number,
  surfacedTerms: string[],
  vizKind: VizKind
): string {
  const surfacedLine =
    surfacedTerms.length > 0
      ? `Terms the learner has already touched this session (prefer these for the handoff): ${surfacedTerms.join(', ')}`
      : 'This is an early turn — the learner has not yet touched any dictionary terms.';

  return `Concept: ${conceptId}.
Tier: ${tier} (mastery=${mastery.toFixed(2)}).
${surfacedLine}

Generate the next scaffold for this learner. Make the setup_prose a concrete Harvard-staff scenario (admissions, advising, giving, course evaluation, or institutional research).

You MUST:
1. Call exactly the ${tier} tool — do not respond with prose alone, do not pick a different tier.
2. ${vizClause(vizKind, mastery)}
3. Include terms_surfaced and dictionary_handoff IN your ${tier} tool call input per your tier-specific instructions.`;
}

export async function composeTurn(input: ComposeTurnInput): Promise<Turn> {
  if (!input._generateText) {
    throw new Error(
      'composeTurn requires _generateText injected (use composeTurnWithProvider in production)'
    );
  }

  const tier = pickScaffold({ mastery: input.mastery, history: input.history });
  const vizDecision = pickVisualization({
    concept: { id: input.conceptId, viz_demand: input.vizDemand },
    mastery: input.mastery,
    history: input.history as VizHistoryEntry[],
  });
  const system = SYSTEM_PROMPTS[tier];
  const prompt = buildPrompt(
    tier,
    input.conceptId,
    input.mastery,
    input.surfacedTerms,
    vizDecision.kind
  );

  const result = await input._generateText({
    model: input._model,
    system,
    prompt,
    tools: input._tools,
    toolChoice: 'required',
    maxOutputTokens: 2400,
  });

  const calls = result.toolCalls ?? [];
  let scaffold: { name: ScaffoldName; input: unknown } | null = null;
  let chart: unknown = null;
  let flowchart: unknown = null;
  for (const c of calls) {
    if (SCAFFOLD_NAMES.has(c.toolName as ScaffoldName)) {
      scaffold = { name: c.toolName as ScaffoldName, input: c.input };
    } else if (c.toolName === 'render_chart') chart = c.input;
    else if (c.toolName === 'render_flowchart') flowchart = c.input;
  }
  if (!scaffold) throw new Error(`composeTurn: no scaffold tool call for tier ${tier}`);

  // Enforce selector decision (defensive — drop rogue viz the model emitted).
  if (vizDecision.kind === 'none') { chart = null; flowchart = null; }
  if (vizDecision.kind === 'chart') flowchart = null;
  if (vizDecision.kind === 'flowchart') chart = null;

  const scaffoldInput = scaffold.input as Record<string, unknown>;
  const termsRaw = scaffoldInput?.terms_surfaced;
  const handoffRaw = scaffoldInput?.dictionary_handoff;

  const termsSurfaced: string[] = Array.isArray(termsRaw)
    ? (termsRaw as unknown[]).filter((t): t is string => typeof t === 'string').map((t) => t.toLowerCase())
    : [];

  const dictionaryHandoff: DictionaryHandoff = normalizeHandoff(handoffRaw, termsSurfaced);

  return {
    tier,
    conceptId: input.conceptId,
    mastery: input.mastery,
    vizDecision,
    scaffold,
    chart,
    flowchart,
    termsSurfaced,
    dictionaryHandoff,
  };
}
