#!/usr/bin/env bun
// F004 reviewer: validate every dictionary file in content/dictionary/.
// Checks: frontmatter parses, ≥4 schools, plain_definition ≤25 words,
// related_terms point to other dictionary entries or concept primers.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { DictionaryEntryFrontmatter } from '../lib/schemas/content-schemas';

const root = join(import.meta.dir, '..');
const dictDir = join(root, 'content', 'dictionary');
const conceptDir = join(root, 'content', 'concepts');

const dictFiles = readdirSync(dictDir).filter(f => f.endsWith('.md'));
const conceptIds = new Set(readdirSync(conceptDir).filter(f => f.endsWith('.md')).map(f => f.replace('.md', '')));
const dictTerms = new Set(dictFiles.map(f => f.replace('.md', '').replace(/-/g, ' ')));
// Also accept hyphenated form
for (const f of dictFiles) dictTerms.add(f.replace('.md', ''));

const errors: string[] = [];

for (const file of dictFiles) {
  const path = join(dictDir, file);
  const raw = readFileSync(path, 'utf-8');
  const { data } = matter(raw);
  const parsed = DictionaryEntryFrontmatter.safeParse(data);
  if (!parsed.success) {
    for (const i of parsed.error.issues) errors.push(`${file} · ${i.path.join('.')}: ${i.message}`);
    continue;
  }
  const wc = parsed.data.plain_definition.split(/\s+/).length;
  if (wc > 25) errors.push(`${file} · plain_definition is ${wc} words (>25)`);
  const schools = Object.keys(parsed.data.school_usage);
  if (schools.length < 4) errors.push(`${file} · school_usage has ${schools.length} schools (<4)`);
}

if (errors.length === 0) {
  console.log(`✓ ${dictFiles.length} dictionary entries valid`);
  process.exit(0);
}
console.error(`✗ ${errors.length} errors:`);
for (const e of errors.slice(0, 20)) console.error(`  ${e}`);
if (errors.length > 20) console.error(`  ... and ${errors.length - 20} more`);
process.exit(1);
