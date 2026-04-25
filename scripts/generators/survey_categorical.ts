#!/usr/bin/env bun
// Generator 4/5 — survey with categorical responses.
// Multiple-choice survey with non-trivial missing-data pattern.
// Teaches: categorical-vs-quantitative, rates-vs-ratios, missing-data, percentages-vs-points.

import { SeededRng, emit } from './_lib';

const REASONS = [
  'cost',
  'fit_with_career_goals',
  'faculty_reputation',
  'location',
  'family_proximity',
  'program_format',
  'no_response',
] as const;

export function generateSurveyCategorical(opts: {
  n_respondents?: number;
  missing_rate?: number;
  seed?: number;
} = {}) {
  const n_respondents = opts.n_respondents ?? 240;
  const missing_rate = opts.missing_rate ?? 0.15;
  const seed = opts.seed ?? 91;
  const rng = new SeededRng(seed);

  const weights: Record<typeof REASONS[number], number> = {
    cost: 0.32,
    fit_with_career_goals: 0.24,
    faculty_reputation: 0.14,
    location: 0.10,
    family_proximity: 0.08,
    program_format: 0.12,
    no_response: 0,
  };

  const rows: Array<Record<string, unknown>> = [];
  for (let i = 0; i < n_respondents; i++) {
    const isMissing = rng.next() < missing_rate;
    let primary_reason: typeof REASONS[number];
    if (isMissing) {
      primary_reason = 'no_response';
    } else {
      const r = rng.next();
      let cum = 0;
      let pick: typeof REASONS[number] = 'cost';
      for (const reason of REASONS) {
        if (reason === 'no_response') continue;
        cum += weights[reason];
        if (r <= cum) { pick = reason; break; }
      }
      primary_reason = pick;
    }
    rows.push({
      respondent_id: `s${(i + 1).toString().padStart(4, '0')}`,
      enrollment_status: rng.next() < 0.42 ? 'enrolled' : 'declined',
      primary_reason,
    });
  }

  const counts: Record<string, number> = {};
  for (const r of rows) counts[r.primary_reason as string] = (counts[r.primary_reason as string] ?? 0) + 1;

  return {
    id: `survey_categorical_seed${seed}`,
    title: `Synthetic admissions decision survey (n=${n_respondents}, seed=${seed})`,
    n_rows: rows.length,
    generator_function: 'generateSurveyCategorical',
    generator_parameters: { n_respondents, missing_rate, seed },
    pedagogical_metadata: {
      primary_concept: 'categorical-vs-quantitative',
      teaches: ['categorical-vs-quantitative', 'rates-vs-ratios', 'missing-data', 'percentages-vs-points'],
      features: {
        n_respondents,
        no_response_count: counts.no_response ?? 0,
        no_response_rate_pct: Math.round(((counts.no_response ?? 0) / n_respondents) * 1000) / 10,
        most_common_reason: 'cost',
        denominator_question_active: true,
      },
      pitfalls_surfaced: [
        'Reporting "32% chose cost" using all respondents conflates with "of those who responded, 38% chose cost"',
        'Dropping no_response rows changes the denominator silently',
        'Treating ordinal categories as numeric scores invents structure',
      ],
      appropriate_tiers: [2, 3, 4],
      relevant_roles: ['admissions', 'institutional_researcher'],
    },
    fields_schema: {
      respondent_id: 'string, synthetic id',
      enrollment_status: 'string, one of: enrolled, declined',
      primary_reason: 'string, one of: cost, fit_with_career_goals, faculty_reputation, location, family_proximity, program_format, no_response',
    },
    plausibility_notes: [
      'All values synthetic; no real survey respondents',
      'Reason weights roughly mirror published higher-ed enrollment-decision surveys',
      `Generated with seed=${seed}; reproducible`,
    ],
    rows,
  };
}

if (import.meta.main) emit(generateSurveyCategorical());
