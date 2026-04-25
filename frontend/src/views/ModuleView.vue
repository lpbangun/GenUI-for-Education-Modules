<script setup lang="ts">
import { ref } from 'vue';
import LMSShell from '../components/LMSShell.vue';
import Scaffolds from '../components/Scaffolds.vue';
import { streamScaffold, pickTier, type ScaffoldCall } from '../lib/api';

const props = defineProps<{ concept_id: string }>();

const mastery = ref(0.10);
const call = ref<ScaffoldCall | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);

async function fetchScaffold() {
  loading.value = true;
  error.value = null;
  call.value = null;
  try {
    call.value = await streamScaffold({ conceptId: props.concept_id, mastery: mastery.value });
  } catch (e) {
    error.value = (e as Error).message;
  } finally {
    loading.value = false;
  }
}

// fetch on mount
fetchScaffold();
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
      <label class="text-micro text-ink-subtle uppercase">Mastery (preview slider)</label>
      <input type="range" min="0" max="1" step="0.01" v-model.number="mastery"
             class="w-full mt-3 accent-accent" />
      <div class="flex justify-between text-small text-ink-muted mt-2 font-mono">
        <span>mastery = {{ mastery.toFixed(2) }} → tier {{ pickTier(mastery).num }} ({{ pickTier(mastery).name }})</span>
        <button @click="fetchScaffold" :disabled="loading"
                class="text-ink hover:underline disabled:opacity-40">
          {{ loading ? 'generating…' : 'generate scaffold →' }}
        </button>
      </div>
    </div>

    <Scaffolds :call="call" :loading="loading" />

    <div v-if="error" class="bg-accent-tint p-4 text-small text-ink mt-4">
      Backend error: {{ error }}. Concept: <code class="font-mono">{{ props.concept_id }}</code>.
    </div>

    <div v-if="!call && !loading && !error" class="text-small text-ink-muted">
      Adjust the mastery slider and click "generate scaffold" to fetch a live scaffold from the LLM.
    </div>
  </LMSShell>
</template>
