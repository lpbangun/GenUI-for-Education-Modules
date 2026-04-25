#!/usr/bin/env bun
// F005 acceptance: generate one of each, validate against schema + consistency.

import { writeFileSync, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { SyntheticDatasetSchema } from '../lib/schemas/content-schemas';
import { generateCohortOutcomes } from './generators/cohort_outcomes';
import { generateTwoGroupComparison } from './generators/two_group_comparison';
import { generateTimeSeriesWithBreak } from './generators/time_series_with_break';
import { generateSurveyCategorical } from './generators/survey_categorical';
import { generatePairedPrePost } from './generators/paired_pre_post';

const generators = [
  ['cohort_outcomes', generateCohortOutcomes],
  ['two_group_comparison', generateTwoGroupComparison],
  ['time_series_with_break', generateTimeSeriesWithBreak],
  ['survey_categorical', generateSurveyCategorical],
  ['paired_pre_post', generatePairedPrePost],
] as const;

const repoRoot = join(import.meta.dir, '..');
const stagingDir = join(repoRoot, 'content', 'datasets');
const stagedPaths: string[] = [];
let failures = 0;

console.log(`Testing ${generators.length} generators...`);

for (const [name, gen] of generators) {
  const data = gen();
  const parsed = SyntheticDatasetSchema.safeParse(data);
  if (!parsed.success) {
    console.error(`✗ ${name}: schema validation failed`);
    for (const i of parsed.error.issues) console.error(`    ${i.path.join('.')}: ${i.message}`);
    failures++;
    continue;
  }
  const data2 = gen();
  if (JSON.stringify(data) !== JSON.stringify(data2)) {
    console.error(`✗ ${name}: not deterministic`);
    failures++;
    continue;
  }
  console.log(`✓ ${name}: ${data.n_rows} rows, schema + determinism OK`);
}

if (failures > 0) {
  console.error(`\n${failures} generator(s) failed`);
  process.exit(1);
}

// Stage temp datasets and run the consistency validator alongside the calibrated exemplar.
if (!existsSync(stagingDir)) mkdirSync(stagingDir, { recursive: true });
try {
  for (const [name, gen] of generators) {
    const target = join(stagingDir, `__test_${name}.json`);
    writeFileSync(target, JSON.stringify(gen(), null, 2));
    stagedPaths.push(target);
  }
  const proc = Bun.spawnSync({
    cmd: ['bun', 'run', 'scripts/validate_exemplar_consistency.ts'],
    cwd: repoRoot,
    stdout: 'inherit',
    stderr: 'inherit',
  });
  if (proc.exitCode !== 0) {
    console.error('\n✗ consistency validator failed against staged generators');
    process.exit(1);
  }
  console.log('\n✓ All 5 generators produce schema-valid, deterministic, mathematically-consistent output');
} finally {
  for (const path of stagedPaths) {
    try { unlinkSync(path); } catch {}
  }
}
