<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import Scaffolds from '../components/Scaffolds.vue';
import { pickTier, type ScaffoldResult } from '../lib/api';
import bundle from '../data/autoplay-bundle.json';

// Pre-generated bundle — no LLM call at runtime. Re-run scripts/pregenerate_autoplay.ts to refresh.
const checkpoints = bundle as Array<{
  mastery: number;
  label: string;
  tier_name: string;
  scaffold: { name: string; input: any };
  chart: any | null;
  flowchart: any | null;
  viz_decision?: { kind: string; reason: string };
  terms_surfaced: string[];
  dictionary_handoff:
    | { kind: 'passive'; termsSurfaced: string[] }
    | { kind: 'active'; candidateTerm: string; surfacedTerms: string[]; handoffQuestion: string }
    | { kind: 'constructive'; targetTerm: string; draftTemplate: any };
}>;

const stepIndex = ref(0);
const playing = ref(false);
let timer: number | undefined;

const currentResult = (): ScaffoldResult | null => {
  const cp = checkpoints[stepIndex.value];
  if (!cp) return null;
  return {
    scaffold: cp.scaffold as any,
    chart: cp.chart,
    flowchart: cp.flowchart,
    termsSurfaced: cp.terms_surfaced ?? [],
    dictionaryHandoff: cp.dictionary_handoff ?? { kind: 'passive', termsSurfaced: [] },
  };
};

function play() {
  playing.value = true;
  stepIndex.value = 0;
  timer = window.setInterval(() => {
    if (stepIndex.value + 1 >= checkpoints.length) {
      clearInterval(timer);
      playing.value = false;
      stepIndex.value = checkpoints.length;
      return;
    }
    stepIndex.value++;
  }, 12000);
}

function stop() {
  if (timer) clearInterval(timer);
  playing.value = false;
}

function jumpTo(i: number) {
  stop();
  stepIndex.value = i;
}

onUnmounted(stop);
onMounted(() => {/* show first step */});
</script>

<template>
  <div class="bg-paper min-h-full">
    <div class="max-w-[1200px] mx-auto px-12 py-16">
      <div class="flex justify-between items-baseline">
        <div>
          <div class="text-micro text-ink-subtle uppercase">Autoplay · 60-second committee demo · central-tendency</div>
          <h1 class="text-h1 text-ink mt-4">The fade, observable</h1>
        </div>
        <div class="flex gap-4 items-center">
          <button v-if="!playing" @click="play" class="text-ink hover:underline text-body">▶ play (~60s)</button>
          <button v-else @click="stop" class="text-ink hover:underline text-body">■ stop</button>
        </div>
      </div>

      <p class="text-body text-ink-muted mt-6 max-w-[640px]">
        Five checkpoints, pre-generated from Gemini 3.1 Flash Lite (so the demo costs zero per play). Same concept (<code class="font-mono text-small">central-tendency</code>), five different scaffold surfaces, each paired with a generative-UI artifact (chart or flowchart).
      </p>

      <!-- Step indicator + jump-to -->
      <div class="mt-12 max-w-[820px]">
        <div class="flex gap-2">
          <button v-for="(cp, i) in checkpoints" :key="i"
                  @click="jumpTo(i)"
                  class="flex-1 h-1 hover:bg-ink-muted transition"
                  :class="i <= stepIndex && stepIndex < checkpoints.length ? 'bg-ink' : 'bg-overlay'"
                  :title="`jump to ${cp.tier_name}`"></button>
        </div>
        <div class="mt-3 flex justify-between text-small text-ink-muted font-mono">
          <span>Step {{ Math.min(stepIndex + 1, checkpoints.length) }}/{{ checkpoints.length }} · {{ checkpoints[stepIndex]?.label ?? 'done' }}</span>
          <span v-if="checkpoints[stepIndex]">
            mastery = {{ checkpoints[stepIndex].mastery.toFixed(2) }} → tier {{ pickTier(checkpoints[stepIndex].mastery).num }}
          </span>
        </div>
        <div v-if="checkpoints[stepIndex]?.viz_decision" class="mt-2 text-micro text-ink-subtle font-mono">
          viz selector → {{ checkpoints[stepIndex].viz_decision!.kind }} · {{ checkpoints[stepIndex].viz_decision!.reason }}
        </div>
      </div>

      <div class="mt-12 max-w-[820px]">
        <Scaffolds v-if="stepIndex < checkpoints.length" :result="currentResult()" />
        <div v-if="stepIndex < checkpoints.length && checkpoints[stepIndex]?.dictionary_handoff" class="mt-6 max-w-[820px]">
          <div class="text-micro text-ink-subtle uppercase">Dictionary handoff</div>
          <div class="text-small text-ink-muted mt-2 font-mono">
            kind: {{ checkpoints[stepIndex].dictionary_handoff.kind }} ·
            terms: {{ checkpoints[stepIndex].terms_surfaced?.join(', ') || '(none)' }}
            <template v-if="checkpoints[stepIndex].dictionary_handoff.kind === 'active'">
              · candidate: {{ (checkpoints[stepIndex].dictionary_handoff as any).candidateTerm }}
            </template>
            <template v-else-if="checkpoints[stepIndex].dictionary_handoff.kind === 'constructive'">
              · target: {{ (checkpoints[stepIndex].dictionary_handoff as any).targetTerm }}
            </template>
          </div>
        </div>
        <div v-else-if="stepIndex >= checkpoints.length" class="bg-surface p-8">
          <div class="text-h2 text-ink">Done.</div>
          <p class="text-body text-ink-muted mt-4">
            The committee just watched the same concept render through five distinct scaffolds, each picked deterministically by
            <code class="font-mono text-small">pickScaffold(mastery)</code> in <code class="font-mono text-small">lib/scaffold-selector.ts</code>.
            Each scaffold paired with a generative-UI artifact — histogram, bar, flowchart, time-series, or cycle — chosen by the model alongside the prose.
          </p>
          <button @click="stepIndex = 0" class="mt-6 text-ink hover:underline">↻ replay</button>
        </div>
      </div>
    </div>
  </div>
</template>
