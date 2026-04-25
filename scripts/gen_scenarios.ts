#!/usr/bin/env bun
// F006 — generate 40 scenarios (8 foundational concepts × 5 tiers).
// Cost-discipline: cached, deterministic shells (id/concept_id/tier/question_type)
// constructed locally; LLM fills only the prose+options+hint+rubric.

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { cachedObject } from './generators/_llm';

const root = join(import.meta.dir, '..');
const taxonomy = JSON.parse(readFileSync(join(root, 'taxonomy.json'), 'utf-8'));
const exemplar = JSON.parse(readFileSync(join(root, 'content', 'scenarios', 'central-tendency-tier-2.json'), 'utf-8'));

const FOUNDATIONAL = taxonomy.categories.foundational.concepts as string[];

const ROUTINE_BY_CATEGORY: Record<string, string> = {
  foundational: 'see-think-wonder',
  interpretive: 'claim-support-question',
  communication: 'connect-extend-challenge',
};

const TIER_TO_QUESTION_TYPE: Record<number, string> = {
  1: 'multiple_choice',
  2: 'multiple_choice_with_hint',
  3: 'short_answer',
  4: 'long_answer',
  5: 'wiki_draft',
};

const Option = z.object({
  id: z.enum(['A', 'B', 'C', 'D']),
  text: z.string(),
  correct: z.boolean(),
  feedback: z.string(),
});

const ScenarioOutput = z.object({
  setup_prose: z.string().min(20),
  artifact_type: z.enum(['summary_stats', 'data_table', 'chart_description', 'quote_excerpt', 'report_excerpt']).optional(),
  artifact_content: z.string().optional(),
  prompt: z.string().min(10),
  options: z.array(Option).length(4).optional(),
  hint_content: z.string().optional(),
  rubric_primary: z.string(),
  rubric_secondary: z.string().optional(),
  visible_thinking_prompts: z.object({
    notice: z.string().optional(),
    think: z.string().optional(),
    wonder: z.string().optional(),
    claim: z.string().optional(),
    support: z.string().optional(),
    question: z.string().optional(),
    connect: z.string().optional(),
    extend: z.string().optional(),
    challenge: z.string().optional(),
  }),
});

const SYSTEM = `You are a Content Generator for a Harvard staff data fluency module. You generate one scenario at a time.

INVIOLABLE RULES (failure = rejected):
- Data fluency, NOT analytics. NEVER ask the learner to calculate anything beyond mean, median, or proportion.
- NEVER use real Harvard people, real salary data, or real student records. Synthetic only.
- The setup_prose MUST start in a Harvard-staff context (admissions, advising, giving, course evaluation, IR).
- Tier 1: 4 options, simple comprehension check. Tier 2: 4 options + always_visible hint, distractors must each embody a real misconception. Tier 3-4: NO options; rubric required. Tier 5: NO options; framing as a contribution invitation.
- For tier 1 and 2: visible_thinking_prompts uses notice/think/wonder OR claim/support/question keys matching the concept primer's routine.
- For tier 3-5: rubric_primary scores reasoning quality, NOT answer correctness.

Output structured JSON only. The harness builds the scenario JSON file from your structured output and a deterministic shell.`;

const exemplarStr = JSON.stringify(exemplar, null, 2);

