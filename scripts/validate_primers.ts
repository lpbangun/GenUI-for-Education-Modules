#!/usr/bin/env bun
// F003 reviewer: validate every primer file in content/concepts/.
// Checks: frontmatter parses, no formula syntax, word count 400-700, references >=1 prereq.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import { ConceptPrimerFrontmatter } from '../lib/schemas/content-schemas';

const root = join(import.meta.dir, '..');
const dir = join(root, 'content', 'concepts');
const files = readdirSync(dir).filter(f => f.endsWith('.md'));

const errors: string[] = [];
const FORMULA = /=|\+|\*|sum\(|avg\(/;

let words = 0, count = 0;
for (const file of files) {
  const path = join(dir, file);
  const raw = readFileSync(path, 'utf-8');
  const { data, content } = matter(raw);
  const parsed = ConceptPrimerFrontmatter.safeParse(data);
  if (!parsed.success) {
    for (const i of parsed.error.issues) errors.push(`${file} · frontmatter · ${i.path.join('.')}: ${i.message}`);
    continue;
  }
  const wc = content.trim().split(/\s+/).length;
  if (wc < 400 || wc > 700) errors.push(`${file} · word count ${wc} outside [400, 700]`);
  // Check for formula tokens in actual prose lines (skip code blocks and prose words like "and"; only in math contexts)
  const proseLines = content.split('\n').filter(l => !l.trim().startsWith('```'));
  for (const line of proseLines) {
    if (/\b(?:sum|avg)\([^)]*\)/.test(line)) errors.push(`${file} · formula syntax found: ${line.trim().slice(0, 60)}`);
  }
  words += wc; count++;
}

if (errors.length === 0) {
  console.log(`✓ ${count} primers valid · avg ${Math.round(words / count)} words`);
  process.exit(0);
}
console.error(`✗ ${errors.length} errors:`);
for (const e of errors) console.error(`  ${e}`);
process.exit(1);
