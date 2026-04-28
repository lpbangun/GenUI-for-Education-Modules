// Frontend mirror of lib/viz-selector.ts. Kept in sync by hand — they are tiny
// and the rule set is the load-bearing pedagogy. If you change one, change both,
// and update lib/__tests__/viz-selector.test.ts.

export type VizKind = 'chart' | 'flowchart' | 'none';
export type VizDemand = 'distribution' | 'comparison' | 'sequence' | 'definition';

export interface ConceptVizMeta {
  id: string;
  viz_demand: VizDemand;
}

export interface VizHistoryEntry {
  viz_kind?: VizKind;
  correct?: boolean;
  asked_for_hint?: boolean;
}

export interface VizDecision {
  kind: VizKind;
  reason: string;
}

export function pickVisualization(opts: {
  concept: ConceptVizMeta;
  mastery: number;
  history: VizHistoryEntry[];
}): VizDecision {
  const { concept, mastery, history } = opts;
  const last = history[history.length - 1];
  const struggled = !!last && (last.correct === false || last.asked_for_hint === true);

  if (struggled) {
    if (concept.viz_demand === 'sequence') return { kind: 'flowchart', reason: 'rule-1: recent struggle → re-offload to flowchart' };
    if (concept.viz_demand === 'definition') return { kind: 'none', reason: 'rule-1+4d: struggle, but definitional concept → dictionary handles it' };
    return { kind: 'chart', reason: 'rule-1: recent struggle → re-offload to chart' };
  }

  if (mastery >= 0.85) return { kind: 'flowchart', reason: 'rule-2: WikiDraft tier → contribution-routine flowchart (process, not content)' };
  if (mastery >= 0.65) return { kind: 'none', reason: 'rule-3: constructive tier → learner constructs interpretation, no visual crutch' };

  let candidate: VizKind;
  switch (concept.viz_demand) {
    case 'distribution': candidate = 'chart'; break;
    case 'comparison': candidate = 'chart'; break;
    case 'sequence': candidate = 'flowchart'; break;
    case 'definition': return { kind: 'none', reason: 'rule-4d: definitional concept → dictionary handles it' };
  }

  if (last && last.viz_kind === candidate) return { kind: 'none', reason: `rule-5: previous turn already used ${candidate} → vary or omit` };
  return { kind: candidate, reason: `rule-4: concept demands ${concept.viz_demand} → ${candidate}` };
}
