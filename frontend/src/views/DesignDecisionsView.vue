<script setup lang="ts"></script>

<template>
  <div class="bg-paper min-h-full">
    <div class="max-w-[820px] mx-auto px-12 py-16">
      <div class="text-micro text-ink-subtle uppercase">Architecture</div>
      <h1 class="text-h1 text-ink mt-4">Design decisions</h1>

      <p class="text-body text-ink mt-12">
        ADR-style log of architectural decisions. Append-only — never edit historical entries; supersede instead.
        The canonical source of truth is <code class="font-mono text-small">docs/design-decisions.md</code> in the repo.
        This page is a quick-read summary; see the markdown file for full rationale.
      </p>
      <p class="text-body text-ink mt-4">
        When <code class="font-mono text-small">CLAUDE.md</code> "Architectural invariants" is modified, a new DD entry
        must land in the same PR. Enforced by <code class="font-mono text-small">.github/workflows/invariant-drift.yml</code>.
      </p>

      <!-- DD-001 -->
      <h2 class="text-h2 text-ink mt-12">DD-001 — Scaffold Selector is rule-based, not LLM-driven</h2>
      <div class="text-micro text-ink-subtle uppercase mt-2">2026-03-15</div>
      <p class="text-body text-ink mt-4">
        The Scaffold Selector is a pure function <code class="font-mono text-small">(mastery, history) → ScaffoldName</code> — not an LLM call.
        The single most defensible piece of pedagogy in the capstone is the rule the committee can read in source.
        ICAP-grounded mastery thresholds are deterministic and explicable; LLM-classification is neither.
        Lives in <code class="font-mono text-small">lib/scaffold-selector.ts</code>.
      </p>

      <!-- DD-002 -->
      <h2 class="text-h2 text-ink mt-12">DD-002 — Five ICAP-mapped tiers</h2>
      <div class="text-micro text-ink-subtle uppercase mt-2">2026-03-15</div>
      <p class="text-body text-ink mt-4">
        Five tiers mapped to Chi &amp; Wylie's ICAP framework: WorkedExample (Passive), ScaffoldedMCQ (Active),
        GuidedShortAnswer (Active), BareLongAnswer (Constructive), WikiDraft (Interactive).
        Mastery thresholds: 0.20 / 0.45 / 0.65 / 0.85.
        ICAP gives an explicit progression from passive consumption to interactive contribution — mirroring
        the module's core thesis of fading scaffolding as mastery grows.
      </p>

      <!-- DD-003 -->
      <h2 class="text-h2 text-ink mt-12">DD-003 — Single-model architecture (Gemini 3.1 Flash Lite)</h2>
      <div class="text-micro text-ink-subtle uppercase mt-2">2026-03-20</div>
      <p class="text-body text-ink mt-4">
        All four agent roles (Content Generator, State Inferrer, Quality Evaluator, Template Filler) run on Gemini 3.1 Flash Lite.
        Differentiation is by system prompt and <code class="font-mono text-small">thinkingLevel</code>, not by model.
        Single-model simplifies provider failover (one swap) and keeps cost predictable.
        Claude Haiku 4.5 stays wired as emergency fallback only.
      </p>

      <!-- DD-004 -->
      <h2 class="text-h2 text-ink mt-12">DD-004 — Content as files, not vectors</h2>
      <div class="text-micro text-ink-subtle uppercase mt-2">2026-03-20</div>
      <p class="text-body text-ink mt-4">
        Concepts and dictionary entries are markdown files with YAML frontmatter. Scenarios and datasets are JSON.
        Runtime loads everything into memory at startup. No embeddings, no vector DB, no semantic search.
        Gemini's 1M-token context window means the full library can be passed inline when needed;
        RAG complexity buys nothing at v1 scale. Vector retrieval is v2 if the dictionary grows beyond a few hundred entries.
      </p>

      <!-- DD-005 -->
      <h2 class="text-h2 text-ink mt-12">DD-005 — Visualization Selector as a pure function</h2>
      <div class="text-micro text-ink-subtle uppercase mt-2">2026-04-15</div>
      <p class="text-body text-ink mt-4">
        Visualization choice (chart / flowchart / none) is a rule-based pure function from
        <code class="font-mono text-small">(concept.viz_demand, mastery, history)</code>.
        The LLM never decides whether to visualize — only what to put in the chosen visualization.
        Same logic as DD-001: the rule is the defensible artifact. Lives in
        <code class="font-mono text-small">lib/viz-selector.ts</code>.
      </p>

      <!-- DD-006 -->
      <h2 class="text-h2 text-ink mt-12">DD-006 — Prompt-rewrite + soft validator + tail blocks</h2>
      <div class="text-micro text-ink-subtle uppercase mt-2">2026-04-29</div>
      <p class="text-body text-ink mt-4">
        Per-tier system prompts carry the full pedagogical contract (observation-before-inference, claim/support/question,
        distractor reasoning, dictionary handoff). A soft validator scans for compliance and warns — it never blocks
        turn generation. Chosen over schema-typed templates (Path B, deferred) because the pedagogy gap is the actual
        problem and per-tier prompts address it directly without the burden of authoring 25 ConceptAnchor files.
        Path B triggers if soft-validator failure rate exceeds 20% sustained on any check.
      </p>

      <!-- DD-007 -->
      <h2 class="text-h2 text-ink mt-12">DD-007 — <code class="font-mono">composeTurn</code> is the single composition path</h2>
      <div class="text-micro text-ink-subtle uppercase mt-2">2026-04-29</div>
      <p class="text-body text-ink mt-4">
        Both the live module's <code class="font-mono text-small">/api/chat</code> route and
        <code class="font-mono text-small">scripts/pregenerate_autoplay.ts</code> call
        <code class="font-mono text-small">composeTurn</code> from <code class="font-mono text-small">lib/turn-composer.ts</code>.
        There is no second path. Drift between the demo surface and what the live module produces would undermine
        the capstone demo; a single call site makes drift structurally impossible.
      </p>

      <!-- DD-008 -->
      <h2 class="text-h2 text-ink mt-12">DD-008 — Tier-graded dictionary handoff</h2>
      <div class="text-micro text-ink-subtle uppercase mt-2">2026-04-29</div>
      <p class="text-body text-ink mt-4">
        The dictionary handoff mirrors the ICAP scaffold-fade arc: T1–T2 passive highlights, T3–T4 active
        single-question responses persisted to <code class="font-mono text-small">dictionary_handoff_responses</code>,
        T5 structured wiki-draft form persisted to <code class="font-mono text-small">wiki_drafts</code> with
        <code class="font-mono text-small">status='pending_review'</code>.
        Constructive contributions are weighted toward learners who have demonstrated they understand the term.
        PII tripwire gates all free text at write time.
      </p>

      <!-- DD-009 -->
      <h2 class="text-h2 text-ink mt-12">DD-009 — Visual interactivity layer is part of the pedagogy</h2>
      <div class="text-micro text-ink-subtle uppercase mt-2">2026-04-29</div>
      <p class="text-body text-ink mt-4">
        The scaffold-fade arc is rendered as visible UI: tier-transition card on tier crossings, distractor-reasoning
        reveal at T2, inline handoff card at T3+, pulsing term-touched indicator in a session sidebar, structured form
        at T5. The arc is the module's core claim — making it legible to the learner is itself a pedagogical signal.
        Five new Vue components in <code class="font-mono text-small">frontend/src/components/scaffolds/</code>.
        No new framework; shadcn-vue + Tailwind only.
      </p>

      <!-- DD-010 -->
      <h2 class="text-h2 text-ink mt-12">DD-010 — Tail-block data travels in tool-call inputs, not trailing text</h2>
      <div class="text-micro text-ink-subtle uppercase mt-2">2026-04-29</div>
      <p class="text-body text-ink mt-4">
        <code class="font-mono text-small">terms_surfaced</code> and
        <code class="font-mono text-small">dictionary_handoff</code> are optional fields inside each scaffold tool's
        input schema. The composer reads them from <code class="font-mono text-small">scaffold.input</code> directly.
        Discovered while regenerating the autoplay bundle: under
        <code class="font-mono text-small">toolChoice: 'required'</code>, Gemini Flash Lite collapses all output
        into the forced tool call and emits empty <code class="font-mono text-small">result.text</code> — trailing
        text never arrives. Putting tail-block info inside the tool's input is a single-round-trip, cheapest fix that
        matches what Gemini actually does.
        <code class="font-mono text-small">lib/tail-blocks.ts</code> remains in the repo but is unused at runtime.
      </p>

      <p class="text-small text-ink-subtle mt-16">
        Full ADR log with verbatim alternatives and consequences: <code class="font-mono text-small">docs/design-decisions.md</code>.
      </p>
    </div>
  </div>
</template>

<style scoped>
.text-link { text-decoration: none; transition: color 150ms cubic-bezier(0.4, 0, 0.2, 1); }
.text-link:hover { text-decoration: underline; }
</style>
