// Hono backend for the data fluency module.
// Three endpoints: /api/chat (streaming), /api/state/infer, /api/quality/eval.
// All LLM traffic via @ai-sdk/google directly (Harvard Portal is v1.5).

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { stream } from 'hono/streaming';
import { streamText, generateObject } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';
import { allTools, TOOL_NAMES } from './tools';

const MODEL_ID = 'gemini-3.1-flash-lite-preview';

const apiKey = process.env.GEMINI_API_KEY;
const baseURL = process.env.HARVARD_PORTAL_GEMINI_BASE_URL; // optional v1.5 swap

// Provider is created lazily so the server still boots without a key — the
// /api/health endpoint reports degraded; LLM endpoints respond with 503.
function getProvider() {
  if (!apiKey) return null;
  return createGoogleGenerativeAI({
    apiKey,
    ...(baseURL ? { baseURL } : {}),
  });
}

const app = new Hono();
const allowedOrigin = process.env.CORS_ORIGIN ?? '*';
app.use('/*', cors({ origin: allowedOrigin, credentials: true }));

app.get('/api/health', (c) => c.json({
  ok: true,
  model: MODEL_ID,
  provider: apiKey ? (baseURL ? 'harvard-portal' : 'google-direct') : 'NONE',
  tool_names: TOOL_NAMES,
  llm_available: Boolean(apiKey),
}));

// --- POST /api/chat — streaming with tool calls ---------------------------
app.post('/api/chat', async (c) => {
  const provider = getProvider();
  if (!provider) return c.json({ error: 'GEMINI_API_KEY not set; LLM unavailable' }, 503);

  const body = await c.req.json().catch(() => ({}));
  const messages = body.messages ?? [];
  const systemPrompt = body.system ?? 'You are a Content Generator for a data fluency module. Pick exactly one scaffold tool per turn matching the learner mastery. Use render_chart or render_flowchart inline only when a visualization helps interpretation.';

  const result = streamText({
    model: provider(MODEL_ID),
    system: systemPrompt,
    messages,
    tools: allTools,
    providerOptions: { google: { thinkingConfig: { thinkingBudget: 'medium' } } },
  });

  return stream(c, async (s) => {
    for await (const chunk of result.toUIMessageStream()) {
      await s.write(JSON.stringify(chunk) + '\n');
    }
  });
});

// --- POST /api/state/infer — structured JSON ---------------------------
const InferOutput = z.object({
  mastery: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  reasoning: z.string(),
});

app.post('/api/state/infer', async (c) => {
  const provider = getProvider();
  if (!provider) return c.json({ error: 'GEMINI_API_KEY not set; LLM unavailable' }, 503);

  const body = await c.req.json().catch(() => ({}));
  const { recent_interactions = [], concept_id = 'unknown' } = body;

  const result = await generateObject({
    model: provider(MODEL_ID),
    schema: InferOutput,
    prompt: `You are the State Inferrer. Concept: ${concept_id}. Recent interactions:\n${JSON.stringify(recent_interactions, null, 2)}\n\nInfer mastery (0-1), your confidence in that estimate (0-1), and one paragraph of reasoning.`,
    providerOptions: { google: { thinkingConfig: { thinkingBudget: 'low' } } },
  });
  return c.json(result.object);
});

// --- POST /api/quality/eval — rubric scoring ---------------------------
const QualityOutput = z.object({
  scores: z.object({
    claim_quality: z.number().min(0).max(5),
    support_quality: z.number().min(0).max(5),
    visible_thinking_present: z.number().min(0).max(5),
  }),
  overall: z.number().min(0).max(5),
  publishable: z.boolean(),
  notes: z.string(),
});

app.post('/api/quality/eval', async (c) => {
  const provider = getProvider();
  if (!provider) return c.json({ error: 'GEMINI_API_KEY not set; LLM unavailable' }, 503);

  const body = await c.req.json().catch(() => ({}));
  const { response_text = '', concept_id = 'unknown' } = body;

  const result = await generateObject({
    model: provider(MODEL_ID),
    schema: QualityOutput,
    prompt: `You are the Quality Evaluator. Score this learner response on the central-tendency.md rubric anchor: claim quality, support quality, visible thinking presence (0-5 each). Set publishable=true only if overall ≥ 3.5 and visible_thinking_present ≥ 3.\n\nConcept: ${concept_id}\nResponse:\n${response_text}`,
    providerOptions: { google: { thinkingConfig: { thinkingBudget: 'medium' } } },
  });
  return c.json(result.object);
});

// JSON 404 (never HTML — matches F010 acceptance "Errors return JSON with status codes")
app.notFound((c) => c.json({ error: 'not found', path: c.req.path }, 404));
app.onError((err, c) => c.json({ error: err.message }, 500));

const port = Number(process.env.PORT ?? 3000);
console.log(`backend listening on :${port}  (LLM ${apiKey ? 'live' : 'offline — set GEMINI_API_KEY'})`);

export default { port, fetch: app.fetch };
