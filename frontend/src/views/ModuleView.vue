<script setup lang="ts">
import { ref, computed } from 'vue';
import LMSShell from '../components/LMSShell.vue';
import Scaffolds from '../components/Scaffolds.vue';
import TierTransition from '../components/scaffolds/TierTransition.vue';
import DictionaryHandoffCard from '../components/scaffolds/DictionaryHandoffCard.vue';
import TermsSurfacedSidebar from '../components/scaffolds/TermsSurfacedSidebar.vue';
import WikiDraftForm from '../components/scaffolds/WikiDraftForm.vue';
import { streamScaffold, pickTier, type ScaffoldResult, type ScaffoldName } from '../lib/api';
import { pickVisualization, type VizDemand, type VizHistoryEntry } from '../lib/viz-selector';
import vizDemandMap from '../data/concept-viz-demand.json';

const props = defineProps<{ concept_id: string }>();

const mastery = ref(0.10);
const result = ref<ScaffoldResult | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

const history = ref<VizHistoryEntry[]>([]);
const surfacedTerms = ref<string[]>([]);
const previousTier = ref<ScaffoldName | null>(null);

const sessionId = ref(`session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);

const vizDemand = computed<VizDemand>(() => {
  const map = vizDemandMap as Record<string, VizDemand>;
  return map[props.concept_id] ?? 'definition';
});

const decision = computed(() => pickVisualization({
  concept: { id: props.concept_id, viz_demand: vizDemand.value },
  mastery: mastery.value,
  history: history.value,
}));

const currentTier = computed(() => pickTier(mastery.value).name);

async function fetchScaffold() {
  loading.value = true;
  error.value = null;
  const prevTier = result.value?.scaffold?.name ?? null;
  result.value = null;
  const d = decision.value;
  try {
    const r = await streamScaffold({ conceptId: props.concept_id, mastery: mastery.value, vizDecision: d });
    result.value = r;
    const producedKind = r.chart ? 'chart' : r.flowchart ? 'flowchart' : 'none';
    history.value.push({ viz_kind: producedKind, correct: true });
    for (const t of r.termsSurfaced) {
      if (!surfacedTerms.value.includes(t)) surfacedTerms.value.push(t);
    }
    previousTier.value = prevTier;
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
}

function onHandoffSubmitted(term: string) {
  console.info(`handoff submitted for term: ${term}`);
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
    <div class="grid grid-cols-[1fr_220px] gap-8">
      <div>
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

        <TierTransition v-if="result" :from="previousTier" :to="currentTier" />

        <Scaffolds :result="result" :loading="loading" />

        <DictionaryHandoffCard
          v-if="result?.dictionaryHandoff?.kind === 'active'"
          :handoff="result.dictionaryHandoff"
          :concept-id="props.concept_id"
          :session-id="sessionId"
          @submitted="onHandoffSubmitted"
        />

        <WikiDraftForm
          v-if="result?.dictionaryHandoff?.kind === 'constructive' && (result.dictionaryHandoff as any).targetTerm"
          :target-term="(result.dictionaryHandoff as any).targetTerm"
          :session-id="sessionId"
          @submitted="onHandoffSubmitted"
        />

        <div v-if="error" class="bg-accent-tint p-4 text-small text-ink mt-4">
          Backend error: {{ error }}. Concept: <code class="font-mono">{{ props.concept_id }}</code>.
        </div>

        <div v-if="!result && !loading && !error" class="text-small text-ink-muted">
          Adjust the mastery slider and click "generate scaffold" to fetch a live scaffold from the LLM.
        </div>
      </div>

      <TermsSurfacedSidebar :terms="surfacedTerms" />
    </div>
  </LMSShell>
</template>
