<script setup lang="ts">
import { ref, computed } from 'vue';
import LMSShell from '../components/LMSShell.vue';
import Scaffolds from '../components/Scaffolds.vue';
import { streamScaffold, pickTier, type ScaffoldResult } from '../lib/api';
import { pickVisualization, type VizDemand, type VizHistoryEntry } from '../lib/viz-selector';
import vizDemandMap from '../data/concept-viz-demand.json';

const props = defineProps<{ concept_id: string }>();

const mastery = ref(0.10);
const result = ref<ScaffoldResult | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

// History accumulates real turns. Each successful generation appends an entry
// reflecting what the prior turn produced — that's what the next selector call sees.
const history = ref<VizHistoryEntry[]>([]);

const vizDemand = computed<VizDemand>(() => {
  const map = vizDemandMap as Record<string, VizDemand>;
  return map[props.concept_id] ?? 'definition';
});

const decision = computed(() => pickVisualization({
  concept: { id: props.concept_id, viz_demand: vizDemand.value },
  mastery: mastery.value,
  history: history.value,
}));

async function fetchScaffold() {
  loading.value = true;
  error.value = null;
  result.value = null;
  const d = decision.value;
  try {
    const r = await streamScaffold({ conceptId: props.concept_id, mastery: mastery.value, vizDecision: d });
    result.value = r;
    const producedKind = r.chart ? 'chart' : r.flowchart ? 'flowchart' : 'none';
    history.value.push({ viz_kind: producedKind, correct: true });
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <LMSShell
    moduleLabel="Module 3 of 7 · Data fluency for higher ed admin"
    lessonTitle="Reading distributions in context"
    audience="Harvard staff"
    :lessonsTotal="7"
    :lessonsCompleted="2"
    :currentIndex="3"
  >
    <div class="mb-8">
      <label class="text-micro text-ink-subtle uppercase">Mastery (live · drag to fetch fresh scaffold)</label>
      <input type="range" min="0" max="1" step="0.01" v-model.number="mastery"
             class="w-full mt-3 accent-accent" />
      <div class="flex justify-between text-small text-ink-muted mt-2 font-mono">
        <span>mastery = {{ mastery.toFixed(2) }} → tier {{ pickTier(mastery).num }} ({{ pickTier(mastery).name }})</span>
        <button @click="fetchScaffold" :disabled="loading"
                class="text-ink hover:underline disabled:opacity-40">
          {{ loading ? 'generating…' : 'generate scaffold →' }}
        </button>
      </div>
      <div class="text-micro text-ink-subtle mt-2 font-mono">
        viz_demand={{ vizDemand }} · selector → {{ decision.kind }}
        <span class="text-ink-muted">· {{ decision.reason }}</span>
      </div>
    </div>

    <Scaffolds :result="result" :loading="loading" />

    <div v-if="error" class="bg-accent-tint p-4 text-small text-ink mt-4">
      Backend error: {{ error }}. Concept: <code class="font-mono">{{ props.concept_id }}</code>.
    </div>

    <div v-if="!result && !loading && !error" class="text-small text-ink-muted">
      Adjust the mastery slider and click "generate scaffold" to fetch a live scaffold from the LLM.
    </div>
  </LMSShell>
</template>
