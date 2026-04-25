// F002 — verify Zod schemas parse all four calibrated exemplars.

import { test, expect } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import {
  ConceptPrimerFrontmatter,
  DictionaryEntryFrontmatter,
  ScenarioSchema,
  SyntheticDatasetSchema,
} from '../content-schemas';

const root = join(import.meta.dir, '..', '..', '..');

test('ConceptPrimerFrontmatter parses central-tendency.md', () => {
  const raw = readFileSync(join(root, 'content/concepts/central-tendency.md'), 'utf-8');
  const { data } = matter(raw);
  const result = ConceptPrimerFrontmatter.safeParse(data);
  if (!result.success) console.error(result.error.issues);
  expect(result.success).toBe(true);
});

test('DictionaryEntryFrontmatter parses median.md', () => {
  const raw = readFileSync(join(root, 'content/dictionary/median.md'), 'utf-8');
  const { data } = matter(raw);
  const result = DictionaryEntryFrontmatter.safeParse(data);
  if (!result.success) console.error(result.error.issues);
  expect(result.success).toBe(true);
});

test('ScenarioSchema parses central-tendency-tier-2.json', () => {
  const raw = JSON.parse(readFileSync(join(root, 'content/scenarios/central-tendency-tier-2.json'), 'utf-8'));
  const result = ScenarioSchema.safeParse(raw);
  if (!result.success) console.error(result.error.issues);
  expect(result.success).toBe(true);
});

test('SyntheticDatasetSchema parses hgse_cohort_salaries.json', () => {
  const raw = JSON.parse(readFileSync(join(root, 'content/datasets/hgse_cohort_salaries.json'), 'utf-8'));
  const result = SyntheticDatasetSchema.safeParse(raw);
  if (!result.success) console.error(result.error.issues);
  expect(result.success).toBe(true);
});
