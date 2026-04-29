<script setup lang="ts"></script>

<template>
  <div class="bg-paper min-h-full">
    <div class="max-w-[820px] mx-auto px-12 py-16">
      <div class="text-micro text-ink-subtle uppercase">About this prototype</div>
      <h1 class="text-h1 text-ink mt-4">What you are looking at</h1>

      <p class="text-body text-ink mt-12">
        This is a generative-UI proof-of-concept built for the T127 capstone. The thesis is simple but load-bearing:
        <strong>the user interface itself is the scaffold</strong>. Not a chatbot beside the content. Not a teacher narrating.
        The same data-fluency concept renders through five different Vue components depending on where the learner sits in their understanding.
      </p>

      <h2 class="text-h2 text-ink mt-12">Three things to look at</h2>

      <div class="mt-6 space-y-8">
        <div>
          <div class="text-micro text-ink-subtle uppercase">1 · The Scaffold Selector</div>
          <p class="text-body text-ink mt-3">
            Open the <router-link to="/module/central-tendency" class="text-link text-ink underline">Module</router-link> page and drag the mastery slider.
            The component you see is picked by a <em>rule-based pure function</em>, not an LLM.
            A committee member can read the rule:
            <code class="font-mono text-small">mastery &lt; 0.20 → WorkedExample</code>,
            <code class="font-mono text-small">0.20 ≤ mastery &lt; 0.45 → ScaffoldedMCQ</code>,
            and so on through five tiers anchored in Chi &amp; Wylie's ICAP framework (2014).
            See <code class="font-mono text-small">lib/scaffold-selector.ts</code>.
          </p>
        </div>

        <div>
          <div class="text-micro text-ink-subtle uppercase">2 · Generative UI artifacts</div>
          <p class="text-body text-ink mt-3">
            Each scaffold can include a <em>chart</em> or <em>flowchart</em> the LLM chose to generate alongside the prose.
            Gemini 3.1 Flash Lite calls one of two visualization tools (<code class="font-mono text-small">render_chart</code>, <code class="font-mono text-small">render_flowchart</code>) when a visualization helps interpretation.
            The Vue component renders the SVG; the model never writes pixels — only the chart type, axes, captions, and provenance.
          </p>
        </div>

        <div>
          <div class="text-micro text-ink-subtle uppercase">3 · Visible-thinking baked in</div>
          <p class="text-body text-ink mt-3">
            Tier 2 scenarios pose observation before inference. Tier 3+ prompts require <em>claim + support + question</em>,
            grounded in Ritchhart's <em>Making Thinking Visible</em>. Validators reject content that lacks the structural routine.
            Reasoning quality is scored, not answer correctness.
          </p>
        </div>
      </div>

      <h2 class="text-h2 text-ink mt-12">How to read this prototype</h2>

      <ul class="text-body text-ink mt-6 space-y-3 list-disc pl-6">
        <li><router-link to="/demo/autoplay" class="text-link text-ink underline">Autoplay</router-link> — 90 seconds, five checkpoints, central-tendency rendered through all five tiers. Pre-generated for cost discipline; what the committee sees.</li>
        <li><router-link to="/module/central-tendency" class="text-link text-ink underline">Module</router-link> — interactive: drag the mastery slider and click "generate scaffold" to fetch a fresh scaffold from the live LLM.</li>
        <li><router-link to="/dictionary" class="text-link text-ink underline">Dictionary</router-link> — 51 calibrated terms, searchable. Wiki drafts contributed at tier 5 will surface here under a "Contributed by staff" section.</li>
      </ul>

      <h2 class="text-h2 text-ink mt-12">What this is not</h2>
      <p class="text-body text-ink mt-6">
        Not a stats course. The hard rule is: <strong>data fluency, not analytics</strong>. The module never asks the learner to calculate anything beyond mean, median, or proportion. The goal is shared interpretive vocabulary across Harvard staff — the conversations they should be having when a number lands on their desk, not the math behind it.
      </p>

      <h2 class="text-h2 text-ink mt-12">Stack &amp; substrate</h2>
      <ul class="text-body text-ink mt-6 space-y-2">
        <li>Frontend: Vue 3 + TypeScript + Vite + Tailwind, deployed on Vercel.</li>
        <li>Backend: Hono + AI SDK v6 with the Google Gemini provider.</li>
        <li>Model: Gemini 3.1 Flash Lite preview, ~$0.10 to generate the entire content catalog.</li>
        <li>Content: 25 concept primers, 51 dictionary entries, 40 scenarios, 5 dataset generators — all schema-validated.</li>
      </ul>

      <h2 class="text-h2 text-ink mt-12">Source code</h2>
      <p class="text-body text-ink mt-6">
        Public repository:
        <a href="https://github.com/lpbangun/GenUI-for-Education-Modules"
           target="_blank" rel="noopener noreferrer"
           class="text-link text-ink underline">
          github.com/lpbangun/GenUI-for-Education-Modules ↗
        </a>
      </p>
      <p class="text-body text-ink mt-3">
        See <router-link to="/architecture" class="text-link text-ink underline">Architecture</router-link>
        and <router-link to="/design-decisions" class="text-link text-ink underline">Design decisions</router-link>
        for the full system spec and ADR log.
      </p>

      <p class="text-small text-ink-subtle mt-16">
        v1.2 · capstone POC · all data synthetic · no real Harvard student or staff records used.
      </p>
    </div>
  </div>
</template>

<style scoped>
.text-link { text-decoration: none; }
.text-link:hover { text-decoration: underline; }
</style>
