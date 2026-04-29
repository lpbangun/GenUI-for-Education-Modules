<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{ terms: string[] }>();
const pulsedTerms = ref<Set<string>>(new Set());
const lastSeen = ref<Set<string>>(new Set());

watch(() => props.terms, (next) => {
  for (const t of next) {
    if (!lastSeen.value.has(t)) {
      pulsedTerms.value.add(t);
      setTimeout(() => pulsedTerms.value.delete(t), 800);
    }
  }
  lastSeen.value = new Set(next);
}, { deep: true, immediate: true });

const open = ref(true);
</script>

<template>
  <aside class="border-l border-ink-subtle/30 pl-6">
    <button @click="open = !open" class="text-micro text-ink-subtle uppercase hover:text-ink">
      Terms you've worked with ({{ props.terms.length }}) {{ open ? '−' : '+' }}
    </button>
    <ul v-if="open" class="mt-3 space-y-1">
      <li v-for="t in props.terms" :key="t"
          :class="['text-small font-mono', pulsedTerms.has(t) ? 'animate-pulse text-accent' : 'text-ink-muted']">
        <a :href="`/dictionary/${t}`" class="hover:underline">{{ t }}</a>
      </li>
      <li v-if="props.terms.length === 0" class="text-small text-ink-subtle italic">
        Terms will appear here as you encounter them.
      </li>
    </ul>
  </aside>
</template>
