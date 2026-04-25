#!/usr/bin/env bun
// Generator 2/5 — two-group comparison.
// Two demographically labeled groups with overlapping but distinct distributions.
// Teaches: comparing-groups, base-rates, statistical-vs-practical-significance.

import { SeededRng, mean, median, emit } from './_lib';

export function generateTwoGroupComparison(opts: {
  group_a_size?: number;
  group_b_size?: number;
  seed?: number;
} = {}) {
  const group_a_size = opts.group_a_size ?? 60;
  const group_b_size = opts.group_b_size ?? 40;
  const seed = opts.seed ?? 17;
  const rng = new SeededRng(seed);

  const rows: Array<Record<string, unknown>> = [];

  for (let i = 0; i < group_a_size; i++) {
    rows.push({
      respondent_id: `r${(i + 1).toString().padStart(4, '0')}`,
      group: 'returning_students',
      satisfaction_score: Math.max(1, Math.min(10, Math.round(rng.normal(7.4, 1.6)))),
    });
  }
  for (let i = 0; i < group_b_size; i++) {
    rows.push({
      respondent_id: `r${(group_a_size + i + 1).toString().padStart(4, '0')}`,
      group: 'first_year_students',
      satisfaction_score: Math.max(1, Math.min(10, Math.round(rng.normal(6.5, 1.8)))),
    });
  }

  const aScores = rows.filter(r => r.group === 'returning_students').map(r => r.satisfaction_score as number);
  const bScores = rows.filter(r => r.group === 'first_year_students').map(r => r.satisfaction_score as number);

  return {
    id: `two_group_comparison_seed${seed}`,
    title: `Synthetic two-group satisfaction comparison (seed=${seed})`,
    n_rows: rows.length,
    generator_function: 'generateTwoGroupComparison',
    generator_parameters: { group_a_size, group_b_size, seed },
    pedagogical_metadata: {
      primary_concept: 'comparing-groups',
      teaches: ['comparing-groups', 'base-rates', 'statistical-vs-practical-significance'],
      features: {
        numeric_field: 'satisfaction_score',
        group_a_n: group_a_size,
        group_b_n: group_b_size,
        group_a_mean_score: Math.round(mean(aScores) * 10) / 10,
        group_b_mean_score: Math.round(mean(bScores) * 10) / 10,
        group_a_median_score: median(aScores),
        group_b_median_score: median(bScores),
        groups_overlap: true,
      },
      pitfalls_surfaced: [
        'A 1-point gap on a 10-point scale may be statistically detectable but not practically meaningful',
        'Comparing means without showing distributions hides overlap',
        'Group sizes differ — proportional comparisons are easier to misread than absolute counts',
      ],
      appropriate_tiers: [2, 3, 4],
      relevant_roles: ['institutional_researcher', 'student_affairs', 'program_director'],
    },
    fields_schema: {
      respondent_id: 'string, synthetic id',
      group: 'string, one of: returning_students, first_year_students',
      satisfaction_score: 'integer 1-10',
    },
    plausibility_notes: [
      'All values synthetic, no real students represented',
      'Score ranges and group means roughly mirror published higher-ed satisfaction surveys',
      `Generated with seed=${seed}; reproducible`,
    ],
    rows,
  };
}

if (import.meta.main) emit(generateTwoGroupComparison());
