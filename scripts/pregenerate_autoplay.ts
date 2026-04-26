#!/usr/bin/env bun
// Pre-generate the autoplay bundle: 5 mastery checkpoints × 1 LLM call each.
// Saves the result as a static JSON the frontend ships with — no per-play LLM cost.
// Re-run only when content needs refreshing.

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { generateText } from 'ai';
import { model } from './generators/_llm';
import { allTools, TOOL_NAMES } from '../backend/tools';

const SCAFFOLD_NAMES = new Set(['WorkedExample', 'ScaffoldedMCQ', 'GuidedShortAnswer', 'BareLongAnswer', 'WikiDraft']);

const CHECKPOINTS = [
  { mastery: 0.10, label: 'Brand new learner', tier_name: 'WorkedExample', viz_hint: 'render_chart with chart_type histogram showing a right-skewed salary distribution; ~25 inline numeric values; caption + provenance.' },
  { mastery: 0.30, label: 'Recognizes the pattern', tier_name: 'ScaffoldedMCQ', viz_hint: 'render_chart with chart_type bar showing mean vs median side by side using {x, y, label, highlight} objects.' },
  { mastery: 0.55, label: 'Articulating their own interpretation', tier_name: 'GuidedShortAnswer', viz_hint: 'render_flowchart with flowchart_type linear: a 3-4 node funnel/funnel-like reasoning path (e.g., notice the gap → infer skew → pick a measure). Use the See-Think-Wonder routine as the structure.' },
  { mastery: 0.75, label: 'Working without scaffolds', tier_name: 'BareLongAnswer', viz_hint: 'render_chart with chart_type time_series showing hypothetical year-over-year averages with one anomalous year highlighted; ~6-8 inline {x, y, label, highlight} objects.' },
  { mastery: 0.92, label: 'Contributing to the wiki', tier_name: 'WikiDraft', viz_hint: 'render_flowchart with flowchart_type cycle: 4-node loop showing claim → support → question → revise. This is the wiki-writing routine the contributor is being invited into.' },
];

async function generateCheckpoint(cp: typeof CHECKPOINTS[number]) {
  const prompt = `The learner has mastery=${cp.mastery.toFixed(2)} on the "central-tendency" concept (which teaches when to use mean vs median, especially for skewed distributions). The Scaffold Selector chose tier (${cp.tier_name}). Generate the next scaffold for this learner. Make the setup_prose a concrete Harvard-staff scenario (admissions, advising, giving, course evaluation, or institutional research).

You MUST:
1. Call exactly the ${cp.tier_name} tool — do not respond with prose alone, do not pick a different tier.
2. ALSO call this visualization in the SAME response: ${cp.viz_hint}
   - render_chart MUST include a non-empty "values" array (numbers for histogram/box; {x,y,label,highlight} objects for bar/scatter/time_series).
   - render_flowchart MUST include 3-6 nodes and the edges connecting them (each edge has from+to ids matching node ids).
   - Both MUST include caption and provenance ("Synthetic data · cohort 2024" style).`;

  const result = await generateText({
    model,
    system: 'You are a Content Generator for a Harvard staff data fluency module. You write voice-controlled scaffolds and pair them with one inline visualization (chart or flowchart) when it helps interpretation.',
    prompt,
    tools: allTools,
    toolChoice: 'required',
    maxOutputTokens: 2400,
  });

  const calls = result.toolCalls ?? [];
  let scaffold: any = null;
  let chart: any = null;
  let flowchart: any = null;
  for (const c of calls) {
    if (SCAFFOLD_NAMES.has(c.toolName)) scaffold = { name: c.toolName, input: c.input };
    else if (c.toolName === 'render_chart') chart = c.input;
    else if (c.toolName === 'render_flowchart') flowchart = c.input;
  }
  if (!scaffold) throw new Error(`no scaffold in checkpoint mastery=${cp.mastery}`);
  return { ...cp, scaffold, chart, flowchart };
}

async function main() {
  console.log(`Pre-generating ${CHECKPOINTS.length} checkpoints (~$0.005 each)...`);
  const out: any[] = [];
  for (const cp of CHECKPOINTS) {
    process.stdout.write(`  ${cp.tier_name} (mastery=${cp.mastery})... `);
    const r = await generateCheckpoint(cp);
    out.push(r);
    console.log(`scaffold=${r.scaffold.name}, chart=${r.chart ? r.chart.chart_type : '—'}, flowchart=${r.flowchart ? r.flowchart.flowchart_type : '—'}`);
  }
  const target = join(import.meta.dir, '..', 'frontend', 'src', 'data');
  if (!existsSync(target)) mkdirSync(target, { recursive: true });
  writeFileSync(join(target, 'autoplay-bundle.json'), JSON.stringify(out, null, 2));
  console.log(`\n✓ wrote ${out.length} checkpoints → frontend/src/data/autoplay-bundle.json`);
  console.log(`  tools used: ${TOOL_NAMES.join(', ')}`);
}

main();
