#!/usr/bin/env bun
/**
 * validate_exemplar_consistency.ts
 *
 * Verifies that synthetic datasets and the scenarios that reference them
 * are mathematically consistent. Also runs structural validation against
 * the Zod schemas.
 *
 * Mathematical consistency rule (per CLAUDE.md):
 *   When a scenario.dataset_ref points to a dataset, the stats in the
 *   scenario.artifact.content must match computed stats from the dataset's
 *   rows within $100 (or proportional tolerance for non-currency fields).
 *
 * Exit codes:
 *   0 - all checks passed
 *   1 - one or more checks failed (errors printed to stderr)
 */

import { readdirSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import {
  ScenarioSchema,
  SyntheticDatasetSchema,
  type Scenario,
  type SyntheticDataset
} from '../lib/schemas/content-schemas';

const TOLERANCE_USD = 100;

interface ValidationError {
  file: string;
  message: string;
}

const errors: ValidationError[] = [];

function computeNumericStats(rows: Record<string, any>[], field: string) {
  const values = rows
    .map((r) => r[field])
    .filter((v): v is number => typeof v === 'number')
    .sort((a, b) => a - b);

  if (values.length === 0) return null;

  const n = values.length;
  const sum = values.reduce((s, v) => s + v, 0);
  const mean = sum / n;
  const median =
    n % 2 === 0
      ? (values[n / 2 - 1] + values[n / 2]) / 2
      : values[Math.floor(n / 2)];

  return {
    n,
    mean: Math.round(mean),
    median: Math.round(median),
    min: values[0],
    max: values[n - 1]
  };
}

function loadDatasets(dir: string): Map<string, SyntheticDataset> {
  const map = new Map<string, SyntheticDataset>();
  if (!existsSync(dir)) return map;

  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.json')) continue;
    const path = join(dir, file);
    try {
      const raw = JSON.parse(readFileSync(path, 'utf-8'));
      const parsed = SyntheticDatasetSchema.safeParse(raw);
      if (!parsed.success) {
        errors.push({
          file: path,
          message: `Schema validation failed: ${parsed.error.issues
            .map((i) => `${i.path.join('.')}: ${i.message}`)
            .join('; ')}`
        });
        continue;
      }
      map.set(parsed.data.id, parsed.data);
    } catch (e) {
      errors.push({
        file: path,
        message: `Failed to parse: ${(e as Error).message}`
      });
    }
  }
  return map;
}

function loadScenarios(dir: string): Map<string, Scenario> {
  const map = new Map<string, Scenario>();
  if (!existsSync(dir)) return map;

  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.json')) continue;
    const path = join(dir, file);
    try {
      const raw = JSON.parse(readFileSync(path, 'utf-8'));
      const parsed = ScenarioSchema.safeParse(raw);
      if (!parsed.success) {
        errors.push({
          file: path,
          message: `Schema validation failed: ${parsed.error.issues
            .map((i) => `${i.path.join('.')}: ${i.message}`)
            .join('; ')}`
        });
        continue;
      }
      map.set(parsed.data.id, parsed.data);
    } catch (e) {
      errors.push({
        file: path,
        message: `Failed to parse: ${(e as Error).message}`
      });
    }
  }
  return map;
}

// Pick the numeric field to validate against. Generalized in F005 so the four
// new generators (two_group_comparison, time_series_with_break,
// survey_categorical, paired_pre_post) can declare their own field via
// pedagogical_metadata.features.numeric_field. Falls back to salary_usd for the
// original cohort_outcomes exemplar.
function pickNumericField(d: SyntheticDataset): string | null {
  const declared = d.pedagogical_metadata.features.numeric_field;
  if (typeof declared === 'string' && d.fields_schema[declared]) return declared;
  if (d.fields_schema.salary_usd) return 'salary_usd';
  for (const [field, type] of Object.entries(d.fields_schema)) {
    if (typeof type === 'string' && /integer|number|float|int/i.test(type)) return field;
  }
  return null;
}

