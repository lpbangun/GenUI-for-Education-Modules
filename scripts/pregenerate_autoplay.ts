#!/usr/bin/env bun
// Pre-generate the autoplay bundle using composeTurn — same code path the
// live module uses (DD-007). Re-run only when content needs refreshing.

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateText } from 'ai';
import { model } from './generators/_llm';
import { allTools } from '../backend/tools';
import { composeTurn } from '../lib/turn-composer';
import type { VizDemand, VizHistoryEntry } from '../lib/viz-selector';

const CONCEPT_ID = 'central-tendency';

const CHECKPOINTS: Array<{ mastery: number; label: string; tier_name: string; simulated_history: VizHistoryEntry[] }> = [
  { mastery: 0.10, label: 'Brand new learner', tier_name: 'WorkedExample', simulated_history: [] },
  { mastery: 0.30, label: 'Recognizes the pattern', tier_name: 'ScaffoldedMCQ', simulated_history: [{ viz_kind: 'none', correct: true }] },
  { mastery: 0.55, label: 'Articulating their own interpretation', tier_name: 'GuidedShortAnswer', simulated_history: [{ viz_kind: 'chart', correct: true }] },
  { mastery: 0.75, label: 'Working without scaffolds', tier_name: 'BareLongAnswer', simulated_history: [{ viz_kind: 'none', correct: true }] },
  { mastery: 0.92, label: 'Contributing to the wiki', tier_name: 'WikiDraft', simulated_history: [] },
];

function readVizDemand(conceptId: string): VizDemand {
  const path = join(import.meta.dir, '..', 'content', 'concepts', `${conceptId}.md`);
  const src = readFileSync(path, 'utf-8');
  const m = src.match(/viz_demand:\s*(\w+)/);
  if (!m) throw new Error(`viz_demand missing from ${conceptId}.md — run scripts/enrich_viz_demand.ts`);
  return m[1] as VizDemand;
}

async function main() {
  const vizDemand = readVizDemand(CONCEPT_ID);
  console.log(`Concept "${CONCEPT_ID}" viz_demand=${vizDemand}`);
  console.log(`Pre-generating ${CHECKPOINTS.length} checkpoints...`);

  const surfacedTerms: string[] = [];
  const out: any[] = [];

  for (const cp of CHECKPOINTS) {
    process.stdout.write(`  ${cp.tier_name} (mastery=${cp.mastery})... `);

    const turn = await composeTurn({
      conceptId: CONCEPT_ID,
      mastery: cp.mastery,
      history: cp.simulated_history as any,
      surfacedTerms,
      vizDemand,
      _generateText: generateText as any,
      _model: model,
      _tools: allTools,
    });

    // Accumulate terms across checkpoints (mirrors the live module).
    for (const t of turn.termsSurfaced) {
      if (!surfacedTerms.includes(t)) surfacedTerms.push(t);
    }

    out.push({
      mastery: cp.mastery,
      label: cp.label,
      tier_name: cp.tier_name,
      simulated_history: cp.simulated_history,
      viz_decision: turn.vizDecision,
      scaffold: turn.scaffold,
      chart: turn.chart,
      flowchart: turn.flowchart,
      terms_surfaced: turn.termsSurfaced,
      dictionary_handoff: turn.dictionaryHandoff,
    });

    const vizSummary = turn.chart ? `chart=${(turn.chart as any).chart_type}` : turn.flowchart ? `flowchart=${(turn.flowchart as any).flowchart_type}` : 'no-viz';
    console.log(`scaffold=${turn.scaffold.name} · ${vizSummary} · handoff=${turn.dictionaryHandoff.kind} · terms=${turn.termsSurfaced.join(',')}`);
  }

  const target = join(import.meta.dir, '..', 'frontend', 'src', 'data');
  if (!existsSync(target)) mkdirSync(target, { recursive: true });

  // Preserve the old bundle for rollback.
  const newPath = join(target, 'autoplay-bundle.json');
  const legacyPath = join(target, 'autoplay-bundle.legacy.json');
  if (existsSync(newPath) && !existsSync(legacyPath)) {
    writeFileSync(legacyPath, readFileSync(newPath, 'utf-8'));
    console.log(`✓ saved previous bundle → autoplay-bundle.legacy.json`);
  }

  writeFileSync(newPath, JSON.stringify(out, null, 2));
  console.log(`\n✓ wrote ${out.length} checkpoints → frontend/src/data/autoplay-bundle.json`);
}

main();
