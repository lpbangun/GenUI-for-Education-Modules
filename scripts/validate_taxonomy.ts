#!/usr/bin/env bun
// F001 — validate taxonomy.json against schema and DAG rules.
// Exits 0 if valid, 1 with specific errors if not.

import { z } from 'zod';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const Concept = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  category: z.enum(['foundational', 'interpretive', 'communication']),
  prerequisites: z.array(z.string()),
  outcome: z.string().min(1),
  exemplar_status: z.enum(['calibrated', 'to_generate']).optional(),
});

const Taxonomy = z.object({
  version: z.string(),
  total_concepts: z.number().int().positive(),
  philosophy: z.string(),
  categories: z.record(z.string(), z.object({
    description: z.string(),
    concepts: z.array(z.string()),
  })),
  concepts: z.array(Concept),
});

const errors: string[] = [];

const raw = JSON.parse(readFileSync(join(import.meta.dir, '..', 'taxonomy.json'), 'utf-8'));
const parsed = Taxonomy.safeParse(raw);
if (!parsed.success) {
  for (const issue of parsed.error.issues) {
    errors.push(`schema · ${issue.path.join('.')} · ${issue.message}`);
  }
  console.error(errors.join('\n'));
  process.exit(1);
}

const { concepts, total_concepts, categories } = parsed.data;

if (concepts.length !== 25) errors.push(`count · expected 25 concepts, got ${concepts.length}`);
if (total_concepts !== concepts.length) errors.push(`count · total_concepts (${total_concepts}) ≠ concepts.length (${concepts.length})`);

const ids = new Set(concepts.map(c => c.id));
if (ids.size !== concepts.length) errors.push(`uniqueness · duplicate concept ids`);

for (const c of concepts) {
  for (const p of c.prerequisites) {
    if (!ids.has(p)) errors.push(`prereq-ref · "${c.id}" → unknown prerequisite "${p}"`);
  }
}

const validCategories = new Set(['foundational', 'interpretive', 'communication']);
for (const k of Object.keys(categories)) {
  if (!validCategories.has(k)) errors.push(`category · unknown category key "${k}"`);
}
const cataloguedIds = new Set<string>();
for (const [k, v] of Object.entries(categories)) {
  for (const cid of v.concepts) {
    if (!ids.has(cid)) errors.push(`category-ref · "${k}" lists unknown id "${cid}"`);
    if (cataloguedIds.has(cid)) errors.push(`category-ref · id "${cid}" appears in multiple categories`);
    cataloguedIds.add(cid);
  }
}
for (const c of concepts) {
  const declared = c.category;
  if (!categories[declared]?.concepts.includes(c.id)) {
    errors.push(`category-consistency · "${c.id}" declares category "${declared}" but is not listed in categories.${declared}.concepts`);
  }
}

const visiting = new Set<string>();
const visited = new Set<string>();
const conceptById = new Map(concepts.map(c => [c.id, c]));
function dfs(id: string, path: string[]) {
  if (visited.has(id)) return;
  if (visiting.has(id)) {
    errors.push(`dag-cycle · ${[...path, id].join(' → ')}`);
    return;
  }
  visiting.add(id);
  for (const p of conceptById.get(id)?.prerequisites ?? []) {
    dfs(p, [...path, id]);
  }
  visiting.delete(id);
  visited.add(id);
}
for (const c of concepts) dfs(c.id, []);

if (errors.length === 0) {
  console.log(`taxonomy.json · OK · ${concepts.length} concepts · DAG clean · all prereq refs resolve`);
  process.exit(0);
}
console.error(`taxonomy.json · ${errors.length} errors:`);
for (const e of errors) console.error(`  · ${e}`);
process.exit(1);