function validateDatasetInternal(d: SyntheticDataset): void {
  const features = d.pedagogical_metadata.features;
  const field = pickNumericField(d);

  if (field) {
    const stats = computeNumericStats(d.rows, field);
    if (stats) {
      // Suffix convention: features.mean_<field-suffix>, median_<field-suffix>, etc.
      // For salary_usd → suffix "usd"; for "score" → suffix "score"; etc.
      const suffix = field.includes('_') ? field.split('_').pop()! : field;
      const claim = (key: string) => features[`${key}_${suffix}`];

      const claimedMean = claim('mean');
      if (typeof claimedMean === 'number') {
        const diff = Math.abs(claimedMean - stats.mean);
        if (diff > TOLERANCE_USD) errors.push({
          file: `dataset:${d.id}`,
          message: `claimed mean_${suffix}=${claimedMean}, computed=${stats.mean}, diff=${diff} exceeds tolerance ${TOLERANCE_USD}`
        });
      }
      const claimedMedian = claim('median');
      if (typeof claimedMedian === 'number') {
        const diff = Math.abs(claimedMedian - stats.median);
        if (diff > TOLERANCE_USD) errors.push({
          file: `dataset:${d.id}`,
          message: `claimed median_${suffix}=${claimedMedian}, computed=${stats.median}, diff=${diff} exceeds tolerance ${TOLERANCE_USD}`
        });
      }
      const claimedMin = claim('min');
      if (typeof claimedMin === 'number' && claimedMin !== stats.min) errors.push({
        file: `dataset:${d.id}`,
        message: `claimed min_${suffix}=${claimedMin}, computed=${stats.min}`
      });
      const claimedMax = claim('max');
      if (typeof claimedMax === 'number' && claimedMax !== stats.max) errors.push({
        file: `dataset:${d.id}`,
        message: `claimed max_${suffix}=${claimedMax}, computed=${stats.max}`
      });

      if (features.right_skew === true && stats.mean <= stats.median) errors.push({
        file: `dataset:${d.id}`,
        message: `claims right_skew=true but mean (${stats.mean}) <= median (${stats.median})`
      });
      if (features.left_skew === true && stats.mean >= stats.median) errors.push({
        file: `dataset:${d.id}`,
        message: `claims left_skew=true but mean (${stats.mean}) >= median (${stats.median})`
      });
      if (features.has_outlier === true && features.outlier_is_extreme === true && stats.max < 3 * stats.median) errors.push({
        file: `dataset:${d.id}`,
        message: `claims extreme outlier but max (${stats.max}) < 3x median (${stats.median})`
      });
    }
  }

  if (d.rows.length !== d.n_rows) {
    errors.push({
      file: `dataset:${d.id}`,
      message: `n_rows=${d.n_rows} but rows array length=${d.rows.length}`
    });
  }
}

function extractStatFromArtifact(content: string, label: string): number | null {
  const re = new RegExp(`${label}[:\\s=]+\\$?([\\d,]+)`, 'i');
  const m = content.match(re);
  if (!m) return null;
  return parseInt(m[1].replace(/,/g, ''), 10);
}

function validateScenarioReferencesDataset(
  s: Scenario,
  datasets: Map<string, SyntheticDataset>
): void {
  if (!s.dataset_ref) return;

  const d = datasets.get(s.dataset_ref);
  if (!d) {
    errors.push({
      file: `scenario:${s.id}`,
      message: `references dataset "${s.dataset_ref}" which does not exist`
    });
    return;
  }

  if (!s.artifact || s.artifact.type !== 'summary_stats') return;

  const field = pickNumericField(d);
  if (field) {
    const computedStats = computeNumericStats(d.rows, field);
    if (!computedStats) return;

    const checks: Array<[string, number]> = [
      ['Mean', computedStats.mean],
      ['Median', computedStats.median]
    ];

    for (const [label, computed] of checks) {
      const claimed = extractStatFromArtifact(s.artifact.content, label);
      if (claimed === null) continue;
      const diff = Math.abs(claimed - computed);
      if (diff > TOLERANCE_USD) {
        errors.push({
          file: `scenario:${s.id}`,
          message: `artifact ${label}=${claimed} but dataset computed ${label.toLowerCase()}=${computed}, diff=${diff} exceeds ${TOLERANCE_USD}`
        });
      }
    }
  }
}

function main(): void {
  const repoRoot = process.cwd();
  const datasetDir = join(repoRoot, 'content', 'datasets');
  const scenarioDir = join(repoRoot, 'content', 'scenarios');

  const datasets = loadDatasets(datasetDir);
  const scenarios = loadScenarios(scenarioDir);

  console.log(`Loaded ${datasets.size} datasets, ${scenarios.size} scenarios`);

  for (const d of datasets.values()) {
    validateDatasetInternal(d);
  }

  for (const s of scenarios.values()) {
    validateScenarioReferencesDataset(s, datasets);
  }

  if (errors.length === 0) {
    console.log('\n✓ All exemplar consistency checks passed');
    process.exit(0);
  }

  console.error(`\n✗ ${errors.length} consistency error(s):\n`);
  for (const e of errors) {
    console.error(`  ${e.file}`);
    console.error(`    ${e.message}\n`);
  }
  process.exit(1);
}

main();
