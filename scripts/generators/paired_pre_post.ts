#!/usr/bin/env bun
// Generator 5/5 — paired pre/post measurements.
// Same individuals measured before and after a workshop.
// Teaches: variability, sampling, statistical-vs-practical-significance, communicating-uncertainty.

import { SeededRng, mean, emit } from './_lib';

export function generatePairedPrePost(opts: {
  n_participants?: number;
  effect_size?: number;
  seed?: number;
} = {}) {
  const n_participants = opts.n_participants ?? 36;
  const effect_size = opts.effect_size ?? 1.2;
  const seed = opts.seed ?? 53;
  const rng = new SeededRng(seed);

  const rows: Array<Record<string, unknown>> = [];
  for (let i = 0; i < n_participants; i++) {
    const pre = Math.max(0, Math.min(20, Math.round(rng.normal(11.0, 2.6))));
    const noise = rng.normal(0, 1.5);
    const post = Math.max(0, Math.min(20, Math.round(pre + effect_size + noise)));
    rows.push({
      participant_id: `p${(i + 1).toString().padStart(3, '0')}`,
      pre_score: pre,
      post_score: post,
      delta: post - pre,
    });
  }

  const deltas = rows.map(r => r.delta as number);
  const improved = deltas.filter(d => d > 0).length;
  const declined = deltas.filter(d => d < 0).length;
  const meanDelta = mean(deltas);

  return {
    id: `paired_pre_post_seed${seed}`,
    title: `Synthetic pre/post workshop scores (n=${n_participants}, seed=${seed})`,
    n_rows: rows.length,
    generator_function: 'generatePairedPrePost',
    generator_parameters: { n_participants, effect_size, seed },
    pedagogical_metadata: {
      primary_concept: 'variability',
      teaches: ['variability', 'sampling', 'statistical-vs-practical-significance', 'communicating-uncertainty'],
      features: {
        numeric_field: 'delta',
        n_participants,
        mean_delta: Math.round(meanDelta * 10) / 10,
        median_delta: deltas.slice().sort((a, b) => a - b)[Math.floor(deltas.length / 2)],
        share_improved_pct: Math.round((improved / n_participants) * 1000) / 10,
        share_declined_pct: Math.round((declined / n_participants) * 1000) / 10,
        small_n_uncertainty: true,
      },
      pitfalls_surfaced: [
        'Reporting "average improvement of 1.2 points" hides that some participants got worse',
        'Pre/post designs without a control cannot rule out maturation or test-retest effects',
        'Small n means the gap between mean and median can be noise, not signal',
      ],
      appropriate_tiers: [3, 4, 5],
      relevant_roles: ['program_director', 'professional_development', 'institutional_researcher'],
    },
    fields_schema: {
      participant_id: 'string, synthetic id',
      pre_score: 'integer 0-20',
      post_score: 'integer 0-20',
      delta: 'integer, post - pre',
    },
    plausibility_notes: [
      'All values synthetic; no real participants represented',
      'Score range and effect size mirror typical higher-ed faculty workshop assessments',
      `Generated with seed=${seed}; reproducible`,
    ],
    rows,
  };
}

if (import.meta.main) emit(generatePairedPrePost());
