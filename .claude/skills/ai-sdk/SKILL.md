# AI SDK v6 — Claude Code Skill

This is a **fallback skill file**. Vercel ships an official Claude Code skill for the AI SDK that is more comprehensive than this. Before relying on this fallback, attempt to fetch the current official version:

## Fetch the official skill (recommended first)

```bash
# Search for the current location — Vercel restructures periodically.
# As of April 2026 the skill is typically at one of these locations:
curl -L https://raw.githubusercontent.com/vercel/ai/main/.claude/skills/ai-sdk/SKILL.md -o .claude/skills/ai-sdk/SKILL.md

# If that 404s, search vercel/ai GitHub repo for "claude" and pull from current path.

# Also fetch the LLM-readable docs dump:
curl https://ai-sdk.dev/llms.txt -o docs/references/ai-sdk-llms.txt
```

If both fetches succeed, replace this file's contents with what you fetched and continue.

If both fail, this fallback covers the v6 patterns Claude Code most often gets wrong. Use this until the official skill is accessible.

---

## Project context

This project uses **AI SDK v6** with the **Vue** binding (`@ai-sdk/vue` v2) and the **Google** provider (`@ai-sdk/google` v2) targeting Gemini 3.1 Flash Lite. See `CLAUDE.md` § Stack for full version pins.

## Critical idioms (v6)

### Use streamText, NOT streamUI

`streamUI` is part of AI SDK RSC, which is **experimental** as of v6. Do not use it. Use `streamText` and render React/Vue components based on `tool-${toolName}` message parts on the client.

```typescript
// ✓ CORRECT
import { streamText } from 'ai';
const result = await streamText({ model, messages, tools });

// ✗ WRONG — RSC is experimental
import { streamUI } from 'ai/rsc';
```

### Tool definitions

Tools use `inputSchema` (not `parameters`) in v6:

```typescript
import { tool } from 'ai';
import { z } from 'zod';

const myTool = tool({
  description: 'Render a worked example for a concept',
  inputSchema: z.object({
    conceptId: z.string(),
    exampleType: z.enum(['numeric', 'narrative'])
  }),
  execute: async ({ conceptId, exampleType }) => {
    // returns the data to render
    return { /* ... */ };
  }
});
```

### Multi-step tool calls

In v6, multi-step orchestration uses `stopWhen`:

```typescript
import { streamText, stepCountIs } from 'ai';

const result = await streamText({
  model,
  messages,
  tools: { myTool },
  stopWhen: stepCountIs(5)  // stop after 5 tool-calling rounds
});
```

### Vue useChat (binding pattern)

```vue
<script setup lang="ts">
import { useChat } from '@ai-sdk/vue';

const { messages, input, handleSubmit, status } = useChat({
  api: '/api/chat',
  // optional: streaming protocol options
});
</script>

<template>
  <div v-for="msg in messages" :key="msg.id">
    <template v-for="(part, i) in msg.parts" :key="i">
      <!-- text -->
      <p v-if="part.type === 'text'">{{ part.text }}</p>

      <!-- tool calls render via tool-<toolName> part type -->
      <WorkedExample
        v-else-if="part.type === 'tool-WorkedExample'"
        :data="part.output"
      />
      <ScaffoldedMCQ
        v-else-if="part.type === 'tool-ScaffoldedMCQ'"
        :data="part.output"
      />
      <!-- ... -->
    </template>
  </div>
</template>
```

### Google provider (Gemini 3.1 Flash Lite)

```typescript
import { createGoogleGenerativeAI } from '@ai-sdk/google';

// Direct Google API (demo path)
const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY!
});

// Harvard API Portal (production path)
const harvard = createGoogleGenerativeAI({
  apiKey: process.env.HARVARD_PORTAL_GEMINI_API_KEY!,
  baseURL: process.env.HARVARD_PORTAL_GEMINI_BASE_URL!
});

const model = google('gemini-3.1-flash-lite-preview');
```

### Thinking level configuration

Gemini 3.1 supports per-call thinking levels:

```typescript
const result = await streamText({
  model: google('gemini-3.1-flash-lite-preview'),
  messages,
  providerOptions: {
    google: {
      thinkingConfig: {
        thinkingBudget: 'medium'  // minimal | low | medium | high
      }
    }
  }
});
```

### Structured output (JSON mode)

```typescript
import { generateObject } from 'ai';
import { z } from 'zod';

const { object } = await generateObject({
  model: google('gemini-3.1-flash-lite-preview'),
  schema: z.object({
    mastery: z.number().min(0).max(1),
    confidence: z.number().min(0).max(1),
    reasoning: z.string()
  }),
  prompt: 'Infer learner mastery from this interaction history: ...'
});

// object is fully typed, validated against schema
```

## Common mistakes Claude Code makes

1. **Mixing v4/v5 patterns into v6 code.** If you see `parameters:` in a tool definition, that's v4. v6 uses `inputSchema:`.

2. **Reading `message.content` directly.** v6 messages have `message.parts[]`. Iterate parts.

3. **Importing from `'ai/rsc'`.** Don't. Use `'ai'` and `'@ai-sdk/vue'` only.

4. **Hardcoding model IDs.** Read from env (`process.env.DEFAULT_MODEL_ID`). The model ID may swap between Gemini snapshot and fallback model.

5. **Forgetting CORS in Hono backend.** When the frontend lives in an iframe, configure CORS to allow the LMS origin. Use `hono/cors` middleware.

## Reference

- AI SDK docs: https://ai-sdk.dev
- LLM-readable reference: https://ai-sdk.dev/llms.txt (place at `docs/references/ai-sdk-llms.txt`)
- Vue-specific docs: https://ai-sdk.dev/docs/getting-started/vue
- Google provider docs: https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai
