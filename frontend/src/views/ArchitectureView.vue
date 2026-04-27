<script setup lang="ts"></script>

<template>
  <div class="bg-paper min-h-full">
    <div class="max-w-[820px] mx-auto px-12 py-16">
      <div class="text-micro text-ink-subtle uppercase">Architecture</div>
      <h1 class="text-h1 text-ink mt-4">How the app works</h1>

      <p class="text-body text-ink mt-12">
        This page is a single-pass walkthrough of what happens between a learner clicking a button and a scaffold appearing on screen.
        It maps the load-bearing decisions: the rule-based selector, the four LLM agent roles, the content-as-files substrate,
        and the request flow that ties them together.
      </p>

      <h2 class="text-h2 text-ink mt-12">1 · The high-level shape</h2>
      <p class="text-body text-ink mt-6">
        The app is three layers: a <strong>Vue 3 frontend</strong> (the iframe that lives inside Harvard's LMS),
        a <strong>Hono backend</strong> (the only place that holds API keys and talks to the model),
        and a <strong>file-based content library</strong> (Markdown + JSON loaded into memory at startup, no vector DB).
      </p>
      <pre class="font-mono text-small text-ink mt-6 bg-paper-2 border-0.5 border-ink-subtle p-4 overflow-x-auto leading-relaxed">
┌─────────────────────────┐         ┌─────────────────────────┐         ┌──────────────────────┐
│  Vue 3 frontend         │  HTTPS  │  Hono backend           │  HTTPS  │  Gemini 3.1 Flash    │
│  - Scaffold Selector    │ ──────▶ │  - 4 agent roles        │ ──────▶ │  Lite (Google AI     │
│  - 5 scaffold components│         │  - content loader       │         │  Studio)             │
│  - viz renderers        │ ◀────── │  - Zod validation       │ ◀────── │                      │
└─────────────────────────┘         └─────────────────────────┘         └──────────────────────┘
                                              │
                                              ▼
                                    ┌─────────────────────────┐
                                    │  /content (files)       │
                                    │  - 25 concept primers   │
                                    │  - 51 dictionary entries│
                                    │  - 40 scenarios         │
                                    │  - 5 dataset generators │
                                    └─────────────────────────┘
      </pre>

      <h2 class="text-h2 text-ink mt-12">2 · The Scaffold Selector (the load-bearing rule)</h2>
      <p class="text-body text-ink mt-6">
        This is the single most defensible piece of pedagogy in the project, and it is deliberately <em>not</em> an LLM call.
        It is a pure function in <code class="font-mono text-small">lib/scaffold-selector.ts</code> that reads
        <code class="font-mono text-small">(mastery: number, history: Interaction[])</code> and returns one of five component names.
        A committee member can read it in under a minute:
      </p>
      <pre class="font-mono text-small text-ink mt-6 bg-paper-2 border-0.5 border-ink-subtle p-4 overflow-x-auto leading-relaxed">
mastery &lt; 0.20             →  Tier 1 · WorkedExample        (ICAP: Passive)
0.20 ≤ mastery &lt; 0.45      →  Tier 2 · ScaffoldedMCQ        (ICAP: Active)
0.45 ≤ mastery &lt; 0.65      →  Tier 3 · GuidedShortAnswer    (ICAP: Active)
0.65 ≤ mastery &lt; 0.85      →  Tier 4 · BareLongAnswer       (ICAP: Constructive)
mastery ≥ 0.85             →  Tier 5 · WikiDraft            (ICAP: Interactive)
      </pre>
      <p class="text-body text-ink mt-6">
        The tiers are anchored in Chi &amp; Wylie's ICAP framework (2014). The mapping is fixed; only the <em>content</em> rendered into each
        tier is generative. Scaffolding fades as mastery rises — the learner never gets less help than they need, and never more.
      </p>

      <h2 class="text-h2 text-ink mt-12">3 · The four LLM agent roles</h2>
      <p class="text-body text-ink mt-6">
        All four roles run on the same model — <strong>Gemini 3.1 Flash Lite</strong> — differentiated only by system prompt and
        <code class="font-mono text-small">thinkingLevel</code> config. One model, four jobs.
      </p>
      <div class="mt-6 space-y-6">
        <div>
          <div class="text-micro text-ink-subtle uppercase">Content Generator</div>
          <p class="text-body text-ink mt-2">
            Produces the prose, scenarios, and visualizations the learner sees. <code class="font-mono text-small">thinkingLevel: 'medium'</code>,
            <code class="font-mono text-small">maxOutputTokens: 2000</code>. May call <code class="font-mono text-small">render_chart</code> or
            <code class="font-mono text-small">render_flowchart</code> as tools when a visualization helps interpretation.
          </p>
        </div>
        <div>
          <div class="text-micro text-ink-subtle uppercase">State Inferrer</div>
          <p class="text-body text-ink mt-2">
            Reads a learner response and updates the mastery estimate. <code class="font-mono text-small">thinkingLevel: 'low'</code>,
            <code class="font-mono text-small">responseFormat: json_object</code>. Pure structured output — fast, cheap, deterministic.
          </p>
        </div>
        <div>
          <div class="text-micro text-ink-subtle uppercase">Quality Evaluator</div>
          <p class="text-body text-ink mt-2">
            Scores long-answer reasoning against rubric anchors. <code class="font-mono text-small">thinkingLevel: 'medium'</code>.
            Critically: it scores <em>reasoning quality</em>, not answer correctness. A wrong conclusion with strong reasoning beats a right one with none.
          </p>
        </div>
        <div>
          <div class="text-micro text-ink-subtle uppercase">Template Filler</div>
          <p class="text-body text-ink mt-2">
            Slots dataset values and dictionary terms into pre-validated scenario templates. <code class="font-mono text-small">thinkingLevel: 'low'</code>,
            JSON output. The cheapest role; runs whenever shape is fixed and only values vary.
          </p>
        </div>
      </div>

      <h2 class="text-h2 text-ink mt-12">4 · Content is files, not vectors</h2>
      <p class="text-body text-ink mt-6">
        The entire content library — every concept primer, dictionary entry, scenario, and dataset — lives as Markdown or JSON files
        under <code class="font-mono text-small">/content</code>. Backend loads them into memory at startup and retrieves by ID.
        No embeddings, no vector DB, no semantic search. The dictionary's fuzzy search runs client-side via Fuse.js.
      </p>
      <p class="text-body text-ink mt-6">
        Why: Gemini's 1M-token context window means the full library can be passed inline when needed. RAG complexity buys nothing here,
        and the file substrate makes content human-auditable, version-controlled, and validator-friendly.
        Every content type has a Zod schema in <code class="font-mono text-small">lib/schemas/content-schemas.ts</code>;
        every file is checked at build time.
      </p>

      <h2 class="text-h2 text-ink mt-12">5 · A single request, end to end</h2>
      <p class="text-body text-ink mt-6">
        Concrete example: the learner is on the central-tendency module page and clicks "generate scaffold."
      </p>
      <pre class="font-mono text-small text-ink mt-6 bg-paper-2 border-0.5 border-ink-subtle p-4 overflow-x-auto leading-relaxed">
1.  Frontend reads current mastery (e.g. 0.35) and history.
2.  scaffoldSelector(0.35, history)  →  "ScaffoldedMCQ"  (Tier 2)
3.  POST /api/generate-scaffold  { concept: "central-tendency", tier: 2 }
4.  Backend loads concept primer + scenario template + dataset from /content.
5.  Backend invokes Content Generator with the system prompt + content as inline context.
6.  Gemini may call render_chart tool → returns chart spec.
7.  Backend validates response against Zod schema → returns to frontend.
8.  Frontend mounts ScaffoldedMCQ.vue with the payload, renders the chart inline.
9.  Learner answers. POST /api/submit-response.
10. State Inferrer updates mastery; Quality Evaluator scores reasoning if tier ≥ 3.
11. Loop.
      </pre>

      <h2 class="text-h2 text-ink mt-12">6 · Cost discipline (autoplay)</h2>
      <p class="text-body text-ink mt-6">
        The Autoplay demo is <strong>pre-generated</strong>. Every scaffold the committee sees during the 90-second walkthrough was
        produced once, validated, and cached as JSON in <code class="font-mono text-small">frontend/src/data/autoplay-bundle.json</code>.
        Per-play LLM cost is zero. The Module page is the only surface that hits the live model interactively, and only when the
        learner clicks "generate."
      </p>

      <h2 class="text-h2 text-ink mt-12">7 · What the visible-thinking and constructivism rules buy us</h2>
      <p class="text-body text-ink mt-6">
        Every Content Generator system prompt embeds two non-negotiables: <em>observation precedes inference</em> (tier 2+) and
        <em>claim + support + question</em> (tier 3+). Validators reject scenarios that skip the structural routine. The result is
        not a chatbot tutor narrating concepts — it is a UI that asks the learner to notice things before it asks them to conclude things.
        The pedagogy is in the shape of the prompt, not in the model's politeness.
      </p>

      <h2 class="text-h2 text-ink mt-12">8 · The hard rules the system enforces</h2>
      <ul class="text-body text-ink mt-6 space-y-3 list-disc pl-6">
        <li>No calculation requirement above mean / median / proportion. Data fluency, not analytics.</li>
        <li>No real Harvard people, salaries, or student records. All data synthetic; every dataset declares its plausibility boundary.</li>
        <li>No scaffold above tier 1 without a visible-thinking routine.</li>
        <li>Scenarios may never reference data their dataset does not contain — the validator checks within $100.</li>
        <li>Wiki drafts never auto-publish. Quality Evaluator scores them; humans review.</li>
        <li>API keys exist only on the backend. The frontend never sees a key.</li>
      </ul>

      <h2 class="text-h2 text-ink mt-12">9 · The provider-swap escape hatch</h2>
      <p class="text-body text-ink mt-6">
        v1 hits Google AI Studio directly via <code class="font-mono text-small">@ai-sdk/google</code> + <code class="font-mono text-small">GEMINI_API_KEY</code>.
        v1.5's pilot path moves traffic through Harvard's API Portal — a one-line <code class="font-mono text-small">baseURL</code> swap, same model ID.
        Claude Haiku 4.5 stays wired as an emergency fallback in env config; if Google deprecates the preview before demo day, two lines change.
      </p>

      <h2 class="text-h2 text-ink mt-12">Where to look in the repo</h2>
      <ul class="text-body text-ink mt-6 space-y-2">
        <li><code class="font-mono text-small">lib/scaffold-selector.ts</code> — the rule-based selector.</li>
        <li><code class="font-mono text-small">lib/schemas/content-schemas.ts</code> — Zod schemas for every content type.</li>
        <li><code class="font-mono text-small">backend/</code> — Hono API, agent system prompts, LLM call config.</li>
        <li><code class="font-mono text-small">frontend/src/components/Scaffolds.vue</code> — the five scaffold components.</li>
        <li><code class="font-mono text-small">content/</code> — primers, dictionary, scenarios, datasets.</li>
        <li><code class="font-mono text-small">scripts/validate_*.ts</code> — the validators that gate every content commit.</li>
      </ul>

      <p class="text-small text-ink-subtle mt-16">
        For the project mission and the full set of architectural invariants, see <code class="font-mono text-small">CLAUDE.md</code>.
      </p>
    </div>
  </div>
</template>

<style scoped>
.text-link { text-decoration: none; }
.text-link:hover { text-decoration: underline; }
</style>
