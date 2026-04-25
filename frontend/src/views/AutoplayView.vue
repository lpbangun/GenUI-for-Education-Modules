<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import Scaffolds from '../components/Scaffolds.vue';
import { streamScaffold, pickTier, type ScaffoldCall } from '../lib/api';

// Five mastery checkpoints, one per tier. Each fetches a fresh scaffold from
// the backend, holds for ~12-15s, then advances. Total runtime ~75-90 seconds.
const CHECKPOINTS = [
  { mastery: 0.10, label: 'Brand new learner' },
  { mastery: 0.30, label: 'Recognizes the pattern' },
  { mastery: 0.55, label: 'Articulating their own interpretation' },
  { mastery: 0.75, label: 'Working without scaffolds' },
  { mastery: 0.92, label: 'Contributing to the wiki' },
];

const stepIndex = ref(0);
const call = ref<ScaffoldCall | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const playing = ref(false);
let timer: number | undefined;
let abort: AbortController | undefined;

async function loadStep(i: number) {
  if (i >= CHECKPOINTS.length) {
    stepIndex.value = CHECKPOINTS.length;
    playing.value = false;
    return;
  }
  stepIndex.value = i;
  loading.value = true;
  error.value = null;
  call.value = null;
  abort?.abort();
  abort = new AbortController();
  try {
    call.value = await streamScaffold({
      conceptId: 'central-tendency',
      mastery: CHECKPOINTS[i].mastery,
      signal: abort.signal,
    });
  } catch (e: any) {
    if (e.name !== 'AbortError') error.value = e.message;
  } finally {
    loading.value = false;
  }
}

function play() {
  playing.value = true;
  loadStep(0);
  timer = window.setInterval(() => {
    if (stepIndex.value + 1 >= CHECKPOINTS.length) {
      clearInterval(timer);
      playing.value = false;
      return;
    }
    loadStep(stepIndex.value + 1);
  }, 18000); // 18s per step × 5 = 90s
}

function stop() {
  if (timer) clearInterval(timer);
  abort?.abort();
  playing.value = false;
}

onMounted(() => {
  // Auto-load the first scaffold so the page isn't blank on arrival.
  loadStep(0);
});
onUnmounted(() => {
  stop();
});

const current = () => CHECKPOINTS[stepIndex.value];
</script>

<template>
  <div class="bg-paper min-h-full">
    <div class="max-w-[1200px] mx-auto px-12 py-16">
      <div class="flex justify-between items-baseline">
        <div>
          <div class="text-micro text-ink-subtle uppercase">Autoplay · 90-second committee demo · central-tendency</div>
          <h1 class="text-h1 text-ink mt-4">The fade, observable</h1>
        </div>
        <div class="flex gap-4 items-center">
          <button v-if="!playing" @click="play"
                  class="text-ink hover:underline text-body">▶ play (~90s)</button>
          <button v-else @click="stop" class="text-ink hover:underline text-body">■ stop</button>
          <button @click="loadStep(stepIndex)" :disabled="loading"
                  class="text-ink-muted hover:text-ink hover:underline text-small disabled:opacity-40">↻ regenerate</button>
        </div>
      </div>

      <p class="text-body text-ink-muted mt-6 max-w-[640px]">
        Five checkpoints, each fetches a fresh scaffold from the live Gemini backend.
        Same concept (<code class="font-mono text-small">central-tendency</code>), five different surfaces.
      </p>

      <!-- Step indicator -->
      <div class="mt-12 max-w-[820px]">
        <div class="flex gap-2">
          <div v-for="(_, i) in CHECKPOINTS" :key="i"
               class="flex-1 h-1"
               :class="i <= stepIndex ? 'bg-ink' : 'bg-overlay'"></div>
        </div>
        <div class="mt-3 flex justify-between text-small text-ink-muted font-mono">
          <span>Step {{ Math.min(stepIndex + 1, CHECKPOINTS.length) }}/{{ CHECKPOINTS.length }} · {{ current()?.label ?? 'done' }}</span>
          <span>mastery = {{ current()?.mastery.toFixed(2) ?? '—' }} → tier {{ current() ? pickTier(current().mastery).num : '—' }}</span>
        </div>
      </div>

      <div class="mt-12 max-w-[820px]">
        <Scaffolds :call="call" :loading="loading" />

        <div v-if="error" class="bg-accent-tint p-4 text-small text-ink mt-4">
          Backend error: {{ error }}.
        </div>

        <div v-if="stepIndex >= CHECKPOINTS.length" class="bg-surface p-8">
          <div class="text-h2 text-ink">Done.</div>
          <p class="text-body text-ink-muted mt-4">
            The committee just watched the same concept render through five distinct scaffolds, each picked deterministically by
            <code class="font-mono text-small">pickScaffold(mastery)</code> in <code class="font-mono text-small">lib/scaffold-selector.ts</code>.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
