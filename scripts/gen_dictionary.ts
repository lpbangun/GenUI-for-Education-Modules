#!/usr/bin/env bun
// F004 — generate 50 dictionary entries (25 concepts + 25 adjacent terms).
// Cost-discipline: cached, deterministic frontmatter built locally; LLM fills only the prose.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { cachedObject } from './generators/_llm';

const root = join(import.meta.dir, '..');
const taxonomy = JSON.parse(readFileSync(join(root, 'taxonomy.json'), 'utf-8'));
const exemplar = readFileSync(join(root, 'content', 'dictionary', 'median.md'), 'utf-8');

// 25 concept terms (one per taxonomy concept) + 25 adjacent terms encountered in scenarios.
const ADJACENT_TERMS = [
  'mean', 'mode', 'percentile', 'quartile', 'standard deviation', 'range',
  'normal distribution', 'binomial', 'survey weight', 'response rate',
  'denominator', 'numerator', 'rate', 'ratio', 'proportion',
  'cohort', 'cross-section', 'panel', 'longitudinal', 'baseline',
  'control group', 'treatment group', 'effect size', 'p-value', 'sample size',
];

const conceptTerms = taxonomy.concepts.map((c: any) => ({
  term: c.id.replace(/-/g, ' '),
  category_id: c.id,
  category: c.category,
  related_to_concept: c.id,
}));

const adjacentTerms = ADJACENT_TERMS.map(t => ({
  term: t,
  category_id: null,
  category: 'adjacent',
  related_to_concept: null,
}));

const allTerms = [...conceptTerms, ...adjacentTerms];

const SCHOOLS = ['HGSE', 'HBS', 'FAS', 'HMS', 'SEAS'] as const;

const DictionaryOutput = z.object({
  plain_definition: z.string().min(10).max(200),
  technical_definition: z.string().optional(),
  related_terms: z.array(z.string()).min(1).max(8),
  common_confusion_with: z.array(z.string()).max(5),
  school_usage: z.object({
    HGSE: z.string().min(15),
    HBS: z.string().min(15),
    FAS: z.string().min(15),
    HMS: z.string().min(15),
    SEAS: z.string().min(15),
  }),
  body_markdown: z.string().min(300),
});

const SYSTEM = `You are a Content Generator for a Harvard staff data fluency dictionary. You write a single dictionary entry per call, matching the calibration exemplar (median.md) in voice, depth, and structure.

INVIOLABLE RULES (failure = rejected):
- plain_definition: under 25 words. One sentence.
- school_usage: each school's note must be 1-2 sentences describing how that school *typically uses* the term, framed as inference ("common in...", "typically used for...") not assertion. Cover all 5 schools.
- NEVER name real Harvard people, real salary data, or real student records.
- body_markdown structure: ## Plain-language definition → ## What it tells you → ## When it matters → ## Common confusion → ## Example in context → ## Usage across Harvard → ## Related terms.
- Examples must be plausibly Harvard-staff-relevant.
- No formulas; no equation signs.

Output structured JSON only. Frontmatter is constructed by the caller — body_markdown is the prose under the YAML frontmatter dashes.`;

const exemplarBody = exemplar.split(/^---\s*$/m).slice(2).join('---').trim();

async function generateEntry(t: typeof allTerms[number]) {
  const prompt = `CALIBRATION EXEMPLAR (median dictionary entry, voice anchor):

${exemplarBody}

---

NOW GENERATE THE DICTIONARY ENTRY FOR: "${t.term}"

Choose related_terms and common_confusion_with from terms a Harvard staff reader is likely to encounter in data work. Make school_usage notes specific to each school's likely use of this term, not generic.`;

  return cachedObject({
    label: `dict__${t.term.replace(/\s+/g, '_')}`,
    schema: DictionaryOutput,
    system: SYSTEM,
    prompt,
    maxOutputTokens: 1800,
  });
}

function writeEntry(t: typeof allTerms[number], output: z.infer<typeof DictionaryOutput>) {
  const filename = t.term.replace(/\s+/g, '-') + '.md';
  const front = [
    '---',
    `term: ${t.term}`,
    `plain_definition: ${output.plain_definition.replace(/"/g, '\\"')}`,
    ...(output.technical_definition ? [`technical_definition: ${JSON.stringify(output.technical_definition)}`] : []),
    `related_terms: [${output.related_terms.map(s => `"${s.replace(/"/g, '\\"')}"`).join(', ')}]`,
    `common_confusion_with: [${output.common_confusion_with.map(s => `"${s.replace(/"/g, '\\"')}"`).join(', ')}]`,
    'school_usage:',
    `  HGSE: ${JSON.stringify(output.school_usage.HGSE)}`,
    `  HBS: ${JSON.stringify(output.school_usage.HBS)}`,
    `  FAS: ${JSON.stringify(output.school_usage.FAS)}`,
    `  HMS: ${JSON.stringify(output.school_usage.HMS)}`,
    `  SEAS: ${JSON.stringify(output.school_usage.SEAS)}`,
    'version: 1',
    '---',
    '',
    output.body_markdown.trim(),
    '',
  ].join('\n');
  writeFileSync(join(root, 'content', 'dictionary', filename), front);
}

async function main() {
  // Skip 'median' — already calibrated.
  const targets = allTerms.filter(t => t.term !== 'median');
  console.log(`Generating ${targets.length} dictionary entries (cached calls cost $0)...`);
  let cached = 0, fresh = 0; const failed: string[] = [];
  const cacheDir = join(root, 'content', '_cache');

  for (const t of targets) {
    const wasCached = existsSync(cacheDir) && require('node:fs').readdirSync(cacheDir).some((f: string) => f.startsWith(`dict__${t.term.replace(/\s+/g, '_')}__`));
    try {
      const out = await generateEntry(t);
      writeEntry(t, out);
      if (wasCached) cached++; else fresh++;
      console.log(`  ${wasCached ? '[cache]' : '[fresh]'} ${t.term}`);
    } catch (e) {
      console.error(`  [FAIL] ${t.term}: ${(e as Error).message}`);
      failed.push(t.term);
    }
  }

  console.log(`\n${cached + fresh}/${targets.length} entries written (${cached} cached, ${fresh} fresh, ${failed.length} failed)`);
  if (failed.length > 0) process.exit(1);
}

main();
