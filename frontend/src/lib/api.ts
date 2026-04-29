// Streaming client for /_/backend/api/chat. Parses the AI SDK UIMessage stream
// and surfaces the scaffold tool call PLUS any visualization tool calls
// (render_chart, render_flowchart) as they arrive.

import type { VizDecision } from './viz-selector';

const BACKEND_BASE = import.meta.env.VITE_BACKEND_BASE
  ?? (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '/_/backend');

export type ScaffoldName = 'WorkedExample' | 'ScaffoldedMCQ' | 'GuidedShortAnswer' | 'BareLongAnswer' | 'WikiDraft';
export type VizName = 'render_chart' | 'render_flowchart';

export interface ToolCall {
  toolName: string;
  input: any;
}

export type HandoffKind = 'passive' | 'active' | 'constructive';

export interface PassiveHandoff {
  kind: 'passive';
  termsSurfaced: string[];
}

export interface ActiveHandoff {
  kind: 'active';
  candidateTerm: string;
  surfacedTerms: string[];
  handoffQuestion: string;
}

export interface ConstructiveHandoff {
  kind: 'constructive';
  targetTerm: string;
  draftTemplate: {
    schoolPlaceholder: string;
    howWeUseItPlaceholder: string;
    examplePlaceholder: string;
    differsPlaceholder: string;
  };
}

export type DictionaryHandoff = PassiveHandoff | ActiveHandoff | ConstructiveHandoff;

export interface ScaffoldResult {
  scaffold: { name: ScaffoldName; input: any } | null;
  chart: any | null;
  flowchart: any | null;
  termsSurfaced: string[];
  dictionaryHandoff: DictionaryHandoff;
}

const SCAFFOLD_NAMES = new Set<string>(['WorkedExample', 'ScaffoldedMCQ', 'GuidedShortAnswer', 'BareLongAnswer', 'WikiDraft']);

