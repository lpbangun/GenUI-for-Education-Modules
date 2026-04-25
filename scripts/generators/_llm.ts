// Shared LLM helpers for content generators.
// - Loads .env so scripts can be run as `bun run scripts/generators/<name>.ts`
// - Disk cache keyed by prompt hash (recall: re-runs cost zero)
// - Single provider configured per CLAUDE.md

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, generateObject } from 'ai';
import type { z } from 'zod';

// Load .env from repo root if not already present (scripts run via bun run)
function loadEnv() {
  if (process.env.GEMINI_API_KEY) return;
  const envPath = join(import.meta.dir, '..', '..', '.env');
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, 'utf-8');
  for (const line of text.split('\n')) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !line.trim().startsWith('#')) process.env[m[1]] = m[2];
  }
}
loadEnv();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('GEMINI_API_KEY not set in env or .env');
  process.exit(1);
}

const provider = createGoogleGenerativeAI({ apiKey });
export const model = provider('gemini-3.1-flash-lite-preview');

const cacheDir = join(import.meta.dir, '..', '..', 'content', '_cache');
if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });

function cacheKey(label: string, payload: unknown): string {
  const hash = createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 16);
  return join(cacheDir, `${label}__${hash}.json`);
}

export async function cachedText(opts: {
  label: string;
  system: string;
  prompt: string;
  maxOutputTokens?: number;
}): Promise<string> {
  const path = cacheKey(opts.label, { s: opts.system, p: opts.prompt, m: opts.maxOutputTokens ?? 2000 });
  if (existsSync(path)) {
    return JSON.parse(readFileSync(path, 'utf-8')).text;
  }
  const result = await generateText({
    model,
    system: opts.system,
    prompt: opts.prompt,
    maxOutputTokens: opts.maxOutputTokens ?? 2000,
  });
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify({ text: result.text, usage: result.usage }, null, 2));
  return result.text;
}

export async function cachedObject<T>(opts: {
  label: string;
  schema: z.ZodType<T>;
  system: string;
  prompt: string;
  maxOutputTokens?: number;
}): Promise<T> {
  const path = cacheKey(opts.label, { s: opts.system, p: opts.prompt, m: opts.maxOutputTokens ?? 1500 });
  if (existsSync(path)) {
    return JSON.parse(readFileSync(path, 'utf-8')).object as T;
  }
  const result = await generateObject({
    model,
    schema: opts.schema,
    system: opts.system,
    prompt: opts.prompt,
    maxOutputTokens: opts.maxOutputTokens ?? 1500,
  });
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify({ object: result.object, usage: result.usage }, null, 2));
  return result.object;
}
