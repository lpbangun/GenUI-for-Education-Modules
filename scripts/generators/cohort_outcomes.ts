#!/usr/bin/env bun
// Generator 1/5 — cohort outcomes (right-skewed salary distribution with outliers).
// Mirrors the calibrated exemplar (hgse_cohort_salaries.json).

import { SeededRng, mean, median, emit } from './_lib';

const SECTORS = ['nonprofit', 'public', 'industry', 'academia', 'consulting'] as const;
const ROLES = ['teacher', 'curriculum designer', 'program coordinator', 'analyst', 'consultant', 'admissions officer', 'researcher'] as const;

export function generateCohortOutcomes(opts: {
  cohort_size?: number;
  seed?: number;
  outlier_count?: number;
} = {}) {
  const cohort_size = opts.cohort_size ?? 28;
  const seed = opts.seed ?? 42;
  const outlier_count = opts.outlier_count ?? 1;
  const rng = new SeededRng(seed);

  const baseline_n = cohort_size - outlier_count;
  const rows: Array<Record<string, unknown>> = [];

  for (let i = 0; i < baseline_n; i++) {
    const salary = Math.round(rng.normal(68500, 7500));
    rows.push({
      graduate_id: `g${(i + 1).toString().padStart(3, '0')}`,
      graduation_year: 2024,
      role_taken: rng.pick(ROLES),
      sector: rng.pick(SECTORS),
      salary_usd: Math.max(40000, Math.min(95000, salary)),
    });
  }
  for (let i = 0; i < outlier_count; i++) {
    rows.push({
      graduate_id: `g${(baseline_n + i + 1).toString().padStart(3, '0')}`,
      graduation_year: 2024,
      role_taken: 'product manager',
      sector: 'industry',
      salary_usd: 250000 + rng.int(0, 250000),
    });
  }

  const salaries = rows.map(r => r.salary_usd as number);

  return {
    id: `cohort_outcomes_seed${seed}`,
    title: `Synthetic cohort salary distribution (n=${cohort_size}, seed=${seed})`,
    n_rows: rows.length,
    generator_function: 'generateCohortOutcomes',
    generator_parameters: { cohort_size, seed, outlier_count },
    pedagogical_metadata: {
      primary_concept: 'central-tendency',
      teaches: ['central-tendency', 'skew', 'outliers'],
      features: {
        numeric_field: 'salary_usd',
        right_skew: mean(salaries) > median(salaries),
        has_outlier: outlier_count > 0,
        outlier_is_extreme: outlier_count > 0,
        mean_usd: Math.round(mean(salaries)),
        median_usd: Math.round(median(salaries)),
        min_usd: Math.min(...salaries),
        max_usd: Math.max(...salaries),
      },
      pitfalls_surfaced: [
        'Reporting mean without median overstates typical outcome when distribution is right-skewed',
        'Removing the outlier suppresses a real-but-rare pathway',
      ],
      appropriate_tiers: [1, 2, 3, 4, 5],
      relevant_roles: ['career_advisor', 'admissions', 'institutional_researcher'],
    },
    fields_schema: {
      graduate_id: 'string, synthetic id, no real person',
      graduation_year: 'integer',
      role_taken: 'string',
      sector: 'string',
      salary_usd: 'integer',
    },
    plausibility_notes: [
      'All values synthetic, no real individuals represented',
      'Salary ranges roughly reflect 2024 ed-sector reporting for early-career graduates',
      `Generated with seed=${seed}; reproducible`,
    ],
    rows,
  };
}

if (import.meta.main) emit(generateCohortOutcomes());