async function generateScenario(conceptId: string, tier: number) {
  const routine = ROUTINE_BY_CATEGORY['foundational'];
  const concept = taxonomy.concepts.find((c: any) => c.id === conceptId);

  const prompt = `CALIBRATION EXEMPLAR (central-tendency tier-2 scenario, voice anchor):

${exemplarStr}

---

NOW GENERATE A SCENARIO FOR:
- concept_id: ${conceptId}
- concept title: ${concept.title}
- tier: ${tier} (question_type: ${TIER_TO_QUESTION_TYPE[tier]})
- visible_thinking_routine: ${routine}
- learning outcome: ${concept.outcome}

Tier-specific shape requirements:
${tier === 1 ? '- 4 options, one correct, all distractors plausibly mistaken. No hint. visible_thinking_prompts: notice/think/wonder.' : ''}
${tier === 2 ? '- 4 options, hint required (always_visible), distractors each embody a different misconception. visible_thinking_prompts: notice/think/wonder.' : ''}
${tier === 3 ? '- NO options. prompt asks for a 2-3 sentence response. rubric_primary scores claim+support, not correctness. visible_thinking_prompts: notice/think/wonder.' : ''}
${tier === 4 ? '- NO options. prompt asks for a richer multi-part interpretation. rubric_primary scores reasoning depth. visible_thinking_prompts: notice/think/wonder.' : ''}
${tier === 5 ? '- NO options. prompt frames as "write the section of the staff handbook explaining this concept to a new colleague." rubric_primary scores contribution quality. visible_thinking_prompts: notice/think/wonder OR connect/extend/challenge.' : ''}`;

  return cachedObject({
    label: `scenario__${conceptId}__t${tier}`,
    schema: ScenarioOutput,
    system: SYSTEM,
    prompt,
    maxOutputTokens: 2400,
  });
}

function buildScenarioFile(conceptId: string, tier: number, seq: number, output: z.infer<typeof ScenarioOutput>) {
  const obj: any = {
    id: `${conceptId}-tier-${tier}-${seq.toString().padStart(3, '0')}`,
    concept_id: conceptId,
    tier,
    question_type: TIER_TO_QUESTION_TYPE[tier],
    visible_thinking_scaffold: ROUTINE_BY_CATEGORY['foundational'],
    setup_prose: output.setup_prose,
    prompt: output.prompt,
    rubric: {
      primary_criterion: output.rubric_primary,
      ...(output.rubric_secondary ? { secondary_criterion: output.rubric_secondary } : {}),
    },
    visible_thinking_prompts: output.visible_thinking_prompts,
  };
  if (output.artifact_type && output.artifact_content) {
    obj.artifact = { type: output.artifact_type, content: output.artifact_content };
  }
  if (tier <= 2 && output.options) {
    obj.options = output.options;
  }
  if (tier === 2 && output.hint_content) {
    obj.hint = { type: 'always_visible', content: output.hint_content };
  }
  return obj;
}

async function main() {
  console.log(`Generating ${FOUNDATIONAL.length * 5} scenarios (8 concepts × 5 tiers)...`);
  let cached = 0, fresh = 0; const failed: string[] = [];
  const cacheDir = join(root, 'content', '_cache');

  for (const conceptId of FOUNDATIONAL) {
    for (let tier = 1; tier <= 5; tier++) {
      // Skip the calibrated exemplar
      if (conceptId === 'central-tendency' && tier === 2) {
        console.log(`  [skip] ${conceptId} tier ${tier} (calibrated exemplar)`);
        continue;
      }
      const wasCached = existsSync(cacheDir) && require('node:fs').readdirSync(cacheDir).some((f: string) => f.startsWith(`scenario__${conceptId}__t${tier}__`));
      try {
        const out = await generateScenario(conceptId, tier);
        const obj = buildScenarioFile(conceptId, tier, 1, out);
        const filename = `${conceptId}-tier-${tier}-001.json`;
        writeFileSync(join(root, 'content', 'scenarios', filename), JSON.stringify(obj, null, 2));
        if (wasCached) cached++; else fresh++;
        console.log(`  ${wasCached ? '[cache]' : '[fresh]'} ${conceptId} tier ${tier}`);
      } catch (e) {
        console.error(`  [FAIL] ${conceptId} tier ${tier}: ${(e as Error).message}`);
        failed.push(`${conceptId}-t${tier}`);
      }
    }
  }

  console.log(`\n${cached + fresh}/${FOUNDATIONAL.length * 5 - 1} scenarios written (${cached} cached, ${fresh} fresh, ${failed.length} failed)`);
  if (failed.length > 0) process.exit(1);
}

main();
