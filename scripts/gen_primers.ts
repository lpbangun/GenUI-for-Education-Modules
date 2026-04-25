#!/usr/bin/env bun
// F003 — generate the 24 remaining concept primers using Gemini.
// Cost-discipline: disk caching (re-runs cost zero), structured output via
// generateObject so we get parseable JSON not free-form prose, deterministic
// frontmatter constructed locally from taxonomy.json.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { cachedObject } from './generators/_llm';

const root = join(import.meta.dir, '..');
const taxonomy = JSON.parse(readFileSync(join(root, 'taxonomy.json'), 'utf-8'));
const exemplar = readFileSync(join(root, 'content', 'concepts', 'central-tendency.md'), 'utf-8');

const ROUTINE_BY_CATEGORY: Record<string, string> = {
  foundational: 'see-think-wonder',
  interpretive: 'claim-support-question',
  communication: 'connect-extend-challenge',
};

const PrimerOutput = z.object({
  visible_thinking_routine: z.enum(['see-think-wonder', 'claim-support-question', 'connect-extend-challenge', 'what-makes-you-say-that']),
  core_misconceptions: z.array(z.string()).min(2).max(6),
  body_markdown: z.string().min(400),
});

const SYSTEM = `You are a Content Generator for a Harvard staff data fluency module. You write concise, voice-controlled concept primers that match a calibration exemplar exactly in shape, voice, and depth.

INVIOLABLE RULES (failure = rejected):
- Data fluency, not analytics. NEVER ask the reader to calculate anything beyond mean, median, or proportion.
- NEVER use formulas (no = signs in math contexts, no sum(), no avg()).
- NEVER use real Harvard people, real salary data, or real student records. Synthetic only.
- Reading example must be a plausible Harvard-staff communication snippet (admissions, advising, giving, course evaluation, IR).
- Word count between 400 and 700. Five sections in this exact order: brief opening, three-part breakdown ("The X" or similar), "Why this matters for Harvard staff", "A reading example", "What to practice".
- Embed the visible_thinking_routine structurally in the closing section, not decoratively.

You output structured JSON only. The body_markdown field is the prose under the YAML frontmatter — do NOT include the frontmatter dashes yourself.

Reference the calibration exemplar (central-tendency primer) for voice, sentence length, paragraph rhythm.`;

const exemplarBody = exemplar.split(/^---\s*$/m).slice(2).join('---').trim();

async function generatePrimer(concept: any) {
  const routine = ROUTINE_BY_CATEGORY[concept.category];
  const prereqs = concept.prerequisites.length > 0 ? concept.prerequisites.join(', ') : 'none — this is a starting concept';
  const prompt = `CALIBRATION EXEMPLAR (central-tendency primer body, for voice anchor):

${exemplarBody}

---

NOW GENERATE A NEW PRIMER FOR:
- id: ${concept.id}
- title: ${concept.title}
- category: ${concept.category}
- prerequisites: ${prereqs}
- learning outcome: ${concept.outcome}
- visible_thinking_routine to embed: ${routine}

Match the exemplar's structure (brief opening → three-part breakdown → "Why this matters for Harvard staff" → "A reading example" → "What to practice" with the routine's three prompts).
Choose 2–4 core_misconceptions that match the actual confusions readers have about this concept.`;

  return cachedObject({
    label: `primer__${concept.id}`,
    schema: PrimerOutput,
    system: SYSTEM,
    prompt,
    maxOutputTokens: 2200,
  });
}

function writePrimer(concept: any, output: z.infer<typeof PrimerOutput>) {
  const front = [
    '---',
    `id: ${concept.id}`,
    `title: ${JSON.stringify(concept.title)}`,
    `level: ${concept.category}`,
    `prerequisites: [${concept.prerequisites.join(', ')}]`,
    `icap_alignment: [passive, active]`,
    `visible_thinking_routine: ${output.visible_thinking_routine}`,
    `connected_concepts: [${concept.prerequisites.join(', ')}]`,
    'core_misconceptions:',
    ...output.core_misconceptions.map(m => `  - ${m.replace(/"/g, '\\"')}`),
    'version: 1',
    '---',
    '',
    output.body_markdown.trim(),
    '',
  ].join('\n');
  writeFileSync(join(root, 'content', 'concepts', `${concept.id}.md`), front);
}

async function main() {
  const targets = taxonomy.concepts.filter((c: any) => c.id !== 'central-tendency');
  console.log(`Generating ${targets.length} primers (cached calls cost $0; new calls ~$0.005 each)...`);
  let cached = 0, fresh = 0, failed: string[] = [];

  for (const concept of targets) {
    const cachePath = join(root, 'content', '_cache');
    const wasCached = existsSync(cachePath) && require('node:fs').readdirSync(cachePath).some((f: string) => f.startsWith(`primer__${concept.id}__`));
    try {
      const out = await generatePrimer(concept);
      writePrimer(concept, out);
      if (wasCached) cached++; else fresh++;
      console.log(`  ${wasCached ? '[cache]' : '[fresh]'} ${concept.id} (${out.body_markdown.split(/\s+/).length} words)`);
    } catch (e) {
      console.error(`  [FAIL] ${concept.id}: ${(e as Error).message}`);
      failed.push(concept.id);
    }
  }

  console.log(`\n${cached + fresh}/${targets.length} primers written (${cached} cached, ${fresh} fresh, ${failed.length} failed)`);
  if (failed.length > 0) process.exit(1);
}

main();
