#!/usr/bin/env bun
// F006 reviewer: validate every scenario file in content/scenarios/.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ScenarioSchema } from '../lib/schemas/content-schemas';

const root = join(import.meta.dir, '..');
const dir = join(root, 'content', 'scenarios');
const files = readdirSync(dir).filter(f => f.endsWith('.json'));

const errors: string[] = [];

for (const file of files) {
  const path = join(dir, file);
  let raw: any;
  try { raw = JSON.parse(readFileSync(path, 'utf-8')); }
  catch (e) { errors.push(`${file} · parse: ${(e as Error).message}`); continue; }
  const parsed = ScenarioSchema.safeParse(raw);
  if (!parsed.success) {
    for (const i of parsed.error.issues.slice(0, 3)) errors.push(`${file} · ${i.path.join('.')}: ${i.message}`);
  }
}

if (errors.length === 0) {
  console.log(`✓ ${files.length} scenarios valid`);
  process.exit(0);
}
console.error(`✗ ${errors.length} errors:`);
for (const e of errors.slice(0, 30)) console.error(`  ${e}`);
if (errors.length > 30) console.error(`  ... and ${errors.length - 30} more`);
process.exit(1);