function normalizeHandoff(raw: any, termsSurfaced: string[]): DictionaryHandoff {
  if (!raw || typeof raw !== 'object') {
    return { kind: 'passive', termsSurfaced };
  }
  const kind = raw.kind;
  if (kind === 'active') {
    const candidate = typeof raw.candidate_term === 'string' ? raw.candidate_term.toLowerCase() : null;
    if (!candidate) return { kind: 'passive', termsSurfaced };
    return {
      kind: 'active',
      candidateTerm: candidate,
      surfacedTerms: termsSurfaced,
      handoffQuestion: typeof raw.handoff_question === 'string' && raw.handoff_question.trim()
        ? raw.handoff_question
        : 'Is this how your school uses this term?',
    };
  }
  if (kind === 'constructive') {
    const target = typeof raw.target_term === 'string' ? raw.target_term.toLowerCase() : null;
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

function extractTermsSurfaced(scaffoldInput: any): string[] {
  const raw = scaffoldInput?.terms_surfaced;
  if (!Array.isArray(raw)) return [];
  return raw.filter((t: any): t is string => typeof t === 'string').map((t: string) => t.toLowerCase());
}

function vizClause(decision: VizDecision, mastery: number): string {
  if (decision.kind === 'none') {
    return 'Do NOT call any visualization tool. The Visualization Selector deliberately omitted viz for this turn — the learner should reason from prose alone.';
  }
  if (decision.kind === 'chart') {
    return 'ALSO call render_chart in the SAME response. Pick chart_type appropriate to the concept — histogram for shape, bar for group comparison, scatter for relationship, time_series for change over time, box for spread comparison. Include a non-empty values array (numbers for histogram/box; {x,y,label,highlight} objects otherwise), caption, and provenance like "Synthetic data · cohort 2024".';
  }
  if (mastery >= 0.85) {
    return 'ALSO call render_flowchart with flowchart_type cycle showing the wiki contribution routine (claim → support → question → revise) — 4 nodes. This visualizes the PROCESS the contributor is being inducted into, not the concept content. Include caption + provenance.';
  }
  return 'ALSO call render_flowchart with flowchart_type linear or decision (3–5 nodes) showing the sequential reasoning routine for this concept. Include edges connecting node ids, caption, and provenance.';
}

export async function streamScaffold(opts: {
  conceptId: string;
  mastery: number;
  vizDecision: VizDecision;
  signal?: AbortSignal;
}): Promise<ScaffoldResult> {
  const tier = pickTier(opts.mastery);
  const userMessage = `The learner has mastery=${opts.mastery.toFixed(2)} on the "${opts.conceptId}" concept, so the Scaffold Selector chose tier ${tier.num} (${tier.name}). Generate the next scaffold for this learner. Make the setup_prose a concrete Harvard-staff scenario.

You MUST:
1. Call exactly the ${tier.name} tool — do not respond with prose alone, do not pick a different tier.
2. ${vizClause(opts.vizDecision, opts.mastery)}`;

  const res = await fetch(`${BACKEND_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: userMessage }],
      tier: tier.name,
    }),
    signal: opts.signal,
  });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  // Track all in-flight tool calls by id.
  const calls = new Map<string, { name: string; jsonBuf: string; input?: any }>();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.trim()) continue;
      let part: any;
      try { part = JSON.parse(line); } catch { continue; }
      if (part.type === 'tool-input-start') {
        calls.set(part.toolCallId, { name: part.toolName, jsonBuf: '' });
      } else if (part.type === 'tool-input-delta') {
        const c = calls.get(part.toolCallId);
        if (c) c.jsonBuf += part.inputTextDelta ?? '';
      } else if (part.type === 'tool-input-available') {
        const existing = calls.get(part.toolCallId);
        const c: { name: string; jsonBuf: string; input?: any } = existing
          ?? { name: part.toolName, jsonBuf: '' };
        c.name = part.toolName ?? c.name;
        if (part.input) c.input = part.input;
        else { try { c.input = JSON.parse(c.jsonBuf); } catch {} }
        calls.set(part.toolCallId, c);
      }
    }
  }

  // Reconcile any calls still pending input
  for (const c of calls.values()) {
    if (!c.input) { try { c.input = JSON.parse(c.jsonBuf); } catch {} }
  }

  let scaffold: ScaffoldResult['scaffold'] = null;
  let chart: any = null;
  let flowchart: any = null;
  for (const c of calls.values()) {
    if (!c.input) continue;
    if (SCAFFOLD_NAMES.has(c.name)) scaffold = { name: c.name as ScaffoldName, input: c.input };
    else if (c.name === 'render_chart') chart = c.input;
    else if (c.name === 'render_flowchart') flowchart = c.input;
  }

  if (!scaffold) throw new Error('no scaffold tool call in stream');

  // Enforce the selector decision client-side — drop any rogue viz the model emitted.
  if (opts.vizDecision.kind === 'none') { chart = null; flowchart = null; }
  if (opts.vizDecision.kind === 'chart') flowchart = null;
  if (opts.vizDecision.kind === 'flowchart') chart = null;

  const scaffoldInput = scaffold?.input ?? {};
  const termsSurfaced = extractTermsSurfaced(scaffoldInput);
  const dictionaryHandoff = normalizeHandoff(scaffoldInput.dictionary_handoff, termsSurfaced);

  return {
    scaffold,
    chart,
    flowchart,
    termsSurfaced,
    dictionaryHandoff,
  };
}

export function pickTier(mastery: number): { num: number; name: ScaffoldName } {
  if (mastery >= 0.85) return { num: 5, name: 'WikiDraft' };
  if (mastery >= 0.65) return { num: 4, name: 'BareLongAnswer' };
  if (mastery >= 0.45) return { num: 3, name: 'GuidedShortAnswer' };
  if (mastery >= 0.20) return { num: 2, name: 'ScaffoldedMCQ' };
  return { num: 1, name: 'WorkedExample' };
}

export const TIER_COLORS: Record<ScaffoldName, string> = {
  WorkedExample: 'bg-tier-1',
  ScaffoldedMCQ: 'bg-tier-2',
  GuidedShortAnswer: 'bg-tier-3',
  BareLongAnswer: 'bg-tier-4',
  WikiDraft: 'bg-tier-5',
};
