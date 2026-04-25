#!/usr/bin/env bun
// Generator 3/5 — time series with a structural break.
// Monthly enrollment counts with a deliberate jump at a known year.
// Teaches: time-series-basics, confounding, reading-charts.

import { SeededRng, mean, emit } from './_lib';

export function generateTimeSeriesWithBreak(opts: {
  start_year?: number;
  n_months?: number;
  break_at_month?: number;
  break_magnitude?: number;
  seed?: number;
} = {}) {
  const start_year = opts.start_year ?? 2018;
  const n_months = opts.n_months ?? 60;
  const break_at_month = opts.break_at_month ?? 30;
  const break_magnitude = opts.break_magnitude ?? 80;
  const seed = opts.seed ?? 7;
  const rng = new SeededRng(seed);

  const baseline = 320;
  const rows: Array<Record<string, unknown>> = [];

  for (let i = 0; i < n_months; i++) {
    const date = new Date(Date.UTC(start_year, i, 1));
    const trend = i * 0.4;
    const post_break = i >= break_at_month ? break_magnitude : 0;
    const noise = rng.normal(0, 12);
    rows.push({
      year_month: `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, '0')}`,
      enrollment_count: Math.max(0, Math.round(baseline + trend + post_break + noise)),
    });
  }

  const counts = rows.map(r => r.enrollment_count as number);
  const before = counts.slice(0, break_at_month);
  const after = counts.slice(break_at_month);

  return {
    id: `time_series_with_break_seed${seed}`,
    title: `Synthetic monthly enrollment with structural break at month ${break_at_month}`,
    n_rows: rows.length,
    generator_function: 'generateTimeSeriesWithBreak',
    generator_parameters: { start_year, n_months, break_at_month, break_magnitude, seed },
    pedagogical_metadata: {
      primary_concept: 'time-series-basics',
      teaches: ['time-series-basics', 'confounding', 'reading-charts'],
      features: {
        numeric_field: 'enrollment_count',
        has_structural_break: true,
        break_at_index: break_at_month,
        mean_count_before: Math.round(mean(before)),
        mean_count_after: Math.round(mean(after)),
        gap_explained_by_policy_change: true,
      },
      pitfalls_surfaced: [
        'A trend line fit through the whole series hides the structural break',
        'Attributing the level change to "growth" misses the policy event that caused it',
        'Choosing the y-axis range can make the break look dramatic or trivial',
      ],
      appropriate_tiers: [2, 3, 4],
      relevant_roles: ['institutional_researcher', 'admissions', 'program_director'],
    },
    fields_schema: {
      year_month: 'string, ISO YYYY-MM',
      enrollment_count: 'integer',
    },
    plausibility_notes: [
      'All values synthetic; no real institutional data',
      'Break at month index 30 simulates a policy change (e.g., new admissions criteria)',
      `Generated with seed=${seed}; reproducible`,
    ],
    rows,
  };
}

if (import.meta.main) emit(generateTimeSeriesWithBreak());
