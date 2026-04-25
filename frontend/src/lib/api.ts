// Streaming client for /_/backend/api/chat. Parses the AI SDK UIMessage stream
// and surfaces the tool call (scaffold name + input) as it arrives.

const BACKEND_BASE = import.meta.env.VITE_BACKEND_BASE
  ?? (window.location.hostname === 'localhost' ? 'http://localhost:3001' : '/_/backend');

export interface ScaffoldCall {
  scaffold: 'WorkedExample' | 'ScaffoldedMCQ' | 'GuidedShortAnswer' | 'BareLongAnswer' | 'WikiDraft';
  input: any;
}

export async function streamScaffold(opts: {
  conceptId: string;
  mastery: number;
  signal?: AbortSignal;
}): Promise<ScaffoldCall> {
  const tier = pickTier(opts.mastery);
  const userMessage = `The learner has mastery=${opts.mastery.toFixed(2)} on the "${opts.conceptId}" concept, so the Scaffold Selector chose tier ${tier.num} (${tier.name}). Generate the next scaffold for this learner. Make the setup_prose a concrete Harvard-staff scenario. You MUST call exactly the ${tier.name} tool — do not respond with prose alone, do not pick a different tier.`;

  const res = await fetch(`${BACKEND_BASE}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: userMessage }],
    }),
    signal: opts.signal,
  });
  if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  let toolName = '';
  let toolInputJson = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.trim()) continue;
      let part: any;
      try { part = JSON.parse(line); } catch { continue; }
      if (part.type === 'tool-input-start') toolName = part.toolName;
      if (part.type === 'tool-input-delta') toolInputJson += part.inputTextDelta ?? '';
      if (part.type === 'tool-input-available') {
        toolName = part.toolName ?? toolName;
        if (part.input) toolInputJson = JSON.stringify(part.input);
      }
    }
  }

  if (!toolName) throw new Error('no tool call in stream');
  let input: any = {};
  try { input = JSON.parse(toolInputJson); } catch { /* partial */ }
  return { scaffold: toolName as ScaffoldCall['scaffold'], input };
}

export function pickTier(mastery: number): { num: number; name: ScaffoldCall['scaffold'] } {
  if (mastery >= 0.85) return { num: 5, name: 'WikiDraft' };
  if (mastery >= 0.65) return { num: 4, name: 'BareLongAnswer' };
  if (mastery >= 0.45) return { num: 3, name: 'GuidedShortAnswer' };
  if (mastery >= 0.20) return { num: 2, name: 'ScaffoldedMCQ' };
  return { num: 1, name: 'WorkedExample' };
}

export const TIER_COLORS: Record<ScaffoldCall['scaffold'], string> = {
  WorkedExample: 'bg-tier-1',
  ScaffoldedMCQ: 'bg-tier-2',
  GuidedShortAnswer: 'bg-tier-3',
  BareLongAnswer: 'bg-tier-4',
  WikiDraft: 'bg-tier-5',
};
