// F010 live verification — runs ONE real Gemini call, asserts the response
// invokes one of our 7 named tools. Skipped if GEMINI_API_KEY is unset.
// Cost: <$0.001 per run.

import { test, expect } from 'bun:test';
import { generateText } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { allTools, TOOL_NAMES } from '../tools';

const apiKey = process.env.GEMINI_API_KEY;

test.skipIf(!apiKey)('Gemini call invokes a known tool name', async () => {
  const provider = createGoogleGenerativeAI({ apiKey: apiKey! });
  const result = await generateText({
    model: provider('gemini-3.1-flash-lite-preview'),
    system: 'You are a Content Generator for a data fluency module. The learner has mastery=0.30, so pick the ScaffoldedMCQ scaffold tool. Make a brief example for central-tendency. You MUST call exactly one scaffold tool — do not respond with prose alone.',
    prompt: 'Build the next scaffold for this learner.',
    tools: allTools,
    toolChoice: 'required',
    maxOutputTokens: 800,
  });

  const calls = result.toolCalls ?? [];
  console.log(`Tool calls: ${calls.length}; names: ${calls.map(c => c.toolName).join(', ')}`);
  expect(calls.length).toBeGreaterThan(0);
  for (const c of calls) {
    expect(TOOL_NAMES).toContain(c.toolName as any);
  }
}, 30_000);
